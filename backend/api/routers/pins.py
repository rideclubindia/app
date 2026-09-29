import logging
import time
import secrets as secrets_lib
from fastapi import APIRouter, Depends, BackgroundTasks, Response, HTTPException, Request, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db
from core.config import settings
from core.limiter import limiter
from models.models import Pin, User
from api.routers.websockets import broadcast_new_pin
from pydantic import BaseModel, Field
from api.deps import get_current_user
from geoalchemy2.elements import WKTElement
import json
import httpx

logger = logging.getLogger(__name__)

router = APIRouter(tags=["pins"])

INCIDENT_PHOTO_BUCKET = "incident-photos"
ALLOWED_PHOTO_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_PHOTO_BYTES = 10 * 1024 * 1024  # matches the bucket's own 10MB limit


def _storage_admin_headers() -> dict:
    """Admin headers for Supabase Storage. New sb_secret_ keys are not JWTs, so pair them with a short-lived
    service_role token signed with the project JWT secret; legacy service_role JWT keys are used as-is."""
    key = settings.SUPABASE_SERVICE_ROLE_KEY
    if key.startswith("sb_secret_") and settings.SUPABASE_JWT_SECRET:
        import jwt as pyjwt
        now = int(time.time())
        token = pyjwt.encode({"role": "service_role", "iss": "supabase", "iat": now, "exp": now + 300}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        return {"apikey": key, "Authorization": f"Bearer {token}"}
    return {"apikey": key, "Authorization": f"Bearer {key}"}


@router.post("/photo-upload")
@limiter.limit("30/minute")
async def upload_incident_photo(
    request: Request,
    file: UploadFile = File(...),
    kind: str = "incident",
    user: User = Depends(get_current_user),
):
    """Proxies an incident-photo upload through the service-role key.

    The incident-photos storage bucket requires an `authenticated` Supabase
    session (see supabase/migrations/20260716_security_and_integrity_hardening.sql),
    but this app authenticates riders via Firebase/rie_token, never a real
    Supabase Auth session — so the client can never satisfy that RLS policy
    directly. This endpoint re-verifies the caller's own token via
    get_current_user, then uploads on their behalf with the service role.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="Photo upload is not configured on the server")

    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_PHOTO_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images are allowed")

    content = await file.read()
    if len(content) > MAX_PHOTO_BYTES:
        raise HTTPException(status_code=400, detail="Image exceeds the 10MB size limit")

    ext = (file.filename or "").rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else "jpg"
    # One bucket and service-role path for incident, ride-cover and avatar photos, separated by folder
    folder = {"avatar": "avatars/", "ride": "rides/"}.get(kind, "")
    object_name = f"{folder}{int(time.time() * 1000)}-{secrets_lib.token_hex(6)}.{ext}"

    upload_url = f"{settings.SUPABASE_URL}/storage/v1/object/{INCIDENT_PHOTO_BUCKET}/{object_name}"
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                upload_url,
                content=content,
                headers={**_storage_admin_headers(), "Content-Type": content_type},
            )
    except httpx.HTTPError as e:
        logger.exception(f"Photo upload request failed: {e}")
        raise HTTPException(status_code=502, detail="Failed to reach photo storage")

    if resp.status_code >= 300:
        logger.error(f"Photo upload rejected by storage: {resp.status_code} {resp.text}")
        raise HTTPException(status_code=502, detail="Failed to upload photo")

    public_url = f"{settings.SUPABASE_URL}/storage/v1/object/public/{INCIDENT_PHOTO_BUCKET}/{object_name}"
    return {"url": public_url}

class PinCreate(BaseModel):
    category: str
    description: str = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    severity: int = Field(1, ge=1, le=5)

@router.get("/")
def get_pins(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    limit: int = 100,
    offset: int = 0,
):
    limit = min(limit, 500)
    pins = db.query(Pin).limit(limit).offset(offset).all()
    return {"pins": pins}

@router.post("/")
@limiter.limit("20/minute")
async def create_pin(
    request: Request,
    pin_data: PinCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        # Construct WKT for PostGIS Geometry (Longitude first, then Latitude)
        wkt_point = f"POINT({pin_data.longitude} {pin_data.latitude})"

        new_pin = Pin(
            user_id=str(user.id),
            category=pin_data.category,
            description=pin_data.description,
            latitude=pin_data.latitude,
            longitude=pin_data.longitude,
            severity=pin_data.severity,
            location=WKTElement(wkt_point, srid=4326)
        )
        db.add(new_pin)
        db.commit()
        db.refresh(new_pin)

        # Convert to dict for websocket
        pin_dict = {
            "id": new_pin.id,
            "category": new_pin.category,
            "description": new_pin.description,
            "latitude": new_pin.latitude,
            "longitude": new_pin.longitude,
            "severity": new_pin.severity
        }

        # Broadcast to all connected clients
        await broadcast_new_pin(pin_dict)

        return Response(
            content=json.dumps({"message": "Pin created successfully", "data": pin_dict}),
            media_type="application/json",
        )
    except Exception as e:
        db.rollback()
        logger.exception(f"Error creating pin: {e}")
        raise HTTPException(status_code=500, detail="Failed to create pin")

@router.get("/nearby")
def get_nearby_pins(
    lat: float,
    lng: float,
    radius_km: int = 10,
    db: Session = Depends(get_db),
):
    try:
        # PostGIS: radius in meters (convert from km)
        radius_meters = radius_km * 1000

        search_point = WKTElement(f"POINT({lng} {lat})", srid=4326)

        nearby_pins = db.query(Pin).filter(
            func.ST_DWithin(Pin.location, search_point, radius_meters)
        ).all()

        # Convert to dict list for JSON serialization
        pins_list = [
            {
                "id": pin.id,
                "category": pin.category,
                "description": pin.description,
                "latitude": pin.latitude,
                "longitude": pin.longitude,
                "severity": pin.severity,
                "created_at": pin.created_at.isoformat() if pin.created_at else None
            }
            for pin in nearby_pins
        ]

        return Response(
            content=json.dumps(pins_list),
            media_type="application/json",
        )
    except Exception as e:
        logger.exception(f"Error in /nearby endpoint: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch nearby pins")
