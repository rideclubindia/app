"""Location update pipeline.

Design goals (see docs/realtime-architecture.md):
  * Never trust client identity - fixes are attributed to the authenticated user.
  * Gate inbound fixes (adaptive frequency + significant-distance) BEFORE any
    fanout so 100K drivers produce bounded traffic, not raw GPS volume.
  * Coalesce per (ride, rider) with latest-wins so slow consumers and chatty
    producers cannot inflate fanout.
  * Persist asynchronously in batches - the hot path never touches Postgres.

Flow:
    client loc:p -> gate -> Redis latest-loc cache -> coalescer --1.5s--> emit loc to room
                             |-> persistence queue --5s--> batch upsert ride_locations
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from typing import Dict, Optional, Tuple

from sqlalchemy import text

from core.database import SessionLocal
from realtime import protocol as proto
from realtime.metrics import (
    M_DB_ERRORS, M_FLUSH_BATCHES, M_FLUSH_TIME, M_LOC_BROADCAST, M_LOC_COALESCED,
    M_LOC_GATED, M_LOC_PERSISTED, M_LOC_RECEIVED, M_PENDING_LOC,
)
from realtime.store import RealtimeStore

logger = logging.getLogger(__name__)

# Gate thresholds - tuned for rider telemetry (see capacity planning docs)
MOVING_MIN_INTERVAL_S = 2.0      # min gap between accepted fixes while moving
STATIONARY_MIN_INTERVAL_S = 15.0  # heartbeat rate when not moving
MOVING_MIN_DISTANCE_M = 5.0      # ignore jitter below this while moving
STATIONARY_DISTANCE_M = 25.0     # must move this far to count as "moved"
COALESCE_WINDOW_S = 1.5          # max broadcast rate per rider per ride
PERSIST_FLUSH_INTERVAL_S = 5.0   # DB write cadence
PERSIST_MAX_BATCH = 200          # max rows per flush
PERSIST_QUEUE_MAX = 10000        # backpressure bound; oldest dropped


@dataclass
class _GateState:
    last_ts: float = 0.0
    last_lat: float = 0.0
    last_lng: float = 0.0
    last_broadcast: float = 0.0


class LocationPipeline:
    def __init__(self, store: RealtimeStore, emit_fn):
        """`emit_fn(room, event_type, payload)` fans out to a room (gateway provides)."""
        self.store = store
        self.emit_fn = emit_fn
        self._gates: Dict[Tuple[str, str], _GateState] = {}
        self._pending: Dict[Tuple[str, str], list] = {}   # (ride, member) -> latest compact loc
        self._coalesce_task: Optional[asyncio.Task] = None
        self._flush_task: Optional[asyncio.Task] = None
        self._queue: asyncio.Queue = asyncio.Queue(maxsize=PERSIST_QUEUE_MAX)
        self._executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="loc-persist")
        self._running = False

    def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._coalesce_task = asyncio.get_running_loop().create_task(self._coalesce_loop())
        self._flush_task = asyncio.get_running_loop().create_task(self._flush_loop())

    async def stop(self) -> None:
        self._running = False
        for task in (self._coalesce_task, self._flush_task):
            if task:
                task.cancel()
                try:
                    await task
                except (asyncio.CancelledError, Exception):
                    pass
        await self._flush_once()  # drain what we can
        self._executor.shutdown(wait=False)

    # ------------------------------------------------------------------ gate
    def _gate_accepts(self, ride_id: str, member_id: str, lat: float, lng: float,
                      speed_kph: float, ts_ms: int) -> bool:
        key = (ride_id, member_id)
        state = self._gates.get(key)
        now = time.time()
        if state is None:
            state = _GateState()
            self._gates[key] = state

        moving = speed_kph > 2.0
        min_interval = MOVING_MIN_INTERVAL_S if moving else STATIONARY_MIN_INTERVAL_S
        min_distance = MOVING_MIN_DISTANCE_M if moving else STATIONARY_DISTANCE_M

        if state.last_ts and (now - state.last_ts) < min_interval:
            # Exception: significant jump while stationary heartbeat window (e.g. teleport)
            if proto.haversine_m(state.last_lat, state.last_lng, lat, lng) < min_distance:
                return False
        state.last_ts = now
        state.last_lat, state.last_lng = lat, lng
        return True

    # ------------------------------------------------------------- ingestion
    async def ingest(self, ride_id: str, member_id: str, fixes: list) -> int:
        """Process a batch of client fixes. Returns number accepted."""
        accepted = 0
        latest: Optional[list] = None
        for fix in fixes:
            decoded = proto.decode_location(fix)
            if decoded is None:
                continue
            _mid, lat, lng, speed, _heading, ts_ms = decoded
            M_LOC_RECEIVED.inc()
            if not (-90 <= lat <= 90 and -180 <= lng <= 180):
                continue
            if not self._gate_accepts(ride_id, member_id, lat, lng, speed, ts_ms):
                M_LOC_GATED.inc()
                continue
            accepted += 1
            latest = [member_id, round(lat, 6), round(lng, 6), round(speed, 1),
                      round(_heading or 0, 0), ts_ms]

        if latest is None:
            return 0

        # 1. Snapshot cache (source for ride:snap on reconnect / new joiners)
        await self.store.put_latest_loc(ride_id, member_id, json.dumps(latest))

        # 2. Coalesced broadcast - latest wins per rider
        key = (ride_id, member_id)
        if key in self._pending:
            M_LOC_COALESCED.inc()
        self._pending[key] = latest

        # 3. Durable persistence (batched, async)
        try:
            self._queue.put_nowait((ride_id, latest))
            M_PENDING_LOC.set(self._queue.qsize())
        except asyncio.QueueFull:
            # Backpressure: drop the OLDEST ephemeral fix, keep the new one
            try:
                self._queue.get_nowait()
                self._queue.put_nowait((ride_id, latest))
            except asyncio.QueueEmpty:
                pass
        return accepted

    # ------------------------------------------------------------ coalescing
    async def _coalesce_loop(self) -> None:
        while self._running:
            try:
                await asyncio.sleep(COALESCE_WINDOW_S)
                if not self._pending:
                    continue
                by_ride: Dict[str, list] = {}
                for (ride_id, _member_id), loc in list(self._pending.items()):
                    by_ride.setdefault(ride_id, []).append(loc)
                self._pending.clear()
                for ride_id, locs in by_ride.items():
                    M_LOC_BROADCAST.inc(len(locs))
                    await self.emit_fn(f"ride:{ride_id}", proto.EV_LOC, {"ride": ride_id, "u": locs})
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("Coalesce loop error")

    # ----------------------------------------------------------- persistence
    async def _flush_loop(self) -> None:
        while self._running:
            try:
                await asyncio.sleep(PERSIST_FLUSH_INTERVAL_S)
                await self._flush_once()
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("Flush loop error")

    async def _flush_once(self) -> None:
        batch: Dict[Tuple[str, str], dict] = {}
        while not self._queue.empty():
            try:
                ride_id, loc = self._queue.get_nowait()
            except asyncio.QueueEmpty:
                break
            member_id = loc[0]
            batch[(ride_id, member_id)] = {
                "ride_id": ride_id, "user_id": member_id,
                "latitude": loc[1], "longitude": loc[2],
                "speed": loc[3], "heading": loc[4],
            }
        if not batch:
            return
        M_PENDING_LOC.set(self._queue.qsize())
        rows = list(batch.values())[:PERSIST_MAX_BATCH]
        loop = asyncio.get_event_loop()
        start = time.perf_counter()
        ok = await loop.run_in_executor(self._executor, _persist_rows, rows)
        duration = (time.perf_counter() - start) * 1000
        M_FLUSH_TIME.observe(duration)
        if ok:
            M_FLUSH_BATCHES.inc()
            M_LOC_PERSISTED.inc(len(rows))
        else:
            M_DB_ERRORS.inc()


_UPSERT_SQL = text("""
    INSERT INTO ride_locations (ride_id, user_id, latitude, longitude, speed, heading, updated_at)
    VALUES (:ride_id, :user_id, :latitude, :longitude, :speed, :heading, NOW())
    ON CONFLICT (ride_id, user_id) DO UPDATE
    SET latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        speed = EXCLUDED.speed,
        heading = EXCLUDED.heading,
        updated_at = NOW()
""")


def _persist_rows(rows: list) -> bool:
    """Runs on the persistence thread - sync SQLAlchemy is fine here."""
    session = SessionLocal()
    try:
        session.execute(_UPSERT_SQL, rows)
        session.commit()
        return True
    except Exception as exc:
        session.rollback()
        logger.error("ride_locations batch upsert failed (%s rows): %s", len(rows), exc)
        return False
    finally:
        session.close()
