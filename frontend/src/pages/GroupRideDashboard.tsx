import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { grcaApi, type GRCADashboardResponse } from '../services/grcaApi';
import { 
    Users, Activity, MapPin, AlertTriangle, 
    CheckCircle, Navigation, Radio, Clock, Route,
    TrendingUp, ArrowLeft, MoreVertical, Search,
    PauseCircle, PlayCircle, Flag, Map
} from 'lucide-react';
import { supabase } from '../lib/supabase';

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
                if (rideData && rideData.route_geometry) {
                    let geom = rideData.route_geometry;
                    if (typeof geom === 'string') try { geom = JSON.parse(geom); } catch(e) {}
                    setRideFeature(geom);
                }
                if (rideData && rideData.start_location) {
                    let loc = rideData.start_location;
                    if (typeof loc === 'string') try { loc = JSON.parse(loc); } catch(e) {}
                    setRideStartLocation(loc);
                }
                const { data: stopsData } = await supabase.from('ride_stops').select('*').eq('ride_id', actualRideId);
                if (stopsData) setRideStops(stopsData);

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
                            'line-opacity': 0.4,
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
                let marker = markersRef.current[`stop-${stop.id}`];
                if (!marker) {
                    const el = document.createElement('div');
                    el.className = 'w-6 h-6 bg-orange-500 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold';
                    el.innerHTML = stop.type === 'destination' ? '🏁' : '📍';
                    
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
            <div className="flex h-screen items-center justify-center bg-[#F2F4F7] text-[#273a5a] font-sans">
                <div className="text-xl animate-pulse flex flex-col items-center gap-4">
                    <Activity className="animate-spin w-10 h-10 text-[#ef4523]" /> 
                    <span className="font-bold text-gray-500">Initializing Digital Twin...</span>
                </div>
            </div>
        );
    }



    if (!dashboardData) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Excellent': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'Healthy': return 'text-green-600 bg-green-50 border-green-100';
            case 'Moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
            case 'Weak': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'Critical': return 'text-red-600 bg-red-50 border-red-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    const filteredRiders = dashboardData.riders_metrics.filter(r => {
        if (selectedRiderFilter !== 'All' && r.rider_id !== selectedRiderFilter) return false;
        if (searchQuery && !r.rider_id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const cohesionData = dashboardData.cohesion_history ? dashboardData.cohesion_history.map((score, index) => ({ index, score })) : [];
    if (cohesionData.length === 1) {
        cohesionData.push({ index: 1, score: cohesionData[0].score });
    }

    return (
        <div className="w-full h-full bg-[#F2F4F7] flex flex-col font-sans overflow-hidden">
            {/* Top Header */}
            <div className="px-5 pt-4 pb-4 bg-white border-b border-gray-100 flex-shrink-0 flex justify-between items-center z-10 shadow-sm">
                <div>
                    <p className="text-[13px] font-bold text-[#8A8A8E] tracking-wider mb-0.5 uppercase">Dashboard</p>
                    <div className="flex items-center gap-2">
                        <h1 className="text-[22px] font-bold text-[#273a5a] leading-none tracking-tight">Fleet Tracker</h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate(-1)} className="w-[44px] h-[44px] bg-[#F2F4F7] rounded-full flex items-center justify-center text-[#273a5a] shadow-sm hover:bg-gray-100 active:scale-95 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button className="w-[44px] h-[44px] bg-[#F2F4F7] rounded-full flex items-center justify-center text-[#273a5a] shadow-sm hover:bg-gray-100 active:scale-95 transition-all">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar p-2">
                
                {error && (
                    <div className="bg-red-50 border border-red-100 p-3 rounded-xl mb-4 mt-2 flex items-start gap-3 shadow-sm mx-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[13px] text-red-700">Connection Error</h4>
                            <p className="text-[12px] text-red-600/80 leading-tight">{error}</p>
                        </div>
                    </div>
                )}

                {/* Ride Info Card (Replacing Profile Card) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col p-2 relative mb-6 mt-2">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-[80px] h-[80px] rounded-full bg-[#F2F4F7] p-1 border border-gray-100 flex items-center justify-center">
                                <div className="w-full h-full rounded-full bg-[#ef4523] flex items-center justify-center text-white">
                                    <Map className="w-8 h-8" />
                                </div>
                            </div>
                            <div className={`absolute bottom-0 right-0 w-6 h-6 border-2 border-white rounded-full flex items-center justify-center shadow-sm ${dashboardData.group_status === 'Critical' ? 'bg-red-500' : 'bg-[#34C759]'}`}>
                                <Activity className="w-3 h-3 text-white" strokeWidth={3} />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-[22px] font-bold text-[#273a5a] leading-tight tracking-tight truncate">Ride {dashboardData.ride_id.substring(0,6).toUpperCase()}</h2>
                            <div className="flex items-center gap-1.5 mt-1 overflow-x-auto hide-scrollbar">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${getStatusColor(dashboardData.group_status)}`}>
                                    {dashboardData.group_status}
                                </span>
                                <span className="text-[13px] font-bold text-[#8A8A8E] ml-1 whitespace-nowrap truncate">{dashboardData.formation_type}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className="flex h-2 w-2 relative shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                                </span>
                                <span className="text-[11px] font-bold text-success uppercase tracking-wider whitespace-nowrap">Live Telemetry</span>
                                <span className="text-[11px] font-medium text-[#8A8A8E] ml-1 whitespace-nowrap">• Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map Card */}
                <h3 className="text-[16px] font-bold text-[#273a5a] mb-3 px-2">Ride Map</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 relative h-[350px]">
                    <div ref={mapContainer} className="absolute inset-0 bg-[#e5e9f0] w-full h-full" />
                    {dashboardData.recommended_regroup_action && (
                        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md border border-red-100 text-[#273a5a] p-3 rounded-xl shadow-lg flex items-center gap-3">
                            <div className="bg-red-50 p-2 rounded-lg shrink-0">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-[13px] leading-tight text-[#ef4523]">System Alert</h4>
                                <p className="text-[11px] text-[#8A8A8E] truncate">{dashboardData.recommended_regroup_action}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Core Stats Grid */}
                <h3 className="text-[16px] font-bold text-[#273a5a] mb-3 px-2">Group Metrics</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-[#FFF0E6] flex items-center justify-center">
                                <Activity className="w-4 h-4 text-[#ef4523]" />
                            </div>
                            <span className="text-[13px] font-bold text-[#8A8A8E]">Cohesion</span>
                        </div>
                        <span className="text-[24px] font-bold text-[#273a5a] leading-none">{dashboardData.cohesion_score}</span>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-blue-500" />
                            </div>
                            <span className="text-[13px] font-bold text-[#8A8A8E]">Total Dist</span>
                        </div>
                        <span className="text-[24px] font-bold text-[#273a5a] leading-none">
                            {(dashboardData.total_ride_distance / 1000).toFixed(1)} <span className="text-[14px]">km</span>
                        </span>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                <Users className="w-4 h-4 text-purple-500" />
                            </div>
                            <span className="text-[13px] font-bold text-[#8A8A8E]">Active Fleet</span>
                        </div>
                        <span className="text-[24px] font-bold text-[#273a5a] leading-none">
                            {dashboardData.active_count}<span className="text-[14px] text-gray-400">/{dashboardData.riders_metrics.length}</span>
                        </span>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                                <Route className="w-4 h-4 text-green-500" />
                            </div>
                            <span className="text-[13px] font-bold text-[#8A8A8E]">Progress</span>
                        </div>
                        <span className="text-[24px] font-bold text-[#273a5a] leading-none">{dashboardData.progress_percentage.toFixed(0)}%</span>
                    </div>
                </div>

                {/* Fleet Tracker Tabs */}
                <h3 className="text-[16px] font-bold text-[#273a5a] mb-3 px-2">Rider Activity</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text" 
                                placeholder="Search rider..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-primary/20 w-full"
                            />
                        </div>
                        <div className="relative shrink-0">
                            <button 
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="py-2 px-3 bg-white border border-gray-200 rounded-lg text-[13px] font-bold text-[#273a5a] shadow-sm flex items-center justify-between gap-2 min-w-[120px] transition-all hover:bg-gray-50 focus:ring-2 focus:ring-[#ef4523]/20"
                            >
                                <span className="truncate">{selectedRiderFilter === 'All' ? 'All Riders' : selectedRiderFilter}</span>
                                <svg className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>

                            {dropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)}></div>
                                    <div className="absolute right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 min-w-[160px] max-h-[250px] overflow-y-auto">
                                        <button 
                                            onClick={() => { setSelectedRiderFilter('All'); setDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors ${selectedRiderFilter === 'All' ? 'font-bold text-[#ef4523] bg-red-50' : 'font-medium text-[#273a5a]'}`}
                                        >
                                            All Riders
                                        </button>
                                        {dashboardData?.riders_metrics.map(r => (
                                            <button 
                                                key={r.rider_id}
                                                onClick={() => { setSelectedRiderFilter(r.rider_id); setDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors ${selectedRiderFilter === r.rider_id ? 'font-bold text-[#ef4523] bg-red-50' : 'font-medium text-[#273a5a]'}`}
                                            >
                                                {r.rider_id}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50/50 border-b border-gray-50 overflow-x-auto hide-scrollbar">
                        <div className="flex gap-2 min-w-max">
                            {[
                                { id: 'status', label: 'Status', icon: <Activity className="w-4 h-4" /> },
                                { id: 'performance', label: 'Performance', icon: <TrendingUp className="w-4 h-4" /> },
                                { id: 'distance', label: 'Distance', icon: <MapPin className="w-4 h-4" /> },
                                { id: 'eta', label: 'ETA', icon: <Clock className="w-4 h-4" /> },
                                { id: 'risk', label: 'Risk', icon: <AlertTriangle className="w-4 h-4" /> }
                            ].map(tab => {
                                const isActive = activeTrackerTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTrackerTab(tab.id as any)}
                                        className={`px-4 py-2 rounded-lg flex items-center gap-2 border transition-all text-[13px] font-bold ${
                                            isActive 
                                            ? 'bg-[#ef4523] text-white border-[#ef4523] shadow-sm' 
                                            : 'bg-white text-gray-500 border-gray-200'
                                        }`}
                                    >
                                        {tab.icon}
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex flex-col divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                        {filteredRiders.map((r, i) => (
                            <div key={i} className="flex flex-col p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#F2F4F7] flex items-center justify-center flex-shrink-0 font-bold text-[#273a5a]">
                                        {r.rider_id.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-bold text-[#273a5a] truncate">{r.rider_id}</p>
                                        <p className="text-[12px] text-[#8A8A8E] truncate">{r.distance_to_leader.toFixed(0)}m from Leader</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    {activeTrackerTab === 'status' && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-[12px] font-bold text-gray-500">Current State:</span>
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border uppercase ${
                                                r.status === 'Active' ? 'bg-green-50 text-green-600 border-green-100' :
                                                r.status === 'Stopped' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                                                'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}>
                                                {r.status}
                                            </span>
                                        </div>
                                    )}
                                    {activeTrackerTab === 'performance' && (
                                        <div className="flex justify-between items-center text-[13px] font-bold text-[#273a5a]">
                                            <span>Top: {r.top_speed.toFixed(1)} km/h</span>
                                            <span className="text-gray-500">Dev: ±{r.speed_deviation.toFixed(1)}</span>
                                        </div>
                                    )}
                                    {activeTrackerTab === 'distance' && (
                                        <div>
                                            <div className="flex justify-between text-[12px] font-bold text-[#273a5a] mb-1">
                                                <span>{(r.total_distance / 1000).toFixed(2)} km covered</span>
                                                <span className="text-gray-400">{r.distance_remaining ? `${(r.distance_remaining/1000).toFixed(1)} km left` : ''}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#ef4523] rounded-full" style={{ width: `${Math.min(100, (r.total_distance / (r.total_distance + (r.distance_remaining||1))) * 100)}%` }} />
                                            </div>
                                        </div>
                                    )}
                                    {activeTrackerTab === 'eta' && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[12px] font-bold text-gray-500">ETA:</span>
                                            <span className="text-[14px] font-black text-[#273a5a]">{r.eta || '--'}</span>
                                        </div>
                                    )}
                                    {activeTrackerTab === 'risk' && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-[12px] font-bold text-gray-500">Separation Risk:</span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${
                                                r.separation_risk === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                                                r.separation_risk === 'Medium' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                                {r.separation_risk}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filteredRiders.length === 0 && (
                            <div className="p-6 text-center text-[13px] text-gray-500 font-medium">
                                No riders match your search criteria.
                            </div>
                        )}
                    </div>
                </div>

                {/* Events Log */}
                <h3 className="text-[16px] font-bold text-[#273a5a] mb-3 px-2">Live Events Log</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 flex flex-col max-h-[300px]">
                    <div className="p-4 overflow-y-auto flex-1 space-y-4 hide-scrollbar">
                        {dashboardData.events.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400 gap-2">
                                <CheckCircle className="w-8 h-8 text-gray-300" />
                                <p className="text-[13px] font-medium">No events recorded yet.</p>
                            </div>
                        ) : (
                            dashboardData.events.slice().reverse().map((event, idx) => (
                                <div key={idx} className="flex gap-3 items-start">
                                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                        event.event_type.includes('WARNING') || event.event_type.includes('RISK') ? 'bg-orange-50 text-orange-500' :
                                        event.event_type.includes('SPLIT') || event.event_type.includes('REQUIRED') || event.event_type.includes('SOS') ? 'bg-red-50 text-red-500' :
                                        'bg-blue-50 text-blue-500'
                                    }`}>
                                        {event.event_type.includes('RISK') ? <AlertTriangle className="w-4 h-4" /> :
                                         event.event_type.includes('SOS') ? <Radio className="w-4 h-4" /> :
                                         <Activity className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <p className="text-[13px] font-bold text-[#273a5a] truncate">{event.event_type.replace(/_/g, ' ')}</p>
                                            <p className="text-[10px] font-bold text-gray-400 whitespace-nowrap ml-2">
                                                {new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                        <p className="text-[12px] text-[#8A8A8E] leading-snug">{event.details}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Cohesion Chart */}
                <h3 className="text-[16px] font-bold text-[#273a5a] mb-3 px-2">Cohesion Trend</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 mb-6">
                    <div className="h-24 relative w-full flex items-end gap-1 pt-4">
                        {cohesionData.length > 0 ? cohesionData.map((d: any, i: number) => {
                            const maxVal = Math.max(...cohesionData.map((x: any) => x.score), 10);
                            const heightPct = (d.score / maxVal) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col justify-end items-center h-full group relative">
                                    <div className="w-full bg-[#ef4523] opacity-80 hover:opacity-100 transition-all rounded-t-sm" style={{ height: `${Math.max(5, heightPct)}%` }}></div>
                                    <div className="absolute -top-8 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                        {d.score.toFixed(1)}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="flex items-center justify-center h-full text-[12px] text-gray-400 font-medium w-full">
                                Collecting historical data...
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
