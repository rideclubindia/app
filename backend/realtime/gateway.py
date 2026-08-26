"""Real-time WebSocket gateway (Socket.IO over ASGI).

Connection lifecycle
--------------------
    handshake (JWT in auth payload or query) -> verify -> register session
      -> restore rooms (reconnect w/ sessionId) -> live events
      -> disconnect (graceful / timeout / eviction)

Scaling
-------
    python-socketio AsyncRedisManager fans out emits to every node via Redis
    pub/sub, so any node can emit to any room regardless of where the target
    socket is connected. No sticky sessions required (websocket transport is
    connection-pinned by nature; polling fallback works without stickiness for
    emits because the Redis manager routes them).

Backpressure
    * inbound: token-bucket per connection + payload size limits
    * outbound: location coalescing at source (latest-wins), critical events
      are small and rare; recovery via streams covers anything missed.
"""

from __future__ import annotations

import asyncio
import logging
import socket
import time
import uuid
from typing import Any, Dict, Optional

import socketio

from core.config import settings
from realtime import protocol as proto
from realtime.identity import AuthError, Identity, verify_token
from realtime.location_pipeline import LocationPipeline
from realtime.metrics import (
    M_ACTIVE_CONNS, M_BYTES_IN, M_CONNECT_FAILS, M_CONNECTS, M_CRITICAL_EVENTS,
    M_DISCONNECTS, M_DROPPED, M_EVENT_LATENCY, M_HANDLER_TIME, M_MSG_IN,
    M_MSG_OUT, M_RIDE_ROOMS, M_REAUTHS,
)
from realtime.ratelimit import RateLimiterRegistry
from realtime.rooms import RoomManager
from realtime.store import RealtimeStore

logger = logging.getLogger("realtime.gateway")


