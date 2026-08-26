"""Redis-backed shared state for the real-time platform.

All state that must survive node restarts / load-balancing is kept here, never
in per-process memory:

  * presence      - which sessions (devices) a user has online, TTL heartbeat
  * sessions      - session -> {user, rooms, lastSeq} for reconnect recovery
  * membership    - ride membership cache (saves repeated DB lookups)
  * latest locs   - per-ride latest known location per rider (snapshot source)
  * seq/streams   - per-ride monotonic sequence + critical event stream

Keys (all TTL'd or trimmed):
    pres:user:{member_id}            set of session ids          (TTL 90s, heartbeat)
    sess:{session_id}                hash {user, connected_at}   (TTL 24h)
    sess:rooms:{session_id}          set of room names           (TTL 24h)
    sess:seq:{session_id}            hash room -> last seq seen  (TTL 24h)
    ride:members:{ride_id}           json membership snapshot    (TTL 60s)
    loc:ride:{ride_id}               hash member_id -> compact loc json (TTL 2h)
    seq:ride:{ride_id}               counter
    stre:ride:{ride_id}              redis stream of critical events (MAXLEN 1000)
"""

from __future__ import annotations

import json
import logging
import time
from typing import Dict, List, Optional, Set

import redis.asyncio as aioredis

from realtime.metrics import M_REDIS_ERRORS, M_REDIS_LATENCY

logger = logging.getLogger(__name__)

PRESENCE_TTL_S = 90
SESSION_TTL_S = 24 * 3600
MEMBERSHIP_TTL_S = 60
LOC_TTL_S = 2 * 3600
STREAM_MAXLEN = 1000


