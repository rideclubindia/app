import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { grcaApi, type GRCADashboardResponse } from '../services/grcaApi';
import { 
    Users, Activity, AlertTriangle, 
    ArrowLeft, Radio, Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Helmet } from 'react-helmet-async';

export const GroupRideDashboard: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const rideId = searchParams.get('ride_id') || 'current_ride_123';

    const [dashboardData, setDashboardData] = useState<GRCADashboardResponse | null>(null);
    const [rideFeature, setRideFeature] = useState<any>(null);
    const [rideStops, setRideStops] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const [rideMembers, setRideMembers] = useState<any[]>([]);
    const [riderLocations, setRiderLocations] = useState<{[userId: string]: any}>({});
    const [rideStartLocation, setRideStartLocation] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedRiderFilter, setSelectedRiderFilter] = useState('All');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [activeTrackerTab, setActiveTrackerTab] = useState<'status' | 'performance' | 'distance' | 'eta' | 'risk'>('status');

    const mapContainer = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<{[key: string]: maplibregl.Marker}>({});

    useEffect(() => {
        let locSub: any;
        
        const initDashboard = async () => {
            setLoading(true);
            let actualRideId = rideId;
            
            if (actualRideId === 'current_ride_123') {
                const { data: recentRide } = await supabase.from('rides').select('id').order('created_at', { ascending: false }).limit(1).single();
                if (recentRide) actualRideId = recentRide.id;
            }

            try {
                // 1. Fetch Route and Stops
                const { data: rideData } = await supabase.from('rides').select('*').eq('id', actualRideId).single();
                let geometry: any = null;
                if (rideData && rideData.route_geometry) {
                    let geom = rideData.route_geometry;
                    if (typeof geom === 'string') try { geom = JSON.parse(geom); } catch(e) {}
                    geometry = geom;
                }
                if (rideData && rideData.start_location) {
                    let loc = rideData.start_location;
                    if (typeof loc === 'string') try { loc = JSON.parse(loc); } catch(e) {}
                    setRideStartLocation(loc);
                }
                const { data: stopsData } = await supabase.from('ride_stops').select('*').eq('ride_id', actualRideId);
                if (stopsData) setRideStops(stopsData);

                // Build the planned route from stops (incl. Start/Destination) or origin/destination when no geometry is stored
                if (!geometry && rideData) {
                    const parse = (v: any) => { if (!v) return null; if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } } return v; };
                    const sl = parse(rideData.start_location);
                    const dl = parse(rideData.destination);
                    const pick = (o: any) => {
                        if (!o) return null;
                        const lat = o.lat ?? o.latitude, lng = o.lng ?? o.longitude;
                        return (typeof lat === 'number' && typeof lng === 'number' && isFinite(lat) && isFinite(lng)) ? [lng, lat] as [number, number] : null;
                    };

                    // Prefer the full ordered stop list (same source LiveRide uses, so the path matches)
                    let waypoints: [number, number][] = (stopsData || [])
                        .filter((s: any) => s.latitude && s.longitude)
                        .sort((a: any, b: any) => (a.sequence ?? a.stop_order ?? 0) - (b.sequence ?? b.stop_order ?? 0))
                        .map((s: any) => [s.longitude, s.latitude] as [number, number]);

                    // Fallback: origin/intermediates/destination from ride fields
                    if (waypoints.length < 2) {
                        waypoints = [];
                        const startPt = pick(sl);
                        if (startPt) waypoints.push(startPt);
                        (stopsData || [])
                            .filter((s: any) => s.stop_type !== 'Start' && s.stop_type !== 'Destination' && s.latitude && s.longitude)
                            .sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0))
                            .forEach((s: any) => waypoints.push([s.longitude, s.latitude]));
                        const destPt = pick(dl);
                        if (destPt) waypoints.push(destPt);
                    }

                    // Deduplicate adjacent identical points (TomTom rejects them)
                    waypoints = waypoints.filter((c, i) => i === 0 || c[0] !== waypoints[i - 1][0] || c[1] !== waypoints[i - 1][1]);

                    if (waypoints.length >= 2) {
                        try {
                            const { fetchTomTomRoute } = await import('../lib/routing');
                            const built = await fetchTomTomRoute(waypoints, 'driving-car');
                            if (built) {
                                geometry = built;
                                // Persist so future loads skip the rebuild
                                supabase.from('rides').update({ route_geometry: built }).eq('id', actualRideId).then(() => {}, () => {});
                            }
                        } catch (e) { console.warn('Route build failed:', e); }

                        // Guaranteed fallback: straight path through stops so the route is always visible
                        if (!geometry) {
                            geometry = {
                                type: 'Feature',
                                properties: { summary: { distance: 0, duration: 0 }, fallback: true },
                                geometry: { type: 'LineString', coordinates: waypoints }
                            };
                        }
                    }
                }
                if (geometry) setRideFeature(geometry);

                // 2. Fetch Members
                const { data: mems } = await supabase.from('ride_members')
                    .select('*')
                    .eq('ride_id', actualRideId);
                
                const membersList = mems || [];
                setRideMembers(membersList);

                // 3. Fetch latest locations for members
                const userIds = membersList.map(m => m.user_id);
                const locsObj: {[k: string]: any} = {};
                
                if (userIds.length > 0) {
                    const { data: locs } = await supabase.from('ride_locations')
                        .select('*').eq('ride_id', actualRideId).in('user_id', userIds);
                    locs?.forEach(l => { locsObj[l.user_id] = l; });
                }
                setRiderLocations(locsObj);

                // Subscribe to real-time location updates (append timestamp to avoid reuse error)
                const channelName = `fleet-tracker-${actualRideId}-${Date.now()}`;
                locSub = supabase.channel(channelName)
                    .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_locations', filter: `ride_id=eq.${actualRideId}` },
                        (payload) => {
                            const newLoc = payload.new as any;
                            if (newLoc && newLoc.user_id) {
                                setRiderLocations(prev => ({ ...prev, [newLoc.user_id]: { ...prev[newLoc.user_id], ...newLoc } }));
                            }
                        }
                    )
                    .subscribe();

                setError(null);
            } catch (err: any) {
                console.error("Error init fleet tracker:", err);
                setError(err.message || 'Failed to connect');
            } finally {
                setLoading(false);
            }
        };

        initDashboard();
        return () => { if (locSub) supabase.removeChannel(locSub); };
    }, [rideId]);

    // Recalculate Dashboard Data when locations or members change
    useEffect(() => {
        if (!rideMembers.length) return;

        const now = Date.now();
        let activeCount = 0;
        let sumLat = 0, sumLon = 0;
        let validLocationsCount = 0;

        const metrics = rideMembers.map(mem => {
            const loc = riderLocations[mem.user_id];
            
            // Use live location, or fallback to the ride's start_location if they just created it
            let finalLat = null;
            let finalLon = null;
            
            if (loc) {
                finalLat = loc.latitude;
                finalLon = loc.longitude;
            } else if (rideStartLocation) {
                finalLat = rideStartLocation.lat || rideStartLocation.latitude;
                finalLon = rideStartLocation.lng || rideStartLocation.longitude;
            }

            const isActive = loc && (now - new Date(loc.updated_at).getTime() < 5 * 60 * 1000); // active within 5 mins
            
            if (isActive) {
                activeCount++;
            }
            
            if (finalLat && finalLon) {
                sumLat += finalLat;
                sumLon += finalLon;
                validLocationsCount++;
            }
            
            return {
                rider_id: mem.display_name || mem.user_id,
                distance_to_center: 0,
                distance_to_leader: 0,
                distance_to_tail: 0,
                speed_deviation: 0,
                heading_difference: 0,
                predicted_separation_30s: 0,
                separation_risk: isActive ? "Low" : "High",
                top_speed: loc?.speed ? Math.round(loc.speed * 3.6) : 0, // m/s to km/h
                total_distance: 0,
                distance_remaining: null,
                eta: null,
                route_deviation: false,
                status: isActive ? 'Active' : 'Offline',
                route_path: (finalLat && finalLon) ? [[finalLat, finalLon]] : []
            };
        });

        const centerLat = validLocationsCount > 0 ? sumLat / validLocationsCount : 17.3850;
        const centerLon = validLocationsCount > 0 ? sumLon / validLocationsCount : 78.4867;

        // Calculate cohesion (simple average distance to center in meters, mock for now)
        const cohesion = activeCount > 1 ? 95 : (validLocationsCount > 0 ? 100 : 0);
        
        setDashboardData({
            ride_id: searchParams.get('ride_id') || 'current_ride_123',
            cohesion_score: cohesion,
            group_status: cohesion > 80 ? "Optimal" : "Scattered",
            formation_type: activeCount > 1 ? "Convoy" : "Single",
            density: activeCount,
            fragmentation: 0.0,
            separation_risk: cohesion > 80 ? "Low" : "High",
            leader: metrics.find(m => m.status === 'Active')?.rider_id || "N/A",
            tail: "N/A",
            center_lat: centerLat,
            center_lon: centerLon,
            total_ride_distance: 0,
            total_ride_duration: 0,
            active_count: activeCount,
            paused_count: rideMembers.length - activeCount,
            completed_count: 0,
            progress_percentage: 0,
            cohesion_history: [cohesion],
            riders_metrics: metrics,
            events: [],
            recommended_regroup_action: cohesion < 50 ? "Recommend regroup at next stop." : null
        });

    }, [rideMembers, riderLocations]);

    // Map Initialization
    useEffect(() => {
        if (!dashboardData) return; // Wait until data is loaded and DOM is present
        if (!mapContainer.current || mapRef.current) return;

        mapRef.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
            center: [dashboardData.center_lon || 78.486, dashboardData.center_lat || 17.385],
            zoom: 12,
            attributionControl: false
        });
        mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        // Force resize to ensure map canvas fills container properly
        setTimeout(() => {
            if (mapRef.current) {
                mapRef.current.resize();
            }
        }, 100);

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            markersRef.current = {};
        };
    }, [dashboardData !== null]);

    const mapBoundsRef = useRef<boolean>(false);

    // Map Updates
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !dashboardData) return;

        const updateMapFeatures = () => {
            if (!map.isStyleLoaded()) {
                map.once('styledata', updateMapFeatures);
                return;
            }

            // Draw planned route
            const hasGeometry = rideFeature && (rideFeature.geometry || (rideFeature.type === 'FeatureCollection' && rideFeature.features?.length > 0));
            if (hasGeometry) {
                if (!map.getSource('planned-route')) {
                    map.addSource('planned-route', {
                        type: 'geojson',
                        data: rideFeature
                    });
                    map.addLayer({
                        id: 'planned-route-line',
                        type: 'line',
                        source: 'planned-route',
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#273a5a', // Dark blue for planned route
                            'line-width': 5,
                            'line-opacity': 0.9,
                            'line-dasharray': [2, 2]
                        }
                    }, map.getStyle()?.layers?.find(l => l.type === 'symbol')?.id); // Draw under labels
                } else {
                    const source = map.getSource('planned-route') as maplibregl.GeoJSONSource;
                    source.setData(rideFeature);
                }
            }

            // Fit bounds once using either route geometry or stops or riders
            if (!mapBoundsRef.current) {
                try {
                    let bbox: any = null;
                    if (hasGeometry) {
                        bbox = turf.bbox(rideFeature);
                    } else if (rideStops && rideStops.length > 0) {
                        const pts = turf.featureCollection(rideStops.map(s => turf.point([s.longitude, s.latitude])));
                        bbox = turf.bbox(pts);
                    } else if (dashboardData?.riders_metrics && dashboardData.riders_metrics.length > 0) {
                        const validCoords = dashboardData.riders_metrics
                            .filter(r => r.route_path && r.route_path.length > 0)
                            .map(r => {
                                const p = r.route_path[r.route_path.length - 1];
                                return turf.point([p[1], p[0]]); // [lon, lat]
                            });
                        if (validCoords.length > 0) {
                            bbox = turf.bbox(turf.featureCollection(validCoords));
                        }
                    }
                    
                    if (bbox && bbox.length === 4) {
                        map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 50, maxZoom: 14, duration: 1000 });
                        mapBoundsRef.current = true;
                    }
                } catch (e) {
                    console.error("Error calculating bounds for route/stops", e);
                }
            }

            // Draw stops
            rideStops.forEach(stop => {
                if (!stop.latitude || !stop.longitude) return;
                let marker = markersRef.current[`stop-${stop.id}`];
                if (!marker) {
                    const el = document.createElement('div');
                    el.className = 'w-7 h-7 bg-white rounded-full border-2 shadow-md flex items-center justify-center text-[12px]';
                    el.style.borderColor = '#FF5A00';
                    el.innerHTML = stop.stop_type === 'Destination' ? '🏁' : stop.stop_type === 'Start' ? '🚩' : '📍';
                    
                    marker = new maplibregl.Marker({element: el}).setLngLat([stop.longitude, stop.latitude]).addTo(map);
                    markersRef.current[`stop-${stop.id}`] = marker;
                }
            });

            // Update markers and route paths
            dashboardData?.riders_metrics.forEach(rider => {
                const path = rider.route_path;
                if (!path || path.length === 0) return;
                const lastCoord = path[path.length - 1];
                // Backend provides [lat, lon], MapLibre expects [lon, lat]
                const lngLat: [number, number] = [lastCoord[1], lastCoord[0]];

                let marker = markersRef.current[rider.rider_id];
                if (!marker) {
                    const el = document.createElement('div');
                    el.className = 'w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md';
                    if (rider.status === 'Stopped') el.className = 'w-4 h-4 bg-yellow-500 rounded-full border-2 border-white shadow-md';
                    if (rider.separation_risk === 'High') el.className = 'w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md animate-pulse';
                    
                    marker = new maplibregl.Marker({element: el}).setLngLat(lngLat).addTo(map);
                    markersRef.current[rider.rider_id] = marker;
                } else {
                    marker.setLngLat(lngLat);
                }

                // Draw Route Polyline
                if (path.length >= 2) {
                    const sourceId = `route-${rider.rider_id}`;
                    const routeGeoJSON: any = {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: path.map(coord => [coord[1], coord[0]])
                        }
                    };

                    if (!map.getSource(sourceId)) {
                        map.addSource(sourceId, {
                            type: 'geojson',
                            data: routeGeoJSON
                        });
                        map.addLayer({
                            id: `route-line-${rider.rider_id}`,
                            type: 'line',
                            source: sourceId,
                            layout: {
                                'line-join': 'round',
                                'line-cap': 'round'
                            },
                            paint: {
                                'line-color': rider.status === 'Stopped' ? '#EAB308' : '#3B82F6',
                                'line-width': 4,
                                'line-opacity': 0.8
                            }
                        });
                    } else {
                        const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
                        source.setData(routeGeoJSON);
                    }
                }
            });
        };

        if (!map.isStyleLoaded()) {
            map.once('styledata', updateMapFeatures);
        } else {
            updateMapFeatures();
        }
    }, [dashboardData, rideFeature, rideStops]);

    if (loading && !dashboardData) {
        return (
            <div className="flex h-full items-center justify-center bg-[#F2F4F7] font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-[#FF5A00] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">Initializing Group Tracker...</span>
                </div>
            </div>
        );
    }

    if (!dashboardData) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Excellent': return 'bg-emerald-50 text-emerald-600';
            case 'Healthy': return 'bg-green-50 text-green-600';
            case 'Optimal': return 'bg-green-50 text-green-600';
            case 'Moderate': return 'bg-yellow-50 text-yellow-600';
            case 'Weak': return 'bg-orange-50 text-orange-600';
            case 'Scattered': return 'bg-red-50 text-red-500';
            case 'Critical': return 'bg-red-50 text-red-600';
            default: return 'bg-gray-100 text-gray-500';
        }
    };

    const filteredRiders = dashboardData.riders_metrics.filter(r => {
        if (selectedRiderFilter !== 'All' && r.rider_id !== selectedRiderFilter) return false;
        if (searchQuery && !r.rider_id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
    <React.Fragment>
        <Helmet>
            <title>Group Dashboard | Ride Club</title>
        </Helmet>

        <div className="w-full h-full bg-[#F2F4F7] flex flex-row overflow-hidden font-sans">

            {/* ===== LEFT: Tracker Panel ===== */}
            <div className="w-[340px] min-w-[300px] max-w-[380px] shrink-0 bg-[#F7F8FA] border-r border-gray-200 flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between shrink-0 px-4 pt-4 pb-2">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#111111] hover:bg-gray-50 active:scale-95 transition-all shadow-sm">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-[#111111] font-semibold text-lg tracking-wide uppercase leading-tight">Group Tracker</h1>
                            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(dashboardData.group_status)}`}>
                                {dashboardData.group_status}
                            </span>
                        </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#FFF0E6] flex items-center justify-center shrink-0">
                        <Radio className="w-4 h-4 text-[#FF5A00]" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pb-3 flex flex-col gap-3">

                    {/* Core Stats */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white rounded-[8px] border border-gray-100 shadow-sm p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Activity className="w-3.5 h-3.5 text-[#FF5A00]" strokeWidth={2.5} />
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Cohesion</span>
                            </div>
                            <span className="text-[24px] font-semibold text-[#111111] leading-none tabular-nums">{dashboardData.cohesion_score}</span>
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
                                <div className="h-full bg-gradient-to-r from-[#FF5A00] to-success rounded-full transition-all duration-500" style={{ width: `${dashboardData.cohesion_score}%` }} />
                            </div>
                        </div>
                        <div className="bg-white rounded-[8px] border border-gray-100 shadow-sm p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Users className="w-3.5 h-3.5 text-blue-500" strokeWidth={2.5} />
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Active Fleet</span>
                            </div>
                            <span className="text-[24px] font-semibold text-[#111111] leading-none tabular-nums">
                                {dashboardData.active_count}<span className="text-[13px] text-gray-400 ml-0.5">/{dashboardData.riders_metrics.length}</span>
                            </span>
                            <div className="flex items-center gap-1 mt-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A00] animate-pulse" />
                                <span className="text-[10px] font-semibold text-gray-400">Live tracking</span>
                            </div>
                        </div>
                    </div>

                    {/* Regroup Alert */}
                    {dashboardData.recommended_regroup_action && (
                        <div className="bg-white rounded-[8px] border border-red-100 p-3 flex items-start gap-2.5 shadow-sm">
                            <div className="bg-red-50 p-1.5 rounded-lg shrink-0">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-0.5">Regroup Recommended</h4>
                                <p className="text-[12px] font-semibold text-[#111111] leading-snug">{dashboardData.recommended_regroup_action}</p>
                            </div>
                        </div>
                    )}

                    {/* Riders List */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Riders</span>
                            <span className="text-[10px] font-semibold text-gray-400">{filteredRiders.length}</span>
                        </div>
                        <div className="relative mb-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search riders..."
                                className="w-full h-9 bg-white border border-gray-200 rounded-xl pl-9 pr-3 text-[12px] text-[#111111] placeholder-gray-400 font-medium outline-none focus:border-[#FF5A00]/60 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            {filteredRiders.length === 0 ? (
                                <div className="text-center text-[12px] font-semibold text-gray-400 py-4">No riders found</div>
                            ) : (
                                filteredRiders.map(r => (
                                    <div key={r.rider_id} className="bg-white rounded-[8px] border border-gray-100 shadow-sm p-2.5 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[12px] shrink-0 border-2 border-white shadow-sm ${
                                                r.status === 'Stopped' ? 'bg-yellow-500' :
                                                r.separation_risk === 'High' ? 'bg-red-500' :
                                                'bg-[#FF5A00]'
                                            }`}>
                                                {r.rider_id.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-semibold text-[#111111] truncate leading-tight">{r.rider_id}</p>
                                                <p className="text-[11px] text-gray-400 font-medium">
                                                    {r.status} · {r.top_speed} km/h
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                                            r.separation_risk === 'High' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
                                        }`}>
                                            {r.separation_risk}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Telemetry Stream */}
                    <div className="bg-white rounded-[8px] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-3 py-2.5 border-b border-gray-50 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-[#FF5A00]" />
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Telemetry Stream</h3>
                        </div>
                        <div className="p-3 overflow-y-auto max-h-[180px] flex flex-col gap-2.5 hide-scrollbar">
                            {dashboardData.events.length === 0 ? (
                                <div className="text-center text-[11px] font-semibold text-gray-400 py-3">Waiting for telemetry data...</div>
                            ) : (
                                dashboardData.events.slice().reverse().map((event, idx) => (
                                    <div key={idx} className="flex gap-2.5 items-center">
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                            event.event_type.includes('RISK') ? 'bg-red-500' : 'bg-blue-500'
                                        }`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-semibold text-[#111111] truncate">{event.event_type.replace(/_/g, ' ')}</p>
                                            <p className="text-[10px] font-medium text-gray-400 truncate">{event.details}</p>
                                        </div>
                                        <span className="text-[9px] font-semibold text-gray-300 shrink-0">{new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== RIGHT: Live Map ===== */}
            <div className="flex-1 relative min-w-0 overflow-hidden">
                <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

                {/* Legend */}
                <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur border border-gray-100 rounded-full px-3 py-1.5 shadow-md flex items-center gap-3">
                    <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF5A00]"></span> Active</span>
                    <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Stopped</span>
                    <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Separated</span>
                </div>
            </div>
        </div>
    </React.Fragment>
    );
};
