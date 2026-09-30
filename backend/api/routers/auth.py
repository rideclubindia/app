import hashlib
import logging
import time

import jwt

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.orm import Session
from api.deps import get_current_user, oauth2_scheme
from api.routers.profiles import is_admin
from sqlalchemy.exc import IntegrityError
from core.database import get_db
from core.security import get_password_hash, create_access_token
from core.otp import issue_otp, verify_otp, is_in_cooldown
from core.email import send_otp_email, EmailSendError
from models.models import User, UserRole
from schemas.schemas import Token
from datetime import timedelta
from core.config import settings

from pydantic import BaseModel, EmailStr

from core.limiter import limiter
from core.ids import member_uuid

logger = logging.getLogger(__name__)

router = APIRouter()


class RequestOtpData(BaseModel):
    email: EmailStr


class VerifyOtpData(BaseModel):
    email: EmailStr
    otp: str


def get_deterministic_uuid(string: str) -> str:
    return member_uuid(string)


@router.post("/request-otp")
@limiter.limit("3/minute")
def request_otp(request: Request, data: RequestOtpData):
    email = data.email.lower()

    if is_in_cooldown(email):
        # Don't reveal timing details; just ask the client to wait.
        raise HTTPException(status_code=429, detail="Please wait before requesting another code")

    code = issue_otp(email)
    try:
        send_otp_email(email, code)
    except EmailSendError:
        raise HTTPException(status_code=502, detail="Failed to send verification email")

    return {"message": "Verification code sent"}


@router.post("/verify-otp", response_model=Token)
@limiter.limit("10/minute")
def verify_otp_and_login(request: Request, data: VerifyOtpData, db: Session = Depends(get_db)):
    email = data.email.lower()

    if not verify_otp(email, data.otp):
        raise HTTPException(status_code=401, detail="Invalid or expired verification code")

    # Only reached once the backend has confirmed the caller received this
    # code by email — identity is authoritative from here on.
    dummy_uid = hashlib.sha256(email.encode()).hexdigest()[:28]

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            id=get_deterministic_uuid(dummy_uid),
            name=email.split("@")[0],
            email=email,
            hashed_password=get_password_hash(dummy_uid),
            role=UserRole.RIDER.value
        )
        db.add(user)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            user = db.query(User).filter(User.email == email).first()
        else:
            db.refresh(user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role if isinstance(user.role, str) else user.role.value if hasattr(user.role, 'value') else "Rider", "uid": dummy_uid},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer", "uid": get_deterministic_uuid(dummy_uid)}


SUPABASE_TOKEN_MINUTES = 60


@router.post("/supabase-token")
@limiter.limit("30/minute")
def supabase_token(request: Request, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    # Short-lived database token so Supabase RLS knows who the rider is; identity comes only from the verified session
    user = get_current_user(db=db, token=token)
    if not settings.SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=503, detail="Database sessions are not configured")
    uid = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM]).get("uid") or ""
    status = db.execute(text("SELECT status, deleted_at FROM profiles WHERE id = :id"), {"id": str(user.id)}).first()
    if status and (status[0] in ("banned", "suspended") or status[1] is not None):
        raise HTTPException(status_code=403, detail="Account restricted")
    now = int(time.time())
    claims = {
        # mid: the id the app derives from uid; older accounts have a profile id that differs from it
        "sub": str(user.id), "uid": uid, "mid": member_uuid(uid) if uid else "", "email": user.email, "role": "authenticated", "aud": "authenticated",
        "app_role": "admin" if is_admin(user) else "rider", "iat": now, "exp": now + SUPABASE_TOKEN_MINUTES * 60,
    }
    return {"access_token": jwt.encode(claims, settings.SUPABASE_JWT_SECRET, algorithm="HS256"), "expires_in": SUPABASE_TOKEN_MINUTES * 60}
