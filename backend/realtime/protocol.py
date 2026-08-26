"""Wire protocol for the RideClub real-time platform.

Envelope shape (server -> client):

    {
      "v": 1,                # protocol version
      "type": "loc",         # event type (see EVENTS)
      "ts": 1730000000000,   # server unix ms
      "eventId": "uuid",     # unique per event (critical events only)
      "seq": 42,             # per-ride monotonic sequence (critical events)
      "corrId": "uuid",      # correlation id (echoes client request id)
      "p": {...}             # payload (compact for high-frequency events)
    }

Client -> server messages are sent as Socket.IO events with an ack callback:
    emit("loc:p", {ride, p: [[lat,lng,spd,hdg,t], ...]}, ack)

Compact location payloads use positional arrays to minimise bytes:
    [memberId, lat, lng, speed_kph, heading_deg, unix_ms]
"""

from __future__ import annotations

import time
import uuid
from typing import Any, Dict, List, Optional, Tuple

PROTOCOL_VERSION = 1

# ---------------------------------------------------------------------------
# Event names (dot-free, short for high-frequency channels)
# ---------------------------------------------------------------------------
# Client -> server
EV_LOC_PUSH = "loc:p"          # batched GPS fixes for a ride
EV_RIDE_JOIN = "ride:join"     # subscribe to a ride room (authz enforced)
EV_RIDE_LEAVE = "ride:leave"   # unsubscribe
EV_RIDE_SYNC = "ride:sync"     # request snapshot + missed critical events
EV_PINS_SUB = "pins:sub"       # subscribe to public incident-pin feed
EV_PINS_UNSUB = "pins:unsub"
EV_EVENT_ACK = "ev:ack"        # acknowledge a critical event
EV_AUTH_REFRESH = "auth:refresh"  # re-authenticate with a fresh token
EV_ECHO = "echo"               # latency probe (also used by load tests)

# Server -> client
EV_LOC = "loc"                 # coalesced location batch for a ride
EV_RIDE_EVENT = "ride:event"   # critical, sequenced, persisted ride event
EV_RIDE_SNAPSHOT = "ride:snap"  # latest known locations for a ride
EV_PINS_NEW = "pins:new"       # new public incident pin
EV_SERVER = "server"           # server control messages (draining etc.)
EV_ERR = "err"                 # error envelope

# Critical event types carried in EV_RIDE_EVENT payloads
RIDE_EVT_SOS = "SOS"
RIDE_EVT_SOS_REVOKED = "SOS_REVOKED"
RIDE_EVT_RIDE_UPDATED = "RIDE_UPDATED"
RIDE_EVT_MEMBER_JOINED = "MEMBER_JOINED"
RIDE_EVT_MEMBER_LEFT = "MEMBER_LEFT"
RIDE_EVT_MEMBER_APPROVED = "MEMBER_APPROVED"
RIDE_EVT_STATUS_CHANGED = "RIDE_STATUS"
RIDE_EVT_DESTINATION_REACHED = "DESTINATION_REACHED"

CRITICAL_RIDE_EVENTS = {
    RIDE_EVT_SOS, RIDE_EVT_SOS_REVOKED, RIDE_EVT_RIDE_UPDATED,
    RIDE_EVT_MEMBER_JOINED, RIDE_EVT_MEMBER_LEFT, RIDE_EVT_MEMBER_APPROVED,
    RIDE_EVT_STATUS_CHANGED, RIDE_EVT_DESTINATION_REACHED,
}

# Error codes
ERR_AUTH = "AUTH_FAILED"
ERR_AUTH_EXPIRED = "TOKEN_EXPIRED"
ERR_FORBIDDEN = "FORBIDDEN"
ERR_RATE_LIMITED = "RATE_LIMITED"
ERR_BAD_REQUEST = "BAD_REQUEST"
ERR_SERVER_DRAINING = "SERVER_DRAINING"
ERR_INTERNAL = "INTERNAL"


def now_ms() -> int:
    return int(time.time() * 1000)


def new_event_id() -> str:
    return uuid.uuid4().hex


def envelope(
    event_type: str,
    payload: Any,
    *,
    event_id: Optional[str] = None,
    seq: Optional[int] = None,
    corr_id: Optional[str] = None,
    version: int = PROTOCOL_VERSION,
) -> Dict[str, Any]:
    env: Dict[str, Any] = {"v": version, "type": event_type, "ts": now_ms(), "p": payload}
    if event_id is not None:
        env["eventId"] = event_id
    if seq is not None:
        env["seq"] = seq
    if corr_id is not None:
        env["corrId"] = corr_id
    return env


def error_envelope(code: str, message: str, corr_id: Optional[str] = None) -> Dict[str, Any]:
    return envelope(EV_ERR, {"code": code, "message": message}, corr_id=corr_id)


# ---------------------------------------------------------------------------
# Compact location codec
# ---------------------------------------------------------------------------
# Wire: [member_id, lat, lng, speed_kph, heading, unix_ms]
LocationTuple = Tuple[str, float, float, float, float, int]


def encode_location(member_id: str, lat: float, lng: float, speed: float,
                    heading: float, ts_ms: Optional[int] = None) -> List[Any]:
    return [member_id, round(lat, 6), round(lng, 6), round(speed or 0, 1),
            round(heading or 0, 0), ts_ms if ts_ms is not None else now_ms()]


def decode_location(arr: List[Any]) -> Optional[LocationTuple]:
    try:
        return (str(arr[0]), float(arr[1]), float(arr[2]), float(arr[3]),
                float(arr[4]), int(arr[5]))
    except (IndexError, TypeError, ValueError):
        return None


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in metres (good enough for gating decisions)."""
    from math import asin, cos, radians, sin, sqrt

    r = 6371000.0
    d_lat = radians(lat2 - lat1)
    d_lng = radians(lng2 - lng1)
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lng / 2) ** 2
    return 2 * r * asin(min(1.0, sqrt(a)))