class Gateway:
    def __init__(self, redis_url: str):
        self.store = RealtimeStore(redis_url)
        # Subscribing manager: every gateway node receives emits published by
        # any other node and delivers them to its locally-connected sockets.
        self.client_manager = socketio.AsyncRedisManager(redis_url)
        self.sio = socketio.AsyncServer(
            async_mode="asgi",
            client_manager=self.client_manager,
            cors_allowed_origins=settings.ALLOWED_ORIGINS_LIST or ["*"],
            ping_interval=25,
            ping_timeout=20,
            max_http_buffer_size=1_000_000,   # 1MB hard cap per packet
            engineio_logger=False,
        )
        self.ratelimits = RateLimiterRegistry(self.store.redis)
        self.rooms = RoomManager(self.store, self.sio)
        self.pipeline = LocationPipeline(self.store, self._emit_to_room)
        # sid -> {identity, session_id, connected_at, rooms:set, last_activity}
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._draining = False
        self._sweep_task: Optional[asyncio.Task] = None
        self._started_at = time.time()
        self._register_handlers()

    def _register_handlers(self) -> None:
        self.sio.on("connect", self.on_connect)
        self.sio.on("disconnect", self.on_disconnect)
        self.sio.on(proto.EV_LOC_PUSH, self.on_loc_p)
        self.sio.on(proto.EV_RIDE_JOIN, self.on_ride_join)
        self.sio.on(proto.EV_RIDE_LEAVE, self.on_ride_leave)
        self.sio.on(proto.EV_RIDE_SYNC, self.on_ride_sync)
        self.sio.on(proto.EV_PINS_SUB, self.on_pins_sub)
        self.sio.on(proto.EV_PINS_UNSUB, self.on_pins_unsub)
        self.sio.on(proto.EV_EVENT_ACK, self.on_ev_ack)
        self.sio.on(proto.EV_AUTH_REFRESH, self.on_auth_refresh)
        self.sio.on(proto.EV_ECHO, self.on_echo)

    # ------------------------------------------------------------------ util
    async def _emit_to_room(self, room: str, event_type: str, payload: dict) -> None:
        env = proto.envelope(event_type, payload)
        await self.sio.emit(event_type, env, room=room)
        M_MSG_OUT.inc()

    def _extract_token(self, environ: dict, auth: Optional[dict]) -> Optional[str]:
        if auth and isinstance(auth, dict) and auth.get("token"):
            return str(auth["token"])
        qs = environ.get("QUERY_STRING", "") or ""
        for part in qs.split("&"):
            if part.startswith("token="):
                from urllib.parse import unquote
                return unquote(part[len("token="):])
        return None

    def _origin_allowed(self, environ: dict) -> bool:
        # python-socketio already enforces cors_allowed_origins for engineio
        # handshakes; this hook exists for explicit logging/deny decisions.
        return True

    # ------------------------------------------------------------- lifecycle
    async def start(self) -> None:
        try:
            await self.store.connect()
            self.ratelimits.redis = self.store.redis
        except Exception as exc:
            # Degraded single-node mode (typically local dev without Redis):
            # in-memory rate limits, no presence/recovery streams. The
            # Socket.IO Redis manager reconnects on its own when Redis returns.
            M_REDIS_ERRORS.inc()
            logger.warning("Redis unavailable - gateway in DEGRADED single-node mode: %s", exc)
        self.pipeline.start()
        self._sweep_task = asyncio.get_running_loop().create_task(self._sweep_loop())
        logger.info("Realtime gateway started (node=%s)", socket.gethostname())

    async def stop(self) -> None:
        """Graceful shutdown: drain, notify clients, then release resources."""
        self._draining = True
        if self._sweep_task:
            self._sweep_task.cancel()
            try:
                await self._sweep_task
            except (asyncio.CancelledError, Exception):
                pass
        # Tell live clients to reconnect elsewhere; LB readiness also flips.
        await self.sio.emit(proto.EV_SERVER, proto.envelope(
            proto.EV_SERVER, {"code": proto.ERR_SERVER_DRAINING, "message": "Node draining"}))
        await asyncio.sleep(2.0)
        sids = list(self._sessions.keys())
        for sid in sids:
            try:
                await self.sio.disconnect(sid)
            except Exception:
                pass
        await self.pipeline.stop()
        await self.store.close()
        logger.info("Realtime gateway stopped")

    @property
    def draining(self) -> bool:
        return self._draining

    # ------------------------------------------------------------- handshake
    async def _authenticate(self, sid: str, environ: dict, auth: Optional[dict]) -> Identity:
        token = self._extract_token(environ, auth)
        identity = verify_token(token or "")

        ip = self._client_ip(environ)
        if not await self.ratelimits.connect.allow(f"ip:{ip}"):
            raise AuthError(proto.ERR_RATE_LIMITED, "Too many connections")
        if not await self.ratelimits.connect.allow(f"user:{identity.member_id}"):
            raise AuthError(proto.ERR_RATE_LIMITED, "Too many connections")

        # Duplicate / multi-device handling: cap concurrent sessions per user.
        existing = [s for s, meta in self._sessions.items()
                    if meta["identity"].member_id == identity.member_id]
        max_devices = settings.RTC_MAX_DEVICES_PER_USER
        if len(existing) >= max_devices:
            # Drop the OLDEST session so the newest device wins.
            existing.sort(key=lambda s: self._sessions[s]["connected_at"])
            for old_sid in existing[: len(existing) - max_devices + 1]:
                try:
                    await self.sio.disconnect(old_sid)
                except Exception:
                    pass

        return identity

    @staticmethod
    def _client_ip(environ: dict) -> str:
        fwd = environ.get("HTTP_X_FORWARDED_FOR") or environ.get("HTTP_X_REAL_IP")
        if fwd:
            return str(fwd).split(",")[0].strip()
        return (environ.get("REMOTE_ADDR") or "unknown")

    # ---------------------------------------------------------- socket.io api
    async def on_connect(self, sid: str, environ: dict, auth: Optional[dict] = None):
        start = time.perf_counter()
        if self._draining:
            M_CONNECT_FAILS.inc()
            raise socketio.exceptions.ConnectionRefusedError(proto.ERR_SERVER_DRAINING)
        try:
            identity = await self._authenticate(sid, environ, auth)
        except AuthError as exc:
            M_CONNECT_FAILS.inc()
            raise socketio.exceptions.ConnectionRefusedError(exc.code)
        except Exception:
            M_CONNECT_FAILS.inc()
            logger.exception("Handshake error")
            raise socketio.exceptions.ConnectionRefusedError(proto.ERR_AUTH)

        session_id = (auth or {}).get("sessionId") or uuid.uuid4().hex
        self._sessions[sid] = {
            "identity": identity,
            "session_id": session_id,
            "connected_at": time.time(),
            "last_activity": time.time(),
            "rooms": set(),
        }
        M_CONNECTS.inc()
        M_ACTIVE_CONNS.set(len(self._sessions))

        await self.store.create_session(session_id, identity.member_id)
        await self.store.heartbeat_session(identity.member_id, session_id)

        restored = await self.rooms.restore_session_rooms(sid, identity, session_id)
        M_RIDE_ROOMS.set(sum(1 for m in self._sessions.values() for r in m["rooms"] if r.startswith("ride:")))

        M_HANDLER_TIME.observe((time.perf_counter() - start) * 1000, op="connect")
        # Acknowledge the session so the client can persist it for recovery.
        await self.sio.emit(proto.EV_SERVER, proto.envelope(
            proto.EV_SERVER,
            {"code": "CONNECTED", "sessionId": session_id,
             "restoredRooms": sorted(restored), "node": socket.gethostname()},
        ), to=sid)

    def _meta(self, sid: str) -> Dict[str, Any]:
        meta = self._sessions.get(sid)
        if meta is None:
            raise KeyError(sid)
        return meta

    async def on_disconnect(self, sid, *args):
        meta = self._sessions.pop(sid, None)
        M_DISCONNECTS.inc()
        M_ACTIVE_CONNS.set(len(self._sessions))
        if not meta:
            return
        identity: Identity = meta["identity"]
        session_id = meta["session_id"]
        # Session record survives (TTL) for recovery; presence is removed.
        await self.store.remove_session_presence(identity.member_id, session_id)

    # ----------------------------------------------------------- rate guard
    async def _allow_message(self, sid: str, op: str, data_len: int = 0) -> bool:
        try:
            meta = self._meta(sid)
        except KeyError:
            return False
        meta["last_activity"] = time.time()
        M_MSG_IN.inc()
        M_BYTES_IN.inc(data_len)
        if not await self.ratelimits.messages.allow(sid):
            M_DROPPED.inc(op=op)
            return False
        return True

    @staticmethod
    def _ack(ok: bool = True, code: str = "OK", **extra) -> dict:
        """Build the handler return value.

        python-socketio sends a handler's RETURN VALUE as the client ack
        (there is no ack callback argument in the Python server, unlike JS).
        Always `return self._ack(...)` from event handlers.
        """
        payload = {"ok": ok, "code": code, "ts": proto.now_ms()}
        payload.update(extra)
        return payload

    # ------------------------------------------------------------ handlers
    async def on_loc_p(self, sid: str, data: dict, ack=None):
        """Batched GPS fixes: {ride: str, p: [[lat,lng,spd,hdg,ts], ...]}"""
        start = time.perf_counter()
        try:
            if not await self._allow_message(sid, "loc:p", len(str(data))):
                return self._ack(False, proto.ERR_RATE_LIMITED)
            meta = self._meta(sid)
            identity: Identity = meta["identity"]
            ride_id = str((data or {}).get("ride", ""))[:64]
            fixes = (data or {}).get("p")
            if not ride_id or not isinstance(fixes, list) or not fixes:
                return self._ack(False, proto.ERR_BAD_REQUEST, message="ride and p[] required")
            if len(fixes) > 20:
                fixes = fixes[:20]
                M_DROPPED.inc(op="loc:batch-trim")
            if not await self.ratelimits.location.allow(identity.member_id):
                M_DROPPED.inc(op="loc:rate")
                return self._ack(False, proto.ERR_RATE_LIMITED)
            info = await self.rooms.check_ride_membership(identity, ride_id)
            if info is None:
                return self._ack(False, proto.ERR_FORBIDDEN, message="not a ride member")
            accepted = await self.pipeline.ingest(ride_id, identity.member_id, fixes)
            M_HANDLER_TIME.observe((time.perf_counter() - start) * 1000, op="loc:p")
            return self._ack(True, "OK", accepted=accepted)
        except KeyError:
            return self._ack(False, proto.ERR_AUTH)
        except Exception:
            logger.exception("loc:p failed")
            return self._ack(False, proto.ERR_INTERNAL)

    async def on_ride_join(self, sid: str, data: dict, ack=None):
        try:
            if not await self._allow_message(sid, "ride:join", len(str(data))):
                return self._ack(False, proto.ERR_RATE_LIMITED)
            meta = self._meta(sid)
            identity: Identity = meta["identity"]
            ride_id = str((data or {}).get("ride", ""))[:64]
            if not ride_id:
                return self._ack(False, proto.ERR_BAD_REQUEST)
            info = await self.rooms.join_ride(sid, identity, meta["session_id"], ride_id)
            meta["rooms"].add(f"ride:{ride_id}")
            M_RIDE_ROOMS.set(sum(1 for m in self._sessions.values() for r in m["rooms"] if r.startswith("ride:")))
            # Snapshot: latest known locations so the map fills instantly.
            await self._send_snapshot(sid, ride_id)
            return self._ack(True, "OK", role=info.get("role"), rideStatus=info.get("ride_status"))
        except PermissionError as exc:
            return self._ack(False, str(exc), message="Not a member of this ride")
        except KeyError:
            return self._ack(False, proto.ERR_AUTH)
        except Exception:
            logger.exception("ride:join failed")
            return self._ack(False, proto.ERR_INTERNAL)

    async def on_ride_leave(self, sid: str, data: dict, ack=None):
        try:
            if not await self._allow_message(sid, "ride:leave", len(str(data))):
                return self._ack(False, proto.ERR_RATE_LIMITED)
            meta = self._meta(sid)
            ride_id = str((data or {}).get("ride", ""))[:64]
            if not ride_id:
                return self._ack(False, proto.ERR_BAD_REQUEST)
            await self.rooms.leave_ride(sid, meta["session_id"], ride_id)
            meta["rooms"].discard(f"ride:{ride_id}")
            M_RIDE_ROOMS.set(sum(1 for m in self._sessions.values() for r in m["rooms"] if r.startswith("ride:")))
            return self._ack(True)
        except KeyError:
            return self._ack(False, proto.ERR_AUTH)

    async def on_ride_sync(self, sid: str, data: dict, ack=None):
        """Recovery: {ride, lastSeq} -> missed critical events + snapshot."""
        try:
            if not await self._allow_message(sid, "ride:sync", len(str(data))):
                return self._ack(False, proto.ERR_RATE_LIMITED)
            meta = self._meta(sid)
            identity: Identity = meta["identity"]
            ride_id = str((data or {}).get("ride", ""))[:64]
            last_seq = int((data or {}).get("lastSeq", 0) or 0)
            info = await self.rooms.check_ride_membership(identity, ride_id)
            if info is None:
                return self._ack(False, proto.ERR_FORBIDDEN)
            missed = await self.store.read_critical_events_after(ride_id, last_seq)
            for env in missed:
                await self.sio.emit(proto.EV_RIDE_EVENT, env, to=sid)
                M_MSG_OUT.inc()
            await self._send_snapshot(sid, ride_id)
            return self._ack(True, "OK", replayed=len(missed))
        except KeyError:
            return self._ack(False, proto.ERR_AUTH)
        except Exception:
            logger.exception("ride:sync failed")
            return self._ack(False, proto.ERR_INTERNAL)

    async def on_pins_sub(self, sid: str, data: dict = None, ack=None):
        try:
            if not await self._allow_message(sid, "pins:sub", 0):
                return self._ack(False, proto.ERR_RATE_LIMITED)
            meta = self._meta(sid)
            await self.rooms.join_pins(sid, meta["session_id"])
            return self._ack(True)
        except KeyError:
            return self._ack(False, proto.ERR_AUTH)

    async def on_pins_unsub(self, sid: str, data: dict = None, ack=None):
        try:
            meta = self._meta(sid)
            await self.rooms.leave_pins(sid, meta["session_id"])
            return self._ack(True)
        except KeyError:
            return self._ack(False, proto.ERR_AUTH)

    async def on_ev_ack(self, sid: str, data: dict, ack=None):
        """Client acknowledges a critical event (delivery confirmation)."""
        try:
            meta = self._sessions.get(sid)
            if not meta:
                return
            event_id = str((data or {}).get("eventId", ""))[:64]
            seq = (data or {}).get("seq")
            if event_id:
                await self.store.ack_event(meta["session_id"], event_id)
            if event_id and seq:
                # roundtrip = now - envelope ts is sent by client in `rtt`
                rtt = (data or {}).get("rttMs")
                if isinstance(rtt, (int, float)) and rtt >= 0:
                    M_EVENT_LATENCY.observe(float(rtt))
        except Exception:
            logger.exception("ev:ack failed")

    async def on_auth_refresh(self, sid: str, data: dict, ack=None):
        """Mid-session token renewal (never trust client identity claims)."""
        try:
            if not await self._allow_message(sid, "auth:refresh", len(str(data))):
                return self._ack(False, proto.ERR_RATE_LIMITED)
            token = str((data or {}).get("token", ""))
            identity = verify_token(token)
            meta = self._meta(sid)
            old = meta["identity"]
            if identity.member_id != old.member_id:
                return self._ack(False, proto.ERR_FORBIDDEN, message="identity mismatch")
            meta["identity"] = identity
            meta["last_activity"] = time.time()
            M_REAUTHS.inc()
            return self._ack(True)
        except AuthError as exc:
            return self._ack(False, exc.code, message=str(exc))
        except KeyError:
            return self._ack(False, proto.ERR_AUTH)

    async def on_echo(self, sid: str, data: dict = None, ack=None):
        """Latency probe: echoes {t} back with server timestamp."""
        if not await self._allow_message(sid, "echo", 0):
            return self._ack(False, proto.ERR_RATE_LIMITED)
        payload = {"t": (data or {}).get("t"), "serverTs": proto.now_ms()}
        M_MSG_OUT.inc()
        return payload

    # ------------------------------------------------------------ publishing
    async def _send_snapshot(self, sid: str, ride_id: str) -> None:
        locs = await self.store.get_latest_locs(ride_id)
        latest = []
        for member_id, raw in locs.items():
            try:
                latest.append(json.loads(raw))
            except ValueError:
                continue
        env = proto.envelope(proto.EV_RIDE_SNAPSHOT, {"ride": ride_id, "u": latest})
        await self.sio.emit(proto.EV_RIDE_SNAPSHOT, env, to=sid)
        M_MSG_OUT.inc()

    async def publish_critical_ride_event(self, ride_id: str, event_type: str,
                                          payload: dict, member_id: str = "") -> dict:
        """Persist + sequence + fan out a critical ride event.

        Used by the gateway internally and callable from REST routers
        (pins, SOS, ride mutations) via `get_gateway()`.
        """
        seq = await self.store.next_seq(ride_id)
        env = proto.envelope(
            proto.EV_RIDE_EVENT,
            {"ride": ride_id, "eventType": event_type, "by": member_id, "data": payload},
            event_id=proto.new_event_id(),
            seq=seq,
        )
        # Durable first: stream (recovery) + Postgres (audit) - both async.
        await self.store.append_critical_event(ride_id, seq, env)
        asyncio.get_running_loop().create_task(
            asyncio.get_running_loop().run_in_executor(
                None, _persist_ride_event_sync, ride_id, member_id, event_type, payload)
        )
        # Fan out via Redis manager so every node delivers it.
        await self.sio.emit(proto.EV_RIDE_EVENT, env, room=f"ride:{ride_id}")
        M_MSG_OUT.inc()
        M_CRITICAL_EVENTS.inc(eventType=event_type)
        return env

    async def handle_kick(self, ride_id: str, member_id: str) -> None:
        """Remove all of a user's sessions from a ride room on this node."""
        room = f"ride:{ride_id}"
        for sid, meta in list(self._sessions.items()):
            if meta["identity"].member_id == member_id and room in meta["rooms"]:
                await self.rooms.leave_ride(sid, meta["session_id"], ride_id)
                meta["rooms"].discard(room)

    # ------------------------------------------------------------------ sweep
    async def _sweep_loop(self) -> None:
        """Idle connection handling: drop sessions silent for too long."""
        while True:
            await asyncio.sleep(60)
            try:
                cutoff = time.time() - settings.RTC_IDLE_TIMEOUT_S
                stale = [sid for sid, meta in self._sessions.items()
                         if meta["last_activity"] < cutoff]
                for sid in stale:
                    logger.info("Disconnecting idle session %s", sid)
                    try:
                        await self.sio.disconnect(sid)
                    except Exception:
                        pass
                # Presence heartbeat for live sessions
                for sid, meta in list(self._sessions.items()):
                    await self.store.heartbeat_session(meta["identity"].member_id, meta["session_id"])
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("Sweep loop error")


