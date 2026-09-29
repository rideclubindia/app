import json
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.orm import Session

from api.deps import get_current_user
from core.database import get_db
from core.limiter import limiter
from models.models import User

# Profiles are no longer readable/writable with the public Supabase key; private fields go through here
router = APIRouter(tags=["profiles"])

ADMIN_EMAILS = {"iharsharoyal@gmail.com"}
PRIVATE_COLS = (
    "id, full_name, email, avatar_url, phone_number, blood_group, emergency_contact, bike_details, status, role, "
    "alerts_last_viewed, policy_accepted_at, device_info, accepted_privacy_version, accepted_terms_version, "
    "deleted_at, created_at, updated_at"
)
SELF_EDITABLE = {
    "full_name", "avatar_url", "phone_number", "blood_group", "emergency_contact", "bike_details",
    "alerts_last_viewed", "policy_accepted_at", "device_info", "accepted_privacy_version", "accepted_terms_version",
}
ADMIN_EDITABLE = SELF_EDITABLE | {"role", "status", "deleted_at", "email"}


def _is_admin(user: User) -> bool:
    return (user.email or "").lower() in ADMIN_EMAILS or str(user.role or "").lower() == "admin"


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not _is_admin(user):
        raise HTTPException(status_code=403, detail="Admin only")
    return user


def _update(db: Session, profile_id: str, patch: Dict[str, Any], allowed: set) -> None:
    fields = {k: v for k, v in patch.items() if k in allowed}
    if not fields:
        raise HTTPException(status_code=400, detail="Nothing to update")
    if "full_name" in fields and not str(fields["full_name"] or "").strip():
        raise HTTPException(status_code=400, detail="Name can't be empty")
    params = {k: (json.dumps(v) if k == "bike_details" and v is not None else v) for k, v in fields.items()}
    sets = ", ".join(f"{k} = CAST(:{k} AS jsonb)" if k == "bike_details" else f"{k} = :{k}" for k in fields)
    try:
        res = db.execute(text(f"UPDATE profiles SET {sets}, updated_at = now() WHERE id = :pid"), {**params, "pid": profile_id})
        db.commit()
    except Exception as e:
        db.rollback()
        msg = str(getattr(e, "orig", e)).split("\n")[0]
        raise HTTPException(status_code=400, detail=msg)
    if res.rowcount == 0:
        raise HTTPException(status_code=404, detail="Profile not found")


@router.get("/me/profile")
@limiter.limit("120/minute")
def my_profile(request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = db.execute(text(f"SELECT {PRIVATE_COLS} FROM profiles WHERE id = :id"), {"id": str(user.id)}).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {**dict(row), "is_admin": _is_admin(user)}


@router.patch("/me/profile")
@limiter.limit("60/minute")
def update_my_profile(request: Request, patch: Dict[str, Any] = Body(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _update(db, str(user.id), patch, SELF_EDITABLE)
    return my_profile(request, db, user)


@router.get("/profiles/search")
@limiter.limit("60/minute")
def search_riders(request: Request, q: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = q.strip()
    if len(q) < 2:
        return []
    # Partial match on name only; an email must match exactly so addresses can't be enumerated
    rows = db.execute(
        text(
            "SELECT id, full_name, avatar_url FROM profiles WHERE deleted_at IS NULL AND COALESCE(status, 'active') NOT IN ('banned', 'suspended') "
            "AND (full_name ILIKE :like OR lower(email) = lower(:q)) ORDER BY full_name LIMIT 20"
        ),
        {"like": f"%{q.replace('%', '').replace('_', '')}%", "q": q},
    ).mappings().all()
    return [dict(r) for r in rows]


@router.get("/admin/profiles")
@limiter.limit("120/minute")
def admin_list_profiles(
    request: Request, ids: Optional[str] = None, email: Optional[str] = None, limit: int = 1000,
    db: Session = Depends(get_db), _: User = Depends(require_admin),
):
    where, params = ["true"], {"limit": max(1, min(limit, 5000))}
    if ids:
        where.append("id = ANY(:ids)")
        params["ids"] = [i for i in ids.split(",") if i][:500]
    if email:
        where.append("lower(email) = lower(:email)")
        params["email"] = email
    rows = db.execute(
        text(f"SELECT {PRIVATE_COLS}, last_ip_address FROM profiles WHERE {' AND '.join(where)} ORDER BY created_at DESC NULLS LAST LIMIT :limit"),
        params,
    ).mappings().all()
    return [dict(r) for r in rows]


@router.patch("/admin/profiles/{profile_id}")
@limiter.limit("60/minute")
def admin_update_profile(request: Request, profile_id: str, patch: Dict[str, Any] = Body(...), db: Session = Depends(get_db), _: User = Depends(require_admin)):
    _update(db, profile_id, patch, ADMIN_EDITABLE)
    return {"ok": True}


@router.delete("/admin/profiles/{profile_id}")
@limiter.limit("30/minute")
def admin_delete_profile(request: Request, profile_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if profile_id == str(admin.id):
        raise HTTPException(status_code=400, detail="You can't delete your own account here")
    try:
        db.execute(text("DELETE FROM profiles WHERE id = :id"), {"id": profile_id})
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(getattr(e, "orig", e)).split("\n")[0])
    return {"ok": True}
