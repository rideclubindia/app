import { API_BASE_URL as BASE_URL } from '../lib/apiClient';
const API_BASE_URL = `${BASE_URL}/api/v1`;
export interface GRCAEvent {
  event_type: string;
  timestamp: string;
  details: string;
}

export interface RiderMetrics {
  rider_id: string;
  distance_to_center: number;
  distance_to_leader: number;
  distance_to_tail: number;
  speed_deviation: number;
  heading_difference: number;
  predicted_separation_30s: number;
  separation_risk: string;
  top_speed: number;
  total_distance: number;
  distance_remaining: number | null;
  eta: string | null;
  route_deviation: boolean;
  status: string;
  route_path: number[][]; // [lat, lon][]
}

export interface GRCADashboardResponse {
  ride_id: string;
  cohesion_score: number;
  group_status: string;
  formation_type: string;
  density: number;
  fragmentation: number;
  separation_risk: string;
  leader: string;
  tail: string;
  total_ride_distance: number;
  total_ride_duration: number; // in seconds
  active_count: number;
  paused_count: number;
  completed_count: number;
  progress_percentage: number;
  cohesion_history: number[];
  riders_metrics: RiderMetrics[];
  events: GRCAEvent[];
  recommended_regroup_action: string | null;
  center_lat: number;
  center_lon: number;
}

export const grcaApi = {
  getDashboard: async (rideId: string): Promise<GRCADashboardResponse> => {
    const response = await fetch(`${API_BASE_URL}/grca/dashboard/${rideId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch GRCA dashboard: ${response.statusText}`);
    }
    return response.json();
  },
  
  // This would typically be called by the tracking service or mobile app
  ingestData: async (data: any): Promise<GRCADashboardResponse> => {
    const response = await fetch(`${API_BASE_URL}/grca/ingest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(`Failed to ingest GRCA data: ${response.statusText}`);
    }
    return response.json();
  }
};
