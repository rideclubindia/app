from fastapi import APIRouter, HTTPException
from typing import Dict

from schemas.grca_schemas import GRCABatchRequest, GRCADashboardResponse
from services.grca_service import grca_engine

router = APIRouter(prefix="/grca", tags=["Group Ride Cohesion Algorithm"])

# In-memory store for active rides dashboard responses
active_rides: Dict[str, GRCADashboardResponse] = {}

@router.post("/ingest", response_model=GRCADashboardResponse)
async def ingest_rider_data(batch: GRCABatchRequest):
    """
    Ingest a batch of rider data, calculate cohesion metrics, and return the dashboard state.
    """
    try:
        dashboard_response = grca_engine.process_batch(batch)
        # Store latest state in memory for polling clients
        active_rides[batch.ride_id] = dashboard_response
        return dashboard_response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/dashboard/{ride_id}", response_model=GRCADashboardResponse)
async def get_dashboard(ride_id: str):
    """
    Retrieve the latest GRCA dashboard metrics for a specific ride.
    """
    if ride_id not in active_rides:
        # Return an empty state instead of 404 so the frontend dashboard displays directly
        return GRCADashboardResponse(
            ride_id=ride_id,
            cohesion_score=0.0,
            group_status="Awaiting Telemetry",
            formation_type="Unknown",
            density=0.0,
            fragmentation=0.0,
            separation_risk="Low",
            leader="N/A",
            tail="N/A",
            center_lat=17.3850, # Default to Hyderabad
            center_lon=78.4867,
            total_ride_distance=0.0,
            total_ride_duration=0,
            active_count=0,
            paused_count=0,
            completed_count=0,
            progress_percentage=0.0,
            cohesion_history=[],
            riders_metrics=[],
            events=[],
            recommended_regroup_action=None
        )
    return active_rides[ride_id]
