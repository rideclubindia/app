import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ShieldAlert, AlertTriangle, Car, Ban, Waves,
  Shield, Hammer, MoreHorizontal, Navigation2, Compass, X, Users, LogOut, MessageCircle,
  Crosshair, Layers, StopCircle, Coffee, Fuel, Utensils, BedDouble, Droplets, Camera, MapPin, RefreshCw, ArrowUp, ArrowLeft, ArrowRight, CornerUpLeft, CornerUpRight,
  Edit2, History
, ChevronUp, Route as RouteIcon, Search, Hospital, SquareParking, Landmark, Plus, Check, Loader2, Flag, Trash2 } from 'lucide-react';

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
import { useAccidentDetection, getAccidentPreference, setAccidentPreference, requestMotionPermission } from '../../lib/crashDetection/useAccidentDetection';
import { AccidentCountdownOverlay, AccidentSetupPrompt, AccidentDebugPanel, accidentStatusText } from '../../components/AccidentDetection';
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
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';

import { getRouteOrigin, upcomingStops } from '../../lib/routeOrigin';
import { triggerSos, resumePendingSos, resolveSos, resolveSosLocation, reportLocationFix } from '../../lib/sos/sosOrchestrator';
import { getMyProfile } from '../../lib/myProfile';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjZlZTI0N2U2NGIwNjQwYTY5N2E0ZGJkMzVlZmYyMDI5IiwiaCI6Im11cm11cjY0In0=';

