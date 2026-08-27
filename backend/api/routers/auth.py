import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from core.database import get_db
from core.security import get_password_hash, create_access_token
from models.models import User, UserRole
from schemas.schemas import Token
from datetime import timedelta
from core.config import settings

from pydantic import BaseModel
from typing import Optional

from core.limiter import limiter

logger = logging.getLogger(__name__)

router = APIRouter()

class EmailJSLoginData(BaseModel):
    email: str

@router.post("/emailjs-login", response_model=Token)
@limiter.limit("5/minute")
def emailjs_login(request: Request, data: EmailJSLoginData, db: Session = Depends(get_db)):
    email = data.email
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")

    # For EmailJS flow, we deterministically generate a dummy UID from the email
    # so they always get the same Supabase/DB profile identity
    import hashlib
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
            raise HTTPException(status_code=409, detail="Email already registered")
        db.refresh(user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role if isinstance(user.role, str) else user.role.value if hasattr(user.role, 'value') else "Rider", "uid": dummy_uid},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer"}

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