class RealtimeStore:
    def __init__(self, redis_url: str):
        self._url = redis_url
        self.redis: Optional[aioredis.Redis] = None

    async def connect(self) -> None:
        self.redis = aioredis.from_url(
            self._url, decode_responses=True, socket_keepalive=True,
            health_check_interval=30,
        )
        await self.redis.ping()

    async def close(self) -> None:
        if self.redis:
            try:
                await self.redis.aclose()
            except Exception:
                pass
            self.redis = None

    async def _op(self, coro_factory):
        """Run a redis op with latency + error instrumentation.

        `coro_factory` receives the client and must return a coroutine.
        Returns None on failure (callers degrade gracefully).
        """
        if self.redis is None:
            try:
                await self.connect()
            except Exception:
                M_REDIS_ERRORS.inc()
                return None
        try:
            start = time.perf_counter()
            result = await coro_factory(self.redis)
            M_REDIS_LATENCY.observe((time.perf_counter() - start) * 1000)
            return result
        except Exception as exc:
            M_REDIS_ERRORS.inc()
            logger.warning("Redis op failed: %s", exc)
            return None

    # -- presence -----------------------------------------------------------
    async def heartbeat_session(self, member_id: str, session_id: str) -> None:
        async def _op(r):
            key = f"pres:user:{member_id}"
            await r.sadd(key, session_id)
            await r.expire(key, PRESENCE_TTL_S)
        await self._op(_op)

    async def remove_session_presence(self, member_id: str, session_id: str) -> None:
        async def _op(r):
            await r.srem(f"pres:user:{member_id}", session_id)
        await self._op(_op)

    async def is_user_online(self, member_id: str) -> bool:
        async def _op(r):
            return await r.exists(f"pres:user:{member_id}")
        result = await self._op(_op)
        return bool(result)

    # -- sessions (recovery) --------------------------------------------------
    async def create_session(self, session_id: str, member_id: str) -> None:
        async def _op(r):
            pipe = r.pipeline()
            pipe.hset(f"sess:{session_id}", mapping={"user": member_id, "connected_at": int(time.time())})
            pipe.expire(f"sess:{session_id}", SESSION_TTL_S)
            pipe.sadd(f"sess:rooms:{session_id}", "user:%s" % member_id)
            pipe.expire(f"sess:rooms:{session_id}", SESSION_TTL_S)
            await pipe.execute()
        await self._op(_op)

    async def destroy_session(self, session_id: str) -> None:
        async def _op(r):
            await r.delete(f"sess:{session_id}", f"sess:rooms:{session_id}", f"sess:seq:{session_id}")
        await self._op(_op)

    async def add_session_room(self, session_id: str, room: str) -> None:
        async def _op(r):
            key = f"sess:rooms:{session_id}"
            await r.sadd(key, room)
            await r.expire(key, SESSION_TTL_S)
        await self._op(_op)

    async def remove_session_room(self, session_id: str, room: str) -> None:
        async def _op(r):
            await r.srem(f"sess:rooms:{session_id}", room)
        await self._op(_op)

    async def get_session_rooms(self, session_id: str) -> Set[str]:
        async def _op(r):
            return set(await r.smembers(f"sess:rooms:{session_id}"))
        return await self._op(_op) or set()

    async def get_session_user(self, session_id: str) -> Optional[str]:
        async def _op(r):
            return await r.hget(f"sess:{session_id}", "user")
        return await self._op(_op)

    async def set_last_seq(self, session_id: str, room: str, seq: int) -> None:
        async def _op(r):
            key = f"sess:seq:{session_id}"
            await r.hset(key, room, seq)
            await r.expire(key, SESSION_TTL_S)
        await self._op(_op)

    async def get_last_seqs(self, session_id: str) -> Dict[str, int]:
        async def _op(r):
            data = await r.hgetall(f"sess:seq:{session_id}")
            return {k: int(v) for k, v in data.items()}
        return await self._op(_op) or {}

    # -- ride membership cache -------------------------------------------------
    async def get_membership(self, ride_id: str, member_id: str) -> Optional[dict]:
        async def _op(r):
            return await r.hget(f"ride:members:{ride_id}", member_id)
        raw = await self._op(_op)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except ValueError:
            return None

    async def put_membership(self, ride_id: str, member_id: str, info: Optional[dict]) -> None:
        async def _op(r):
            key = f"ride:members:{ride_id}"
            if info is None:
                await r.hset(key, member_id, json.dumps({"member": False}))
            else:
                await r.hset(key, member_id, json.dumps(info))
            await r.expire(key, MEMBERSHIP_TTL_S)
        await self._op(_op)

    async def invalidate_membership(self, ride_id: str) -> None:
        async def _op(r):
            await r.delete(f"ride:members:{ride_id}")
        await self._op(_op)

    # -- latest locations (snapshot source) ------------------------------------
    async def put_latest_loc(self, ride_id: str, member_id: str, loc_json: str) -> None:
        async def _op(r):
            key = f"loc:ride:{ride_id}"
            await r.hset(key, member_id, loc_json)
            await r.expire(key, LOC_TTL_S)
        await self._op(_op)

    async def get_latest_locs(self, ride_id: str) -> Dict[str, str]:
        async def _op(r):
            return await r.hgetall(f"loc:ride:{ride_id}")
        return await self._op(_op) or {}

    # -- critical event streams --------------------------------------------------
    async def next_seq(self, ride_id: str) -> int:
        async def _op(r):
            return await r.incr(f"seq:ride:{ride_id}")
        result = await self._op(_op)
        return int(result) if result is not None else int(time.time() * 1000)

    async def append_critical_event(self, ride_id: str, seq: int, envelope: dict) -> None:
        async def _op(r):
            await r.xadd(
                f"stre:ride:{ride_id}",
                {"seq": seq, "env": json.dumps(envelope)},
                id="*",
                maxlen=STREAM_MAXLEN,
                approximate=True,
            )
        await self._op(_op)

    async def read_critical_events_after(self, ride_id: str, after_seq: int,
                                         limit: int = 200) -> List[dict]:
        async def _op(r):
            entries = await r.xrange(f"stre:ride:{ride_id}", count=limit)
            out = []
            for _entry_id, fields in entries:
                try:
                    if int(fields.get("seq", 0)) > after_seq:
                        out.append(json.loads(fields["env"]))
                except (ValueError, KeyError):
                    continue
            return out
        return await self._op(_op) or []

    # -- pending critical events per session (ack tracking) ----------------------
    async def track_pending_event(self, session_id: str, event_id: str, room: str, ttl_s: int = 3600) -> None:
        async def _op(r):
            key = f"pend:{session_id}"
            await r.hset(key, event_id, room)
            await r.expire(key, ttl_s)
        await self._op(_op)

    async def ack_event(self, session_id: str, event_id: str) -> None:
        async def _op(r):
            await r.hdel(f"pend:{session_id}", event_id)
        await self._op(_op)
