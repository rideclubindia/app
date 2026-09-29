import hashlib

from fastapi import Depends, HTTPException, status
from sqlalchemy import Text, cast, func
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from core.database import get_db
from core.config import settings
from models.models import User, Ride, RideParticipant
import jwt
from pydantic import ValidationError
from schemas.schemas import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token_data = TokenData(email=email)
    except (jwt.PyJWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.email == token_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def require_ride_access(db: Session, ride_id: str, user: User) -> None:
    """Raise 403/404 unless the given user owns or has joined the ride.

    Used to close the IDOR gap where ride analytics/dashboard/cohesion
    endpoints previously returned data for any ride_id to any caller.
    """
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    # Rows store either the profile uuid or the login uid, which is derived from the verified email
    my_ids = {str(user.id), hashlib.sha256((user.email or "").lower().encode()).hexdigest()[:28]}
    if str(ride.group_id) in my_ids:
        return

    is_participant = db.query(RideParticipant).filter(
        RideParticipant.ride_id == ride_id,
        cast(RideParticipant.user_id, Text).in_(list(my_ids)),
        func.coalesce(RideParticipant.status, "approved").notin_(["pending", "rejected", "removed", "left"]),
    ).first()
    if not is_participant:
        raise HTTPException(status_code=403, detail="You do not have access to this ride")
