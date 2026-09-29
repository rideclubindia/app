"""Authorized room subscription management.

Rooms:
    user:{member_id}   - personal events for every device of a user
    ride:{ride_id}     - ride members only (approved members + ride owner)
    pins               - public incident feed (opt-in, low frequency)

Authorization:
    Ride membership is resolved SERVER-SIDE from ride_members/rides. The
    result is cached in Redis for 60s to keep join storms cheap. A user who
    leaves a ride (or is removed) is unsubscribed from the room automatically
    on their next membership check; the cache invalidation helper lets the
    REST layer evict instantly.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Optional, Set

from sqlalchemy import text

from core.database import SessionLocal
from realtime import protocol as proto
from realtime.identity import Identity, member_id_for_uid
from realtime.metrics import M_ROOM_JOIN_FAILS, M_ROOM_JOINS, M_ROOM_LEAVES
from realtime.store import MEMBERSHIP_TTL_S, RealtimeStore

logger = logging.getLogger(__name__)

_membership_executor = None


def _get_executor():
    global _membership_executor
    if _membership_executor is None:
        from concurrent.futures import ThreadPoolExecutor
        _membership_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="membership")
    return _membership_executor


_MEMBERSHIP_SQL = text("""
    SELECT rm.role AS member_role, rm.status AS member_status, r.owner_id AS owner_id, r.status AS ride_status
    FROM rides r
    LEFT JOIN ride_members rm
      ON rm.ride_id = r.id AND rm.user_id::text IN (:uid, :duid)
    WHERE r.id = CAST(:ride_id AS uuid)
    LIMIT 1
""")


def _lookup_membership_sync(ride_id: str, firebase_uid: str, duid: str) -> Optional[dict]:
    session = SessionLocal()
    try:
        row = session.execute(
            _MEMBERSHIP_SQL,
            {"ride_id": ride_id, "uid": firebase_uid, "duid": duid},
        ).mappings().first()
        if row is None:
            return None
        return dict(row)
    except Exception as exc:
        logger.error("Membership lookup failed for ride %s: %s", ride_id, exc)
        return {"error": True}
    finally:
        session.close()


class RoomManager:
    def __init__(self, store: RealtimeStore, sio):
        self.store = store
        self.sio = sio

    # ------------------------------------------------------------- authorize
    async def check_ride_membership(self, identity: Identity, ride_id: str) -> Optional[dict]:
        """Returns membership info dict, or None when not a member."""
        duid = member_id_for_uid(identity.firebase_uid)
        cached = await self.store.get_membership(ride_id, duid)
        if cached is not None:
            return None if not cached.get("member") else cached

        loop = asyncio.get_event_loop()
        row = await loop.run_in_executor(
            _get_executor(), _lookup_membership_sync, ride_id, identity.firebase_uid, duid
        )
        info: Optional[dict]
        if row is None or row.get("error"):
            # Ride not found or DB failure - fail closed for not-found, open for errors
            info = None if (row is None) else None
            await self.store.put_membership(ride_id, duid, None)
            return None
        owner = str(row.get("owner_id") or "")
        is_owner = owner in (identity.firebase_uid, duid)
        member_status = row.get("member_status")
        if is_owner or member_status in ("approved", "admin", "owner"):
            info = {"member": True, "role": row.get("member_role") or ("owner" if is_owner else "rider"),
                    "ride_status": row.get("ride_status")}
        else:
            info = None
            await self.store.put_membership(ride_id, duid, None)
            return None
        await self.store.put_membership(ride_id, duid, info)
        return info

    # ------------------------------------------------------------------ join
    async def join_ride(self, sid: str, identity: Identity, session_id: str, ride_id: str) -> dict:
        info = await self.check_ride_membership(identity, ride_id)
        if info is None:
            M_ROOM_JOIN_FAILS.inc()
            raise PermissionError(proto.ERR_FORBIDDEN)
        room = f"ride:{ride_id}"
        await self.sio.enter_room(sid, room)
        await self.store.add_session_room(session_id, room)
        await self.store.heartbeat_session(identity.member_id, session_id)
        M_ROOM_JOINS.inc()
        return info

    async def leave_ride(self, sid: str, session_id: str, ride_id: str) -> None:
        room = f"ride:{ride_id}"
        await self.sio.leave_room(sid, room)
        await self.store.remove_session_room(session_id, room)
        M_ROOM_LEAVES.inc()

    async def join_pins(self, sid: str, session_id: str) -> None:
        await self.sio.enter_room(sid, "pins")
        await self.store.add_session_room(session_id, "pins")

    async def leave_pins(self, sid: str, session_id: str) -> None:
        await self.sio.leave_room(sid, "pins")
        await self.store.remove_session_room(session_id, "pins")

    # ---------------------------------------------------------------- restore
    async def restore_session_rooms(self, sid: str, identity: Identity, session_id: str) -> Set[str]:
        """Re-enter rooms recorded for this session (used on reconnect)."""
        rooms = await self.store.get_session_rooms(session_id)
        restored: Set[str] = set()
        for room in rooms:
            if room.startswith("ride:"):
                ride_id = room.split(":", 1)[1]
                info = await self.check_ride_membership(identity, ride_id)
                if info is None:
                    await self.store.remove_session_room(session_id, room)
                    continue
                await self.sio.enter_room(sid, room)
                restored.add(room)
            elif room == "pins":
                await self.sio.enter_room(sid, room)
                restored.add(room)
        return restored

    # ------------------------------------------------------------------ misc
    async def evict_ride_from_user(self, member_id: str, ride_id: str) -> None:
        """Invalidate membership so the next join/sync is re-checked.

        Live removal of a connected device is handled by the gateway, which
        keeps an in-memory sid -> identity map for its own connections and can
        leave the room immediately when a MEMBER_LEFT critical event is
        published (see gateway.handle_kick).
        """
        await self.store.invalidate_membership(ride_id)


def invalidate_ride_cache(store: RealtimeStore, ride_id: str) -> None:
    """Fire-and-forget cache eviction for REST handlers that mutate membership."""
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(store.invalidate_membership(ride_id))
    except RuntimeError:
        pass
