"""Dependency-free Prometheus text-format metrics registry.

Tracks WebSocket, pipeline and application metrics. Exposed at GET /metrics.
All operations are O(1) and non-blocking (plain dict updates) so they are safe
to call from async handlers on the hot path.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict
from typing import Dict, List, Tuple


class Counter:
    def __init__(self, name: str, help_text: str):
        self.name, self.help = name, help_text
        self._values: Dict[Tuple[str, ...], float] = defaultdict(float)
        self._lock = threading.Lock()

    def inc(self, value: float = 1.0, **labels) -> None:
        key = tuple(sorted(labels.items()))
        with self._lock:
            self._values[key] += value

    def render(self) -> List[str]:
        lines = [f"# HELP {self.name} {self.help}", f"# TYPE {self.name} counter"]
        with self._lock:
            for key, val in sorted(self._values.items()):
                label_str = ""
                if key:
                    pairs = ",".join(f'{k}="{v}"' for k, v in key)
                    label_str = f"{{{pairs}}}"
                lines.append(f"{self.name}{label_str} {val}")
        return lines


class Gauge:
    def __init__(self, name: str, help_text: str):
        self.name, self.help = name, help_text
        self._values: Dict[Tuple[str, ...], float] = defaultdict(float)
        self._lock = threading.Lock()

    def set(self, value: float, **labels) -> None:
        key = tuple(sorted(labels.items()))
        with self._lock:
            self._values[key] = value

    def inc(self, value: float = 1.0, **labels) -> None:
        key = tuple(sorted(labels.items()))
        with self._lock:
            self._values[key] += value

    def dec(self, value: float = 1.0, **labels) -> None:
        self.inc(-value, **labels)

    def render(self) -> List[str]:
        lines = [f"# HELP {self.name} {self.help}", f"# TYPE {self.name} gauge"]
        with self._lock:
            for key, val in sorted(self._values.items()):
                label_str = ""
                if key:
                    pairs = ",".join(f'{k}="{v}"' for k, v in key)
                    label_str = f"{{{pairs}}}"
                lines.append(f"{self.name}{label_str} {val}")
        return lines


class Histogram:
    """Cumulative histogram with fixed buckets (Prometheus-compatible)."""

    DEFAULT_BUCKETS = (5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000)

    def __init__(self, name: str, help_text: str, buckets: Tuple[float, ...] = DEFAULT_BUCKETS):
        self.name, self.help = name, help_text
        self.buckets = buckets
        self._counts: Dict[Tuple[str, ...], List[int]] = {}
        self._sums: Dict[Tuple[str, ...], float] = defaultdict(float)
        self._totals: Dict[Tuple[str, ...], int] = defaultdict(int)
        self._lock = threading.Lock()

    def observe(self, value_ms: float, **labels) -> None:
        key = tuple(sorted(labels.items()))
        with self._lock:
            if key not in self._counts:
                self._counts[key] = [0] * len(self.buckets)
            for i, bound in enumerate(self.buckets):
                if value_ms <= bound:
                    self._counts[key][i] += 1
            self._sums[key] += value_ms
            self._totals[key] += 1

    def render(self) -> List[str]:
        lines = [f"# HELP {self.name} {self.help}", f"# TYPE {self.name} histogram"]
        with self._lock:
            for key in sorted(set(self._counts) | set(self._sums)):
                counts = self._counts.get(key, [0] * len(self.buckets))
                base = self.name
                label_str = ""
                if key:
                    pairs = list(key)
                    for i, bound in enumerate(self.buckets):
                        lp = pairs + [("le", str(bound))]
                        s = ",".join(f'{k}="{v}"' for k, v in lp)
                        lines.append(f"{base}_bucket{{{s}}} {counts[i]}")
                    lp = pairs + [("le", "+Inf")]
                    s = ",".join(f'{k}="{v}"' for k, v in lp)
                    lines.append(f"{base}_bucket{{{s}}} {self._totals[key]}")
                    s0 = ",".join(f'{k}="{v}"' for k, v in pairs)
                    label_str = f"{{{s0}}}"
                else:
                    for i, bound in enumerate(self.buckets):
                        lines.append(f'{base}_bucket{{le="{bound}"}} {counts[i]}')
                    lines.append(f'{base}_bucket{{le="+Inf"}} {self._totals.get(key, 0)}')
                lines.append(f"{base}_sum{label_str} {self._sums.get(key, 0.0)}")
                lines.append(f"{base}_count{label_str} {self._totals.get(key, 0)}")
        return lines


class Registry:
    def __init__(self) -> None:
        self._counters: Dict[str, Counter] = {}
        self._gauges: Dict[str, Gauge] = {}
        self._histograms: Dict[str, Histogram] = {}

    def counter(self, name: str, help_text: str) -> Counter:
        if name not in self._counters:
            self._counters[name] = Counter(name, help_text)
        return self._counters[name]

    def gauge(self, name: str, help_text: str) -> Gauge:
        if name not in self._gauges:
            self._gauges[name] = Gauge(name, help_text)
        return self._gauges[name]

    def histogram(self, name: str, help_text: str,
                  buckets: Tuple[float, ...] = Histogram.DEFAULT_BUCKETS) -> Histogram:
        if name not in self._histograms:
            self._histograms[name] = Histogram(name, help_text, buckets)
        return self._histograms[name]

    def render(self) -> str:
        lines: List[str] = []
        for metric in (*self._counters.values(), *self._gauges.values(), *self._histograms.values()):
            lines.extend(metric.render())
        return "\n".join(lines) + "\n"


registry = Registry()

# --- WebSocket / connection metrics ---------------------------------------
M_CONNECTS = registry.counter("rtc_connects_total", "Accepted WebSocket connections")
M_CONNECT_FAILS = registry.counter("rtc_connect_failures_total", "Rejected handshake attempts")
M_DISCONNECTS = registry.counter("rtc_disconnects_total", "Client disconnects")
M_REAUTHS = registry.counter("rtc_reauth_total", "In-session token refreshes")
M_ACTIVE_CONNS = registry.gauge("rtc_active_connections", "Currently open connections")
M_MSG_IN = registry.counter("rtc_messages_in_total", "Inbound messages", )
M_MSG_OUT = registry.counter("rtc_messages_out_total", "Outbound messages")
M_BYTES_IN = registry.counter("rtc_bytes_in_total", "Inbound bytes")
M_BYTES_OUT = registry.counter("rtc_bytes_out_total", "Outbound bytes")
M_DROPPED = registry.counter("rtc_messages_dropped_total", "Dropped messages (rate limit / backpressure)")
M_HANDLER_TIME = registry.histogram("rtc_handler_duration_ms", "Inbound handler processing time")

# --- Location pipeline ------------------------------------------------------
M_LOC_RECEIVED = registry.counter("rtc_loc_received_total", "GPS fixes received")
M_LOC_GATED = registry.counter("rtc_loc_gated_total", "GPS fixes suppressed by adaptive gate", )
M_LOC_BROADCAST = registry.counter("rtc_loc_broadcast_total", "GPS fixes fanned out (post coalescing)")
M_LOC_COALESCED = registry.counter("rtc_loc_coalesced_total", "GPS fixes collapsed by latest-wins coalescer")
M_LOC_PERSISTED = registry.counter("rtc_loc_persisted_total", "GPS fixes persisted to Postgres")
M_FLUSH_BATCHES = registry.counter("rtc_loc_flush_batches_total", "Location persistence flush batches")
M_FLUSH_TIME = registry.histogram("rtc_loc_flush_duration_ms", "Location flush batch duration")
M_PENDING_LOC = registry.gauge("rtc_loc_pending", "GPS fixes waiting in persistence queue")

# --- Rooms / rides ----------------------------------------------------------
M_ROOM_JOINS = registry.counter("rtc_room_joins_total", "Room subscriptions", )
M_ROOM_JOIN_FAILS = registry.counter("rtc_room_join_failures_total", "Room subscriptions denied")
M_ROOM_LEAVES = registry.counter("rtc_room_leaves_total", "Room unsubscriptions")
M_RIDE_ROOMS = registry.gauge("rtc_ride_rooms_active", "Active ride rooms on this node")
M_CRITICAL_EVENTS = registry.counter("rtc_critical_events_total", "Critical ride events published")
M_EVENT_LATENCY = registry.histogram("rtc_event_roundtrip_ms", "Critical event emit->ack roundtrip")
M_SOS_EVENTS = registry.counter("rtc_sos_events_total", "SOS events published on the priority lane")

# --- Infrastructure ----------------------------------------------------------
M_REDIS_ERRORS = registry.counter("rtc_redis_errors_total", "Redis operation errors")
M_DB_ERRORS = registry.counter("rtc_db_errors_total", "Database write errors")
M_REDIS_LATENCY = registry.histogram("rtc_redis_op_ms", "Redis operation latency")

# --- Autoscaling / degradation signals ---------------------------------------
# WebSocket Architecture.md §25/§28: CPU/memory alone (the existing k8s HPA,
# backend/k8s/hpa.yaml) under-react for an I/O-bound, connection-count-bound
# workload — event loop lag is the earlier, more direct signal that a node is
# approaching its connection ceiling before CPU saturates.
M_EVENT_LOOP_LAG = registry.gauge("rtc_event_loop_lag_ms", "Event loop scheduling lag (asyncio drift)")
M_LOAD_LEVEL = registry.gauge("rtc_load_level", "Current graceful-degradation load level (0=normal,1=high,2=critical)")
