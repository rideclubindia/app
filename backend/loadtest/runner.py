"""Socket.IO load-test harness for the RideClub real-time platform.

Generates progressive load (1K -> 150K+ virtual users) across the scenarios
defined in docs/realtime-architecture.md and reports P50/P95/P99 latencies,
error rates and server metrics deltas.

Usage (single machine, ~10-15K clients per process due to Python overhead):
    python -m loadtest.runner --scenario idle --users 5000 --ride rides.json
    python -m loadtest.runner --scenario locations --users 10000 --ramp 100
    python -m loadtest.runner --scenario mass_reconnect --users 8000

For 100K+ run multiple processes (several machines/containers), each with a
slice of the users, all pointing at the public LB URL. See README.md.

NOTE: a single Python asyncio process saturates around 10-15K sockets; that is
a LIMITATION OF THE TEST HARNESS, not of the server.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import random
import statistics
import time
import uuid
from typing import List, Optional

import httpx
import socketio

DEFAULT_URL = "http://localhost:8000"
TOKEN = ""  # set via --token or TOKEN env; load tests need a valid JWT


class VirtualUser:
    def __init__(self, url: str, token: str, ride_id: str, index: int):
        self.url = url
        self.token = token
        self.ride_id = ride_id
        self.index = index
        self.client: Optional[socketio.AsyncClient] = None
        self.connected = False
        self.rtts: List[float] = []
        self.errors = 0
        self.fixes_sent = 0
        # Start riders around a metro area with jitter so gates pass
        self.lat = 17.3850 + random.uniform(-0.05, 0.05)
        self.lng = 78.4867 + random.uniform(-0.05, 0.05)

    async def connect(self) -> bool:
        self.client = socketio.AsyncClient(reconnection=False, logger=False, engineio_logger=False)
        started = time.perf_counter()

        @self.client.event
        async def connect():
            self.connected = True
            self.rtts.append((time.perf_counter() - started) * 1000)

        @self.client.on("ride:snap")
        async def on_snap(env):
            pass

        @self.client.on("loc")
        async def on_loc(env):
            pass

        @self.client.on("ride:event")
        async def on_ride_event(env):
            await self.client.emit("ev:ack", {
                "eventId": env.get("eventId"), "seq": env.get("seq"),
                "rttMs": max(0, int((time.time() * 1000) - env.get("ts", time.time() * 1000))),
            })

        try:
            await self.client.connect(
                self.url, auth={"token": self.token, "sessionId": uuid.uuid4().hex},
                transports=["websocket"],
            )
            return self.connected
        except Exception:
            self.errors += 1
            return False

    async def join_ride(self):
        if self.client and self.connected:
            await self.client.emit("ride:join", {"ride": self.ride_id})

    async def send_fix(self, moving: bool = True):
        if not (self.client and self.connected):
            return
        if moving:
            self.lat += random.uniform(-0.0004, 0.0004)
            self.lng += random.uniform(-0.0004, 0.0004)
        fix = [round(self.lat, 6), round(self.lng, 6), 32.0 if moving else 0.0,
               random.uniform(0, 359), int(time.time() * 1000)]
        t0 = time.perf_counter()
        try:
            await self.client.emit("loc:p", {"ride": self.ride_id, "p": [fix]})
            self.fixes_sent += 1
        except Exception:
            self.errors += 1
        self.rtts.append((time.perf_counter() - t0) * 1000)

    async def heartbeat(self):
        if self.client and self.connected:
            t0 = time.perf_counter()
            try:
                await self.client.call("echo", {"t": time.time()}, timeout=5)
                self.rtts.append((time.perf_counter() - t0) * 1000)
            except Exception:
                self.errors += 1

    async def disconnect(self):
        if self.client:
            try:
                await self.client.disconnect()
            except Exception:
                pass


def percentile(values: List[float], p: float) -> float:
    if not values:
        return -1
    values = sorted(values)
    idx = min(len(values) - 1, int(len(values) * p / 100))
    return values[idx]


async def fetch_metrics(url: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=5) as http:
            res = await http.get(f"{url}/metrics")
            out = {}
            for line in res.text.splitlines():
                if line and not line.startswith("#"):
                    parts = line.rsplit(" ", 1)
                    if len(parts) == 2:
                        try:
                            out[parts[0]] = float(parts[1])
                        except ValueError:
                            pass
            return out
    except Exception:
        return {}


async def run_scenario(args):
    print(f"== Scenario: {args.scenario} | users: {args.users} | ramp: {args.ramp}/s | url: {args.url}")
    users: List[VirtualUser] = []

    async def spawn(i: int):
        u = VirtualUser(args.url, args.token, args.ride, i)
        ok = await u.connect()
        if ok and args.scenario in ("locations", "navigation", "rides", "reconnect"):
            await u.join_ride()
        users.append(u)

    # Staged ramp
    sem = asyncio.Semaphore(500)
    spawned = 0
    while spawned < args.users:
        batch = min(args.ramp, args.users - spawned)
        tasks = []
        for i in range(spawned, spawned + batch):
            async def _go(idx=i):
                async with sem:
                    await spawn(idx)
            tasks.append(_go())
        await asyncio.gather(*tasks, return_exceptions=True)
        spawned += batch
        print(f"   connected {spawned}/{args.users} (conn P95 {percentile([u.rtts[-1] for u in users if u.rtts], 95):.0f}ms)")
        await asyncio.sleep(1.0)

    metrics_before = await fetch_metrics(args.url)

    # Activity phase
    duration = args.duration
    print(f"== Running activity for {duration}s")
    started = time.perf_counter()
    while time.perf_counter() - started < duration:
        loops = []
        for u in users:
            if args.scenario == "idle":
                continue  # just stay connected
            elif args.scenario == "heartbeat":
                loops.append(u.heartbeat())
            elif args.scenario == "locations":
                loops.append(u.send_fix(moving=True))
            elif args.scenario == "navigation":
                if u.index % 2 == 0:
                    loops.append(u.send_fix(moving=True))
                elif u.index % 10 == 0:
                    loops.append(u.heartbeat())
            elif args.scenario == "reconnect":
                if random.random() < 0.05:  # 5% churn per tick
                    loops.append(u.disconnect())
                    loops.append(u.connect())
        if loops:
            await asyncio.gather(*loops, return_exceptions=True)
        await asyncio.sleep(3.0)

    metrics_after = await fetch_metrics(args.url)

    # Report
    all_rtts = [r for u in users for r in u.rtts]
    total_errors = sum(u.errors for u in users)
    total_fixes = sum(u.fixes_sent for u in users)
    connected = sum(1 for u in users if u.connected)

    def delta(name):
        return metrics_after.get(name, 0) - metrics_before.get(name, 0)

    print("\n================ RESULTS ================")
    print(f"scenario            : {args.scenario}")
    print(f"target users        : {args.users}")
    print(f"still connected     : {connected}")
    print(f"connect errors      : {total_errors}")
    print(f"fixes sent          : {total_fixes}")
    if all_rtts:
        print(f"latency  P50        : {percentile(all_rtts, 50):.1f} ms")
        print(f"latency  P95        : {percentile(all_rtts, 95):.1f} ms")
        print(f"latency  P99        : {percentile(all_rtts, 99):.1f} ms")
    print(f"server msgs in      : +{delta('rtc_messages_in_total')}")
    print(f"server msgs out     : +{delta('rtc_messages_out_total')}")
    print(f"loc received        : +{delta('rtc_loc_received_total')}")
    print(f"loc gated           : +{delta('rtc_loc_gated_total')}")
    print(f"loc broadcast       : +{delta('rtc_loc_broadcast_total')}")
    print(f"loc persisted       : +{delta('rtc_loc_persisted_total')}")
    print(f"dropped             : +{delta('rtc_messages_dropped_total')}")
    print(f"active conns (end)  : {metrics_after.get('rtc_active_connections', 0)}")
    print("=========================================\n")

    for u in users:
        await u.disconnect()

    # Save raw results for comparison across runs
    with open(f"loadtest-results-{args.scenario}-{args.users}.json", "w") as f:
        json.dump({
            "scenario": args.scenario, "users": args.users,
            "connected": connected, "errors": total_errors,
            "p50": percentile(all_rtts, 50), "p95": percentile(all_rtts, 95),
            "p99": percentile(all_rtts, 99),
            "server": {k: delta(k) for k in metrics_after},
        }, f, indent=2, default=str)


def main():
    ap = argparse.ArgumentParser(description="RideClub realtime load tester")
    ap.add_argument("--url", default=DEFAULT_URL)
    ap.add_argument("--scenario", default="idle",
                    choices=["idle", "heartbeat", "locations", "navigation", "rides", "reconnect"])
    ap.add_argument("--users", type=int, default=1000)
    ap.add_argument("--ramp", type=int, default=100, help="connections per second")
    ap.add_argument("--duration", type=int, default=60, help="activity phase seconds")
    ap.add_argument("--ride", default="00000000-0000-0000-0000-000000000000", help="ride id to join")
    ap.add_argument("--token", default=TOKEN)
    args = ap.parse_args()

    if not args.token:
        raise SystemExit("A valid backend JWT is required: pass --token <jwt>")
    asyncio.run(run_scenario(args))


if __name__ == "__main__":
    main()
