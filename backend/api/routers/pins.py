import logging
from fastapi import APIRouter, Depends, BackgroundTasks, Response, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db
from core.limiter import limiter
from models.models import Pin, User
from api.routers.websockets import broadcast_new_pin
from pydantic import BaseModel, Field
from api.deps import get_current_user
from geoalchemy2.elements import WKTElement
import json

logger = logging.getLogger(__name__)

router = APIRouter(tags=["pins"])

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
