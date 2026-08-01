import math
from haversine import haversine, Unit
from sqlalchemy.orm import Session
from sqlalchemy import func
from models.models import LocationUpdate, RideStop, StopType
from datetime import datetime, timedelta

def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    """
    Fast in-memory distance calculation using the haversine formula.
    Returns distance in kilometers.
    """
    return haversine((lat1, lon1), (lat2, lon2), unit=Unit.KILOMETERS)

def get_ride_total_distance(db: Session, ride_id: int) -> float:
    """
    Calculates total ride distance utilizing PostGIS ST_Distance iteratively,
    or using Haversine across sorted points.
    For high accuracy, we use PostGIS Geography calculations.
    """
    # Fetch chronological location points for the ride
    points = db.query(LocationUpdate).filter(LocationUpdate.ride_id == ride_id).order_by(LocationUpdate.timestamp).all()
    
    if len(points) < 2:
        return 0.0
        
    total_distance_km = 0.0
    for i in range(1, len(points)):
        p1 = points[i-1]
        p2 = points[i]
        
        # We can extract lat/lon from the raw WKT if needed, but since we are inserting into Geography,
        # querying it requires ST_AsText or similar. 
        # Alternatively, if we store lat/lon in the model temporarily or extract it, we can use haversine.
        # Assuming we have lat/lon on the model (if we added it), but LocationUpdate only has 'location'.
        # Since we just need the analytics, we could also use a direct SQL query:
        pass
        
    # Better approach using PostGIS ST_Length(ST_MakeLine(geom))
    # This requires points to be sorted by timestamp, which is slightly complex in pure SQLAlchemy without raw SQL.
    query = f"""
        SELECT ST_Length(ST_MakeLine(location::geometry)::geography) / 1000.0 AS distance_km
        FROM (
            SELECT location 
            FROM location_updates 
            WHERE ride_id = :ride_id 
            ORDER BY timestamp ASC
        ) AS ordered_points;
    """
    result = db.execute(query, {"ride_id": ride_id}).scalar()
    return float(result) if result else 0.0

def detect_stops(db: Session, ride_id: int):
    """
    Stop Detection Engine:
    Detects stops using:
    - Speed < 3 km/h
    - For > 3 minutes
    """
    # Fetch recent points
    points = db.query(LocationUpdate).filter(
        LocationUpdate.ride_id == ride_id
    ).order_by(LocationUpdate.timestamp).all()
    
    if not points:
        return
        
    current_stop_start = None
    stop_points = []
    
    for point in points:
        speed = point.speed or 0.0
        if speed < 3.0:
            if current_stop_start is None:
                current_stop_start = point.timestamp
            stop_points.append(point)
        else:
            if current_stop_start is not None:
                duration = (point.timestamp - current_stop_start).total_seconds()
                if duration > 180: # greater than 3 minutes
                    # Record the stop
                    stop = RideStop(
                        ride_id=ride_id,
                        user_id=point.user_id, # Assuming single user ride or grouped
                        stop_start=current_stop_start,
                        stop_end=point.timestamp,
                        duration_seconds=int(duration),
                        location=stop_points[0].location,
                        stop_type=StopType.REST # Can be classified further by ML
                    )
                    db.add(stop)
                    db.commit()
                # Reset
                current_stop_start = None
                stop_points = []
    
    # Handle case where ride ends while stopped
    if current_stop_start is not None:
        duration = (points[-1].timestamp - current_stop_start).total_seconds()
        if duration > 180:
             stop = RideStop(
                ride_id=ride_id,
                user_id=points[-1].user_id,
                stop_start=current_stop_start,
                stop_end=points[-1].timestamp,
                duration_seconds=int(duration),
                location=stop_points[0].location,
                stop_type=StopType.DESTINATION
             )
             db.add(stop)
             db.commit()

def calculate_ride_analytics(db: Session, ride_id: int):
    """
    Ride Analytics Engine:
    Calculate Ride Duration, Average Speed, Max Speed, Distance.
    """
    points = db.query(LocationUpdate).filter(LocationUpdate.ride_id == ride_id).order_by(LocationUpdate.timestamp).all()
    if not points:
        return {}
    
    start_time = points[0].timestamp
    end_time = points[-1].timestamp
    duration_seconds = (end_time - start_time).total_seconds()
    
    speeds = [p.speed for p in points if p.speed is not None]
    max_speed = max(speeds) if speeds else 0.0
    avg_speed = sum(speeds)/len(speeds) if speeds else 0.0
    
    distance_km = get_ride_total_distance(db, ride_id)
    
    return {
        "duration_seconds": duration_seconds,
        "max_speed_kmh": max_speed,
        "average_speed_kmh": avg_speed,
        "distance_km": distance_km
    }

def calculate_safety_score(db: Session, ride_id: int, user_id: int):
    """
    Rider Safety Engine:
    Detects Overspeeding (>100kmh), Hard Braking (Deceleration > 15km/h/s).
    Generates a 0-100 score.
    """
    points = db.query(LocationUpdate).filter(
        LocationUpdate.ride_id == ride_id,
        LocationUpdate.user_id == user_id
    ).order_by(LocationUpdate.timestamp).all()
    
    if len(points) < 2:
        return {"score": 100, "level": "Safe Rider", "events": []}
        
    score = 100
    events = []
    
    for i in range(1, len(points)):
        p1 = points[i-1]
        p2 = points[i]
        
        # Check Overspeed
        if p2.speed and p2.speed > 100.0:
            score -= 1
            events.append("Overspeeding")
            
        # Check Hard Braking
        if p1.speed is not None and p2.speed is not None:
            time_diff = (p2.timestamp - p1.timestamp).total_seconds()
            if time_diff > 0:
                accel = (p2.speed - p1.speed) / time_diff
                if accel < -15.0:  # Hard braking
                    score -= 5
                    events.append("Hard Braking")
                elif accel > 15.0: # Rapid acceleration
                    score -= 2
                    events.append("Rapid Acceleration")
                    
    score = max(0, score)
    level = "Dangerous" if score < 60 else "Risky" if score < 80 else "Safe Rider"
    
    return {"score": score, "level": level, "events": list(set(events))}

def check_geofence_triggers(db: Session, ride_id: int, user_id: int, lat: float, lon: float):
    """
    Geofence Engine:
    Uses PostGIS ST_Within to check if a point falls inside known danger zones or checkpoints.
    (Assuming we have a Geofence table, which we approximate with Pins for now).
    """
    from geoalchemy2.elements import WKTElement
    from models.models import Pin
    
    # We check if the user is within 100 meters of any Pin categorized as 'danger' or 'checkpoint'
    search_point = WKTElement(f"POINT({lon} {lat})", srid=4326)
    
    triggers = db.query(Pin).filter(
        Pin.category.in_(["danger", "checkpoint", "fuel"]),
        func.ST_DWithin(Pin.location, search_point, 100) # 100 meters
    ).all()
    
    results = []
    for t in triggers:
        results.append({
            "type": t.category,
            "description": t.description
        })
    return results
