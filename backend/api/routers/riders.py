import json
import math
import re
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.orm import Session

from api.deps import get_current_user
from core.database import get_db
from core.limiter import limiter
from models.models import User

router = APIRouter(tags=["riders"])

UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)


def _to_int32(x: int) -> int:
    x &= 0xFFFFFFFF
    return x - 0x100000000 if x >= 0x80000000 else x


def deterministic_uuid(value: str) -> str:
    """Python port of frontend lib/user.ts getDeterministicUuid (JS 32-bit shift semantics)."""
    h = 0
    for ch in value:
        shl = _to_int32(_to_int32(h) * 32)
        h = ord(ch) + (shl - h)
    return "00000000-0000-0000-0000-" + format(abs(h), "x").rjust(12, "0")


def _km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _bike_model(bike) -> Optional[str]:
    # Only the model is public; the registration number identifies a vehicle and stays private
    if isinstance(bike, dict):
        return bike.get("model") or None
    if isinstance(bike, str) and bike.strip():
        try:
            return (json.loads(bike) or {}).get("model") or None
        except ValueError:
            return bike.strip()
    return None


@router.get("/{rider_id}/public")
@limiter.limit("60/minute")
def public_rider_profile(request: Request, rider_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Limited public profile of a rider: safe fields and aggregate stats only. Never email, phone, emergency
    contact, blood group, location, registration number, private groups or individual rides."""
    rider_id = rider_id.strip()
    profile_id = rider_id if UUID_RE.match(rider_id) else deterministic_uuid(rider_id)

    row = db.execute(
        text("SELECT id, full_name, avatar_url, bike_details, created_at, status FROM profiles WHERE id = :id AND deleted_at IS NULL"),
        {"id": profile_id},
    ).mappings().first()
    if not row or row["status"] in ("banned", "suspended"):
        raise HTTPException(status_code=404, detail="Rider not found")

    ids = [profile_id] + ([rider_id] if rider_id != profile_id else [])

    # Same rules the rider's own Profile uses: rides owned, joined or tracked; km from completed navigations
    ride_ids = set()
    for sql in (
        "SELECT id::text FROM rides WHERE owner_id::text = ANY(:ids)",
        "SELECT DISTINCT ride_id::text FROM ride_members WHERE user_id::text = ANY(:ids) AND COALESCE(status, 'approved') <> 'pending'",
        "SELECT DISTINCT ride_id::text FROM ride_locations WHERE user_id::text = ANY(:ids)",
    ):
        try:
            ride_ids.update(r[0] for r in db.execute(text(sql), {"ids": ids}).fetchall() if r[0])
        except Exception:
            db.rollback()

    km = 0.0
    try:
        for s in db.execute(
            text("SELECT origin_lat, origin_lng, dest_lat, dest_lng FROM navigation_sessions WHERE user_id::text = ANY(:ids) AND status = 'completed'"),
            {"ids": ids},
        ).fetchall():
            if None not in s:
                km += _km(float(s[0]), float(s[1]), float(s[2]), float(s[3]))
    except Exception:
        db.rollback()

    groups = []
    groups_led = 0
    try:
        groups = [
            {"id": str(g[0]), "name": g[1]}
            for g in db.execute(
                text(
                    "SELECT g.id, g.name FROM groups g JOIN group_members m ON m.group_id = g.id "
                    "WHERE m.user_id::text = ANY(:ids) AND COALESCE(g.is_private, false) = false "
                    "AND COALESCE(m.status, 'accepted') = 'accepted' ORDER BY g.name LIMIT 20"
                ),
                {"ids": ids},
            ).fetchall()
        ]
        groups_led = db.execute(
            text("SELECT COUNT(*) FROM groups WHERE admin_id::text = ANY(:ids) AND COALESCE(is_private, false) = false"), {"ids": ids}
        ).scalar() or 0
    except Exception:
        db.rollback()

    rides = len(ride_ids)
    created = row["created_at"]
    viewer_ids = {str(user.id), deterministic_uuid(str(user.id))} if user else set()
    return {
        "id": str(row["id"]),
        "name": row["full_name"] or "Rider",
        "avatarUrl": row["avatar_url"],
        "bike": _bike_model(row["bike_details"]),
        "memberSince": created.isoformat() if isinstance(created, datetime) else created,
        "stats": {"rides": rides, "km": round(km)},
        "groups": groups,
        "badges": [b for b, ok in (("First Ride", rides >= 1), ("100 KM", km >= 100), ("1,000 KM", km >= 1000), ("Group Leader", groups_led >= 1)) if ok],
        "isMe": profile_id in viewer_ids,
    }