async def _safe_call(ack, payload: dict) -> None:
    try:
        result = ack(payload)
        if asyncio.iscoroutine(result):
            await result
    except Exception:
        pass


def _persist_ride_event_sync(ride_id: str, member_id: str, event_type: str, payload: dict) -> None:
    from sqlalchemy import text as _text
    from core.database import SessionLocal
    session = SessionLocal()
    try:
        session.execute(
            _text("""INSERT INTO ride_events (ride_id, user_id, event_type, payload)
                     VALUES (CAST(:ride_id AS uuid), :user_id, :event_type, CAST(:payload AS jsonb))"""),
            {"ride_id": ride_id, "user_id": member_id or "system",
             "event_type": event_type, "payload": json_dumps(payload)},
        )
        session.commit()
    except Exception as exc:
        session.rollback()
        from realtime.metrics import M_DB_ERRORS
        M_DB_ERRORS.inc()
        logger.error("ride_events insert failed: %s", exc)
    finally:
        session.close()


def json_dumps(obj: dict) -> str:
    import json as _json
    return _json.dumps(obj, separators=(",", ":"), default=str)


# ---------------------------------------------------------------------------
# Module-level singleton (mounted by main.py, imported by REST routers)
# ---------------------------------------------------------------------------
gateway = Gateway(settings.REDIS_URL)
sio = gateway.sio


async def broadcast_new_pin(pin_data: dict) -> None:
    """Compat shim for api/routers/pins.py - now scoped to the pins room."""
    env = proto.envelope(proto.EV_PINS_NEW, pin_data)
    await sio.emit(proto.EV_PINS_NEW, env, room="pins")
    M_MSG_OUT.inc()


async def broadcast_ride_event(ride_id: str, event_type: str, payload: dict,
                               member_id: str = "") -> dict:
    """Public helper for REST routers to publish critical ride events."""
    return await gateway.publish_critical_ride_event(ride_id, event_type, payload, member_id)
