import hashlib
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
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

logger = logging.getLogger(__name__)

router = APIRouter()


class RequestOtpData(BaseModel):
    email: EmailStr


class VerifyOtpData(BaseModel):
    email: EmailStr
    otp: str


def get_deterministic_uuid(string: str) -> str:
    hash_val = 0
    for char in string:
        code = ord(char)
        hash_val = code + ((hash_val << 5) - hash_val)
        hash_val = (hash_val & 0xFFFFFFFF)
        if hash_val > 0x7FFFFFFF:
            hash_val -= 0x100000000

    hex_val = f"{abs(hash_val):012x}"
    return f"00000000-0000-0000-0000-{hex_val}"


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
