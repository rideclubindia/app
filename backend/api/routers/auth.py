import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi.security import OAuth2PasswordRequestForm
from core.database import get_db
from core.security import verify_password, get_password_hash, create_access_token, init_firebase_admin
from models.models import User, UserRole
from schemas.schemas import UserCreate, UserResponse, Token
from datetime import timedelta
from core.config import settings

from pydantic import BaseModel
from typing import Optional

from core.limiter import limiter

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Firebase Admin SDK once at module import time (no crash on failure).
init_firebase_admin()

class FirebaseLoginData(BaseModel):
    id_token: str
    name: Optional[str] = None  # display-name hint only, not trusted for identity

@router.post("/register", response_model=UserResponse)
@limiter.limit("5/minute")
def register(request: Request, user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_password,
        phone=user_in.phone,
        role=user_in.role
    )
    db.add(db_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/firebase-login", response_model=Token)
@limiter.limit("5/minute")
def firebase_login(request: Request, data: FirebaseLoginData, db: Session = Depends(get_db)):
    from firebase_admin import auth as firebase_auth

    try:
        decoded_token = firebase_auth.verify_id_token(data.id_token)
    except Exception as e:
        logger.warning(f"Firebase ID token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase token")

    email = decoded_token.get("email")
    firebase_uid = decoded_token.get("uid")
    if not email or not firebase_uid:
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Auto-register user from verified Firebase identity
        user = User(
            name=data.name or email.split("@")[0],
            email=email,
            hashed_password=get_password_hash(firebase_uid),  # Use uid as dummy pass
            role=UserRole.RIDER
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
        data={"sub": user.email, "role": user.role.value}, expires_delta=access_token_expires
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

@router.post("/supabase-token", response_model=Token)
@limiter.limit("20/minute")
def get_supabase_token(request: Request, data: FirebaseLoginData):
    from firebase_admin import auth as firebase_auth
    import jwt

    if not settings.SUPABASE_JWT_SECRET:
        raise HTTPException(status_code=500, detail="SUPABASE_JWT_SECRET not configured")

    try:
        decoded_token = firebase_auth.verify_id_token(data.id_token)
    except Exception as e:
        logger.warning(f"Firebase ID token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase token")

    firebase_uid = decoded_token.get("uid")
    if not firebase_uid:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

    # Supabase expects the token subject (sub) to be a UUID.
    # We use the same deterministic UUID logic as the frontend to map Firebase UIDs to Supabase UUIDs.
    supabase_uuid = get_deterministic_uuid(firebase_uid)

    payload = {
        "aud": "authenticated",
        "exp": decoded_token.get("exp"), # Match the Firebase token expiration
        "sub": supabase_uuid,
        "email": decoded_token.get("email"),
        "role": "authenticated"
    }

    supabase_token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    return {"access_token": supabase_token, "token_type": "bearer"}
