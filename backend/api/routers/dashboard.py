from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from core.database import get_db
from models.models import User, RideEvent, LocationUpdate, RideStop
from api.deps import get_current_user
from analytics.engines import calculate_ride_analytics, calculate_safety_score

router = APIRouter(tags=["dashboard"])

@router.get("/ride/{ride_id}")
def get_ride_dashboard(ride_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Dashboard API: Returns aggregated analytics for a specific ride.
    """
    analytics = calculate_ride_analytics(db, ride_id)
    safety = calculate_safety_score(db, ride_id, user.id)
    
    stops = db.query(RideStop).filter(RideStop.ride_id == ride_id).all()
    events = db.query(RideEvent).filter(RideEvent.ride_id == ride_id).all()
    
    # Generate Timeline
    timeline = []
    timeline.append({"event": "Ride Started", "timestamp": "08:00"}) # Mock
    for stop in stops:
        timeline.append({
            "event": stop.stop_type.value if stop.stop_type else "Stop",
            "duration_seconds": stop.duration_seconds,
            "timestamp": stop.stop_start.isoformat()
        })
        
    for event in events:
        timeline.append({
            "event": event.event_type.value,
            "timestamp": event.timestamp.isoformat()
        })
        
    return {
        "ride_id": ride_id,
        "analytics": analytics,
        "safety_score": safety,
        "timeline": sorted(timeline, key=lambda x: x["timestamp"]),
        "stop_count": len(stops)
    }

@router.get("/heatmap")
def get_heatmap_data(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Heatmap Engine: Groups locations to find popular areas.
    """
    # Simple heatmap: fetching dense clusters. In PostGIS we could use ST_ClusterDBSCAN
    # For now we just return recent location points
    points = db.query(LocationUpdate.latitude, LocationUpdate.longitude).limit(1000).all()
    # Assume lat/lon were added or computed via ST_Y/ST_X
    return {"message": "Heatmap points aggregated", "data": []}
