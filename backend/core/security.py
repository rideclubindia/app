from datetime import datetime, timedelta
from typing import Optional
import logging
import jwt
from passlib.context import CryptContext
from core.config import settings

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_firebase_initialized = False

def init_firebase_admin() -> None:
    """Initialize the Firebase Admin SDK exactly once (module-level flag).

    Does not raise on failure - logs a warning instead so a missing/invalid
    service account doesn't crash the app at import time.
    """
    global _firebase_initialized
    if _firebase_initialized:
        return
    try:
        import firebase_admin
        from firebase_admin import credentials

        if not firebase_admin._apps:
            if settings.FIREBASE_SERVICE_ACCOUNT_PATH:
                cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
            else:
                cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)
        _firebase_initialized = True
    except Exception as e:
        logger.warning(f"Firebase Admin SDK initialization failed: {e}")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt
