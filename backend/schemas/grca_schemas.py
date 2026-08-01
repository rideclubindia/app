from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class RiderData(BaseModel):
    rider_id: str
    latitude: float
    longitude: float
    speed: float
    heading: float
    altitude: float
    accuracy: float
    timestamp: datetime
    battery_level: Optional[int] = 100
    signal_strength: Optional[int] = 100
    mesh_connectivity: Optional[bool] = True
    ride_role: Optional[str] = "member"

class GRCABatchRequest(BaseModel):
    ride_id: str
    riders: List[RiderData]
    destination_lat: Optional[float] = None
    destination_lon: Optional[float] = None
    total_route_distance: Optional[float] = None

class RiderMetrics(BaseModel):
    rider_id: str
    distance_to_center: float
    distance_to_leader: float
    distance_to_tail: float
    speed_deviation: float
    heading_difference: float
    predicted_separation_30s: float
    separation_risk: str
    top_speed: float
    total_distance: float
    distance_remaining: Optional[float] = None
    eta: Optional[str] = None
    route_deviation: bool
    status: str
    route_path: List[List[float]] # List of [lat, lon] coordinates

class GRCAEvent(BaseModel):
    event_type: str
    timestamp: datetime
    details: str

class GRCADashboardResponse(BaseModel):
    ride_id: str
    cohesion_score: float
    group_status: str
    formation_type: str
    density: float
    fragmentation: float
    separation_risk: str
    leader: str
    tail: str
    center_lat: float
    center_lon: float
    total_ride_distance: float
    total_ride_duration: int # in seconds
    active_count: int
    paused_count: int
    completed_count: int
    progress_percentage: float
    cohesion_history: List[float]
    riders_metrics: List[RiderMetrics]
    events: List[GRCAEvent]
    recommended_regroup_action: Optional[str] = None
