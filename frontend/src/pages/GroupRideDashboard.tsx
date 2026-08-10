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
import { CockpitLayout } from '../components/spatial/CockpitLayout';
import { SpatialMembrane } from '../components/spatial/SpatialMembrane';
import { LeftGravityWell } from '../components/spatial/LeftGravityWell';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';

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
        <CockpitLayout
            mapChildren={
                <div className="w-full h-full relative pointer-events-none bg-[#FAFAF9]">
                    <div ref={mapContainer} className="w-full h-full" />
                </div>
            }
        >
            <Helmet>
                <title>Group Dashboard | Ride Club</title>
            </Helmet>

            <LeftGravityWell onSOSClick={() => navigate('/alerts')}>
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-[#ef4523] mt-2">
                    <ArrowLeft className="w-5 h-5" />
                </button>
            </LeftGravityWell>

            <SpatialMembrane className="flex flex-col h-full pointer-events-auto p-4 gap-4 overflow-y-auto hide-scrollbar landscape:ml-[72px]">
                
                {/* Dashboard Header */}
                <div className="bg-white/90 backdrop-blur-md rounded-[24px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 flex items-center justify-between gap-4 mt-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-[22px] font-black text-[#14142B] leading-tight truncate">Group Tracker</h1>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${getStatusColor(dashboardData.group_status)}`}>
                                {dashboardData.group_status}
                            </span>
                            <span className="text-[12px] font-bold text-gray-500 whitespace-nowrap">ID: {dashboardData.ride_id.substring(0,6).toUpperCase()}</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[#FFF0E6] flex items-center justify-center shrink-0 border border-white/50">
                        <Radio className="w-6 h-6 text-[#ef4523]" />
                    </div>
                </div>

                {/* Core Stats Spatial Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/90 backdrop-blur-md rounded-[20px] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-[#ef4523]" strokeWidth={3} />
                            <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Cohesion</span>
                        </div>
                        <span className="text-[28px] font-black text-[#14142B] leading-none">{dashboardData.cohesion_score}</span>
                    </div>
                    
                    <div className="bg-white/90 backdrop-blur-md rounded-[20px] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-[#3B82F6]" strokeWidth={3} />
                            <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Active Fleet</span>
                        </div>
                        <span className="text-[28px] font-black text-[#14142B] leading-none">
                            {dashboardData.active_count}<span className="text-[14px] text-gray-400 ml-1">/{dashboardData.riders_metrics.length}</span>
                        </span>
                    </div>
                </div>

                {/* System Alert Overlay */}
                {dashboardData.recommended_regroup_action && (
                    <div className="bg-red-50/90 backdrop-blur-md rounded-[20px] p-4 shadow-sm border border-red-100 flex items-start gap-3">
                        <div className="bg-red-100 p-2 rounded-xl shrink-0 mt-0.5">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-black text-[13px] text-red-600 uppercase tracking-widest mb-1">System Alert</h4>
                            <p className="text-[13px] font-bold text-red-800 leading-tight">{dashboardData.recommended_regroup_action}</p>
                        </div>
                    </div>
                )}

                {/* Spatial Rider Presence Field */}
                <div className="bg-white/90 backdrop-blur-md rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100/50 flex items-center justify-between">
                        <h3 className="font-black text-[14px] text-[#14142B] uppercase tracking-widest">Spatial Presence</h3>
                        <div className="flex gap-2">
                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4523]"></span> Active</span>
                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Stopped</span>
                        </div>
                    </div>
                    
                    <div className="relative h-[220px] w-full bg-[#F8F9FA] overflow-hidden">
                        {/* Background Grid Pattern */}
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#14142B 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        
                        {/* Leader Marker (Center) */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-[#ef4523]/20 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full border border-[#ef4523]/40 flex items-center justify-center">
                                <div className="text-[10px] font-black text-[#ef4523]/50 uppercase tracking-widest">Leader</div>
                            </div>
                        </div>

                        {/* Fluid Rider Nodes */}
                        <AnimatePresence>
                            {dashboardData.riders_metrics.map((r, i) => {
                                // Map distance_to_leader to radius (0-100px) and heading to angle
                                const distFactor = Math.min(r.distance_to_leader / 500, 1); // 500m max radius
                                const radius = distFactor * 90; // max 90px from center
                                const angle = (i * (360 / Math.max(dashboardData.riders_metrics.length, 1))) * (Math.PI / 180);
                                
                                const xOffset = Math.cos(angle) * radius;
                                const yOffset = Math.sin(angle) * radius;
                                
                                return (
                                    <motion.div
                                        key={r.rider_id}
                                        layout
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1, x: `calc(-50% + ${xOffset}px)`, y: `calc(-50% + ${yOffset}px)` }}
                                        exit={{ opacity: 0, scale: 0 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                        className="absolute left-1/2 top-1/2 flex flex-col items-center gap-1.5 z-10"
                                    >
                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-[14px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] border-2 border-white transition-colors duration-300 ${
                                            r.status === 'Stopped' ? 'bg-yellow-500' :
                                            r.separation_risk === 'High' ? 'bg-red-500 animate-pulse' :
                                            'bg-[#ef4523]'
                                        }`}>
                                            {r.rider_id.substring(0,2).toUpperCase()}
                                        </div>
                                        <div className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm border border-white flex flex-col items-center">
                                            <span className="text-[10px] font-black text-[#14142B] leading-none">{r.rider_id}</span>
                                            <span className="text-[8px] font-bold text-gray-500">{r.distance_to_leader.toFixed(0)}m</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Events Log Spatial Card */}
                <div className="bg-white/90 backdrop-blur-md rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-white/50 overflow-hidden flex flex-col mb-6">
                    <div className="p-4 border-b border-gray-100/50">
                        <h3 className="font-black text-[14px] text-[#14142B] uppercase tracking-widest">Telemetry Stream</h3>
                    </div>
                    <div className="p-4 overflow-y-auto max-h-[200px] flex flex-col gap-3 hide-scrollbar">
                        {dashboardData.events.length === 0 ? (
                            <div className="text-center text-[12px] font-bold text-gray-400 py-4">Waiting for telemetry data...</div>
                        ) : (
                            dashboardData.events.slice().reverse().map((event, idx) => (
                                <div key={idx} className="flex gap-3 items-center">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                                        event.event_type.includes('RISK') ? 'bg-red-500' : 'bg-[#3B82F6]'
                                    }`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-bold text-[#14142B] truncate">{event.event_type.replace(/_/g, ' ')}</p>
                                        <p className="text-[11px] font-bold text-gray-400 truncate">{event.details}</p>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-300">{new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </SpatialMembrane>
        </CockpitLayout>
    );
};
