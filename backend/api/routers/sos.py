import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from core.database import get_db
from core.limiter import limiter
from models.models import User
from api.deps import get_current_user, require_ride_access
from services.notification_service import send_emergency_sms

logger = logging.getLogger(__name__)

router = APIRouter(tags=["sos"])


class SOSDispatchRequest(BaseModel):
    ride_id: str
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    message: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None


@router.post("/dispatch")
@limiter.limit("5/hour")
async def dispatch_sos(request: Request, payload: SOSDispatchRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    require_ride_access(db, payload.ride_id, user)

    if not payload.emergency_contact_phone:
        raise HTTPException(status_code=400, detail="emergency_contact_phone is required to dispatch SOS SMS")

    result = send_emergency_sms(
        rider_name=user.name,
        contact_phone=payload.emergency_contact_phone,
        contact_name=payload.emergency_contact_name,
        lat=payload.lat,
        lng=payload.lng,
        status_line="SOS — I need help",
        message=payload.message,
        ride_id=payload.ride_id,
    )
    if not result["sms_sent"] and result.get("reason") == "twilio_error":
        raise HTTPException(status_code=502, detail="Failed to send SOS SMS")
    return result
