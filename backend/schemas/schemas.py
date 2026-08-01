from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from models.models import UserRole, RideStatus

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    role: UserRole = UserRole.RIDER

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    profile_image: Optional[str] = None
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class LocationUpdateSchema(BaseModel):
    ride_id: int
    user_id: int
    latitude: float
    longitude: float
    altitude: Optional[float] = None
    speed: Optional[float] = None
    heading: Optional[float] = None
    accuracy: Optional[float] = None
    battery: Optional[float] = None
    timestamp: datetime

class SafetyScoreResponse(BaseModel):
    score: int
    level: str
