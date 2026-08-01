from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from core.database import get_db
from models.models import LocationUpdate, Ride, User
from api.deps import get_current_user
from analytics.engines import get_ride_total_distance

router = APIRouter(tags=["analytics"])


def _table_exists(db: Session, table_name: str) -> bool:
    return bool(
        db.execute(
            text(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = :table_name
                )
                """
            ),
            {"table_name": table_name},
        ).scalar()
    )

@router.get("/ride/{ride_id}/route")
def get_ride_route(ride_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Route Replay Engine: Return route coordinates in chronological order.
    """
    if _table_exists(db, "ride_locations"):
        query = text("""
            SELECT latitude as lat, longitude as lon, timestamp, speed, NULL::double precision as altitude
            FROM ride_locations
            WHERE ride_id::text = :ride_id
            ORDER BY timestamp ASC
        """)
    else:
        # Legacy schema path
        query = text("""
            SELECT ST_Y(location::geometry) as lat, ST_X(location::geometry) as lon, timestamp, speed, altitude
            FROM location_updates
            WHERE ride_id::text = :ride_id
            ORDER BY timestamp ASC
        """)

    result = db.execute(query, {"ride_id": ride_id}).fetchall()
    
    route = [
        {"lat": row[0], "lon": row[1], "timestamp": row[2], "speed": row[3], "altitude": row[4]}
        for row in result
    ]
    
    return {"ride_id": ride_id, "route": route}

@router.get("/ride/{ride_id}/group-intelligence")
def get_group_intelligence(ride_id: str, db: Session = Depends(get_db)):
    """
    Group Intelligence Engine: Calculates distance to leader, tail rider, etc.
    """
    try:
        use_ride_locations = _table_exists(db, "ride_locations")

        if use_ride_locations:
            query = text("""
                SELECT DISTINCT ON (user_id)
                    user_id,
                    latitude as lat,
                    longitude as lon,
                    timestamp
                FROM ride_locations
                WHERE ride_id::text = :ride_id
                ORDER BY user_id, timestamp DESC
            """)
            latest_locations = db.execute(query, {"ride_id": ride_id}).fetchall()
        else:
            query = text("""
                SELECT DISTINCT ON (user_id)
                    user_id,
                    ST_Y(location::geometry) as lat,
                    ST_X(location::geometry) as lon,
                    timestamp,
                    location
                FROM location_updates
                WHERE ride_id::text = :ride_id
                ORDER BY user_id, timestamp DESC
            """)
            latest_locations = db.execute(query, {"ride_id": ride_id}).fetchall()

        if not latest_locations:
            return {
                "reference_user_id": None,
                "active_riders_count": 0,
                "distances": [],
                "separated_riders": [],
                "total_distance_covered_km": 0,
                "message": "No active riders found for this ride."
            }

        # Use the first active rider as reference when auth/user context is unavailable.
        reference_loc = latest_locations[0]
        active_riders_count = len(latest_locations)

        if use_ride_locations:
            dist_query = text("""
                SELECT
                    l.user_id,
                    COALESCE(u.name, u.email, l.user_id) as name,
                    ST_Distance(
                        ST_SetSRID(ST_MakePoint(l.lon, l.lat), 4326)::geography,
                        ST_SetSRID(ST_MakePoint(:ref_lon, :ref_lat), 4326)::geography
                    ) as distance_meters
                FROM (
                    SELECT DISTINCT ON (user_id)
                        user_id,
                        latitude as lat,
                        longitude as lon,
                        timestamp
                    FROM ride_locations
                    WHERE ride_id::text = :ride_id
                    ORDER BY user_id, timestamp DESC
                ) l
                LEFT JOIN users u ON (u.id::text = l.user_id OR u.firebase_uid = l.user_id)
                WHERE l.user_id != :my_id
            """)

            distances = db.execute(
                dist_query,
                {
                    "ref_lon": reference_loc[2],
                    "ref_lat": reference_loc[1],
                    "ride_id": ride_id,
                    "my_id": reference_loc[0],
                },
            ).fetchall()
        else:
            # Legacy schema path
            dist_query = text("""
                SELECT u.id, u.name, ST_Distance(l.location, :my_loc) as distance_meters
                FROM users u
                JOIN (
                    SELECT DISTINCT ON (user_id) user_id, location
                    FROM location_updates
                    WHERE ride_id::text = :ride_id
                    ORDER BY user_id, timestamp DESC
                ) l ON u.id::text = l.user_id::text
                WHERE u.id::text != :my_id
            """)

            distances = db.execute(
                dist_query,
                {
                    "my_loc": reference_loc[4],
                    "ride_id": ride_id,
                    "my_id": str(reference_loc[0]),
                },
            ).fetchall()

        results = [
            {"user_id": row[0], "name": row[1], "distance_meters": row[2]}
            for row in distances
        ]

        # Single-rider mode: still return a meaningful intelligence record.
        if active_riders_count == 1:
            results = [
                {
                    "user_id": reference_loc[0],
                    "name": str(reference_loc[0]),
                    "distance_meters": 0,
                    "is_reference": True,
                }
            ]

        # Identify separated riders (> 2000 meters)
        separated = [
            r for r in results
            if isinstance(r.get("distance_meters"), (int, float)) and r["distance_meters"] > 2000
        ]

        try:
            total_distance = get_ride_total_distance(db, ride_id)
        except Exception:
            total_distance = 0

        return {
            "reference_user_id": reference_loc[0],
            "active_riders_count": active_riders_count,
            "distances": results,
            "separated_riders": separated,
            "total_distance_covered_km": total_distance,
            "message": "OK (single rider mode)" if active_riders_count == 1 else "OK"
        }
    except Exception:
        return {
            "reference_user_id": None,
            "active_riders_count": 0,
            "distances": [],
            "separated_riders": [],
            "total_distance_covered_km": 0,
            "message": "Group intelligence temporarily unavailable."
        }
