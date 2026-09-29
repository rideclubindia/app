import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ShieldAlert, AlertTriangle, Car, Ban, Waves,
  Shield, Hammer, MoreHorizontal, Navigation2, Compass, X, Users, LogOut, MessageCircle,
  Crosshair, Layers, StopCircle, Coffee, Fuel, Utensils, BedDouble, Droplets, Camera, MapPin, RefreshCw, ArrowUp, ArrowLeft, ArrowRight, CornerUpLeft, CornerUpRight,
  Edit2, History
, ChevronUp, Route as RouteIcon } from 'lucide-react';

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getTravelModeIcon } from '../../components/TravelIcons';
import * as turf from '@turf/turf';
import { supabase } from '../../lib/supabase';
import { apiClient } from '../../lib/apiClient';
import { auth } from '../../lib/firebase';
import { useToast } from '../../components/ToastContext';
import { IncidentDrawer } from '../../components/IncidentDrawer';
import { SOSModal } from '../../components/SOSModal';
import { useCrashDetection } from '../../hooks/useCrashDetection';
import { EmergencySetupModal } from '../../components/EmergencySetupModal';
import LogoDark from '../../assets/Logos/Logo for Dark Backgrounds 2.svg';
import { useLocationStore } from '../../store/useLocationStore';

import { useIncidentCategories, incidentIconMap } from '../../hooks/useIncidentCategories';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getDeterministicUuid, getAppUser } from '../../lib/user';
import { useConfirm } from '../../components/ConfirmDialog';
import img14 from '../../assets/WebsiteImages/img14.jpg';
const imgSoloRide = img14;
import { SpeedometerCluster } from '../../hmi/components/Speedometer';
import { getRealtime, EV_LOC, EV_RIDE_EVENT, EV_RIDE_SNAPSHOT, type LocationTuple } from '../../realtime';
import { OfflineMapDownloader } from '../../components/map/OfflineMapDownloader';
import { useOrientationLock } from '../../hooks/useOrientationLock';

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjZlZTI0N2U2NGIwNjQwYTY5N2E0ZGJkMzVlZmYyMDI5IiwiaCI6Im11cm11cjY0In0=';