const LiveRide = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // The Ride screen is one of only two screens allowed to be landscape —
  // locks on mount, and this hook restores portrait automatically on
  // unmount (back button, end ride, tab switch, or any other exit).
  useOrientationLock('any');

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchCat, setSearchCat] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingPlaceId, setAddingPlaceId] = useState<string | null>(null);
  const previewMarkerRef = useRef<maplibregl.Marker | null>(null);
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
  const [accidentPref, setAccidentPref] = useState(getAccidentPreference);
  const [isCrashDetectionActive, setIsCrashDetectionActive] = useState(() => getAccidentPreference() === 'on');
  const [sosData, setSosData] = useState<any>(null);
  const [isReceivingSOS, setIsReceivingSOS] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const telemetryFailCountRef = useRef(0);
  const lastLocSaveRef = useRef(0);
  const [activeSosId, setActiveSosId] = useState<string | null>(null);
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
  const appliedStyleRef = useRef<string | null>(null);
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
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', uids);
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
      const myP = await getMyProfile(true);
      if (myP) {
        setCurrentUserProfile(myP);
        if (!myP.bike_details || !myP.emergency_contact) setShowEmergencySetup(true);
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

    // A manual drag pauses auto-follow; the recenter button resumes it
    m.on('dragstart', (e: any) => { if (e.originalEvent) { setIsFollowingUser(false); setFocusedRiderId(null); } });

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
        reportLocationFix(lat, lng, pos.coords.accuracy);
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
          // GPS heading is null/noisy when slow or stopped — follow the route direction instead
          let arrowBearing: number | null = heading != null && !isNaN(heading) && (speed ?? 0) > 2 ? heading : null;
          if (arrowBearing === null && routeFeatureRef.current) {
            try {
              const line = turf.lineString(routeFeatureRef.current.geometry.coordinates);
              const near = turf.nearestPointOnLine(line, turf.point([lng, lat]));
              const along = (near.properties as any).location as number;
              const ahead = turf.along(line, Math.min(along + 0.03, turf.length(line)));
              if (along < turf.length(line)) arrowBearing = turf.bearing(near, ahead);
            } catch { /* keep last rotation */ }
          }
          if (arrowBearing !== null) {
            riderMarkersRef.current[auth.currentUser?.uid || 'me']?.setRotation(arrowBearing);
          }
        }

        // Add self to riders panel on first fix
        const user = getAppUser(auth.currentUser);
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
          // persist to ride_locations too so other riders' maps always see this rider
          if (Date.now() - lastLocSaveRef.current > 5000) {
            lastLocSaveRef.current = Date.now();
            const memberId = user.uid.length === 36 ? user.uid : getDeterministicUuid(user.uid);
            supabase.from('ride_locations').upsert(
              { ride_id: id, user_id: memberId, latitude: lat, longitude: lng, speed: speedKph, updated_at: new Date().toISOString() },
              { onConflict: 'ride_id,user_id' },
            ).then(({ error }) => { if (error) console.warn('ride_locations upsert failed', error.message); });
          }
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

  // Android foreground service keeps sharing location while the screen is off or the app is in the background
  useEffect(() => {
    if (!id || !Capacitor.isNativePlatform()) return;
    let watcherId: string | null = null;
    let cancelled = false;
    BackgroundGeolocation.addWatcher(
      {
        backgroundTitle: 'RideClub is tracking your ride',
        backgroundMessage: 'Sharing your live location with your group',
        requestPermissions: true,
        stale: false,
        distanceFilter: 10,
      },
      (loc, err) => {
        if (err) {
          if (err.code === 'NOT_AUTHORIZED') showToast('Allow location access so your group can see you when the screen is off', 'error');
          return;
        }
        const user = getAppUser(auth.currentUser);
        if (!loc) return;
        reportLocationFix(loc.latitude, loc.longitude, loc.accuracy);
        if (!user) return;
        const speedKph = loc.speed != null ? loc.speed * 3.6 : 0;
        getRealtime().sendLocation(id, { lat: loc.latitude, lng: loc.longitude, speed: speedKph, heading: loc.bearing ?? 0 });
        if (Date.now() - lastLocSaveRef.current > 5000) {
          lastLocSaveRef.current = Date.now();
          const memberId = user.uid.length === 36 ? user.uid : getDeterministicUuid(user.uid);
          supabase.from('ride_locations').upsert(
            { ride_id: id, user_id: memberId, latitude: loc.latitude, longitude: loc.longitude, speed: speedKph, updated_at: new Date().toISOString() },
            { onConflict: 'ride_id,user_id' },
          ).then(({ error }) => { if (error) console.warn('ride_locations upsert failed', error.message); });
        }
      },
    ).then((wid) => {
      if (cancelled) BackgroundGeolocation.removeWatcher({ id: wid });
      else watcherId = wid;
    }).catch((e) => console.warn('Background location unavailable', e));
    return () => {
      cancelled = true;
      if (watcherId) BackgroundGeolocation.removeWatcher({ id: watcherId });
    };
  }, [id]);

  // ─── Personal route: always from the rider's latest location through the stops still ahead ───
  const [routeTick, setRouteTick] = useState(0);
  const lastRouteCalcRef = useRef(0);
  const stopsKey = rideStops.map((st: any) => `${st.id}:${st.sequence}:${st.latitude},${st.longitude}`).join('|');
  const hasFix = !!(userLocation || globalLocation);

  useEffect(() => {
    const onResume = () => { if (document.visibilityState === 'visible') setRouteTick((t) => t + 1); };
    document.addEventListener('visibilitychange', onResume);
    window.addEventListener('online', onResume);
    return () => { document.removeEventListener('visibilitychange', onResume); window.removeEventListener('online', onResume); };
  }, []);

  // Off-route by more than 250 m: recalculate from where the rider is now (at most every 30 s)
  useEffect(() => {
    const here = userLocation;
    const line = routeFeatureRef.current?.geometry?.coordinates;
    if (!here || !line || line.length < 2) return;
    if (Date.now() - lastRouteCalcRef.current < 30000) return;
    try {
      const off = turf.pointToLineDistance(turf.point([here.lng, here.lat]), turf.lineString(line), { units: 'kilometers' });
      if (off > 0.25) setRouteTick((t) => t + 1);
    } catch { /* ignore malformed line */ }
  }, [userLocation]);

  useEffect(() => {
    if (!hasFix || !rideStops.length) return;
    const origin = getRouteOrigin(userLocationRef.current || userLocation || globalLocation);
    if (!origin) return;
    const ordered = [...rideStops]
      .filter((st: any) => typeof st.latitude === 'number' && typeof st.longitude === 'number' && !/start|origin/i.test(st.stop_type || ''))
      .sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0))
      .map((st: any) => ({ ...st, lng: st.longitude, lat: st.latitude }));
    if (!ordered.length) return;
    const ahead = upcomingStops(origin, ordered, (a, b) => turf.distance(turf.point(a), turf.point(b)));
    const coords = [origin, ...ahead.map((st: any) => [st.lng, st.lat])];
    let cancelled = false;
    lastRouteCalcRef.current = Date.now();
    (async () => {
      try {
        const { fetchTomTomRoute } = await import('../../lib/routing');
        const feature = await fetchTomTomRoute(coords, ride?.vehicle_type === 'bike' ? 'motorcycle' : 'driving-car');
        if (!feature || cancelled) return;
        setRouteFeature(feature);
        setTotalDuration(feature.properties.summary.duration);
        setTotalDistance(feature.properties.summary.distance / 1000);
      } catch (e) {
        console.debug('Personal route skipped:', (e as Error).message);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopsKey, hasFix, routeTick]);

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
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', uids);
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

  // SOS must never be blocked on GPS or profile loading; missing data is shown as unavailable
  const handleSOS = () => {
    const loc = resolveSosLocation(userLocation || globalLocation);
    const me = getAppUser(auth.currentUser);
    setSosData({
      coordinates: loc ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : 'Location unavailable',
      riderName: currentUserProfile?.full_name || me?.displayName || 'Unknown Rider',
      bikeDetails: currentUserProfile?.bike_details || 'Not provided',
      bloodGroup: currentUserProfile?.blood_group || 'Not provided',
      emergencyContact: currentUserProfile?.emergency_contact || 'Not provided'
    });
    setIsReceivingSOS(false);
    setShowSOSModal(true);
  };

  const handleTriggerSOS = async (extra?: Record<string, unknown>) => {
    const user = getAppUser(auth.currentUser);
    if (!user || !id) return;
    const ev = await triggerSos({
      rideId: id,
      memberUid: user.uid,
      riderName: currentUserProfile?.full_name || user.displayName || user.email?.split('@')[0] || 'A RideClub rider',
      rideName: ride?.title || ride?.name || null,
      liveLocation: userLocation || globalLocation,
      emergencyContactRaw: currentUserProfile?.emergency_contact,
      payload: { ...(sosData || {}), ...(extra || {}) },
    });
    setActiveSosId(ev.id);
    setShowSOSModal(true);
  };

  // Resume queued SOS deliveries (e.g. after an app restart while offline)
  useEffect(() => {
    const user = getAppUser(auth.currentUser);
    if (user) resumePendingSos(user.uid);
  }, []);

  const handleRevokeSOS = async () => {
    const user = getAppUser(auth.currentUser);
    if (!user || !id) return;
    if (activeSosId) resolveSos(activeSosId);
    setActiveSosId(null);
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

  const accident = useAccidentDetection({
    rideId: id,
    enabled: isCrashDetectionActive,
    speedKph: userLocation ? currentSpeedKph : null,
    getLocation: () => {
      const loc = resolveSosLocation(userLocation || globalLocation);
      return loc ? { lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy, speedKph: currentSpeedKph, isStale: loc.stale } : null;
    },
    onConfirmed: (c, outcome) => {
      setSosData((prev: any) => prev || {
        coordinates: 'Location unavailable', riderName: currentUserProfile?.full_name || 'Unknown Rider',
        bikeDetails: currentUserProfile?.bike_details || 'Not provided', bloodGroup: currentUserProfile?.blood_group || 'Not provided',
        emergencyContact: currentUserProfile?.emergency_contact || 'Not provided',
      });
      setIsReceivingSOS(false);
      handleTriggerSOS({ trigger: 'automatic_crash_sos', outcome, confidence: Number(c.confidence.toFixed(2)), peak_g: Number(c.peakAccelMagnitudeG.toFixed(1)) });
    },
    debug: import.meta.env.DEV,
  });

  const enableAccidentDetection = async () => {
    const ok = await requestMotionPermission();
    setAccidentPref(ok ? 'on' : 'off');
    setAccidentPreference(ok ? 'on' : 'off');
    setIsCrashDetectionActive(ok);
    if (!ok) showToast('Motion access was denied, so accident detection is off. You can turn it on later from the SOS screen.', 'error');
  };

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

    // Same style already applied: just refresh the route line instead of reloading the whole map
    if (appliedStyleRef.current === mapStyle && map.current.isStyleLoaded()) {
      const route = map.current.getSource('route') as maplibregl.GeoJSONSource | undefined;
      const remaining = map.current.getSource('route-remaining') as maplibregl.GeoJSONSource | undefined;
      if (route && remaining && routeFeature) { route.setData(routeFeature); remaining.setData(routeFeature); }
      else handleStyleLoad();
      return;
    }

    appliedStyleRef.current = mapStyle;
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
    .filter((st: any) => typeof st.latitude === 'number' && typeof st.longitude === 'number')
    .sort((x: any, y: any) => (x.sequence ?? 0) - (y.sequence ?? 0))
    .map((st: any) => {
      const here = userLocation || globalLocation;
      const km = here ? turf.distance(turf.point([here.lng, here.lat]), turf.point([st.longitude, st.latitude])) : null;
      const pace = avgSpeed > 10 ? avgSpeed : 40;
      const at = km != null ? new Date(Date.now() + (km / pace) * 3600000) : null;
      return {
        key: st.id || `${st.sequence}-${st.stop_name}`,
        id: st.id,
        name: st.stop_name || 'Stop',
        isDest: st.stop_type === 'Destination',
        isStart: /start|origin/i.test(st.stop_type || ''),
        addedBy: st.added_by_name ? String(st.added_by_name).split(' ')[0] : null,
        dist: km == null ? '--' : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`,
        eta: at ? at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--',
      };
    });
  const SEARCH_CATEGORIES = [
    { id: 'fuel', label: 'Fuel', icon: Fuel },
    { id: 'restaurant', label: 'Food', icon: Utensils },
    { id: 'cafe', label: 'Café', icon: Coffee },
    { id: 'hotel', label: 'Hotels', icon: BedDouble },
    { id: 'hospital', label: 'Hospital', icon: Hospital },
    { id: 'parking', label: 'Parking', icon: SquareParking },
    { id: 'tourist attraction', label: 'Sights', icon: Landmark },
  ];

  // Nominatim search biased to ~40 km around the rider, falling back to an unbounded search
  const runPlaceSearch = async (term: string) => {
    const q = term.trim();
    if (!q) { setSearchResults([]); return; }
    const here = userLocation || globalLocation;
    setSearching(true);
    try {
      const base = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=20&q=${encodeURIComponent(q)}`;
      const box = here ? `&viewbox=${here.lng - 0.4},${here.lat + 0.4},${here.lng + 0.4},${here.lat - 0.4}&bounded=1` : '';
      let data: any[] = await (await fetch(base + box)).json();
      if ((!data || data.length === 0) && box) data = await (await fetch(base)).json();
      const rows = (data || []).map((r: any) => {
        const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
        const km = here ? turf.distance(turf.point([here.lng, here.lat]), turf.point([lng, lat])) : null;
        const name = r.name || String(r.display_name || '').split(',')[0];
        return {
          id: String(r.place_id),
          name,
          type: String(r.type || r.category || 'place').replace(/_/g, ' '),
          address: String(r.display_name || '').split(',').slice(1, 4).join(',').trim(),
          lat, lng, km,
        };
      });
      rows.sort((a: any, b: any) => (a.km ?? 9e9) - (b.km ?? 9e9));
      setSearchResults(rows);
    } catch (e) {
      console.error('Place search failed', e);
      showToast('Search failed — check your connection', 'error');
    } finally {
      setSearching(false);
    }
  };

  const previewPlace = (p: any) => {
    if (!map.current) return;
    setIsFollowingUser(false);
    previewMarkerRef.current?.remove();
    const el = document.createElement('div');
    el.style.cssText = 'width:34px;height:34px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:#111827;border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.3);';
    previewMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.lng, p.lat]).addTo(map.current);
    map.current.easeTo({ center: [p.lng, p.lat], zoom: 15, pitch: 0, duration: 800 });
  };

  const closeSearch = () => {
    setSearchOpen(false);
    previewMarkerRef.current?.remove();
    previewMarkerRef.current = null;
  };

  const deleteStop = async (stopId: string, name: string) => {
    if (!id || !isAdmin || !window.confirm(`Remove ${name} from stops?`)) return;
    try {
      const { error } = await supabase.from('ride_stops').delete().eq('id', stopId);
      if (error) throw error;
      const me = getAppUser(auth.currentUser);
      const myName = (me && (riders[me.uid]?.display_name || me.displayName || me.email?.split('@')[0])) || 'Ride leader';
      const { data: fresh } = await supabase.from('ride_stops').select('*').eq('ride_id', id);
      const rest = (fresh || []).sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0));
      for (const [i, st] of rest.entries()) {
        if (st.sequence !== i) await supabase.from('ride_stops').update({ sequence: i }).eq('id', st.id);
      }
      const coords = rest.filter((st: any) => typeof st.latitude === 'number').map((st: any) => [st.longitude, st.latitude]);
      try {
        if (coords.length >= 2) {
          const { fetchTomTomRoute } = await import('../../lib/routing');
          const geom = await fetchTomTomRoute(coords, 'driving-car');
          if (geom) await supabase.from('rides').update({ route_geometry: geom }).eq('id', id);
        }
      } catch (e) {
        console.warn('Route recalculation after removing stop failed', e);
      }
      await supabase.from('ride_edit_log').insert({ ride_id: id, editor_id: me?.uid, editor_name: myName, edit_type: 'stop_removed', changes: { stop: name } });
      await supabase.from('ride_events').insert({
        ride_id: id, user_id: me?.uid, event_type: 'RIDE_UPDATED',
        description: `Stop removed: ${name}`,
        payload: { editor_name: myName, edit_types: ['stop_removed'], changes_summary: name },
      });
      await handleRideUpdated();
      showToast(`Removed from stops · ${name}`, 'success');
    } catch (e: any) {
      console.error('Remove stop failed', e);
      showToast(e?.message || 'Could not remove this stop', 'error');
    }
  };

  const addPlaceAsStop = async (p: any) => {
    if (!id || addingPlaceId) return;
    const dup = rideStops.find((st: any) =>
      typeof st.latitude === 'number' && turf.distance(turf.point([st.longitude, st.latitude]), turf.point([p.lng, p.lat])) < 0.15);
    if (dup) { showToast(`${dup.stop_name || 'This place'} is already in stops`, 'info'); return; }

    setAddingPlaceId(p.id);
    try {
      const me = getAppUser(auth.currentUser);
      const myName = (me && (riders[me.uid]?.display_name || me.displayName || me.email?.split('@')[0])) || 'A rider';
      const ordered = [...rideStops].sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0))
        .filter((st: any) => typeof st.latitude === 'number');
      const km = (a: number[], b: number[]) => turf.distance(turf.point(a), turf.point(b));
      const here = userLocation || globalLocation;
      const pt = (st: any) => [st.longitude, st.latitude];
      const startStop = ordered[0] && /start|origin/i.test(ordered[0].stop_type || '') ? ordered[0] : null;
      const destStop = [...ordered].reverse().find((st: any) => st.stop_type === 'Destination') || null;
      const newStop = { id: '__new__', stop_name: p.name, latitude: p.lat, longitude: p.lng };
      const middle = [...ordered.filter((st: any) => st !== startStop && st !== destStop), newStop];
      const origin = here ? [here.lng, here.lat] : startStop ? pt(startStop) : pt(middle[0]);

      // re-optimise the whole middle order: nearest-neighbour from the rider, then 2-opt with the destination fixed last
      const route: any[] = [];
      const left = [...middle];
      let cur = origin;
      while (left.length) {
        let bi = 0;
        left.forEach((st, i) => { if (km(cur, pt(st)) < km(cur, pt(left[bi]))) bi = i; });
        cur = pt(left[bi]);
        route.push(left.splice(bi, 1)[0]);
      }
      const nodes = () => [origin, ...route.map(pt), ...(destStop ? [pt(destStop)] : [])];
      for (let improved = true, guard = 0; improved && guard < 50; guard++) {
        improved = false;
        for (let i = 0; i < route.length - 1; i++) {
          for (let j = i + 1; j < route.length; j++) {
            const n = nodes();
            const a = n[i], b = n[i + 1], c = n[j + 1], d = n[j + 2];
            const delta = km(a, c) + (d ? km(b, d) : 0) - km(a, b) - (d ? km(c, d) : 0);
            if (delta < -0.01) { route.splice(i, j - i + 1, ...route.slice(i, j + 1).reverse()); improved = true; }
          }
        }
      }
      const finalOrder = [...(startStop ? [startStop] : []), ...route, ...(destStop ? [destStop] : [])];
      const newSeq = finalOrder.indexOf(newStop);
      const bestIdx = newSeq;
      const orderedView = finalOrder.filter(st => st !== newStop);

      for (const [i, st] of finalOrder.entries()) {
        if (st !== newStop && st.sequence !== i) await supabase.from('ride_stops').update({ sequence: i }).eq('id', st.id);
      }

      const row: any = { ride_id: id, stop_name: p.name, latitude: p.lat, longitude: p.lng, sequence: newSeq, stop_type: 'Stop', added_by_name: myName };
      let { error } = await supabase.from('ride_stops').insert(row);
      if (error && /added_by_name/i.test(error.message || '')) {
        // column not migrated yet — still add the stop
        delete row.added_by_name;
        ({ error } = await supabase.from('ride_stops').insert(row));
      }
      if (error) throw error;

      // recompute and share the route so every rider's map follows the new stop
      const { data: fresh } = await supabase.from('ride_stops').select('*').eq('ride_id', id);
      const coords = (fresh || [])
        .sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0))
        .filter((st: any) => typeof st.latitude === 'number')
        .map((st: any) => [st.longitude, st.latitude]);
      try {
        if (coords.length >= 2) {
          const { fetchTomTomRoute } = await import('../../lib/routing');
          const geom = await fetchTomTomRoute(coords, 'driving-car');
          if (geom) await supabase.from('rides').update({ route_geometry: geom }).eq('id', id);
        }
      } catch (e) {
        console.warn('Route recalculation after adding stop failed', e);
      }

      await supabase.from('ride_edit_log').insert({ ride_id: id, editor_id: me?.uid, editor_name: myName, edit_type: 'stop_added', changes: { stop: p.name } });
      await supabase.from('ride_events').insert({
        ride_id: id, user_id: me?.uid, event_type: 'RIDE_UPDATED',
        description: `Stop added: ${p.name}`,
        payload: { editor_name: myName, edit_types: ['stop_added'], changes_summary: p.name },
      });

      await handleRideUpdated();
      const after = orderedView[bestIdx - 1]?.stop_name, before = orderedView[bestIdx]?.stop_name;
      showToast(`Added to stops · ${p.name}${after && before ? ` (between ${after} and ${before})` : before ? ` (before ${before})` : ''}`, 'success');
    } catch (e: any) {
      console.error('Add stop failed', e);
      showToast(e?.message || 'Could not add this stop', 'error');
    } finally {
      setAddingPlaceId(null);
    }
  };

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
          <div className="px-4 mt-2 mb-5 flex items-center gap-2 shrink-0">
            <div className="min-w-0 flex-1">
              <span className="text-gray-950 font-bold text-[18px] leading-tight block truncate">{ride?.name || 'Live Ride'}</span>
              <div className="flex items-center gap-2 mt-1 text-[13px] font-medium text-gray-500">
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

          {/* Trip card (portrait) — the landscape ETA card carries the same info */}
          <div className="hidden portrait:block px-4 mb-3 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200/80 px-4 pt-4 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-gray-500">Trip progress</span>
                <span className="text-[12px] font-bold text-[#FF5A00] bg-orange-50 rounded-full px-2.5 py-0.5 tabular-nums">{Math.round(progress * 100)}%</span>
              </div>
              <p className="mt-1.5 text-[22px] font-bold text-gray-950 tabular-nums leading-none">
                {userDistKm.toFixed(1)} <span className="text-[15px] font-medium text-gray-500">of {totalDistance.toFixed(1)} km</span>
              </p>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-[#FF5A00] rounded-full transition-all duration-1000" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-100 mt-4 pt-3 border-t border-gray-100 text-center">
                {[
                  { label: 'Remaining', value: `${Math.max(0, totalDistance - userDistKm).toFixed(1)} km` },
                  { label: 'Avg speed', value: `${avgSpeed} km/h` },
                  { label: 'Max speed', value: `${maxSpeed} km/h` },
                ].map((st) => (
                  <div key={st.label} className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{st.label}</span>
                    <span className="text-[15px] font-bold text-gray-950 tabular-nums">{st.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Speedometer */}
          <div className="shrink-0 mb-2 portrait:mb-5">
            <SpeedometerCluster speed={currentSpeedKph || 0} hideSpeedInPortrait />
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
                <div className="mt-2 flex flex-col gap-3 pb-6">
                  <div>
                    <h3 className="text-[15px] font-bold text-[#111111]">Route</h3>
                    <p className="text-[12px] text-gray-500">{routeStopRows.length} {routeStopRows.length === 1 ? 'stop' : 'stops'} · distance and ETA from you</p>
                  </div>
                  {routeStopRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl border border-dashed border-gray-200 bg-white">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3"><MapPin className="w-6 h-6 text-gray-400" /></div>
                      <p className="text-[#111111] font-semibold text-sm">No stops on this ride</p>
                      <p className="text-gray-500 text-xs mt-1">Use Search on the map to add one</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-gray-200 bg-white px-3.5 py-1">
                      {routeStopRows.map((st, i) => {
                        const last = i === routeStopRows.length - 1;
                        return (
                          <div key={st.key} className="flex items-stretch gap-3">
                            <div className="flex flex-col items-center w-10 shrink-0">
                              <div className={`w-px flex-none h-3 ${i === 0 ? 'bg-transparent' : 'bg-gray-200'}`} />
                              <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-bold shrink-0 ${st.isDest ? 'bg-gray-900 text-white' : st.isStart ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-[#ef4523]'}`}>
                                {st.isDest ? <MapPin className="w-5 h-5" /> : st.isStart ? <Flag className="w-5 h-5" /> : String(i + (routeStopRows[0]?.isStart ? 0 : 1)).padStart(2, '0')}
                              </span>
                              <div className={`w-px flex-1 ${last ? 'bg-transparent' : 'bg-gray-200'}`} />
                            </div>
                            <div className={`flex-1 min-w-0 flex items-start gap-2 pt-3 pb-3 ${last ? '' : 'border-b border-gray-100'}`}>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-[#111111] truncate">{st.name}</p>
                                <p className="text-[11px] text-gray-500 mt-1 truncate">{st.isDest ? 'Destination' : st.isStart ? 'Start' : st.addedBy ? `Added by ${st.addedBy}` : 'Stop'}</p>
                              </div>
                              <div className="text-right shrink-0 tabular-nums">
                                <p className="text-[13px] font-semibold text-[#111111]">{st.dist}</p>
                                <p className="text-[11px] text-gray-500 mt-1">{st.isStart ? 'Starting point' : `ETA ${st.eta}`}</p>
                              </div>
                              {isAdmin && !st.isStart && !st.isDest && st.id && (
                                <button onClick={() => deleteStop(st.id, st.name)} aria-label={`Remove ${st.name}`} className="w-10 h-10 -my-1 rounded-xl flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-gray-100 active:scale-95 transition-colors shrink-0">
                                  <Trash2 className="w-[18px] h-[18px]" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Activity Log Tab ── */}
              {activeTab === 'activity' && (
                <div className="mt-2 flex flex-col gap-3 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[15px] font-bold text-[#111111]">Ride activity</h3>
                      <p className="text-[12px] text-gray-500">{editLog.length} {editLog.length === 1 ? 'change' : 'changes'} during this ride</p>
                    </div>
                    {isAdmin && (
                      <button onClick={() => navigate(`/ride-plus/create`, { state: { editRideId: id } })} className="h-11 text-[13px] font-semibold text-[#111111] flex items-center gap-1.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors active:scale-95">
                        <Edit2 className="w-4 h-4" /> Edit ride
                      </button>
                    )}
                  </div>
                  {editLog.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl border border-dashed border-gray-200 bg-white">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3"><History className="w-6 h-6 text-gray-400" /></div>
                      <p className="text-[#111111] font-semibold text-sm">No activity yet</p>
                      <p className="text-gray-500 text-xs mt-1">Stops added and ride edits will show here</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
                      {editLog.map((entry: any, idx: number) => {
                        const types: string[] = String(entry.edit_type || 'edit').split(/,\s*/);
                        const isStop = types.some(t => /stop/.test(t));
                        const Icon = isStop ? MapPin : types.some(t => /route/.test(t)) ? RouteIcon : Edit2;
                        const title = types.map(t => t.replace(/_/g, ' ')).join(' · ');
                        const detail = entry.changes?.stop || Object.keys(entry.changes || {}).map(k => k.replace(/_/g, ' ')).join(', ');
                        const d = new Date(entry.created_at);
                        return (
                          <div key={entry.id || idx} className="flex items-start gap-3 p-3.5">
                            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${isStop ? 'bg-orange-50 text-[#ef4523]' : 'bg-gray-100 text-[#111111]'}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <p className="text-[13px] font-semibold text-[#111111] capitalize truncate">{title}</p>
                                <span className="text-[11px] text-gray-500 shrink-0 tabular-nums">{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              {detail && <p className="text-[12px] text-gray-700 mt-0.5 truncate">{detail}</p>}
                              <p className="text-[11px] text-gray-500 mt-1">by {entry.editor_name || 'Ride leader'} · {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                            </div>
                          </div>
                        );
                      })}
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
          <div className={`absolute landscape:right-3 portrait:left-3 z-20 flex flex-col gap-3 landscape:top-1/2 landscape:-translate-y-1/2 portrait:bottom-[calc(var(--sheet-h)+12px)] portrait:transition-[bottom] portrait:duration-300 ${sheetTall ? 'portrait:hidden' : ''}`}>
            <button
              onClick={() => { setSearchOpen(true); setMoreOpen(false); }}
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-md bg-white/95 backdrop-blur border border-gray-100 text-[#111111] hover:bg-gray-50 active:scale-95 transition-all"
              title="Search places"
              aria-label="Search places"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setShowUsersModal(true); setMoreOpen(false); }}
              className="relative w-12 h-12 rounded-full flex items-center justify-center shadow-md bg-white/95 backdrop-blur border border-gray-100 text-[#111111] hover:bg-gray-50 active:scale-95 transition-all"
              title="Riders"
              aria-label="Riders"
            >
              <Users className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#FF5A00] text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                {Object.values(riders).filter((r: any) => r.status !== 'pending').length}
              </span>
            </button>
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
              className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-all duration-300 shadow-md ${is3D ? 'bg-white text-[#FF5A00] ring-2 ring-[#FF5A00]' : 'bg-white/95 backdrop-blur border border-gray-100 text-[#111111] hover:bg-gray-50'}`}
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
              className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-all duration-300 shadow-md ${isFollowingUser && !focusedRiderId ? 'bg-white text-[#FF5A00] ring-2 ring-[#FF5A00]' : 'bg-white/95 backdrop-blur border border-gray-100 text-[#111111] hover:bg-gray-50'}`}
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

          {/* Search places → pin as stop */}
          {searchOpen && (
            <div className="absolute z-40 inset-x-0 top-0 portrait:max-h-[62%] landscape:left-3 landscape:right-auto landscape:top-3 landscape:w-[380px] landscape:max-h-[calc(100%-24px)] landscape:rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] portrait:rounded-b-3xl flex flex-col overflow-hidden">
              <form
                onSubmit={(e) => { e.preventDefault(); setSearchCat(null); runPlaceSearch(searchQ); }}
                className="flex items-center gap-2 px-3 pt-3 pb-2"
              >
                <button type="button" onClick={closeSearch} aria-label="Close search" className="w-11 h-11 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 flex items-center gap-2 h-12 px-4 rounded-full bg-gray-100">
                  <Search className="w-5 h-5 text-gray-500 shrink-0" />
                  <input
                    autoFocus
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Search places, fuel, food, hotels…"
                    className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-gray-950 placeholder:text-gray-500"
                    aria-label="Search places"
                  />
                  {searchQ && (
                    <button type="button" onClick={() => { setSearchQ(''); setSearchResults([]); }} aria-label="Clear" className="text-gray-500"><X className="w-4 h-4" /></button>
                  )}
                </div>
              </form>

              <div className="flex gap-2 overflow-x-auto hide-scrollbar px-3 pb-3">
                {SEARCH_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setSearchCat(c.id); setSearchQ(''); runPlaceSearch(c.id); }}
                    className={`shrink-0 h-10 px-3.5 rounded-full border flex items-center gap-1.5 text-[14px] font-semibold transition-colors ${searchCat === c.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 border-gray-200'}`}
                  >
                    <c.icon className="w-4 h-4" /> {c.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto border-t border-gray-100">
                {searching ? (
                  <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 text-[#FF5A00] animate-spin" /></div>
                ) : searchResults.length === 0 ? (
                  <p className="py-8 px-6 text-center text-[14px] text-gray-500">
                    {searchQ || searchCat ? 'No places found nearby.' : 'Search for any place, or pick a category above.'}
                  </p>
                ) : (
                  <ul>
                    {searchResults.map((p) => {
                      const inStops = rideStops.some((st: any) => typeof st.latitude === 'number' && turf.distance(turf.point([st.longitude, st.latitude]), turf.point([p.lng, p.lat])) < 0.15);
                      return (
                        <li key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
                          <button onClick={() => previewPlace(p)} className="flex-1 min-w-0 text-left">
                            <p className="text-[15px] font-semibold text-gray-950 truncate">{p.name}</p>
                            <p className="text-[13px] text-gray-500 truncate">
                              <span className="capitalize">{p.type}</span>
                              {p.km != null && <> · {p.km < 1 ? `${Math.round(p.km * 1000)} m` : `${p.km.toFixed(1)} km`}</>}
                              {p.address && <> · {p.address}</>}
                            </p>
                          </button>
                          <button
                            onClick={() => addPlaceAsStop(p)}
                            disabled={inStops || addingPlaceId === p.id}
                            aria-label={inStops ? 'Already in stops' : `Add ${p.name} to stops`}
                            className={`h-11 px-3.5 rounded-full flex items-center gap-1.5 text-[13px] font-bold shrink-0 transition-colors ${inStops ? 'bg-emerald-50 text-emerald-700' : 'bg-[#FF5A00] text-white active:scale-95'}`}
                          >
                            {addingPlaceId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : inStops ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {inStops ? 'Added' : 'Add stop'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
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
              <button onClick={() => navigate(`/rider/${tappedRider.user_id}`)} className="h-11 px-4 rounded-full border border-gray-200 text-[13px] font-semibold text-gray-900 shrink-0">Profile</button>
              <button onClick={() => setTappedRiderId(null)} aria-label="Close rider card" className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Round speed gauge above the drawer (portrait) */}
          <div className={`hidden ${sheetTall ? '' : 'portrait:flex'} absolute right-3 z-20 w-[92px] h-[92px] rounded-full bg-white shadow-[0_6px_18px_rgba(0,0,0,0.16)] items-center justify-center portrait:bottom-[calc(var(--sheet-h)+12px)] transition-[bottom] duration-300`} aria-label={`${Math.round(currentSpeedKph || 0)} km/h`}>
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
            <div className={`absolute top-3 portrait:top-[92px] left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-300 w-max max-w-[calc(100%-160px)]`}>
              <div className="bg-red-500/90 backdrop-blur-md border border-red-400/50 text-white px-3.5 py-2 rounded-2xl font-semibold text-[12px] leading-tight flex items-center gap-2 shadow-[0_4px_14px_rgba(255,59,48,0.45)] animate-pulse">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{fmtHazard(nextHazard.remainingDist)} — {nextHazard.category?.split(':')[0]} Ahead</span>
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
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#273a5a] flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" /> Ride Members
              </h3>
              <button onClick={() => setShowUsersModal(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {(() => {
                const here = userLocation || globalLocation;
                const myUid = getAppUser(auth.currentUser)?.uid;
                const meIds = myUid ? [myUid, getDeterministicUuid(myUid)] : [];
                const rows = Object.values(riders)
                  .filter((r: any) => r.status !== 'pending')
                  .map((r: any) => {
                    const hasLoc = typeof r.latitude === 'number' && typeof r.longitude === 'number';
                    const isMe = meIds.includes(r.user_id);
                    const km = hasLoc && here && !isMe ? turf.distance(turf.point([here.lng, here.lat]), turf.point([r.longitude, r.latitude])) : null;
                    return { r, hasLoc, isMe, km };
                  })
                  .sort((a, b) => (a.isMe ? -1 : b.isMe ? 1 : (a.km ?? Infinity) - (b.km ?? Infinity)));
                return rows.map(({ r, hasLoc, isMe, km }) => (
                  <button
                    key={r.user_id}
                    disabled={!hasLoc}
                    onClick={() => {
                      setShowUsersModal(false);
                      setIsFollowingUser(false);
                      setFocusedRiderId(isMe ? null : r.user_id);
                      if (!isMe) setTappedRiderId(r.user_id);
                      map.current?.flyTo({ center: [r.longitude, r.latitude], zoom: 17, pitch: 0, duration: 1200 });
                    }}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-colors ${isMe ? 'bg-orange-50/60 border-orange-200' : 'bg-white border-gray-200'} ${hasLoc ? 'hover:bg-gray-50 active:scale-[0.99]' : 'opacity-70'}`}
                  >
                    <div className="relative shrink-0">
                      <img src={r.avatar_url || imgSoloRide} alt="" referrerPolicy="no-referrer" className="w-12 h-12 rounded-full border-2 border-white shadow-md object-cover bg-white" />
                      {r.role === 'admin' && <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-1 rounded-full border-2 border-white"><Shield className="w-3 h-3 text-white" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[#111111] flex items-center gap-2 truncate">
                        <span className="truncate">{r.display_name || 'Rider'}</span> {isMe && <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full shrink-0">You</span>}
                      </h4>
                      <p className="text-[13px] text-gray-500">
                        {!hasLoc ? 'Location not shared yet' : r.speed > 0 ? `${Math.round(r.speed)} km/h` : 'Stopped'}
                      </p>
                    </div>
                    {hasLoc && (
                      <div className="text-right shrink-0">
                        {km != null && <p className="text-[15px] font-bold text-[#111111] tabular-nums">{km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}</p>}
                        <p className="text-[12px] font-semibold text-[#ef4523] flex items-center justify-end gap-1"><Crosshair className="w-3.5 h-3.5" /> Show</p>
                      </div>
                    )}
                  </button>
                ));
              })()}
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
            getMyProfile(true).then((data) => { if (data) setCurrentUserProfile(data); });
          }}
          onClose={() => setShowEmergencySetup(false)}
        />
      )}

      {showSOSModal && sosData && (
        <SOSModal 
          isReceiving={isReceivingSOS}
          data={sosData}
          sosEventId={isReceivingSOS ? null : activeSosId}
          memberUid={getAppUser(auth.currentUser)?.uid || ''}
          onTrigger={handleTriggerSOS}
          onRevoke={handleRevokeSOS}
          onNavigate={handleSOSNavigate}
          isCrashDetectionActive={isCrashDetectionActive}
          crashDetectionStatus={accidentStatusText(isCrashDetectionActive, accident.availability)}
          onToggleCrashDetection={() => {
            if (isCrashDetectionActive) { setIsCrashDetectionActive(false); setAccidentPref('off'); setAccidentPreference('off'); }
            else enableAccidentDetection();
          }}
          onClose={() => {
            setShowSOSModal(false);
            setIsReceivingSOS(false);
          }}
        />
      )}
      {accident.level === 'POSSIBLE_ACCIDENT' && (
        <AccidentCountdownOverlay secondsLeft={accident.secondsLeft} onOk={accident.confirmOk} onSos={accident.sendSosNow} />
      )}
      {accidentPref === 'unset' && mapLoaded && !showSOSModal && (
        <AccidentSetupPrompt
          onAllow={enableAccidentDetection}
          onLater={() => { setAccidentPref('off'); setAccidentPreference('off'); }}
        />
      )}
      <AccidentDebugPanel snap={accident.debugSnap} level={accident.level} availability={accident.availability} />
    </div>
  );
};

export default LiveRide;
