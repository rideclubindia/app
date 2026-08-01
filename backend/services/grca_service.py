import math
from datetime import datetime
import numpy as np
from sklearn.cluster import DBSCAN
from shapely.geometry import MultiPoint
from haversine import haversine, Unit
from schemas.grca_schemas import (
    GRCABatchRequest,
    GRCADashboardResponse,
    RiderMetrics,
    GRCAEvent,
    RiderData
)

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in meters between two coordinates."""
    return haversine((lat1, lon1), (lat2, lon2), unit=Unit.METERS)

def calculate_weighted_center(riders: list[RiderData]) -> tuple[float, float]:
    """Calculate the weighted center of the group."""
    total_weight = 0.0
    weighted_lat = 0.0
    weighted_lon = 0.0

    for r in riders:
        # Weight based on accuracy, speed stability (assume higher speed means less stability if variance is high, but we'll use a simple proxy for now), and signal strength.
        # Accuracy is usually CEP in meters (lower is better). We'll invert it.
        acc_weight = 1.0 / (r.accuracy if r.accuracy > 0 else 1.0)
        signal_weight = (r.signal_strength or 50) / 100.0
        
        weight = acc_weight * signal_weight
        total_weight += weight
        weighted_lat += r.latitude * weight
        weighted_lon += r.longitude * weight

    if total_weight == 0:
        return riders[0].latitude, riders[0].longitude

    return weighted_lat / total_weight, weighted_lon / total_weight

def get_leader_and_tail(riders: list[RiderData], center_lat: float, center_lon: float) -> tuple[RiderData, RiderData]:
    """Identify leader and tail. Simple heuristic: sort by heading and distance."""
    # A true leader/tail detection would project onto the route polyline.
    # We will approximate based on heading vectors. 
    # For now, let's just pick the ones furthest apart to simplify, or rely on predefined roles.
    for r in riders:
        if r.ride_role == "leader":
            leader = r
            break
    else:
        leader = riders[0]

    for r in riders:
        if r.ride_role == "tail":
            tail = r
            break
    else:
        tail = riders[-1]
    
    return leader, tail

class GRCAEngine:
    def __init__(self):
        # State tracking: ride_id -> rider_id -> { top_speed, total_distance, last_coords, route_path, start_time, cohesion_history ... }
        self.ride_history = {} 

    def process_batch(self, batch: GRCABatchRequest) -> GRCADashboardResponse:
        riders = batch.riders
        if not riders:
            raise ValueError("No riders in batch")

        # 1. Group Center
        center_lat, center_lon = calculate_weighted_center(riders)

        # 2. Leader and Tail
        leader, tail = get_leader_and_tail(riders, center_lat, center_lon)

        # 3. Density (Convex Hull)
        coords = [(r.latitude, r.longitude) for r in riders]
        if len(coords) >= 3:
            # MultiPoint expects (x, y) which is (lon, lat) usually, but for area it doesn't matter as long as it's consistent
            # To get accurate meters area, we should project to local CRS, but for a score approximation, we can use a scaling factor
            # Approx: 1 deg lat ~ 111km. For simplicity, we calculate the area in square degrees and scale, or just use Haversine bounds.
            # A simpler density approximation: area of bounding box or just use Shapely's convex hull area
            geom = MultiPoint([(r.longitude, r.latitude) for r in riders])
            hull = geom.convex_hull
            # Rough conversion to square meters: Area in sq degrees * (111000^2)
            group_area_sqm = hull.area * (111000 ** 2)
            # Density = riders / sq km
            density = len(riders) / (group_area_sqm / 1000000.0) if group_area_sqm > 0 else 1.0
        else:
            density = 1.0

        # 4. Speed & Heading Cohesion
        speeds = [r.speed for r in riders]
        headings = [r.heading for r in riders]
        
        avg_speed = np.mean(speeds)
        
        # 5. Formation Detection & Fragmentation (DBSCAN)
        # Convert coords to radians for haversine metric in DBSCAN
        coords_rad = np.radians([(r.latitude, r.longitude) for r in riders])
        # Epsilon = 500m (in radians: 500 / 6371000)
        epsilon = 500 / 6371000.0
        db = DBSCAN(eps=epsilon, min_samples=1, algorithm='ball_tree', metric='haversine').fit(coords_rad)
        labels = db.labels_
        cluster_count = len(set(labels))
        
        fragmentation = cluster_count / len(riders) if len(riders) > 0 else 0.0
        
        if cluster_count == 1:
            # Check if it's compact, linear, or stretched based on distances
            max_dist = max([calculate_distance(center_lat, center_lon, r.latitude, r.longitude) for r in riders])
            if max_dist <= 500:
                formation_type = "Compact Formation"
            elif max_dist <= 2000:
                formation_type = "Linear Formation"
            else:
                formation_type = "Stretched Formation"
        else:
            formation_type = "Fragmented Formation"

        # 6. Distance Analysis and Separation Risk per rider
        riders_metrics = []
        events = []
        
        position_scores = []
        speed_scores = []
        heading_scores = []
        connectivity_scores = []

        for r in riders:
            dist_to_center = calculate_distance(center_lat, center_lon, r.latitude, r.longitude)
            dist_to_leader = calculate_distance(leader.latitude, leader.longitude, r.latitude, r.longitude)
            dist_to_tail = calculate_distance(tail.latitude, tail.longitude, r.latitude, r.longitude)
            
            speed_dev = abs(r.speed - avg_speed)
            
            # Heading diff (circular)
            heading_diff = min(abs(r.heading - np.mean(headings)), 360 - abs(r.heading - np.mean(headings)))
            
            # Simple linear prediction for 30s
            pred_sep_30s = dist_to_center + (speed_dev * (1000/3600)) * 30 
            
            risk = "Low"
            if speed_dev > 20 or heading_diff > 45 or dist_to_center > 2000:
                risk = "High"
                events.append(GRCAEvent(
                    event_type="RIDER_SEPARATION_RISK",
                    timestamp=datetime.utcnow(),
                    details=f"Rider {r.rider_id} is at high risk of separation."
                ))
            elif speed_dev > 10 or dist_to_center > 1000:
                risk = "Medium"

            # --- Update State History ---
            ride_state = self.ride_history.setdefault(batch.ride_id, {
                'start_time': datetime.utcnow(),
                'cohesion_history': [],
                'riders': {}
            })
            rider_state = ride_state['riders'].setdefault(r.rider_id, {
                'top_speed': 0.0,
                'total_distance': 0.0,
                'last_coords': None,
                'route_path': [],
                'status': 'Active'
            })

            # Update top speed
            if r.speed > rider_state['top_speed']:
                rider_state['top_speed'] = r.speed

            # Update distance and path
            if rider_state['last_coords']:
                last_lat, last_lon = rider_state['last_coords']
                dist_since_last = calculate_distance(last_lat, last_lon, r.latitude, r.longitude)
                # Filter out GPS jumps (e.g., > 500m in a few seconds)
                if dist_since_last < 500:
                    rider_state['total_distance'] += dist_since_last
                    
            rider_state['last_coords'] = (r.latitude, r.longitude)
            # Only store every Nth point or if moved to save memory, but for now append
            if not rider_state['route_path'] or rider_state['route_path'][-1] != [r.latitude, r.longitude]:
                rider_state['route_path'].append([r.latitude, r.longitude])

            # Status logic
            if r.speed < 2:
                rider_state['status'] = 'Stopped'
            else:
                rider_state['status'] = 'Active'

            # ETA and Distance Remaining
            dist_remaining = None
            eta_str = None
            if batch.destination_lat and batch.destination_lon:
                dist_remaining = calculate_distance(r.latitude, r.longitude, batch.destination_lat, batch.destination_lon)
                if r.speed > 5: # min speed to calc ETA
                    eta_seconds = dist_remaining / (r.speed * (1000/3600))
                    eta_str = f"{int(eta_seconds // 60)}m"
                else:
                    eta_str = "Delayed"

            # Check completion
            if dist_remaining is not None and dist_remaining < 100:
                rider_state['status'] = 'Completed'

            riders_metrics.append(RiderMetrics(
                rider_id=r.rider_id,
                distance_to_center=dist_to_center,
                distance_to_leader=dist_to_leader,
                distance_to_tail=dist_to_tail,
                speed_deviation=speed_dev,
                heading_difference=heading_diff,
                predicted_separation_30s=pred_sep_30s,
                separation_risk=risk,
                top_speed=rider_state['top_speed'],
                total_distance=rider_state['total_distance'],
                distance_remaining=dist_remaining,
                eta=eta_str,
                route_deviation=False, # Mocked for now
                status=rider_state['status'],
                route_path=rider_state['route_path']
            ))
            
            # Scoring for overall cohesion
            pos_score = max(0, 100 - (dist_to_center / 50)) # 5000m -> 0 score
            spd_score = max(0, 100 - (speed_dev * 2))
            hdg_score = max(0, 100 - (heading_diff * 1.5))
            conn_score = (r.signal_strength or 50)
            
            position_scores.append(pos_score)
            speed_scores.append(spd_score)
            heading_scores.append(hdg_score)
            connectivity_scores.append(conn_score)

        # 7. Final Cohesion Score
        overall_pos = np.mean(position_scores)
        overall_spd = np.mean(speed_scores)
        overall_hdg = np.mean(heading_scores)
        overall_conn = np.mean(connectivity_scores)
        # Density score: 0 to 100 based on density (cap at some reasonable value)
        density_score = min(100, density * 10) 

        cohesion_score = (
            overall_pos * 0.35 +
            overall_spd * 0.20 +
            overall_hdg * 0.20 +
            density_score * 0.15 +
            overall_conn * 0.10
        )

        # Status Levels
        if cohesion_score >= 90:
            group_status = "Excellent"
        elif cohesion_score >= 75:
            group_status = "Healthy"
        elif cohesion_score >= 60:
            group_status = "Moderate"
        elif cohesion_score >= 40:
            group_status = "Weak"
        else:
            group_status = "Critical"

        if group_status == "Critical":
            events.append(GRCAEvent(
                event_type="REGROUP_REQUIRED",
                timestamp=datetime.utcnow(),
                details="Group cohesion is critical. Regrouping recommended."
            ))
        elif cluster_count > 1:
            events.append(GRCAEvent(
                event_type="GROUP_SPLIT_DETECTED",
                timestamp=datetime.utcnow(),
                details=f"Group has fragmented into {cluster_count} clusters."
            ))
        else:
            events.append(GRCAEvent(
                event_type="GROUP_HEALTH_GOOD" if cohesion_score >= 75 else "GROUP_HEALTH_WARNING",
                timestamp=datetime.utcnow(),
                details=f"Group cohesion is {group_status.lower()}.",
                recommended_regroup_action="Regroup immediately" if group_status == "Critical" else "Consider regrouping soon"
            ))

        ride_state = self.ride_history.get(batch.ride_id, {'start_time': datetime.utcnow(), 'cohesion_history': []})
        
        # Append latest score and keep only last 30
        ride_state['cohesion_history'].append(round(cohesion_score, 2))
        if len(ride_state['cohesion_history']) > 30:
            ride_state['cohesion_history'].pop(0)

        ride_duration = int((datetime.utcnow() - ride_state['start_time']).total_seconds())

        total_ride_distance = max([m.total_distance for m in riders_metrics]) if riders_metrics else 0.0
        active_count = sum(1 for m in riders_metrics if m.status == 'Active')
        paused_count = sum(1 for m in riders_metrics if m.status == 'Stopped')
        completed_count = sum(1 for m in riders_metrics if m.status == 'Completed')

        progress_pct = 0.0
        if batch.total_route_distance and batch.total_route_distance > 0:
            avg_dist_cov = np.mean([m.total_distance for m in riders_metrics])
            progress_pct = min(100.0, (avg_dist_cov / batch.total_route_distance) * 100.0)

        return GRCADashboardResponse(
            ride_id=batch.ride_id,
            cohesion_score=round(cohesion_score, 2),
            group_status=group_status,
            formation_type=formation_type,
            density=round(density, 2),
            fragmentation=round(fragmentation, 2),
            separation_risk="High" if any(m.separation_risk == "High" for m in riders_metrics) else "Low",
            leader=leader.rider_id,
            tail=tail.rider_id,
            center_lat=center_lat,
            center_lon=center_lon,
            total_ride_distance=total_ride_distance,
            total_ride_duration=ride_duration,
            active_count=active_count,
            paused_count=paused_count,
            completed_count=completed_count,
            progress_percentage=round(progress_pct, 1),
            cohesion_history=ride_state['cohesion_history'],
            riders_metrics=riders_metrics,
            events=events,
            recommended_regroup_action="Regroup after 2km" if group_status in ["Weak", "Critical"] else None
        )

grca_engine = GRCAEngine()