const LiveRide = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // The Ride screen is one of only two screens allowed to be landscape —
  // locks on mount, and this hook restores portrait automatically on
  // unmount (back button, end ride, tab switch, or any other exit).
  useOrientationLock('landscape');

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  
  const [ride, setRide] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [sheetH, setSheetH] = useState<number | null>(null);
  const [sheetDragging, setSheetDragging] = useState(false);
  const sheetDrag = useRef<{ y: number; h: number; moved: boolean } | null>(null);
  const locateBtnRef = useRef<HTMLButtonElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [tappedRiderId, setTappedRiderId] = useState<string | null>(null);
  const ridersRef = useRef<Record<string, any>>({});
  const PEEK_H = 112;
  const globalLocation = useLocationStore((state) => state.coordinates);
  const [routeFeature, setRouteFeature] = useState<any>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [currentSpeedKph, setCurrentSpeedKph] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [avgSpeed, setAvgSpeed] = useState<number>(0);
  const speedDataRef = useRef<{sum: number, count: number}>({ sum: 0, count: 0 });

  const [is3D, setIs3D] = useState(false);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'light'>('light');
  const [showTraffic, setShowTraffic] = useState(false);
  
  const [showRiders, setShowRiders] = useState(true);
  
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [focusedRiderId, setFocusedRiderId] = useState<string | null>(null);
  
  const [incidents, setIncidents] = useState<any[]>([]);
  const [rideStops, setRideStops] = useState<any[]>([]);
  
  const [riders, setRiders] = useState<Record<string, any>>({});
  
  const [nextHazard, setNextHazard] = useState<any>(null);
  const [nextStop, setNextStop] = useState<any>(null);
  const [userDistKm, setUserDistKm] = useState(0);
  const [hazardsOnRoute, setHazardsOnRoute] = useState<any[]>([]);

  const [showEmergencySetup, setShowEmergencySetup] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [isCrashDetectionActive, setIsCrashDetectionActive] = useState(true);
  const [sosData, setSosData] = useState<any>(null);
  const [isReceivingSOS, setIsReceivingSOS] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const telemetryFailCountRef = useRef(0);
  const [telemetryDegraded, setTelemetryDegraded] = useState(false);

  const handleTriggerSOSRef = useRef<() => void>(() => {});
  
  const selfAddedRef = useRef(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'routes' | 'activity'>('details');
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeSinceUpdate, setTimeSinceUpdate] = useState('just now');
  const [refreshing, setRefreshing] = useState(false);

  const [groupIntelligence, setGroupIntelligence] = useState<any>(null);

  // ─── Edit Ride State ─────────────────────────────────────────────────────
  const [editLog, setEditLog] = useState<any[]>([]);

  const formatInstruction = (text: string) => {
    return text.replace(/Head (north|south|east|west|northeast|northwest|southeast|southwest)/i, 'Head straight');
  };
  const [currentInstruction, setCurrentInstruction] = useState<{text: string, dist: string, type: number} | null>(null);
  const getTurnIcon = (type: number) => {
    switch (type) {
      case 0: return <ArrowLeft className="w-7 h-7 text-primary" />;
      case 1: return <ArrowRight className="w-7 h-7 text-primary" />;
      case 2: return <CornerUpLeft className="w-7 h-7 text-primary" />;
      case 3: return <CornerUpRight className="w-7 h-7 text-primary" />;
      case 4: return <ArrowLeft className="w-7 h-7 text-primary" />;
      case 5: return <ArrowRight className="w-7 h-7 text-primary" />;
      case 6: return <ArrowUp className="w-7 h-7 text-primary" />;
      case 10: return <MapPin className="w-7 h-7 text-primary" />;
      default: return <ArrowUp className="w-7 h-7 text-primary" />;
    }
  };

  const routeFeatureRef = useRef<any>(null);
  const userLocationRef = useRef<{lat: number, lng: number} | null>(null);
  
  useEffect(() => { routeFeatureRef.current = routeFeature; }, [routeFeature]);
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);

  const pinMarkersRef = useRef<Record<string, maplibregl.Marker>>({});
  const rootsRef = useRef<Record<string, any>>({});
  const riderMarkersRef = useRef<Record<string, maplibregl.Marker>>({});
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const { categories: reportTypes } = useIncidentCategories();

  useEffect(() => {
    const prefetch = async () => {
      if (!id) return;
      const { data: rideData, error: rideErr } = await supabase.from('rides').select('*').eq('id', id).single();
      if (rideErr) {
        showToast('Ride not found', 'error');
        return;
      }
      setRide(rideData);

      const { data: stops } = await supabase.from('ride_stops').select('*').eq('ride_id', id);
      if (stops) {
          stops.sort((a: any, b: any) => (a.sequence ?? a.stop_order ?? 0) - (b.sequence ?? b.stop_order ?? 0));
          setRideStops(stops);
      }

      if (rideData.route_geometry) {
        let geom = rideData.route_geometry;
        if (typeof geom === 'string') {
          try { geom = JSON.parse(geom); } catch(e) { console.error('Failed to parse geometry'); }
        }
        setRouteFeature(geom);
        if (geom.properties?.summary) {
          setTotalDuration(geom.properties.summary.travelTimeInSeconds || geom.properties.summary.duration || 0);
          setTotalDistance((geom.properties.summary.lengthInMeters || geom.properties.summary.distance || 0) / 1000);
        }
      } else if (rideData.start_location && rideData.destination) {
          let coords: number[][] = [];
          if (stops && stops.length > 0) {
            coords = stops.map((s: any) => [s.longitude, s.latitude]);
          } else {
            coords = [
              [rideData.start_location.lng, rideData.start_location.lat],
              [rideData.destination.lng, rideData.destination.lat]
            ];
          }

          // Validate all coordinates are valid numbers before calling TomTom
          const hasValidCoords = coords.length >= 2 && coords.every(c => 
            c.length >= 2 && isFinite(c[0]) && isFinite(c[1]) && 
            Math.abs(c[1]) <= 90 && Math.abs(c[0]) <= 180
          );

          if (hasValidCoords) {
            const profile = rideData.vehicle_type === 'bike' ? 'motorcycle' : 'driving-car';
            const { fetchTomTomRoute } = await import('../../lib/routing');
            
            try {
              const feature = await fetchTomTomRoute(coords, profile);
              if (feature) {
                setRouteFeature(feature);
                setTotalDuration(feature.properties.summary.duration);
                setTotalDistance(feature.properties.summary.distance / 1000);
              }
            } catch (e) {
              // Silently handle routing failures (e.g. intercontinental routes)
              console.debug('Route calculation skipped:', (e as Error).message);
            }
          } else {
            console.debug('Skipping route fetch: invalid coordinates in ride data');
          }
      }

      // Hazard pins
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: pins, error: pinsErr } = await supabase.from('pins').select('*').eq('status', 'active').gte('created_at', last24Hours);
      if (pinsErr) console.error('Failed to load hazards', pinsErr);
      else if (pins) setIncidents(pins);

      // Members & Locations
      const { data: members, error: memErr } = await supabase.from('ride_members').select('*').eq('ride_id', id);
      if (memErr) showToast('Failed to load members', 'error');
      
      let userProfiles: any[] = [];
      if (members && members.length > 0) {
        const uids = members.map((m: any) => m.user_id.length === 36 ? m.user_id : getDeterministicUuid(m.user_id));
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', uids);
        if (profiles) userProfiles = profiles;
      }

      const init: any = {};
      if (members) {
        members.forEach((m: any) => { 
          const searchId = m.user_id.length === 36 ? m.user_id : getDeterministicUuid(m.user_id);
          const profile = userProfiles.find((p: any) => p.id === searchId);
          init[m.user_id] = { 
            user_id: m.user_id, 
            display_name: profile?.full_name || m.display_name, 
            avatar_url: profile?.avatar_url || m.avatar_url, 
            role: m.role 
          }; 
        });
      }

      const { data: locs } = await supabase.from('ride_locations').select('*').eq('ride_id', id);
      if (locs) {
        locs.forEach((l: any) => { 
          if (init[l.user_id]) {
            init[l.user_id] = { ...init[l.user_id], ...l };
          } else {
            init[l.user_id] = l;
          }
        });
      }
      setRiders(prev => ({ ...prev, ...init }));
      if (auth.currentUser) {
        const myUid = auth.currentUser.uid;
        const myProfile = userProfiles.find((p: any) => p.id === myUid || p.id === getDeterministicUuid(myUid));
        if (myProfile) {
          setCurrentUserProfile(myProfile);
          if (!myProfile.bike_details || !myProfile.emergency_contact) setShowEmergencySetup(true);
        } else {
          const searchId = myUid.length === 36 ? myUid : getDeterministicUuid(myUid);
          const { data: myP } = await supabase.from('profiles').select('*').eq('id', searchId).single();
          if (myP) {
            setCurrentUserProfile(myP);
            if (!myP.bike_details || !myP.emergency_contact) setShowEmergencySetup(true);
          }
        }
      }
      setIsDataLoaded(true);
    };
    prefetch();
  }, [id]);

  // ─── Step 2: Init map once we have prefetched data ──
  useEffect(() => {
    if (!mapContainer.current || map.current || !isDataLoaded) return;

    let bearing = 0;
    let fallbackStart: [number, number] = [78.4867, 17.3850];

    if (routeFeature) {
      const coords = routeFeature.geometry.coordinates;
      const startCoord = coords[0] as [number, number];
      fallbackStart = startCoord;
      
      // Calculate initial bearing
      const nextCoord = coords[Math.min(5, coords.length - 1)];
      const dy = nextCoord[1] - startCoord[1];
      const dx = nextCoord[0] - startCoord[0];
      bearing = (Math.atan2(dx, dy) * 180) / Math.PI;
    }

    // Determine immediate fallback center so map loads INSTANTLY
    const liveCenter: [number, number] = routeFeatureRef.current ? 
      [routeFeatureRef.current.geometry.coordinates[0][0], routeFeatureRef.current.geometry.coordinates[0][1]] : 
      [78.4867, 17.3850];

    // Initialize map immediately
    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle === 'dark' ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: liveCenter,
      zoom: 20, maxZoom: 22,
      pitch: 60,
      bearing,
    });
    map.current = m;

    // Ride navigation must stay locked onto the rider automatically —
    // riders shouldn't be able to accidentally (or deliberately) drag the
    // map away from the route while riding. Panning is disabled outright
    // rather than just re-centering after the fact.
    m.dragPan.disable();

    // Asynchronously try to get GPS and fly to it later
    if (globalLocation && map.current) {
      map.current.flyTo({ center: [globalLocation.lng, globalLocation.lat], zoom: 20, duration: 1000 });
    }

    m.on('load', () => {
        if (!map.current) return;

        // ── Glow + Route layers (if available) ──────────
        if (routeFeature) {
          map.current.addSource('route', { type: 'geojson', data: routeFeature });
          
          // Completed portion
          map.current.addLayer({
            id: 'route-glow-completed', type: 'line', source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#ef4523', 'line-width': 18, 'line-opacity': 0.1, 'line-blur': 10 },
          });
          map.current.addLayer({
            id: 'route-line-completed', type: 'line', source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#ef4523', 'line-width': 12, 'line-opacity': 0.2 },
          });

          // Remaining portion source
          map.current.addSource('route-remaining', { type: 'geojson', data: routeFeature });
          
          map.current.addLayer({
            id: 'route-glow', type: 'line', source: 'route-remaining',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#ef4523', 'line-width': 18, 'line-opacity': 0.3, 'line-blur': 10 },
          });
          map.current.addLayer({
            id: 'route-line', type: 'line', source: 'route-remaining',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#ef4523', 'line-width': 12, 'line-opacity': 1 },
          });
        }

        // Panning itself is disabled (dragPan.disable() above), and the
        // camera is meant to stay auto-following at all times — so this no
        // longer drops out of follow mode on drag/touch. (Tapping a
        // specific rider marker still switches the view via
        // `focusedRiderId`, which is a deliberate, separate action.)

        if (routeFeature && (ride?.status === 'ended' || ride?.status === 'arrived')) {
          setIsFollowingUser(false);
          setIs3D(false);
          const bbox = turf.bbox(routeFeature);
          m.fitBounds(bbox as [number, number, number, number], { padding: 50, duration: 1000, pitch: 0 });
        }

        setMapLoaded(true);
      });

    return () => { map.current?.remove(); map.current = null; };
  }, [isDataLoaded]);

  // ─── Step 3: Add hazard pins + rider markers once map is ready ───────────
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    
    const stopMarkers: maplibregl.Marker[] = [];

    // Hazard pins
    incidents.forEach((pin: any) => {
      if (!pin.latitude || !pin.longitude || pinMarkersRef.current[pin.id]) return;
      const typeObj = reportTypes.find((t: any) => t.id === pin.category) || reportTypes.find((t: any) => t.id === 'Other')!;
      const el   = document.createElement('div');
      const root = createRoot(el);
      rootsRef.current[pin.id] = root;
      el.style.cursor = 'pointer';
      el.addEventListener('click', e => { e.stopPropagation(); setSelectedIncident(pin); });
      const IconComp = typeObj ? incidentIconMap[typeObj.iconName] : AlertTriangle;
      
      root.render(
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${typeObj?.bg || 'bg-gray-100'}`}>
          <IconComp className={`w-6 h-6 ${typeObj?.color || 'text-gray-600'}`} />
        </div>
      );
      pinMarkersRef.current[pin.id] = new maplibregl.Marker({ element: el })
        .setLngLat([pin.longitude, pin.latitude]).addTo(map.current!);
    });

    // Rider markers from initial fetch
    Object.values(riders).forEach((r: any) => {
      placeRiderMarker(r.user_id, r.longitude, r.latitude);
    });

    // Draw ride stops markers
    rideStops.forEach((stop, idx) => {
      if (idx === 0) return; // Skip START marker because the navigation arrow serves as the start
      const el = document.createElement('div');
      const root = createRoot(el);
      rootsRef.current[`stop_${idx}`] = root;

      const getStopIcon = (type?: string) => {
        switch(type) {
          case 'Rest Stop': return <Coffee className="w-4 h-4 text-white" />;
          case 'Gas Station': return <Fuel className="w-4 h-4 text-white" />;
          case 'Restaurant': return <Utensils className="w-4 h-4 text-white" />;
          case 'Food': return <Utensils className="w-4 h-4 text-white" />;
          case 'Hotel': return <BedDouble className="w-4 h-4 text-white" />;
          case 'Restroom': return <Droplets className="w-4 h-4 text-white" />;
          case 'Sightseeing': return <Camera className="w-4 h-4 text-white" />;
          case 'Pickup': return <Users className="w-4 h-4 text-white" />;
          default: return <MapPin className="w-4 h-4 text-white" />;
        }
      };

      const isEnd = idx === rideStops.length - 1;
      const bg = isEnd ? '#ef4444' : '#ef4523';

      root.render(
        <div className="flex items-center justify-center rounded-full border-[3px] border-white shadow-[0_2px_8px_rgba(0,0,0,0.3)] text-white font-semibold" style={{ backgroundColor: bg, width: '32px', height: '32px' }}>
          {isEnd ? <span className="text-[12px]">E</span> : getStopIcon(stop.stop_type)}
        </div>
      );

      const m = new maplibregl.Marker({ element: el })
        .setLngLat([stop.longitude, stop.latitude])
        .addTo(map.current!);
      stopMarkers.push(m);
    });

    return () => {
      stopMarkers.forEach(m => m.remove());
      Object.values(pinMarkersRef.current).forEach((m: any) => m.remove());
      pinMarkersRef.current = {};
    };
  }, [mapLoaded, incidents, rideStops]);

  // ─── Handle ride updated (refresh stops, route, map) ─────────────────────
  const handleRideUpdated = async () => {
    if (!id) return;
    // Re-fetch ride data
    const { data: rideData } = await supabase.from('rides').select('*').eq('id', id).single();
    if (rideData) setRide(rideData);

    // Re-fetch stops
    const { data: stopsData } = await supabase.from('ride_stops').select('*').eq('ride_id', id);
    if (stopsData) {
      stopsData.sort((a: any, b: any) => (a.sequence ?? a.stop_order ?? 0) - (b.sequence ?? b.stop_order ?? 0));
      setRideStops(stopsData);
    }

    // Re-fetch route geometry
    if (rideData?.route_geometry) {
      let geom = rideData.route_geometry;
      if (typeof geom === 'string') {
        try { geom = JSON.parse(geom); } catch(e) { console.error('Failed to parse geometry'); }
      }
      setRouteFeature(geom);
      if (geom.properties?.summary) {
        setTotalDuration(geom.properties.summary.travelTimeInSeconds || geom.properties.summary.duration || 0);
        setTotalDistance((geom.properties.summary.lengthInMeters || geom.properties.summary.distance || 0) / 1000);
      }
      // Update map route source
      if (map.current) {
        const routeSource = map.current.getSource('route') as maplibregl.GeoJSONSource;
        if (routeSource) routeSource.setData(geom);
        const remainingSource = map.current.getSource('route-remaining') as maplibregl.GeoJSONSource;
        if (remainingSource) remainingSource.setData(geom);
      }
    } else if (rideData?.start_location && rideData?.destination) {
      // Recalculate route from updated stops/locations
      let coords: number[][] = [];
      if (stopsData && stopsData.length > 0) {
        coords = stopsData.map((s: any) => [s.longitude, s.latitude]);
      } else {
        coords = [
          [rideData.start_location.lng, rideData.start_location.lat],
          [rideData.destination.lng, rideData.destination.lat]
        ];
      }
      const { fetchTomTomRoute } = await import('../../lib/routing');
      try {
        const feature = await fetchTomTomRoute(coords, 'driving-car');
        if (feature) {
          setRouteFeature(feature);
          setTotalDuration(feature.properties.summary.duration);
          setTotalDistance(feature.properties.summary.distance / 1000);
          if (map.current) {
            const routeSource = map.current.getSource('route') as maplibregl.GeoJSONSource;
            if (routeSource) routeSource.setData(feature);
            const remainingSource = map.current.getSource('route-remaining') as maplibregl.GeoJSONSource;
            if (remainingSource) remainingSource.setData(feature);
          }
        }
      } catch (e) {
        console.error('Route recalc failed:', e);
      }
    }

    // Re-fetch edit log
    const { data: logData } = await supabase.from('ride_edit_log').select('*').eq('ride_id', id).order('created_at', { ascending: false }).limit(20);
    if (logData) setEditLog(logData);

    setLastUpdated(new Date());
  };

  // ─── Fetch edit log on load ─────────────────────────────────────────────
  useEffect(() => {
    if (!id || !isDataLoaded) return;
    supabase.from('ride_edit_log').select('*').eq('ride_id', id).order('created_at', { ascending: false }).limit(20).then(({ data }) => {
      if (data) setEditLog(data);
    });
  }, [id, isDataLoaded]);

  // ─── Realtime subscriptions ───────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const locSub = supabase.channel(`liveride-loc-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_locations', filter: `ride_id=eq.${id}` },
        p => { const l = p.new as any; setRiders(prev => ({ ...prev, [l.user_id]: { ...prev[l.user_id], ...l } })); placeRiderMarker(l.user_id, l.longitude, l.latitude); })
      .subscribe();
    const evtSub = supabase.channel(`liveride-evt-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ride_events', filter: `ride_id=eq.${id}` },
        p => {
          const evt = p.new as any;
          if (evt.event_type === 'SOS' && evt.user_id !== auth.currentUser?.uid) {
            const payload = evt.payload || {};
            setSosData({
              coordinates: payload.coordinates || '--, --',
              riderName: payload.riderName || 'Unknown Rider',
              bikeDetails: payload.bikeDetails || 'Not provided',
              bloodGroup: payload.bloodGroup || 'Unknown',
              emergencyContact: payload.emergencyContact || 'Not provided'
            });
            setIsReceivingSOS(true);
            setShowSOSModal(true);
          }
          // Handle ride updated notifications from other admins
          if (evt.event_type === 'RIDE_UPDATED' && evt.user_id !== auth.currentUser?.uid) {
            const payload = evt.payload || {};
            showToast(`🔄 Route updated by ${payload.editor_name || 'admin'}`, 'success');
            handleRideUpdated();
          }
        })
      .subscribe();
    const memSub = supabase.channel(`liveride-mem-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_members', filter: `ride_id=eq.${id}` },
        p => { 
          if (p.eventType === 'INSERT' || p.eventType === 'UPDATE') {
            const m = p.new as any;
            if (m.user_id !== auth.currentUser?.uid) {
              const searchId = m.user_id.length === 36 ? m.user_id : getDeterministicUuid(m.user_id);
              supabase.from('profiles').select('full_name, avatar_url').eq('id', searchId).single().then(({ data }) => {
                setRiders(prev => ({ ...prev, [m.user_id]: { ...prev[m.user_id], display_name: data?.full_name || m.display_name, avatar_url: data?.avatar_url || m.avatar_url, role: m.role, user_id: m.user_id } }));
              });
            }
          } else if (p.eventType === 'DELETE') {
            const m = p.old as any;
            setRiders(prev => { const copy = {...prev}; delete copy[m.user_id]; return copy; });
            if (riderMarkersRef.current[m.user_id]) {
              riderMarkersRef.current[m.user_id].remove();
              delete riderMarkersRef.current[m.user_id];
            }
          }
        })
      .subscribe();
    // Subscribe to ride table changes (for version updates from other tabs/devices)
    const rideSub = supabase.channel(`liveride-ride-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${id}` },
        p => {
          const updated = p.new as any;
          // Only refresh if version changed and it wasn't us who triggered it
          if (updated.version && updated.version !== ride?.version) {
            handleRideUpdated();
          }
        })
      .subscribe();
    return () => { locSub.unsubscribe(); evtSub.unsubscribe(); memSub.unsubscribe(); rideSub.unsubscribe(); };
  }, [id]);

  // —— Realtime platform (WebSocket): fast path for locations + critical events ——
  useEffect(() => {
    if (!id) return;
    const rt = getRealtime();
    rt.connect();
    rt.joinRide(id);

    // Fast path: WS location fanout. The Supabase postgres_changes channel
    // above remains as the durable slow path - merging twice is idempotent
    // because both carry the same latest position.
    const offLoc = rt.on(EV_LOC, (env) => {
      const p = env.p as { ride: string; u: LocationTuple[] };
      if (!p || p.ride !== id) return;
      p.u.forEach((row) => {
        const [memberId, lat, lng, speed, _heading, tsMs] = row;
        if (memberId === 'self') return; // own marker handled by GPS watch
        setRiders(prev => {
          // Accept only if newer than what we already have (dedup vs slow path)
          const existing = prev[memberId];
          const existingTs = existing?.updated_at ? new Date(existing.updated_at).getTime() : 0;
          if (tsMs && tsMs <= existingTs) return prev;
          return {
            ...prev,
            [memberId]: {
              ...existing,
              user_id: memberId,
              latitude: lat,
              longitude: lng,
              speed: speed,
              updated_at: new Date(tsMs).toISOString()
            }
          };
        });
        placeRiderMarker(memberId, lng, lat);
      });
    });

    // Fast path: critical ride events (SOS, ride updates). The Supabase
    // ride_events channel stays as the durable fallback.
    const offEvt = rt.on(EV_RIDE_EVENT, (env) => {
      const p = env.p as { ride: string; eventType: string; by: string; data: any };
      if (!p || p.ride !== id) return;
      if (p.eventType === 'SOS' && p.by !== auth.currentUser?.uid) {
        const payload = p.data || {};
        setSosData({
          coordinates: payload.coordinates || '--, --',
          riderName: payload.riderName || 'Unknown Rider',
          bikeDetails: payload.bikeDetails || 'Not provided',
          bloodGroup: payload.bloodGroup || 'Unknown',
          emergencyContact: payload.emergencyContact || 'Not provided'
        });
        setIsReceivingSOS(true);
        setShowSOSModal(true);
      }
      if (p.eventType === 'RIDE_UPDATED' && p.by !== auth.currentUser?.uid) {
        showToast(`Route updated by ${p.data?.editor_name || 'admin'}`, 'success');
        handleRideUpdated();
      }
    });

    // Fresh snapshot whenever the socket reconnects (covers missed events)
    const offSnap = rt.on(EV_RIDE_SNAPSHOT, (env) => {
      const p = env.p as { ride: string; u: LocationTuple[] };
      if (!p || p.ride !== id) return;
      p.u.forEach((row) => {
        const [memberId, lat, lng, speed] = row;
        if (memberId === 'self') return;
        setRiders(prev => ({
          ...prev,
          [memberId]: { ...prev[memberId], user_id: memberId, latitude: lat, longitude: lng, speed }
        }));
        placeRiderMarker(memberId, lng, lat);
      });
    });

    return () => {
      offLoc(); offEvt(); offSnap();
      rt.leaveRide(id);
    };
  }, [id]);

  // ─── GPS watch → camera follow + position broadcast ──────────────────────
  useEffect(() => {
    if (!mapLoaded) return;
    const wid = navigator.geolocation.watchPosition(
      async pos => {
        const { latitude: lat, longitude: lng, heading, speed } = pos.coords;
        const speedKph = speed != null ? Math.round(speed * 3.6) : 0;
        setUserLocation({ lat, lng });
        setCurrentSpeedKph(speedKph);
        setMaxSpeed(prev => Math.max(prev, speedKph));
        if (speedKph > 0) {
          speedDataRef.current.sum += speedKph;
          speedDataRef.current.count += 1;
          setAvgSpeed(Math.round(speedDataRef.current.sum / speedDataRef.current.count));
        }

        // Place / update own marker
        if (map.current) {
          placeRiderMarker(auth.currentUser?.uid || 'me', lng, lat);
          if (heading !== null && !isNaN(heading)) {
             riderMarkersRef.current[auth.currentUser?.uid || 'me']?.setRotation(heading);
          }
        }

        // Add self to riders panel on first fix
        const user = auth.currentUser;
        if (user && !selfAddedRef.current) {
          selfAddedRef.current = true;
          setRiders(prev => ({
            ...prev,
            [user.uid]: { 
              ...prev[user.uid], 
              user_id: user.uid, 
              display_name: prev[user.uid]?.display_name || user.displayName || user.email?.split('@')[0] || 'Rider',
              avatar_url: prev[user.uid]?.avatar_url || user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email?.split('@')[0] || 'Rider'}`,
              latitude: lat, 
              longitude: lng, 
              speed: speed ?? 0 
            }
          }));
        } else if (user) {
          setRiders(prev => ({
            ...prev,
            [user.uid]: { 
              ...prev[user.uid], 
              user_id: user.uid,
              display_name: prev[user.uid]?.display_name || user.displayName || user.email?.split('@')[0] || 'Rider',
              avatar_url: prev[user.uid]?.avatar_url || user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email?.split('@')[0] || 'Rider'}`,
              latitude: lat, 
              longitude: lng, 
              speed: speed ?? 0 
            }
          }));
        }

        
        if (map.current && is3D && isFollowingUser && !focusedRiderId) {
          let routeBearing = heading;
          
          if (routeFeature) {
             try {
                // Find the closest point on the route to the user
                const userPt = turf.point([lng, lat]);
                const line = turf.lineString(routeFeature.geometry.coordinates);
                const closestPoint = turf.nearestPointOnLine(line, userPt);
                
                // Get a point slightly ahead on the line to calculate bearing
                const routeLength = turf.length(line);
                const distanceAlong = closestPoint.properties.location;
                // Look 50 meters ahead for bearing
                const aheadDist = Math.min(distanceAlong + 0.05, routeLength);
                const aheadPoint = turf.along(line, aheadDist);
                
                routeBearing = turf.bearing(closestPoint, aheadPoint);

                if (routeFeature.properties?.segments?.[0]?.steps) {
                  const segments = routeFeature.properties.segments;
                  let currentCoordIndex = closestPoint.properties?.index || 0;
                  let foundStep: any = null;
                  for (let s=0; s<segments.length; s++) {
                    const segment = segments[s];
                    for (let i=0; i<segment.steps.length; i++) {
                      const step = segment.steps[i];
                      const [start, end] = step.way_points;
                      if (currentCoordIndex >= start && currentCoordIndex <= end) {
                        foundStep = step;
                        const stepEndPt = turf.point(routeFeature.geometry.coordinates[end]);
                        let distToStepEnd = turf.distance(closestPoint, stepEndPt) * 1000;
                        let nextStep = i + 1 < segment.steps.length ? segment.steps[i + 1] : null;
                        if (distToStepEnd < 25 && nextStep) {
                           foundStep = nextStep;
                           const nextStepEndPt = turf.point(routeFeature.geometry.coordinates[foundStep.way_points[1]]);
                           distToStepEnd = turf.distance(stepEndPt, nextStepEndPt) * 1000;
                           nextStep = i + 2 < segment.steps.length ? segment.steps[i + 2] : null;
                        }
                        foundStep = { ...foundStep, remainingDist: distToStepEnd, nextStep };
                        break;
                      }
                    }
                    if (foundStep) break;
                  }
                  if (foundStep) {
                    let displayText = formatInstruction(foundStep.instruction);
                    let displayType = foundStep.type;
                    if (foundStep.nextStep && (displayType === 6 || displayType === 11 || displayText.toLowerCase().includes('head '))) {
                      displayText = formatInstruction(foundStep.nextStep.instruction);
                      displayType = foundStep.nextStep.type;
                    }
                    setCurrentInstruction({
                      text: displayText,
                      dist: foundStep.remainingDist < 1000 ? `${Math.round(foundStep.remainingDist)} m` : `${(foundStep.remainingDist/1000).toFixed(1)} km`,
                      type: displayType
                    });
                  }
                }
             } catch (e) {
                console.error('Error calculating route bearing:', e);
             }
          }
          
          map.current.easeTo({ center: [lng, lat], bearing: routeBearing ?? map.current.getBearing(), pitch: 60, zoom: 20, duration: 900 });
        }


        if (user && id) {
          // Realtime platform: adaptive batching over the shared WebSocket
          // (auto REST fallback when the socket is down - same telemetry
          // contract, user_id derived server-side from the JWT).
          const rt = getRealtime();
          rt.sendLocation(id, { lat, lng, speed: speedKph, heading: heading ?? 0 });
          const wsUp = rt.connected;
          setTelemetryDegraded(!wsUp);
          if (wsUp) telemetryFailCountRef.current = 0;
        }
      },
      err => {
         console.debug('GPS unavailable:', err.message || err);
         if (routeFeatureRef.current && !userLocationRef.current) {
            const startCoord = routeFeatureRef.current.geometry.coordinates[0];
            const lat = startCoord[1];
            const lng = startCoord[0];
            setUserLocation({ lat, lng });
             if (map.current) {
               placeRiderMarker(auth.currentUser?.uid || 'me', lng, lat);
               setIsFollowingUser(false);
               setIs3D(false);
               const bbox = turf.bbox(routeFeatureRef.current);
               map.current.fitBounds(bbox as [number, number, number, number], { padding: 50, duration: 1000, pitch: 0 });
             }
             // Add self to riders even if GPS fails so we don't show 0
            const user = auth.currentUser;
            if (user && !selfAddedRef.current) {
              selfAddedRef.current = true;
              setRiders(prev => ({
                ...prev,
                [user.uid]: {
                  user_id: user.uid,
                  display_name: user.displayName || user.email?.split('@')[0] || 'Rider',
                  avatar_url: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email?.split('@')[0] || 'Rider'}`,
                  latitude: lat,
                  longitude: lng,
                  speed: 0
                }
              }));
            }
         }
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, [mapLoaded, is3D, id, isFollowingUser, routeFeature]);

  // ─── Hazard & Stop proximity (Turf) ────────────────────
  useEffect(() => {
    if (!userLocation || !routeFeature?.geometry?.coordinates?.length) return;
    try {
      const line   = turf.lineString(routeFeature.geometry.coordinates);
      const origin = turf.point(routeFeature.geometry.coordinates[0]);
      const userPt = turf.point([userLocation.lng, userLocation.lat]);
      const snap   = turf.nearestPointOnLine(line, userPt);
      const myDist = turf.length(turf.lineSlice(origin, snap, line));
      setUserDistKm(myDist);

      // Slice route for dynamic progress
      const routeEnd = turf.point(routeFeature.geometry.coordinates[routeFeature.geometry.coordinates.length - 1]);
      try {
        const remainingSliced = turf.lineSlice(snap, routeEnd, line);
        const remainingSource = map.current?.getSource('route-remaining') as maplibregl.GeoJSONSource;
        if (remainingSource) {
          remainingSource.setData(remainingSliced);
        }
      } catch (e) {
        console.error("Route slicing error:", e);
      }

      let nearestHaz: any = null; let minRemHaz = Infinity;
      const hazOnRoute: any[] = [];
      incidents.forEach((pin: any) => {
        if (!pin.latitude || !pin.longitude) return;
        const pt   = turf.point([pin.longitude, pin.latitude]);
        const snPt = turf.nearestPointOnLine(line, pt);
        if ((snPt.properties.dist || 0) > 0.1) return;
        const distAlongRoute = turf.length(turf.lineSlice(origin, snPt, line));
        const rem = distAlongRoute - myDist;
        if (rem >= -0.05) { 
          hazOnRoute.push(pin);
          if (rem < minRemHaz) {
            minRemHaz = rem; nearestHaz = { ...pin, remainingDist: Math.max(0, rem) }; 
          }
        }
      });
      setHazardsOnRoute(hazOnRoute);
      setNextHazard(nearestHaz);

      let nxtStop: any = null; let minRemStop = Infinity;
      if (rideStops && rideStops.length > 0) {
        rideStops.forEach((stop, idx) => {
          if (idx === 0) return; // skip start
          if (!stop.latitude || !stop.longitude) return;
          const pt = turf.point([stop.longitude, stop.latitude]);
          const snPt = turf.nearestPointOnLine(line, pt);
          const distAlongRoute = turf.length(turf.lineSlice(origin, snPt, line));
          const rem = distAlongRoute - myDist;
          if (rem >= -0.05 && rem < minRemStop) {
             minRemStop = rem;
             nxtStop = { ...stop, remainingDist: Math.max(0, rem) };
          }
        });
      }
      setNextStop(nxtStop);
      
    } catch (e) { console.error('Turf:', e); }
  }, [userLocation, routeFeature, incidents, rideStops]);

  // Traffic Layer logic
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const updateTraffic = () => {
      if (!map.current || !map.current.isStyleLoaded()) return;
      try {
        if (showTraffic) {
          if (!map.current.getSource('tomtom-traffic')) {
            map.current.addSource('tomtom-traffic', {
              type: 'raster',
              tiles: [`https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=GkjXLzDVKuB5KI8iXmBBYKVtYTDu6LhJ`],
              tileSize: 256
            });
          }
          if (!map.current.getLayer('tomtom-traffic-layer')) {
            const glowLayerId = map.current.getLayer('route-glow') ? 'route-glow' : undefined;
            map.current.addLayer({
              id: 'tomtom-traffic-layer',
              type: 'raster',
              source: 'tomtom-traffic',
              paint: { 'raster-opacity': 0.8 }
            }, glowLayerId);
          }
        } else {
          if (map.current.getLayer('tomtom-traffic-layer')) map.current.removeLayer('tomtom-traffic-layer');
        }
      } catch (e) { console.warn('Traffic error:', e); }
    };
    updateTraffic();
    map.current.on('styledata', updateTraffic);
    return () => { map.current?.off('styledata', updateTraffic); }
  }, [mapLoaded, showTraffic]);

  // Satellite Layer logic
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const updateStyle = () => {
      if (!map.current || !map.current.isStyleLoaded()) return;
      try {
        if (mapStyle === 'satellite') {
          if (!map.current.getSource('google-satellite')) {
            map.current.addSource('google-satellite', {
              type: 'raster',
              tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
              tileSize: 256
            });
          }
          if (!map.current.getLayer('google-satellite-layer')) {
            const glowLayerId = map.current.getLayer('route-glow') ? 'route-glow' : undefined;
            map.current.addLayer({
              id: 'google-satellite-layer',
              type: 'raster',
              source: 'google-satellite',
              paint: { 'raster-opacity': 1 }
            }, glowLayerId);
          }
        } else {
          if (map.current.getLayer('google-satellite-layer')) map.current.removeLayer('google-satellite-layer');
        }
      } catch (e) { console.warn('Satellite error:', e); }
    };
    updateStyle();
    map.current.on('styledata', updateStyle);
    return () => { map.current?.off('styledata', updateStyle); }
  }, [mapLoaded, mapStyle]);

  useEffect(() => {
    ridersRef.current = riders;
    Object.entries(riderMarkersRef.current).forEach(([uid, mk]) => {
      const r = riders[uid];
      if (!r) return;
      const el = mk.getElement();
      const label = el.querySelector('[data-name]');
      if (label) label.textContent = String(r.display_name || 'Rider').split(' ')[0];
      const av = el.querySelector('[data-avatar]') as HTMLElement | null;
      if (av && r.avatar_url && av.getAttribute('data-src') !== r.avatar_url) setMarkerAvatar(av, r.avatar_url, String(r.display_name || 'Rider'));
    });
  }, [riders]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const setMarkerAvatar = (av: HTMLElement, url: string | null | undefined, name: string) => {
    const initial = () => { av.replaceChildren(); av.textContent = name.trim()[0]?.toUpperCase() || 'R'; };
    if (!url) { initial(); return; }
    av.setAttribute('data-src', url);
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.referrerPolicy = 'no-referrer'; // Google profile photos refuse hot-linked requests that send a referrer
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = initial;
    av.replaceChildren(img);
  };
  const placeRiderMarker = (userId: string, lng: number, lat: number) => {
    if (!map.current) return;
    if (isNaN(lng) || isNaN(lat) || lng == null || lat == null) return;
    if (riderMarkersRef.current[userId]) { riderMarkersRef.current[userId].setLngLat([lng, lat]); return; }
    const myUid = getAppUser(auth.currentUser)?.uid;
    const isMe = userId === 'me' || (!!myUid && (userId === myUid || userId === getDeterministicUuid(myUid)));
    const el = document.createElement('div');
    el.style.cssText = isMe
      ? 'width:96px;height:96px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 6px 12px rgba(0,0,0,0.5));'
      : 'width:34px;height:34px;background:#273a5a;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px rgba(59,130,246,0.7);border:3px solid white;';
    if (!isMe) {
      const r = ridersRef.current[userId] || {};
      const name = String(r.display_name || 'Rider').split(' ')[0];
      el.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;';
      const av = document.createElement('div');
      av.style.cssText = 'width:40px;height:40px;border-radius:50%;border:3px solid #FF5A00;background:#fff;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;overflow:hidden;font:800 15px system-ui;color:#FF5A00;';
      av.setAttribute('data-avatar', '');
      setMarkerAvatar(av, r.avatar_url, name);
      const label = document.createElement('div');
      label.setAttribute('data-name', '');
      label.textContent = name;
      label.style.cssText = 'padding:2px 8px;border-radius:999px;background:#111827;color:#fff;font:700 12px system-ui;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25);';
      el.append(av, label);
      el.addEventListener('click', (ev) => { ev.stopPropagation(); setTappedRiderId(userId); });
      riderMarkersRef.current[userId] = new maplibregl.Marker({ element: el, anchor: 'top' }).setLngLat([lng, lat]).addTo(map.current);
      return;
    }
    el.innerHTML = isMe
      ? `<svg width="120" height="120" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M20 4L8 32L20 25L32 32L20 4Z" fill="#273a5a" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>`;
    riderMarkersRef.current[userId] = new maplibregl.Marker({ element: el, rotationAlignment: isMe ? 'map' : 'auto', pitchAlignment: isMe ? 'map' : 'auto' })
      .setLngLat([lng, lat]).addTo(map.current);
  };

  const fetchLiveUpdates = async () => {
    if (!id || refreshing || !isDataLoaded) return;
    setRefreshing(true);
    try {
      const { data: locs } = await supabase.from('ride_locations').select('*').eq('ride_id', id);
      const { data: members } = await supabase.from('ride_members').select('*').eq('ride_id', id);
      
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: latestPins } = await supabase.from('pins').select('*').eq('status', 'active').gte('created_at', last24Hours);
      if (latestPins) setIncidents(latestPins);
      
      let userProfiles: any[] = [];
      if (members && members.length > 0) {
        const uids = members.map((m: any) => m.user_id.length === 36 ? m.user_id : getDeterministicUuid(m.user_id));
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', uids);
        if (profiles) userProfiles = profiles;
      }

      setRiders((prev: any) => {
        const init = { ...prev };
        if (members) {
          members.forEach((m: any) => { 
            const searchId = m.user_id.length === 36 ? m.user_id : getDeterministicUuid(m.user_id);
            const profile = userProfiles.find((p: any) => p.id === searchId);
            if (!init[m.user_id]) {
               init[m.user_id] = { user_id: m.user_id, display_name: profile?.full_name || m.display_name, avatar_url: profile?.avatar_url || m.avatar_url, role: m.role };
            } else {
               init[m.user_id].display_name = profile?.full_name || m.display_name;
               init[m.user_id].avatar_url = profile?.avatar_url || m.avatar_url;
               init[m.user_id].role = m.role;
            }
          });
        }
        if (locs) {
          locs.forEach((l: any) => { 
            if (init[l.user_id]) {
              init[l.user_id] = { ...init[l.user_id], ...l };
            } else {
              init[l.user_id] = l;
            }
          });
        }
        return init;
      });

      if (locs) {
        locs.forEach((l: any) => placeRiderMarker(l.user_id, l.longitude, l.latitude));
      }
      setLastUpdated(new Date());

      // Fetch Group Intelligence ML Inference
      if (id) {
        try {
          const res = await apiClient.get(`/api/v1/analytics/ride/${encodeURIComponent(id)}/group-intelligence`);
          setGroupIntelligence(res.data);
        } catch {
          // Silently skip — backend may not be running
        }
      }

    } catch (err) {
      console.error('Fetch live updates error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const diffSecs = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      if (diffSecs < 10) setTimeSinceUpdate('just now');
      else if (diffSecs < 60) setTimeSinceUpdate(`${diffSecs}s ago`);
      else setTimeSinceUpdate(`${Math.floor(diffSecs/60)}m ago`);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  useEffect(() => {
    if (!isDataLoaded) return;
    const interval = setInterval(() => {
      fetchLiveUpdates();
    }, 10000);
    return () => clearInterval(interval);
  }, [isDataLoaded, id]);

  const handleSOS = () => {
    if (userLocation && currentUserProfile) {
      setSosData({
        coordinates: `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`,
        riderName: currentUserProfile.full_name || auth.currentUser?.displayName || 'Unknown Rider',
        bikeDetails: currentUserProfile.bike_details || 'Not provided',
        bloodGroup: currentUserProfile.blood_group || 'Not provided',
        emergencyContact: currentUserProfile.emergency_contact || 'Not provided'
      });
      setIsReceivingSOS(false);
      setShowSOSModal(true);
    } else {
      showToast('Wait for GPS fix and profile load to send SOS', 'error');
    }
  };

  const PENDING_SOS_KEY = 'pending_sos';

  const dispatchSOSToBackend = async (lat: number, lng: number) => {
    // Parse emergency contact phone/name from the free-text profile field, e.g. "9876543210 (Father)"
    let emergencyContactPhone: string | undefined;
    let emergencyContactName: string | undefined;
    const rawContact: string = currentUserProfile?.emergency_contact || '';
    const phoneMatch = rawContact.match(/\+?\d[\d\-\s]+/);
    if (phoneMatch) emergencyContactPhone = phoneMatch[0].replace(/[\s-]/g, '');
    const relationMatch = rawContact.match(/\(([^)]+)\)/);
    if (relationMatch) emergencyContactName = relationMatch[1];

    try {
      const res = await apiClient.post('/api/v1/sos/dispatch', {
        ride_id: id,
        lat,
        lng,
        emergency_contact_phone: emergencyContactPhone,
        emergency_contact_name: emergencyContactName
      });
      if (res.data?.sms_sent) {
        showToast('🚨 SOS sent — emergency contact notified via SMS.', 'success');
      } else {
        showToast(`In-app SOS alert sent to your group. SMS to emergency contact was NOT confirmed${res.data?.reason ? `: ${res.data.reason}` : '.'}`, 'error');
      }
    } catch (err) {
      console.error('SOS dispatch to backend failed:', err);
      showToast('In-app SOS alert sent to your group, but SMS to your emergency contact could not be confirmed.', 'error');
    }
  };

  const savePendingSOS = (lat: number, lng: number) => {
    try {
      localStorage.setItem(PENDING_SOS_KEY, JSON.stringify({ ride_id: id, lat, lng, timestamp: new Date().toISOString() }));
    } catch (e) {
      console.error('Failed to persist pending SOS:', e);
    }
  };

  const handleTriggerSOS = async () => {
    const user = auth.currentUser;
    if (!user || !id) return;

    const lat = userLocation?.lat ?? 0;
    const lng = userLocation?.lng ?? 0;

    if (!navigator.onLine) {
      savePendingSOS(lat, lng);
      showToast('You are offline. SOS will be sent automatically when your connection returns.', 'error');
      throw new Error('Offline — SOS queued for retry.');
    }

    try {
      await supabase.from('ride_events').insert({
        ride_id: id,
        user_id: user.uid,
        event_type: 'SOS',
        description: 'Emergency SOS!',
        payload: sosData
      });
      showToast('🚨 SOS Sent to all riders!', 'success');
    } catch (err) {
      console.error('SOS insert failed:', err);
      savePendingSOS(lat, lng);
      showToast('Could not reach the server. SOS will retry automatically when back online.', 'error');
      throw err;
    }

    // Best-effort dispatch to real emergency contact via backend SMS gateway.
    // This is independent of the in-app alert above — report failures honestly.
    await dispatchSOSToBackend(lat, lng);
  };

  // Retry any pending SOS once connectivity returns
  useEffect(() => {
    const retryPendingSOS = async () => {
      const raw = localStorage.getItem(PENDING_SOS_KEY);
      if (!raw) return;
      try {
        const pending = JSON.parse(raw);
        const user = auth.currentUser;
        if (!user || !pending?.ride_id) return;
        await supabase.from('ride_events').insert({
          ride_id: pending.ride_id,
          user_id: user.uid,
          event_type: 'SOS',
          description: 'Emergency SOS! (queued while offline)',
          payload: sosData
        });
        localStorage.removeItem(PENDING_SOS_KEY);
        showToast('🚨 Queued SOS alert has been sent now that you are back online.', 'success');
        await dispatchSOSToBackend(pending.lat, pending.lng);
      } catch (err) {
        console.error('Retrying pending SOS failed:', err);
      }
    };
    window.addEventListener('online', retryPendingSOS);
    // Also attempt once on mount in case we came back online before listener attached
    if (navigator.onLine) retryPendingSOS();
    return () => window.removeEventListener('online', retryPendingSOS);
  }, []);

  const handleRevokeSOS = async () => {
    const user = auth.currentUser;
    if (!user || !id) return;
    await supabase.from('ride_events')
      .delete()
      .eq('ride_id', id)
      .eq('user_id', user.uid)
      .eq('event_type', 'SOS');
    // Send a revoke event so receivers know it was a false alarm
    await supabase.from('ride_events').insert({
      ride_id: id,
      user_id: user.uid,
      event_type: 'SOS_REVOKED',
      description: 'SOS was revoked — false alarm',
      payload: sosData
    });
    showToast('SOS revoked — your group has been notified', 'success');
  };

  const handleSOSNavigate = (lat: number, lng: number) => {
    if (map.current) {
      map.current.flyTo({ center: [lng, lat], zoom: 16, pitch: 45, duration: 2000 });
    }
  };

  // Keep the ref in sync with the latest handleTriggerSOS
  handleTriggerSOSRef.current = handleTriggerSOS;

  const { isCountingDown, countdown, cancelCountdown } = useCrashDetection({
    onCrashDetected: () => {
      handleTriggerSOSRef.current();
    },
    isActive: isCrashDetectionActive && !showEmergencySetup
  });

  const handleLeaveOrEnd = async () => {
    const user = auth.currentUser;
    if (!user || !id) return;
    const userUuid = user.uid.length === 36 ? user.uid : getDeterministicUuid(user.uid);
    const { data: mem } = await supabase.from('ride_members').select('role').eq('ride_id', id).eq('user_id', userUuid).maybeSingle();
    if (mem?.role === 'admin') {
      await supabase.from('rides').update({ status: 'ended' }).eq('id', id);
      showToast('Ride ended for everyone.', 'success');
    } else {
      await supabase.from('ride_members').delete().eq('ride_id', id).eq('user_id', userUuid);
      showToast('You left the ride.', 'success');
    }
    navigate('/ride-plus');
  };

  // Remaining time calculation
  const progress        = totalDistance > 0 ? Math.min(userDistKm / totalDistance, 1) : 0;
  const remainingDistKm = Math.max(0, totalDistance - userDistKm);
  const remainingSecs   = Math.max(0, totalDuration * (1 - progress));
  const remainingMins   = Math.round(remainingSecs / 60);
  const isArrived       = totalDistance > 0 && progress >= 0.98;

  let nextStopDistKm = remainingDistKm;
  let nextStopMins = remainingMins;

  if (routeFeature?.properties?.legs?.length > 0) {
    let accumulatedDistMeters = 0;
    
    for (let i = 0; i < routeFeature.properties.legs.length; i++) {
      const leg = routeFeature.properties.legs[i];
      accumulatedDistMeters += leg.summary.lengthInMeters;
      
      const legDistKm = accumulatedDistMeters / 1000;
      if (userDistKm < legDistKm) {
        nextStopDistKm = legDistKm - userDistKm;
        const legTotalDistKm = leg.summary.lengthInMeters / 1000;
        const progressInLeg = Math.max(0, 1 - (nextStopDistKm / legTotalDistKm));
        const legRemainingSecs = leg.summary.travelTimeInSeconds * (1 - progressInLeg);
        nextStopMins = Math.round(legRemainingSecs / 60);
        break;
      }
    }
  }

  const etaStr          = isArrived ? 'Arrived' : nextStopMins > 0 ? `${nextStopMins} min` : '-- min';
  const distStr         = nextStopDistKm < 1 ? `${Math.round(nextStopDistKm * 1000)} m` : `${nextStopDistKm.toFixed(1)} km`;

  const fmtHazard = (km: number) => km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

  // Keep Group Intelligence available in UI even when backend falls back due DB/network issues.
  const liveRidersWithCoords = Object.values(riders).filter(
    (r: any) => typeof r?.longitude === 'number' && typeof r?.latitude === 'number'
  ) as any[];

  const referenceRider = (
    (auth.currentUser?.uid && liveRidersWithCoords.find((r: any) => r.user_id === auth.currentUser?.uid)) ||
    liveRidersWithCoords[0] ||
    null
  );

  const localDistances = referenceRider
    ? liveRidersWithCoords
        .filter((r: any) => r.user_id !== referenceRider.user_id)
        .map((r: any) => {
          const km = turf.distance(
            turf.point([referenceRider.longitude, referenceRider.latitude]),
            turf.point([r.longitude, r.latitude]),
            { units: 'kilometers' }
          );
          return {
            user_id: r.user_id,
            name: r.display_name || 'Rider',
            distance_meters: Math.round(km * 1000)
          };
        })
    : [];

  const effectiveGroupIntelligence = (groupIntelligence && (groupIntelligence.reference_user_id || (groupIntelligence.distances && groupIntelligence.distances.length > 0)))
    ? {
        ...groupIntelligence,
        source: 'backend'
      }
    : {
        reference_user_id: referenceRider?.user_id || null,
        distances: localDistances,
        separated_riders: localDistances.filter((d: any) => d.distance_meters > 2000),
        total_distance_covered_km: typeof userDistKm === 'number' ? userDistKm : 0,
        message: localDistances.length > 0 ? 'Live fallback from rider GPS' : 'Waiting for rider location data',
        source: 'local'
      };


  
  
  useEffect(() => {
    if (!map.current) return;
    
    const handleStyleLoad = () => {
      if (!map.current || !routeFeature || map.current.getSource('route')) return;
      try {
        map.current.addSource('route', { type: 'geojson', data: routeFeature });
        map.current.addLayer({
          id: 'route-glow-completed', type: 'line', source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#ef4523', 'line-width': 18, 'line-opacity': 0.1, 'line-blur': 10 },
        });
        map.current.addLayer({
          id: 'route-line-completed', type: 'line', source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#ef4523', 'line-width': 12, 'line-opacity': 0.2 },
        });
        map.current.addSource('route-remaining', { type: 'geojson', data: routeFeature });
        map.current.addLayer({
          id: 'route-glow', type: 'line', source: 'route-remaining',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#ef4523', 'line-width': 18, 'line-opacity': 0.3, 'line-blur': 10 },
        });
        map.current.addLayer({
          id: 'route-line', type: 'line', source: 'route-remaining',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#ef4523', 'line-width': 12, 'line-opacity': 1 },
        });
      } catch (e) {
        console.error("Failed to re-add route layers:", e);
      }
    };

    map.current.on('style.load', handleStyleLoad);
    map.current.setStyle(mapStyle === 'dark' ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json');

    return () => {
      map.current?.off('style.load', handleStyleLoad);
    };
  }, [mapStyle, routeFeature]);


  
  const currentUserData = riders[auth.currentUser?.uid || ''];
  const currentUserStatus = currentUserData?.status;
  const isPending = currentUserStatus === 'pending';

  if (isPending) {
    return (
      <div className="w-full h-full bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Shield className="w-10 h-10 text-orange-500" />
        </div>
        <h2 className="text-2xl font-semibold text-dark mb-2">Waiting for Approval</h2>
        <p className="text-gray-500 mb-4 max-w-xs">Your request to join this ride has been sent to the Ride Admin. Please wait while they review your request.</p>
        <button onClick={() => navigate('/home')} className="w-full max-w-[300px] bg-dark text-white font-semibold py-4 rounded-lg active:scale-95 transition-transform">
          Back to Home
        </button>
      </div>
    );
  }

  const pendingRiders = Object.values(riders).filter((r: any) => r.status === 'pending');
  const isAdmin = currentUserData?.role === 'admin' || ride?.owner_id === auth.currentUser?.uid;

  // Portrait bottom drawer: drag the handle or tap it to cycle peek → half → full
  const sheetSnaps = () => {
    const h = rootRef.current?.clientHeight || window.innerHeight;
    return [PEEK_H, h * 0.5, h - 128];
  };
  const routeStopRows = rideStops
    .filter((st: any) => st.stop_type !== 'Start' && typeof st.latitude === 'number' && typeof st.longitude === 'number')
    .sort((x: any, y: any) => (x.sequence ?? 0) - (y.sequence ?? 0))
    .map((st: any) => {
      const here = userLocation || globalLocation;
      const km = here ? turf.distance(turf.point([here.lng, here.lat]), turf.point([st.longitude, st.latitude])) : null;
      const pace = avgSpeed > 10 ? avgSpeed : 40;
      const at = km != null ? new Date(Date.now() + (km / pace) * 3600000) : null;
      return {
        key: st.id || `${st.sequence}-${st.stop_name}`,
        name: st.stop_name || 'Stop',
        isDest: st.stop_type === 'Destination',
        dist: km == null ? '--' : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`,
        eta: at ? at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--',
      };
    });
  const tappedRider = tappedRiderId ? riders[tappedRiderId] : null;
  const tappedRiderKm = tappedRider && (userLocation || globalLocation) && typeof tappedRider.latitude === 'number'
    ? turf.distance(turf.point([(userLocation || globalLocation)!.lng, (userLocation || globalLocation)!.lat]), turf.point([tappedRider.longitude, tappedRider.latitude]))
    : null;
  const sheetTall = (sheetH ?? PEEK_H) > (rootRef.current?.clientHeight || window.innerHeight) * 0.55;
  const toggleSheet = () => {
    const [peek, , full] = sheetSnaps();
    setSheetH((sheetH ?? PEEK_H) > peek + 20 ? peek : full);
  };
  const onSheetDown = (e: React.PointerEvent) => {
    const h = sheetH ?? PEEK_H;
    sheetDrag.current = { y: e.clientY, h, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onSheetMove = (e: React.PointerEvent) => {
    const d = sheetDrag.current;
    if (!d) return;
    const dy = d.y - e.clientY;
    if (Math.abs(dy) > 4) d.moved = true;
    const [min, , max] = sheetSnaps();
    setSheetH(Math.max(min, Math.min(max, d.h + dy)));
    setSheetDragging(true);
  };
  const onSheetUp = () => {
    const d = sheetDrag.current;
    sheetDrag.current = null;
    setSheetDragging(false);
    const snaps = sheetSnaps();
    if (!d) return;
    if (!d.moved) {
      const cur = sheetH ?? PEEK_H;
      const idx = snaps.findIndex((s) => Math.abs(s - cur) < 8);
      setSheetH(snaps[(idx + 1) % snaps.length]);
      return;
    }
    const cur = sheetH ?? PEEK_H;
    setSheetH(snaps.reduce((a, b) => (Math.abs(b - cur) < Math.abs(a - cur) ? b : a)));
  };

  return (
    <div ref={rootRef} style={{ '--sheet-h': `${sheetH ?? PEEK_H}px` } as React.CSSProperties} className="w-full h-full bg-[#E8F1F2] flex portrait:flex-col landscape:flex-row overflow-hidden font-sans relative">

      {/* 1. Telemetry Panel — side panel in landscape, draggable bottom drawer in portrait */}
      <div
        className={`flex flex-col portrait:absolute portrait:inset-x-0 portrait:bottom-0 portrait:h-[var(--sheet-h)] portrait:rounded-t-[24px] portrait:shadow-[0_-8px_30px_rgba(0,0,0,0.18)] portrait:z-20 ${sheetDragging ? '' : 'portrait:transition-[height] portrait:duration-300 portrait:ease-out'} landscape:w-[30%] landscape:min-w-[280px] landscape:max-w-[340px] landscape:h-full landscape:order-2 landscape:border-r bg-[#F7F8FA] shrink-0 z-10 landscape:shadow-[4px_0_15px_rgba(0,0,0,0.05)] border-gray-200`}
      >
        <div
          className="hidden portrait:flex shrink-0 h-7 items-center justify-center cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={onSheetDown}
          onPointerMove={onSheetMove}
          onPointerUp={onSheetUp}
          onPointerCancel={onSheetUp}
          role="button"
          aria-label="Resize ride panel"
        >
          <span className="w-12 h-1.5 rounded-full bg-gray-300" />
        </div>
        <div className="hidden portrait:flex shrink-0 px-4 pb-3 items-center gap-3 relative">
          <span className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6 text-red-500" fill="currentColor" stroke="white" strokeWidth={1.5} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-gray-500 leading-tight">{isArrived ? 'Arrived' : 'Next stop'}</p>
            <p className="text-[18px] font-bold text-gray-950 leading-tight truncate">{nextStop?.stop_name || ride?.destination?.name?.split(',')[0] || ride?.name || 'Destination'}</p>
            <p className="text-[14px] text-gray-600 tabular-nums">{etaStr} · {distStr}</p>
          </div>
          <button onClick={() => setMoreOpen((v) => !v)} aria-label="More options" aria-expanded={moreOpen} className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-all ${moreOpen ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>
            <MoreHorizontal className="w-6 h-6" />
          </button>
          <button onClick={() => { setMoreOpen(false); toggleSheet(); }} aria-label="Expand ride details" className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 shrink-0 active:scale-95 transition-all">
            <ChevronUp className={`w-6 h-6 transition-transform ${(sheetH ?? PEEK_H) > PEEK_H + 20 ? 'rotate-180' : ''}`} />
          </button>

          {moreOpen && (
            <>
              <button className="fixed inset-0 z-30 cursor-default" aria-label="Close menu" onClick={() => setMoreOpen(false)} />
              <div role="menu" className="absolute right-4 bottom-full mb-2 z-40 w-[220px] bg-white rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.18)] py-1.5 overflow-hidden">
                {[
                  { label: 'Riders', icon: Users, show: true, act: () => setShowUsersModal(true), danger: false },
                  { label: 'Edit ride', icon: Edit2, show: isAdmin, act: () => navigate('/ride-plus/create', { state: { editRideId: id } }), danger: false },
                  { label: isAdmin ? 'End ride' : 'Leave ride', icon: isAdmin ? StopCircle : LogOut, show: true, act: handleLeaveOrEnd, danger: true },
                  { label: 'Exit to rides', icon: X, show: true, act: () => navigate('/ride-plus'), danger: false },
                ].filter((m) => m.show).map((m) => (
                  <button
                    key={m.label}
                    role="menuitem"
                    onClick={() => { setMoreOpen(false); m.act(); }}
                    className={`w-full min-h-[52px] px-4 flex items-center gap-3 text-left text-[15px] font-semibold active:bg-gray-50 ${m.danger ? 'text-red-600' : 'text-gray-900'}`}
                  >
                    <m.icon className="w-5 h-5" />
                    {m.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className={`flex-1 flex flex-col pt-2 portrait:pt-0 pb-2 overflow-y-auto hide-scrollbar min-h-0 ${(sheetH ?? PEEK_H) <= PEEK_H + 4 ? 'portrait:hidden' : ''}`}>

          {/* Header */}
          <div className="px-4 mt-1 mb-3 flex items-center gap-2 shrink-0">
            <div className="min-w-0 flex-1">
              <span className="text-gray-950 font-bold text-[16px] leading-tight block truncate">{ride?.name || 'Live Ride'}</span>
              <div className="flex items-center gap-2 mt-0.5 text-[12px] font-semibold text-gray-500">
                <button
                  onClick={() => { if (ride?.ride_code) { navigator.clipboard.writeText(ride.ride_code); showToast('Ride code copied!', 'success'); } }}
                  className="flex items-center gap-1.5 hover:text-gray-900"
                  title="Copy ride code"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> <span className="text-success">LIVE</span> {ride?.ride_code || ''}
                </button>
                <span className="text-gray-300">·</span>
                <button onClick={() => fetchLiveUpdates()} className="flex items-center gap-1 hover:text-[#FF5A00]" title="Refresh">
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-[#FF5A00]' : ''}`} /> {timeSinceUpdate}
                </button>
              </div>
            </div>
            <button onClick={() => navigate('/ride-plus')} className="portrait:hidden w-11 h-11 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0" title="Exit Ride">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Speedometer */}
          <div className="shrink-0 mb-2">
            <SpeedometerCluster speed={currentSpeedKph || 0} hideSpeedInPortrait />
          </div>

          {/* Progress (portrait) — the landscape ETA card below carries the same info */}
          <div className="hidden portrait:block px-4 mt-1 mb-2 shrink-0">
            <div className="flex items-center justify-between text-[12px] font-semibold text-gray-500 tabular-nums">
              <span>{userDistKm.toFixed(1)} / {totalDistance.toFixed(1)} km · {Math.round(progress * 100)}%</span>
              <span>Avg {avgSpeed} · Max {maxSpeed} km/h</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-[#FF5A00] rounded-full transition-all duration-1000" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          </div>

          {/* ETA Card */}
          <div className="px-2 shrink-0 pb-2 portrait:hidden">
            <div className="bg-white rounded-[8px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex">
                <div className="w-1 shrink-0" />
                <div className="flex-1 min-w-0 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">Next Stop</span>
                    <span className="bg-[#FFF0E6] text-[#FF5A00] text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">ETA {etaStr}</span>
                  </div>
                  {nextStop?.stop_name && (
                    <p className="text-[12px] font-semibold text-[#111111] truncate mb-0.5" title={nextStop.stop_name}>{nextStop.stop_name}</p>
                  )}
                  <div className="flex items-end justify-between">
                    <h2 className="text-[26px] font-semibold text-success leading-none tabular-nums">{distStr}</h2>
                    <span className="text-[11px] font-semibold text-gray-400 tabular-nums">{Math.round(progress * 100)}% done</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF5A00] to-success rounded-full transition-all duration-1000"
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <span className="bg-gray-50 border border-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-1 rounded-lg tabular-nums">{userDistKm.toFixed(1)} / {totalDistance.toFixed(1)} km</span>
                    <span className="bg-gray-50 border border-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-1 rounded-lg tabular-nums">Avg {avgSpeed}</span>
                    <span className="bg-gray-50 border border-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-1 rounded-lg tabular-nums">Max {maxSpeed}</span>
                  </div>
                </div>
                </div>
            </div>
          </div>

          {/* Tabs (stick to the top of the drawer while content scrolls) */}
          <div className="px-3 shrink-0 pt-2 pb-3 sticky top-0 z-10 bg-[#F7F8FA]">
            <div className="flex bg-gray-200/60 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${activeTab === 'details' ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Details
              </button>
              <button 
                onClick={() => setActiveTab('routes')}
                className={`flex-1 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${activeTab === 'routes' ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Route
              </button>
              <button 
                onClick={() => setActiveTab('activity')}
                className={`flex-1 py-1.5 text-[12px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'activity' ? 'bg-white text-[#111111] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <History className="w-3 h-3" /> Activity
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-4 flex flex-col gap-6 pb-6">

              {activeTab === 'details' && (
                <div className="flex flex-col gap-6">

              {/* Pending Approvals Section (Admin Only) */}
              {isAdmin && pendingRiders.length > 0 && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-orange-800 font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Pending Approvals ({pendingRiders.length})
                    </h3>
                  </div>
                  <div className="flex flex-col gap-3">
                    {pendingRiders.map((pr: any) => (
                      <div key={pr.user_id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-orange-100">
                        <div className="flex items-center gap-3">
                          {pr.avatar_url ? (
                            <img 
                              src={pr.avatar_url} 
                              alt=""
                              loading="lazy"
                              onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(pr.full_name || 'User')}&background=random`; }}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-500">
                              {pr.display_name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <span className="font-semibold text-dark">{pr.display_name}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={async () => {
                            const searchPrUserId = pr.user_id.length === 36 ? pr.user_id : getDeterministicUuid(pr.user_id);
                              await supabase.from('ride_members').update({ status: 'approved' }).eq('ride_id', id).eq('user_id', searchPrUserId);
                              showToast('Rider approved!', 'success');
                            }}
                            className="bg-success text-white px-3 py-1.5 rounded-lg text-sm font-semibold active:scale-95 transition-all"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={async () => {
                            const searchPrUserId = pr.user_id.length === 36 ? pr.user_id : getDeterministicUuid(pr.user_id);
                              await supabase.from('ride_members').delete().eq('ride_id', id).eq('user_id', searchPrUserId);
                              showToast('Rider rejected', 'info');
                            }}
                            className="bg-danger/10 text-danger px-3 py-1.5 rounded-lg text-sm font-semibold active:scale-95 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}



              {/* Map Settings Section */}
              <div className="flex flex-col gap-4 px-1 pt-1">
                <h3 className="text-[13px] font-bold uppercase tracking-wider text-gray-500">Map settings</h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-900 font-semibold text-[15px]">
                    <Car className="w-5 h-5 text-gray-500" /> Live traffic
                  </div>
                  <button 
                    onClick={() => setShowTraffic(!showTraffic)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${showTraffic ? 'bg-success' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${showTraffic ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="h-px bg-gray-100 w-full" />

                {(userLocation || globalLocation) && (
                  <OfflineMapDownloader 
                    currentLat={(userLocation || globalLocation)!.lat} 
                    currentLng={(userLocation || globalLocation)!.lng} 
                  />
                )}

                <div className="h-px bg-gray-100 w-full" />

                <div className="flex flex-col gap-3">
                  <span className="text-gray-900 text-[15px] font-semibold">Map style</span>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setMapStyle('dark')} 
                      className={`flex-1 py-3 px-2 rounded-xl text-sm font-semibold transition-all ${mapStyle === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      Dark
                    </button>
                    <button 
                      onClick={() => setMapStyle('light')} 
                      className={`flex-1 py-3 px-2 rounded-xl text-sm font-semibold transition-all ${mapStyle === 'light' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      Light
                    </button>
                    <button 
                      onClick={() => setMapStyle('satellite')} 
                      className={`flex-1 py-3 px-2 rounded-xl text-sm font-semibold transition-all ${mapStyle === 'satellite' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                      Satellite
                    </button>
                  </div>
                </div>
              </div>
                </div>
              )}

              {activeTab === 'routes' && (
                <div className="flex flex-col">
                  {routeStopRows.length === 0 ? (
                    <p className="py-6 text-center text-[14px] text-gray-500">No stops on this ride.</p>
                  ) : routeStopRows.map((st, i) => (
                    <div key={st.key} className="flex items-center gap-3 py-3.5 border-b border-gray-200/70 last:border-0">
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${st.isDest ? 'bg-gray-900 text-white' : 'bg-orange-50 text-[#FF5A00]'}`}>
                        {st.isDest ? <MapPin className="w-4 h-4" /> : String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-gray-950 truncate">{st.name}</p>
                        <p className="text-[13px] text-gray-500">{st.isDest ? 'Destination' : 'Stop'}</p>
                      </div>
                      <div className="text-right shrink-0 tabular-nums">
                        <p className="text-[15px] font-semibold text-gray-950">{st.dist}</p>
                        <p className="text-[13px] text-gray-500">{st.eta}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Activity Log Tab ── */}
              {activeTab === 'activity' && (
                <div className="mt-2 flex flex-col gap-3 pb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#273a5a] flex items-center gap-2"><History className="w-5 h-5 text-[#ef4523]" /> Edit History</h3>
                    {isAdmin && (
                      <button onClick={() => navigate(`/ride-plus/create`, { state: { editRideId: id } })} className="text-[12px] font-semibold text-[#ef4523] flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 transition-colors active:scale-95">
                        <Edit2 className="w-3.5 h-3.5" /> Edit Ride
                      </button>
                    )}
                  </div>
                  {editLog.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <History className="w-10 h-10 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium text-sm">No edit history yet</p>
                      <p className="text-gray-400 text-xs mt-1">Changes made to this ride will appear here</p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-gray-100 ml-3 pl-5 flex flex-col gap-4">
                      {editLog.map((entry: any, idx: number) => (
                        <div key={entry.id || idx} className="relative">
                          <div className="absolute -left-[27px] w-4 h-4 rounded-full bg-white border-4 border-[#ef4523]" />
                          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-[#273a5a]">{entry.editor_name || 'Admin'}</span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {new Date(entry.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium">
                              {entry.edit_type?.replace(/_/g, ' ').replace(/,\s*/g, ' · ')}
                            </p>
                            {entry.changes && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {Object.keys(entry.changes).map((key: string) => (
                                  <span key={key} className="px-2 py-0.5 bg-orange-50 text-[#ef4523] rounded-full text-[10px] font-semibold">
                                    {key.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
      </div>

      {/* 3. Map Area */}
      <div className="portrait:w-full portrait:flex-1 portrait:order-1 landscape:flex-1 landscape:h-full landscape:order-3 relative z-0 overflow-hidden">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-10" />

        {!mapLoaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#F7F8FA]/90 backdrop-blur-sm">
            <div className="w-10 h-10 border-4 border-[#FF5A00] border-t-transparent rounded-full animate-spin" />
            <p className="text-[12px] font-semibold text-gray-400 mt-3 uppercase tracking-wider">Loading Ride Map...</p>
          </div>
        )}

        {mapLoaded && (
          <>
          {/* Top-right ride actions (SOS + Edit + End/Leave in one stack) */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-3 items-center">
            <button onClick={handleSOS} className="w-14 h-14 bg-red-500/90 backdrop-blur-md border border-red-400/50 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,59,48,0.6)] shrink-0 hover:scale-110 active:scale-95 transition-all duration-300" title="SOS Emergency">
              <ShieldAlert className="w-7 h-7" />
            </button>
            {(riders[auth.currentUser?.uid || '']?.role === 'admin' || ride?.owner_id === auth.currentUser?.uid) && (
              <button onClick={() => navigate('/ride-plus/create', { state: { editRideId: id } })} className="portrait:hidden w-12 h-12 rounded-full bg-white/95 backdrop-blur border border-gray-100 shadow-md flex items-center justify-center text-[#FF5A00] hover:bg-gray-50 active:scale-95 transition-all" title="Edit Ride">
                <Edit2 className="w-5 h-5" />
              </button>
            )}
            {riders[auth.currentUser?.uid || '']?.role === 'admin' || ride?.owner_id === auth.currentUser?.uid ? (
              <button onClick={handleLeaveOrEnd} className="portrait:hidden w-12 h-12 rounded-full bg-white/95 backdrop-blur border border-gray-100 shadow-md flex items-center justify-center text-red-500 hover:bg-red-50 active:scale-95 transition-all" title="End Ride">
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={handleLeaveOrEnd} className="portrait:hidden w-12 h-12 rounded-full bg-white/95 backdrop-blur border border-gray-100 shadow-md flex items-center justify-center text-red-500 hover:bg-red-50 active:scale-95 transition-all" title="Leave Ride">
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Map Controls */}
          <div className={`absolute right-3 z-20 flex flex-col gap-3 landscape:top-1/2 landscape:-translate-y-1/2 portrait:bottom-[calc(var(--sheet-h)+12px)] portrait:transition-[bottom] portrait:duration-300 ${sheetTall ? 'portrait:hidden' : ''}`}>
            <button
              onClick={() => { 
                if (!map.current) return; 
                const next3D = !is3D;
                let currentBearing = 0;
                let targetCenter: [number, number] | null = null;
                
                if (userLocationRef.current) {
                  targetCenter = [userLocationRef.current.lng, userLocationRef.current.lat];
                } else if (routeFeatureRef.current) {
                  targetCenter = [routeFeatureRef.current.geometry.coordinates[0][0], routeFeatureRef.current.geometry.coordinates[0][1]];
                }

                if (next3D && routeFeatureRef.current && targetCenter) {
                   try {
                      const userPt = turf.point(targetCenter);
                      const line = turf.lineString(routeFeatureRef.current.geometry.coordinates);
                      const closestPoint = turf.nearestPointOnLine(line, userPt);
                      const routeLength = turf.length(line);
                      const distanceAlong = (closestPoint.properties as any).location;
                      const aheadDist = Math.min(distanceAlong + 0.05, routeLength);
                      const aheadPoint = turf.along(line, aheadDist);
                      currentBearing = turf.bearing(closestPoint, aheadPoint);
                   } catch(e) {}
                }
                if (next3D) {
                  const options: any = { pitch: 60, zoom: 20, bearing: currentBearing, duration: 1000 };
                  if (targetCenter) options.center = targetCenter;
                  map.current.easeTo(options);
                  setIsFollowingUser(true);
                } else {
                  map.current.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
                }
                setIs3D(next3D); 
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-all duration-300 shadow-md ${is3D ? 'bg-[#FF5A00] text-white shadow-[0_4px_16px_rgba(255,90,0,0.4)]' : 'bg-white/95 backdrop-blur border border-gray-100 text-[#111111] hover:bg-gray-50'}`}
            >
              {is3D ? <Compass className="w-5 h-5" /> : <Navigation2 className="w-5 h-5" />}
            </button>

            <button
              onClick={() => {
                setIsFollowingUser(true);
                setFocusedRiderId(null);
                if (map.current) {
                  let currentBearing = map.current.getBearing();
                  let targetCenter: [number, number] | null = null;
                  if (userLocationRef.current) {
                    targetCenter = [userLocationRef.current.lng, userLocationRef.current.lat];
                  } else if (routeFeatureRef.current) {
                    targetCenter = [routeFeatureRef.current.geometry.coordinates[0][0], routeFeatureRef.current.geometry.coordinates[0][1]];
                  }

                  if (is3D && routeFeatureRef.current && targetCenter) {
                    try {
                      const userPt = turf.point(targetCenter);
                      const line = turf.lineString(routeFeatureRef.current.geometry.coordinates);
                      const closestPoint = turf.nearestPointOnLine(line, userPt);
                      const routeLength = turf.length(line);
                      const distanceAlong = (closestPoint.properties as any).location;
                      const aheadDist = Math.min(distanceAlong + 0.05, routeLength);
                      const aheadPoint = turf.along(line, aheadDist);
                      currentBearing = turf.bearing(closestPoint, aheadPoint);
                    } catch (e) {}
                  }

                  const options: any = { duration: 1000, bearing: currentBearing, pitch: is3D ? 60 : 0, zoom: 20 };
                  if (targetCenter) options.center = targetCenter;
                  if (targetCenter) {
                    map.current.easeTo(options);
                    return;
                  }

                  useLocationStore.getState().fetchLocationOnce().then((pos) => {
                    const center: [number, number] = [pos.lng, pos.lat];
                    setUserLocation({ lat: pos.lat, lng: pos.lng });
                    map.current?.easeTo({ ...options, center });
                    placeRiderMarker(auth.currentUser?.uid || 'me', pos.lng, pos.lat);
                  }).catch(() => {
                    showToast('Live location unavailable. Please enable location permission.', 'error');
                  });
                }
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-all duration-300 shadow-md ${isFollowingUser && !focusedRiderId ? 'bg-[#FF5A00] text-white shadow-[0_4px_16px_rgba(255,90,0,0.4)]' : 'bg-white/95 backdrop-blur border border-gray-100 text-[#111111] hover:bg-gray-50'}`}
              ref={locateBtnRef}
              title="My Location"
              aria-label="My Location"
            >
              <Crosshair className="w-5 h-5" />
            </button>
          </div>

          {/* Status Banners: telemetry degraded / crash detection paused */}
          <div className="absolute top-[80px] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none transition-all duration-300">
            {telemetryDegraded && (
              <div className="bg-amber-500/90 backdrop-blur-md border border-amber-300/50 text-white px-4 py-2 rounded-full font-semibold text-[12px] flex items-center gap-2 shadow-[0_8px_24px_rgba(245,158,11,0.4)] whitespace-nowrap">
                <AlertTriangle className="w-4 h-4" /> Location updates failing
              </div>
            )}
            {showEmergencySetup && (
              <div className="bg-[#111111]/90 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full font-semibold text-[12px] flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.3)] whitespace-nowrap">
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Crash detection paused
              </div>
            )}
          </div>

          {/* Next maneuver, or the next stop when there is no turn yet (portrait) */}
          {(
          <div className="hidden absolute top-3 left-3 right-[80px] z-20 bg-[#0F5132] text-white rounded-2xl portrait:flex shadow-[0_6px_20px_rgba(0,0,0,0.22)] pl-3 pr-4 py-2.5 items-center gap-3">
            <span className="w-12 h-12 flex items-center justify-center shrink-0">
              {currentInstruction
                ? React.cloneElement(getTurnIcon(currentInstruction.type) as React.ReactElement<{ className?: string }>, { className: 'w-11 h-11 text-white' })
                : <ArrowUp className="w-11 h-11 text-white" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[24px] font-bold leading-none tabular-nums">{currentInstruction?.dist || distStr}</p>
              <p className="text-[15px] text-white/85 mt-1 leading-snug truncate">
                {currentInstruction?.text || `Head to ${nextStop?.stop_name || ride?.destination?.name?.split(',')[0] || 'destination'}`}
              </p>
            </div>
          </div>
          )}

          {/* Tapped rider card */}
          {tappedRider && (
            <div className={`absolute left-3 right-3 z-30 portrait:bottom-[calc(var(--sheet-h)+12px)] landscape:bottom-4 bg-white rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.18)] px-4 py-3 flex items-center gap-3`}>
              <span className="w-11 h-11 rounded-full bg-orange-50 border-2 border-[#FF5A00] flex items-center justify-center text-[#FF5A00] font-bold overflow-hidden shrink-0">
                {tappedRider.avatar_url ? <img src={tappedRider.avatar_url} alt="" className="w-full h-full object-cover" /> : String(tappedRider.display_name || 'R')[0]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-bold text-gray-950 truncate">{tappedRider.display_name || 'Rider'}</p>
                <p className="text-[13px] text-gray-500 tabular-nums">
                  {tappedRiderKm == null ? 'Distance unknown' : tappedRiderKm < 1 ? `${Math.round(tappedRiderKm * 1000)} m away` : `${tappedRiderKm.toFixed(1)} km away`}
                  {typeof tappedRider.speed === 'number' ? ` · ${tappedRider.speed > 0 ? `${Math.round(tappedRider.speed)} km/h` : 'Stopped'}` : ''}
                </p>
              </div>
              <button onClick={() => setTappedRiderId(null)} aria-label="Close rider card" className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Round speed gauge above the drawer (portrait) */}
          <div className={`hidden ${sheetTall ? '' : 'portrait:flex'} absolute left-3 z-20 w-[92px] h-[92px] rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,0.16)] items-center justify-center portrait:bottom-[calc(var(--sheet-h)+12px)] transition-[bottom] duration-300`} aria-label={`${Math.round(currentSpeedKph || 0)} km/h`}>
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="7" strokeLinecap="round" strokeDasharray="188.5 400" transform="rotate(135 50 50)" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={(currentSpeedKph || 0) > 120 ? '#FF5A00' : '#16A34A'} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(Math.min(currentSpeedKph || 0, 200) / 200) * 188.5} 400`} transform="rotate(135 50 50)" className="transition-all duration-500" />
            </svg>
            <div className="relative flex flex-col items-center leading-none">
              <span className="text-[30px] font-black text-gray-950 tabular-nums">{Math.round(currentSpeedKph || 0)}</span>
              <span className="text-[12px] font-semibold text-gray-500 mt-0.5">km/h</span>
            </div>
          </div>

          {/* Hazard Banner */}
          {nextHazard ? (
            <div className={`absolute top-3 portrait:top-[92px] left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-300`}>
              <div className="bg-red-500/90 backdrop-blur-md border border-red-400/50 text-white px-3 py-1.5 rounded-full font-semibold text-[11px] flex items-center gap-1.5 shadow-[0_4px_14px_rgba(255,59,48,0.45)] animate-pulse whitespace-nowrap max-w-[70%] overflow-hidden">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{fmtHazard(nextHazard.remainingDist)} — {nextHazard.category?.split(':')[0]} Ahead</span>
              </div>
            </div>
          ) : incidents.length > 0 && userLocation ? (
            <div className={`absolute top-3 portrait:top-[92px] left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-300`}>
              <div className="bg-success/90 backdrop-blur-md border border-green-400/50 text-white px-3 py-1.5 rounded-full font-semibold text-[11px] flex items-center gap-1.5 shadow-[0_4px_14px_rgba(52,199,89,0.35)] whitespace-nowrap">
                <Shield className="w-3.5 h-3.5 shrink-0" /> Clear Route Ahead
              </div>
            </div>
          ) : null}
          </>
        )}
      </div>

      {mapLoaded && selectedIncident && (
        <IncidentDrawer incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
      )}

      {/* Users Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-dark/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#273a5a] flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" /> Ride Members
              </h3>
              <button onClick={() => setShowUsersModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {Object.values(riders)
                .filter((r: any) => r.status !== 'pending')
                .sort((a: any, b: any) => {
                  if (a.user_id === auth.currentUser?.uid) return -1;
                  if (b.user_id === auth.currentUser?.uid) return 1;
                  const distA = userLocation ? Math.sqrt(Math.pow((a.lat || 0) - userLocation.lat, 2) + Math.pow((a.lng || 0) - userLocation.lng, 2)) : 0;
                  const distB = userLocation ? Math.sqrt(Math.pow((b.lat || 0) - userLocation.lat, 2) + Math.pow((b.lng || 0) - userLocation.lng, 2)) : 0;
                  return distA - distB;
                })
                .map((r: any, idx) => {
                  const isMe = r.user_id === auth.currentUser?.uid;
                  return (
                    <div key={r.user_id} className={`flex items-center justify-between p-4 rounded-xl ${isMe ? 'bg-primary/5 border border-primary/20' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={r.avatar_url || imgSoloRide} alt="avatar" className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover bg-white" />
                          {r.role === 'admin' && <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-1 rounded-full border-2 border-white"><Shield className="w-3 h-3 text-white" /></div>}
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#273a5a] flex items-center gap-2">
                            {r.display_name} {isMe && <span className="text-xs bg-dark text-white px-2 py-0.5 rounded-full">You</span>}
                          </h4>
                          {r.speed > 0 ? <p className="text-sm text-gray-500 font-medium">{Math.round(r.speed)} km/h</p> : <p className="text-sm text-gray-500 font-medium">Stationary</p>}
                        </div>
                      </div>
                      {idx > 0 && idx < 4 && <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">Nearest</span>}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* SOS Modals */}
      {showEmergencySetup && (
        <EmergencySetupModal 
          userId={auth.currentUser?.uid?.length === 36 ? auth.currentUser.uid : getDeterministicUuid(auth.currentUser?.uid || '')}
          onComplete={() => {
            setShowEmergencySetup(false);
            const myUid = auth.currentUser?.uid;
            if (myUid) {
               const searchId = myUid.length === 36 ? myUid : getDeterministicUuid(myUid);
               supabase.from('profiles').select('*').eq('id', searchId).single().then(({ data }) => {
                  if (data) setCurrentUserProfile(data);
               });
            }
          }}
          onClose={() => setShowEmergencySetup(false)}
        />
      )}

      {showSOSModal && sosData && (
        <SOSModal 
          isReceiving={isReceivingSOS}
          data={sosData}
          onTrigger={handleTriggerSOS}
          onRevoke={handleRevokeSOS}
          onNavigate={handleSOSNavigate}
          isCrashDetectionActive={isCrashDetectionActive}
          onToggleCrashDetection={() => setIsCrashDetectionActive(!isCrashDetectionActive)}
          onClose={() => {
            setShowSOSModal(false);
            setIsReceivingSOS(false);
          }}
        />
      )}
      {/* Full Screen Crash Detection Countdown Overlay */}
      {isCountingDown && (
        <div className="fixed inset-0 z-[200] bg-danger/95 backdrop-blur-md flex flex-col items-center justify-center p-6">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <AlertTriangle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-semibold text-white text-center mb-4">
            CRASH DETECTED
          </h2>
          <p className="text-white/80 text-center mb-4 text-lg font-medium max-w-xs">
            SOS Alert will be sent automatically to your ride group in:
          </p>
          <div className="text-[120px] leading-none font-semibold text-white mb-12 tabular-nums">
            {countdown}
          </div>
          <button 
            onClick={cancelCountdown}
            className="w-full max-w-sm bg-white text-danger hover:bg-gray-100 font-semibold text-2xl py-6 rounded-full shadow-2xl transition-transform active:scale-95"
          >
            CANCEL SOS
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveRide;
