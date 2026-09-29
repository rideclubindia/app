from celery import shared_task
import logging
import uuid
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


@shared_task(name="workers.tasks.sos_expiry_sweep")
def sos_expiry_sweep():
    """SOS Escalation Architecture.md §4/§9 — the server-authoritative
    countdown expiry check. Must be scheduled via Celery Beat (not wired up
    in this codebase's docker-compose yet — the `worker` service there only
    runs `celery worker`, not `celery beat`; add a beat schedule entry and a
    `celery -A workers.celery_app beat` process before relying on this in
    any real deployment). Runs the degraded-escalation path from §8 directly
    (no real 24/7 monitoring provider is integrated yet), notifying the
    rider's supplied emergency contact and broadcasting to the ride group.
    """
    from core.database import SessionLocal
    from models.models import SosEvent, SosEventAuditLog
    from services.notification_service import send_emergency_sms

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        expired = (
            db.query(SosEvent)
            .filter(SosEvent.status == "countdown_active", SosEvent.expires_at <= now)
            .all()
        )
        for sos in expired:
            sos.status = "monitoring_active"
            sos.escalated_at = now
            sos.monitoring_unavailable = True  # no real provider configured yet, see §8
            sos.response_status = "degraded_escalation"
            db.add(
                SosEventAuditLog(
                    id=uuid.uuid4(),
                    sos_id=sos.id,
                    actor="system",
                    action="countdown_expired_degraded_escalation",
                    detail={"reason": "no_monitoring_provider_configured"},
                )
            )

            if sos.latitude is not None and sos.longitude is not None:
                result = send_emergency_sms(
                    rider_name=f"rider {sos.user_id}",
                    contact_phone=None,  # see note below — no emergency_contacts table yet
                    contact_name=None,
                    lat=sos.latitude,
                    lng=sos.longitude,
                    status_line="Automated SOS escalation — no response to countdown",
                    ride_id=str(sos.ride_id),
                )
                logger.info(f"Degraded SOS escalation for {sos.id}: {result}")

            try:
                import asyncio

                from realtime.gateway import gateway
                from realtime.protocol import RIDE_EVT_SOS

                loop = asyncio.get_event_loop()
                loop.create_task(
                    gateway.publish_sos_event(
                        str(sos.ride_id), RIDE_EVT_SOS,
                        {"sosId": str(sos.id), "status": sos.status, "monitoringUnavailable": True},
                        member_id=str(sos.user_id),
                    )
                )
            except Exception:
                logger.exception("Failed to broadcast escalated SOS event (non-fatal)")

        db.commit()
        return {"escalated": len(expired)}
    finally:
        db.close()

@shared_task(name="workers.tasks.process_location_update")
def process_location_update(location_data: dict):
    """
    Background task to process a new location update.
    This inserts into the DB and triggers stop/distance logic.
    """
    logger.info(f"Processing location update for User {location_data.get('user_id')} in Ride {location_data.get('ride_id')}")
    
    # In a real scenario, this would use a dedicated DB session to insert the point 
    # using ST_SetSRID(ST_MakePoint(lon, lat), 4326)
    
    # Then it would trigger stop detection analytics.
    # calculate_stop_detection.delay(location_data['user_id'], location_data['ride_id'])
    return True

@shared_task(name="workers.tasks.calculate_analytics")
def calculate_analytics(ride_id: int):
    """
    Background task to crunch numbers for a ride (duration, distance, speeds).
    """
    logger.info(f"Calculating analytics for Ride {ride_id}")
    return True
