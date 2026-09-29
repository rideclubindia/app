import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from api.deps import get_current_user, require_ride_access
from core.database import get_db
from core.limiter import limiter
from models.models import CrashEvent, SosEvent, SosEventAuditLog, User
from services.notification_service import send_emergency_sms

logger = logging.getLogger(__name__)

router = APIRouter(tags=["emergency"])

# SOS Countdown & 24/7 Emergency Escalation Architecture.md §4 — configurable,
# not hardcoded elsewhere in the codebase, so this is the one place tuning it changes.
SOS_COUNTDOWN_SECONDS = 120


def _log_audit(db: Session, sos_id, actor: str, action: str, detail: Optional[dict] = None) -> None:
    db.add(SosEventAuditLog(id=uuid.uuid4(), sos_id=sos_id, actor=actor, action=action, detail=detail))


def _broadcast_sos(ride_id: str, event_type: str, sos: SosEvent) -> None:
    """Fire-and-forget best-effort broadcast over the SOS priority lane
    (realtime/gateway.py's publish_sos_event — WebSocket Architecture.md §11 —
    a dedicated stream/emit path, never sharing the general critical-event
    stream's trim window with ordinary ride-state churn). Never blocks/fails
    the HTTP response on a realtime-delivery problem — the SOS event's own
    persisted state is the source of truth, the socket push is just a live-UI
    convenience.
    """
    try:
        import asyncio

        from realtime.gateway import gateway
        from realtime.protocol import RIDE_EVT_SOS

        payload = {
            "sosId": str(sos.id),
            "status": sos.status,
            "triggerType": sos.trigger_type,
            "expiresAt": sos.expires_at.isoformat() if sos.expires_at else None,
        }
        loop = asyncio.get_event_loop()
        loop.create_task(
            gateway.publish_sos_event(str(ride_id), event_type or RIDE_EVT_SOS, payload, member_id=str(sos.user_id))
        )
    except Exception:
        logger.exception("Failed to broadcast SOS event over Socket.IO (non-fatal)")


