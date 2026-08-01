import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from models.models import User
from api.deps import get_current_user
from core.config import settings

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
async def dispatch_sos(payload: SOSDispatchRequest, user: User = Depends(get_current_user)):
    maps_link = f"https://www.google.com/maps?q={payload.lat},{payload.lng}"
    body = f"SOS from {user.name}: I need help. My live location is {maps_link}."
    if payload.message:
        body += f" Message: {payload.message}"

    twilio_configured = bool(
        settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER
    )

    if not twilio_configured:
        logger.warning(
            f"SOS dispatch requested but Twilio not configured — no SMS sent. "
            f"Contact: {payload.emergency_contact_name} {payload.emergency_contact_phone}, ride_id={payload.ride_id}"
        )
        return {"sms_sent": False, "reason": "twilio_not_configured"}

    if not payload.emergency_contact_phone:
        raise HTTPException(status_code=400, detail="emergency_contact_phone is required to dispatch SOS SMS")

    try:
        from twilio.rest import Client

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=body,
            from_=settings.TWILIO_FROM_NUMBER,
            to=payload.emergency_contact_phone,
        )
        return {"sms_sent": True}
    except Exception as e:
        logger.exception(f"Failed to send SOS SMS via Twilio: {e}")
        raise HTTPException(status_code=502, detail="Failed to send SOS SMS")
