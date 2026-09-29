import logging
from typing import Optional

from core.config import settings

logger = logging.getLogger(__name__)


def twilio_configured() -> bool:
    return bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_FROM_NUMBER)


def send_emergency_sms(
    *,
    rider_name: str,
    contact_phone: Optional[str],
    contact_name: Optional[str],
    lat: float,
    lng: float,
    status_line: str,
    message: Optional[str] = None,
    ride_id: Optional[str] = None,
) -> dict:
    """Shared Twilio SMS path for both manual SOS (api/routers/sos.py) and the
    crash-event/SOS-escalation pipelines — extracted per Crash Detection
    Architecture.md §6 and SOS Escalation Architecture.md §11, so there is one
    Twilio client wiring in this codebase, not several copies of it.
    """
    maps_link = f"https://www.google.com/maps?q={lat},{lng}"
    body = f"RideClub: {status_line} involving {rider_name}. Location: {maps_link}."
    if message:
        body += f" Message: {message}"

    if not twilio_configured():
        logger.warning(
            "Emergency SMS requested but Twilio not configured — no SMS sent. "
            f"Contact: {contact_name} {contact_phone}, ride_id={ride_id}"
        )
        return {"sms_sent": False, "reason": "twilio_not_configured"}

    if not contact_phone:
        return {"sms_sent": False, "reason": "no_contact_phone"}

    try:
        from twilio.rest import Client

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(body=body, from_=settings.TWILIO_FROM_NUMBER, to=contact_phone)
        return {"sms_sent": True}
    except Exception as e:
        logger.exception(f"Failed to send emergency SMS via Twilio: {e}")
        return {"sms_sent": False, "reason": "twilio_error"}