class LocationPayload(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    accuracy: Optional[float] = None
    speedKph: Optional[float] = None
    isStale: bool = False


class ManualSosCreateRequest(BaseModel):
    ride_id: str
    location: LocationPayload
    emergency_contact_phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    message: Optional[str] = None


class CrashEventCreateRequest(BaseModel):
    """Crash Detection Architecture.md §7's EmergencyEventPayload, as sent by
    the mobile Emergency Manager when the on-device engine reaches
    CRASH_SUSPECTED. This always creates a linked SOS event — the crash
    engine's own job ends at CRASH_SUSPECTED; everything from here on is the
    SOS Escalation architecture's countdown/escalation pipeline.
    """
    ride_id: str
    location: LocationPayload
    confidence: float = Field(..., ge=0, le=1)
    peak_acceleration: Optional[float] = None
    rotation_change: Optional[float] = None
    stationary_duration_s: Optional[float] = None
    device_platform: Optional[str] = None
    device_os_version: Optional[str] = None
    sampling_rate_achieved: Optional[int] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_name: Optional[str] = None


class SosCancelRequest(BaseModel):
    status: str  # must be "user_cancelled"
    method: Optional[str] = None  # "i_am_ok" | "cancel_button"
    device_timestamp: Optional[str] = None


def _sos_to_dict(sos: SosEvent) -> dict:
    return {
        "sosId": str(sos.id),
        "rideId": str(sos.ride_id),
        "userId": sos.user_id,
        "triggerType": sos.trigger_type,
        "status": sos.status,
        "createdAt": sos.created_at.isoformat() if sos.created_at else None,
        "expiresAt": sos.expires_at.isoformat() if sos.expires_at else None,
        "cancelledAt": sos.cancelled_at.isoformat() if sos.cancelled_at else None,
        "escalatedAt": sos.escalated_at.isoformat() if sos.escalated_at else None,
        "resolutionOutcome": sos.resolution_outcome,
        "monitoringUnavailable": sos.monitoring_unavailable,
    }


@router.post("/sos")
@limiter.limit("20/hour")
async def create_manual_sos(
    request: Request,
    payload: ManualSosCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Manual SOS trigger — SOS Escalation Architecture.md §2/§3. Rate-limited
    generously (not the old 5/hour) per §16: a rider in a genuine repeated
    emergency must never be throttled; this bound only guards against a
    client bug looping the create call.
    """
    require_ride_access(db, payload.ride_id, user)

    now = datetime.now(timezone.utc)
    sos = SosEvent(
        id=uuid.uuid4(),
        ride_id=payload.ride_id,
        user_id=user.id,
        trigger_type="manual_sos",
        status="countdown_active",
        expires_at=now + timedelta(seconds=SOS_COUNTDOWN_SECONDS),
        latitude=payload.location.lat,
        longitude=payload.location.lng,
        location_accuracy_m=payload.location.accuracy,
        location_timestamp=now,
        location_is_stale=payload.location.isStale,
        speed_kph=payload.location.speedKph,
    )
    db.add(sos)
    _log_audit(db, sos.id, actor=f"user:{user.id}", action="sos_initiated", detail={"triggerType": "manual_sos"})
    db.commit()
    db.refresh(sos)

    _broadcast_sos(payload.ride_id, "SOS", sos)
    return _sos_to_dict(sos)


@router.post("/crash-events")
@limiter.limit("20/hour")
async def create_crash_event(
    request: Request,
    payload: CrashEventCreateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Crash Detection Architecture.md §8's Crash Event API — persists the
    crash_events row and creates the linked, AUTOMATIC_CRASH_SOS-triggered
    SOS event that owns the countdown from here (SOS Escalation
    Architecture.md §2).
    """
    require_ride_access(db, payload.ride_id, user)

    now = datetime.now(timezone.utc)
    sos = SosEvent(
        id=uuid.uuid4(),
        ride_id=payload.ride_id,
        user_id=user.id,
        trigger_type="automatic_crash_sos",
        status="countdown_active",
        expires_at=now + timedelta(seconds=SOS_COUNTDOWN_SECONDS),
        latitude=payload.location.lat,
        longitude=payload.location.lng,
        location_accuracy_m=payload.location.accuracy,
        location_timestamp=now,
        location_is_stale=payload.location.isStale,
        speed_kph=payload.location.speedKph,
        crash_confidence=payload.confidence,
        crash_peak_acceleration=payload.peak_acceleration,
        crash_rotation_change=payload.rotation_change,
        crash_stationary_duration_ms=int((payload.stationary_duration_s or 0) * 1000),
    )
    db.add(sos)
    db.flush()  # need sos.id before creating the crash_events row that references it

    crash_event = CrashEvent(
        id=uuid.uuid4(),
        ride_id=payload.ride_id,
        user_id=user.id,
        latitude=payload.location.lat,
        longitude=payload.location.lng,
        location_accuracy_m=payload.location.accuracy,
        speed_kph=payload.location.speedKph,
        confidence=payload.confidence,
        peak_acceleration=payload.peak_acceleration,
        rotation_change=payload.rotation_change,
        stationary_duration_s=payload.stationary_duration_s,
        device_platform=payload.device_platform,
        device_os_version=payload.device_os_version,
        sampling_rate_achieved=payload.sampling_rate_achieved,
        status="crash_suspected",
        sos_id=sos.id,
    )
    db.add(crash_event)
    _log_audit(
        db, sos.id, actor=f"user:{user.id}", action="sos_initiated",
        detail={"triggerType": "automatic_crash_sos", "confidence": payload.confidence},
    )
    db.commit()
    db.refresh(sos)

    _broadcast_sos(payload.ride_id, "SOS", sos)
    return {"crashEventId": str(crash_event.id), **_sos_to_dict(sos)}


@router.get("/sos/{sos_id}")
async def get_sos_event(sos_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """§4 — the mobile app resyncs its countdown display against this on
    reconnect/reopen; the server's expiresAt is always authoritative.
    """
    sos = db.query(SosEvent).filter(SosEvent.id == sos_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS event not found")
    require_ride_access(db, str(sos.ride_id), user)
    return _sos_to_dict(sos)


@router.patch("/sos/{sos_id}")
async def cancel_sos_event(
    sos_id: str,
    payload: SosCancelRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """§5/§19 — only a valid transition while status is still
    sos_initiated/countdown_active. A cancellation arriving after the
    backend has already escalated is deliberately NOT auto-applied (see the
    architecture's "cancel after escalation" row) — it's recorded but the
    event stays in its escalated state pending human review.
    """
    if payload.status != "user_cancelled":
        raise HTTPException(status_code=400, detail="Only 'user_cancelled' is accepted here")

    sos = db.query(SosEvent).filter(SosEvent.id == sos_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS event not found")
    require_ride_access(db, str(sos.ride_id), user)
    if sos.user_id != user.id:
        raise HTTPException(status_code=403, detail="Only the rider who triggered this SOS can cancel it")

    now = datetime.now(timezone.utc)
    if sos.status in ("sos_initiated", "countdown_active"):
        sos.status = "resolved"
        sos.cancelled_at = now
        sos.cancellation_method = payload.method
        sos.resolution_outcome = "user_cancelled"
        sos.resolved_at = now
        _log_audit(
            db, sos.id, actor=f"user:{user.id}", action="user_cancelled",
            detail={"method": payload.method, "deviceTimestamp": payload.device_timestamp},
        )
        db.commit()
        db.refresh(sos)
        _broadcast_sos(str(sos.ride_id), "SOS_REVOKED", sos)
        return _sos_to_dict(sos)

    # Already escalated — log the request, do not silently resolve it.
    _log_audit(
        db, sos.id, actor=f"user:{user.id}", action="cancel_requested_during_escalation",
        detail={"currentStatus": sos.status},
    )
    db.commit()
    return {**_sos_to_dict(sos), "cancelRequestRecorded": True, "note": "Event already escalated; awaiting operator/ops review to close."}
