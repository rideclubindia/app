import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUp, X, AlertTriangle, Car, Ban, Waves, Shield, Hammer, MoreHorizontal, Layers, Crosshair, Map, CornerUpLeft, CornerUpRight, ArrowLeft, ArrowRight, MapPin, Users, Crown, Phone, LogOut, Search as SearchIcon, Smartphone, Gauge, Clock, Route as RouteIcon, Plus, Coffee, Fuel, HeartPulse, Utensils, Hotel, Pill, Landmark, BatteryCharging, ParkingCircle, Wrench, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { supabase } from '../lib/supabase';
import { getTravelModeIcon } from '../components/TravelIcons';
import { IncidentDrawer } from '../components/IncidentDrawer';
import { useIncidentCategories, incidentIconMap } from '../hooks/useIncidentCategories';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getDeterministicUuid } from '../lib/user';
import { useLocationStore } from '../store/useLocationStore';
import { useToast } from '../components/ToastContext';
import { RiderCockpitLayout } from '../components/spatial/RiderCockpitLayout';
import { EdgeRail } from '../components/spatial/EdgeRail';
import { Telemetry } from '../components/spatial/Telemetry';
import { SpatialMembrane } from '../components/spatial/SpatialMembrane';
import LoadingSpinner from '../components/LoadingSpinner';
import { getRealtime } from '../realtime';
import { useOrientationLock } from '../hooks/useOrientationLock';
import { useCrashDetection } from '../lib/crashDetection/useCrashDetection';
import type { EmergencyLocation } from '../lib/crashDetection/emergencyManager';
import { EmergencyCountdownScreen } from '../components/spatial/EmergencyCountdownScreen';

// "Search along route" categories — matched against the raw query text so a
// rider can type "coffee shops", "petrol", "fuel stations", "hospitals", etc.
// and get real OSM POI results for that category, not a literal place-name
// geocode of the words they typed (that's what produced results thousands of
// km away for something like "Coffee near me" — Nominatim was trying to find
// a place literally NAMED that).
interface RouteSearchCategory {
  id: string;
  label: string;
  keywords: string[];
  overpassTag: string; // e.g. '["amenity"="cafe"]'
  icon: LucideIcon;
}

const ROUTE_SEARCH_CATEGORIES: RouteSearchCategory[] = [
  { id: 'fuel', label: 'Fuel', keywords: ['fuel', 'petrol', 'gas station', 'gas', 'diesel'], overpassTag: '["amenity"="fuel"]', icon: Fuel },
  { id: 'coffee', label: 'Coffee', keywords: ['coffee', 'cafe', 'café'], overpassTag: '["amenity"="cafe"]', icon: Coffee },
  { id: 'food', label: 'Food', keywords: ['food', 'restaurant', 'dining', 'eat', 'dhaba'], overpassTag: '["amenity"="restaurant"]', icon: Utensils },
  { id: 'parking', label: 'Parking', keywords: ['parking', 'park'], overpassTag: '["amenity"="parking"]', icon: ParkingCircle },
  { id: 'charging', label: 'Charging', keywords: ['charging', 'ev charg', 'ev station', 'charge point'], overpassTag: '["amenity"="charging_station"]', icon: BatteryCharging },
  { id: 'hospital', label: 'Hospital', keywords: ['hospital', 'clinic', 'medical', 'emergency room', 'er'], overpassTag: '["amenity"="hospital"]', icon: HeartPulse },
  { id: 'pharmacy', label: 'Pharmacy', keywords: ['pharmacy', 'chemist', 'medicine', 'drug store'], overpassTag: '["amenity"="pharmacy"]', icon: Pill },
  { id: 'atm', label: 'ATM', keywords: ['atm', 'cash', 'bank'], overpassTag: '["amenity"="atm"]', icon: Landmark },
  { id: 'hotel', label: 'Hotel', keywords: ['hotel', 'lodge', 'stay', 'motel', 'inn'], overpassTag: '["tourism"="hotel"]', icon: Hotel },
  { id: 'mechanic', label: 'Mechanic', keywords: ['mechanic', 'repair', 'garage', 'service center', 'tyre', 'tire'], overpassTag: '["shop"="car_repair"]', icon: Wrench },
];

const matchRouteSearchCategory = (query: string): RouteSearchCategory | null => {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return ROUTE_SEARCH_CATEGORIES.find((cat) => cat.keywords.some((kw) => q.includes(kw))) || null;
};

// Overpass element -> a normalized result shape shared with the Nominatim
// named-place fallback, so the rest of the UI doesn't care which one ran.
interface RouteSearchResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  category?: RouteSearchCategory;
  distFromRouteKm: number | null;
  distFromUserKm: number | null;
  estimatedDetourKm: number | null;
}

const searchPoisAlongRoute = async (
  category: RouteSearchCategory,
  routeLine: GeoJSON.Feature<GeoJSON.LineString> | null,
  origin: { lat: number; lng: number } | null,
  corridorKm = 2.5
): Promise<RouteSearchResult[]> => {
  // Corridor to search within: a buffer around the route if we have one,
  // otherwise a circle around the rider's current position.
  let bboxSouth: number, bboxWest: number, bboxNorth: number, bboxEast: number;
  if (routeLine) {
    const buffered = turf.buffer(routeLine, corridorKm, { units: 'kilometers' });
    const [west, south, east, north] = turf.bbox(buffered as any);
    bboxWest = west; bboxSouth = south; bboxEast = east; bboxNorth = north;
  } else if (origin) {
    const buffered = turf.buffer(turf.point([origin.lng, origin.lat]), 5, { units: 'kilometers' });
    const [west, south, east, north] = turf.bbox(buffered as any);
    bboxWest = west; bboxSouth = south; bboxEast = east; bboxNorth = north;
  } else {
    return [];
  }

  const bbox = `${bboxSouth},${bboxWest},${bboxNorth},${bboxEast}`;
  const overpassQuery = `[out:json][timeout:20];(node${category.overpassTag}(${bbox});way${category.overpassTag}(${bbox}););out center 40;`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(overpassQuery)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) throw new Error(`Overpass request failed: ${res.status}`);
  const data = await res.json();
  const elements: any[] = data?.elements || [];

  const results: RouteSearchResult[] = elements
    .map((el) => {
      const lat = el.type === 'node' ? el.lat : el.center?.lat;
      const lng = el.type === 'node' ? el.lon : el.center?.lon;
      if (lat == null || lng == null) return null;
      const name: string = el.tags?.name || `Unnamed ${category.label}`;
      const addressParts = [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean);

      let distFromRouteKm: number | null = null;
      if (routeLine) {
        distFromRouteKm = turf.pointToLineDistance(turf.point([lng, lat]), routeLine, { units: 'kilometers' });
      }
      let distFromUserKm: number | null = null;
      if (origin) {
        distFromUserKm = turf.distance(turf.point([origin.lng, origin.lat]), turf.point([lng, lat]), { units: 'kilometers' });
      }

      return {
        id: `osm-${el.type}-${el.id}`,
        name,
        lat,
        lng,
        address: addressParts.join(', ') || undefined,
        category,
        distFromRouteKm,
        distFromUserKm,
        // There-and-back estimate to leave the route and rejoin it — not a
        // routed detour calculation, labeled as an estimate in the UI.
        estimatedDetourKm: distFromRouteKm != null ? distFromRouteKm * 2 : null,
      } as RouteSearchResult;
    })
    .filter((r): r is RouteSearchResult => r !== null)
    // Enforce real "along/near the route" — the bbox is a rectangle around
    // the buffered corridor, wider than the corridor itself at the corners.
    .filter((r) => r.distFromRouteKm == null || r.distFromRouteKm <= corridorKm);

  // Prioritize closeness to the route first, current-location distance as a
  // light tiebreaker — matches "prioritized based on how close they are to
  // the route, while also considering distance from current location."
  results.sort((a, b) => {
    const scoreA = (a.distFromRouteKm ?? a.distFromUserKm ?? 0) + (a.distFromUserKm ?? 0) * 0.1;
    const scoreB = (b.distFromRouteKm ?? b.distFromUserKm ?? 0) + (b.distFromUserKm ?? 0) * 0.1;
    return scoreA - scoreB;
  });

  return results.slice(0, 10);
};

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { routeFeature, eta: initialEta, distance: initialDistance, destName, destLat, destLng, travelMode, isGroupMode: initialGroupMode } = location.state || {};

 // (back button, close, tab switch, or any other way of leaving).
  useOrientationLock('landscape');

  const [sessionId, setSessionId] = useState<string | null>(null);
  const hasStartedSessionRef = useRef(false);
  const persistedSessionIdRef = useRef<string | null>(null);
  const geolocationDeniedNotifiedRef = useRef(false);
  const [totalDistanceKm, setTotalDistanceKm] = useState<number>(() => {
    return initialDistance ? parseFloat(initialDistance) : 0;
  });

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [incidentsOnRoute, setIncidentsOnRoute] = useState<any[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const pinMarkersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const rootsRef = useRef<{ [id: string]: any }>({});
  const stopMarkersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const stopRootsRef = useRef<{ [id: string]: any }>({});

  const [mapBearing, setMapBearing] = useState(0);
  const [showTraffic, setShowTraffic] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
  const prevPosRef = useRef<{lat: number; lng: number; timestamp: number} | null>(null);
  const smoothedHeadingRef = useRef<number>(0);
  const isFollowingUserRef = useRef(true);
  useEffect(() => { isFollowingUserRef.current = isFollowingUser; }, [isFollowingUser]);
  
  const [currentRoute, setCurrentRoute] = useState(routeFeature);
  const [currentEta, setCurrentEta] = useState(initialEta);
  const [currentDistance, setCurrentDistance] = useState(initialDistance);
  const [isRerouting, setIsRerouting] = useState(false);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [groupRideCode, setGroupRideCode] = useState<string | null>(null);
  const [groupRideId, setGroupRideId] = useState<string | null>(null);
  const [isGroupMode, setIsGroupMode] = useState<boolean>(initialGroupMode || false);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  
  // Group Participant State
  const [participants, setParticipants] = useState<Record<string, any>>({});
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
  const [showParticipantList, setShowParticipantList] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const participantMarkersRef = useRef<Record<string, maplibregl.Marker>>({});
  const locationBroadcastRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const formatInstruction = (text: string) => {
    return text.replace(/Head (north|south|east|west|northeast|northwest|southeast|southwest)/i, 'Head straight');
  };

 // shows at all — otherwise it stays hidden instead of permanently
  // covering the map with a turn that's still far off.
  const TURN_CARD_VISIBLE_WITHIN_M = 200;

  const [currentInstruction, setCurrentInstruction] = useState<{ text: string; dist: string; type: number; distMeters: number | null }>(() => {
    let text = 'Head straight';
    let dist = '';
    let type = 6;
    let distMeters: number | null = null;
    if (routeFeature?.properties?.segments?.[0]?.steps?.[0]) {
      const step = routeFeature.properties.segments[0].steps[0];
      text = formatInstruction(step.instruction);
      type = step.type;
      distMeters = step.distance;
      dist = step.distance < 1000 ? `${Math.round(step.distance)} m` : `${(step.distance/1000).toFixed(1)} km`;
    }
    return { text, dist, type, distMeters };
  });

  const getTurnIcon = (type: number) => {
    switch (type) {
      case 0: return <ArrowLeft className="w-8 h-8 text-white" />;
      case 1: return <ArrowRight className="w-8 h-8 text-white" />;
      case 2: return <CornerUpLeft className="w-8 h-8 text-white" />;
      case 3: return <CornerUpRight className="w-8 h-8 text-white" />;
      case 4: return <ArrowLeft className="w-8 h-8 text-white" />;
      case 5: return <ArrowRight className="w-8 h-8 text-white" />;
      case 6: return <ArrowUp className="w-8 h-8 text-white" />;
      case 10: return <MapPin className="w-8 h-8 text-white" />;
      default: return <ArrowUp className="w-8 h-8 text-white" />;
    }
  };

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(() => {
    if (location.state?.routeFeature?.geometry?.coordinates?.[0]) {
      const coord = location.state.routeFeature.geometry.coordinates[0];
      return { lat: coord[1], lng: coord[0] };
    }
    return null;
  });
  const [userDistAlongRoute, setUserDistAlongRoute] = useState<number | null>(null);
  const [nextHazard, setNextHazard] = useState<any | null>(null);

  // Phase 3/5 of Crash Detection & Emergency Response Architecture.md, wired
  // to the SOS Escalation backend. Only armed for a backend-tracked ride
  // (groupRideId) since crash/SOS events require a real rides-table row
  // (require_ride_access) — solo, untracked navigation isn't wired to this yet.
  const getEmergencyLocation = useCallback((): EmergencyLocation | null => {
    if (!userLocation) return null;
    return { lat: userLocation.lat, lng: userLocation.lng, speedKph: currentSpeed ?? undefined };
  }, [userLocation, currentSpeed]);
  const { emergencyState, confirmSafe } = useCrashDetection(groupRideId ?? undefined, getEmergencyLocation);
  const [upcomingSteps, setUpcomingSteps] = useState<{ text: string; type: number; dist: string }[]>([]);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [routeBuildFailed, setRouteBuildFailed] = useState(false);
  const [routeRetryTick, setRouteRetryTick] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [showRouteSearch, setShowRouteSearch] = useState(false);
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [routeSearchResults, setRouteSearchResults] = useState<RouteSearchResult[]>([]);
  const [routeSearchHasRun, setRouteSearchHasRun] = useState(false);
  // A result the rider tapped (pin or list row) — shown as a detail card
  // with an explicit "Add as Stop" action, not added instantly on tap.
  const [previewResult, setPreviewResult] = useState<RouteSearchResult | null>(null);
  const searchResultMarkersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const searchResultRootsRef = useRef<{ [id: string]: any }>({});

  const [routeStops, setRouteStops] = useState<{ id: string; lat: number; lng: number; name: string }[]>([]);
  const routeStopsRef = useRef<typeof routeStops>([]);
  useEffect(() => { routeStopsRef.current = routeStops; }, [routeStops]);

  const orderStopsAlongRoute = (
    origin: { lat: number; lng: number },
    stops: { id: string; lat: number; lng: number; name: string }[],
    dest: { lat: number; lng: number }
  ) => {
    if (stops.length <= 1) return stops;
    const line = turf.lineString([[origin.lng, origin.lat], [dest.lng, dest.lat]]);
    return [...stops].sort((a, b) => {
      const locA = turf.nearestPointOnLine(line, turf.point([a.lng, a.lat])).properties.location ?? 0;
      const locB = turf.nearestPointOnLine(line, turf.point([b.lng, b.lat])).properties.location ?? 0;
      return locA - locB;
    });
  };

  const buildRouteThroughStops = async (
    origin: { lat: number; lng: number },
    stops: { id: string; lat: number; lng: number; name: string }[]
  ) => {
    if (!destLat || !destLng || !map.current) return;
    try {
      setIsRerouting(true);
      setCurrentInstruction({ text: stops.length ? 'Adding stop...' : 'Rerouting...', dist: '', type: 6, distMeters: 0 });
      const profile = travelMode?.id || 'driving-car';
      const { fetchTomTomRoute } = await import('../lib/routing');
      const ordered = orderStopsAlongRoute(origin, stops, { lat: destLat, lng: destLng });
      const coordinates = [
        [origin.lng, origin.lat],
        ...ordered.map((s) => [s.lng, s.lat]),
        [destLng, destLat],
      ];

      const newRouteFeature = await fetchTomTomRoute(coordinates, profile);

      if (newRouteFeature) {
        const summary = newRouteFeature.properties.summary;
        const adjustedEtaMins = Math.round(summary.duration / 60);

        setCurrentRoute(newRouteFeature);
        setCurrentEta(`${adjustedEtaMins} min`);
        setCurrentDistance(`${(summary.distance / 1000).toFixed(1)} km`);
        setTotalDistanceKm(summary.distance / 1000);

        const source = map.current.getSource('route') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData(newRouteFeature);
        }
        const remainingSource = map.current.getSource('route-remaining') as maplibregl.GeoJSONSource;
        if (remainingSource) {
          remainingSource.setData(newRouteFeature);
        }
      }
      // Reflect the routed order back into state so the stops list matches the map.
      setRouteStops(ordered);
    } catch (error) {
      console.error('Failed to recalculate route', error);
      showToast('Could not update the route with that stop', 'error');
    } finally {
      setIsRerouting(false);
    }
  };

  const fetchNewRoute = async (origin: {lat: number, lng: number}) => {
    if (!destLat || !destLng || isRerouting || !map.current) return;
    await buildRouteThroughStops(origin, routeStopsRef.current);
  };

  const addRouteStop = async (stop: { id: string; lat: number; lng: number; name: string }) => {
    if (isRerouting) return;
    // Ignore a re-pick of a stop that's already on the route.
    if (routeStopsRef.current.some((s) => s.id === stop.id)) return;
    const nextStops = [...routeStopsRef.current, stop];
    const origin = userLocation
      || useLocationStore.getState().coordinates
      || useLocationStore.getState().rawCoordinates
      || (currentRoute?.geometry?.coordinates?.[0]
        ? { lng: currentRoute.geometry.coordinates[0][0], lat: currentRoute.geometry.coordinates[0][1] }
        : null);
    if (!origin) {
      showToast('Still finding your location — try again in a moment', 'error');
      return;
    }
    await buildRouteThroughStops(origin, nextStops);
  };

  const removeRouteStop = async (id: string) => {
    if (isRerouting) return;
    const nextStops = routeStopsRef.current.filter((s) => s.id !== id);
    const origin = userLocation
      || useLocationStore.getState().coordinates
      || useLocationStore.getState().rawCoordinates
      || (currentRoute?.geometry?.coordinates?.[0]
        ? { lng: currentRoute.geometry.coordinates[0][0], lat: currentRoute.geometry.coordinates[0][1] }
        : null);
    if (!origin) {
      setRouteStops(nextStops);
      return;
    }
    await buildRouteThroughStops(origin, nextStops);
  };

  const recenterCamera = () => {
    setIsFollowingUser(true);
    // was tapped) is what re-centering returns to.
    if (!map.current) return;
  // produced a `userLocation` yet.
    const origin = userLocation
      || useLocationStore.getState().coordinates
      || (currentRoute?.geometry?.coordinates?.[0]
        ? { lng: currentRoute.geometry.coordinates[0][0], lat: currentRoute.geometry.coordinates[0][1] }
        : null);
    if (!origin) return;
    map.current.flyTo({
      center: [origin.lng, origin.lat],
      bearing: smoothedHeadingRef.current,
      pitch: 0,
      zoom: 17,
      offset: [0, 120],
      duration: 900,
    });
  };

  const searchAlongRoute = async (query: string) => {
    if (!query.trim()) return;
    setRouteSearchHasRun(false);
    setPreviewResult(null);
    const origin = userLocation
      || useLocationStore.getState().coordinates
      || (currentRoute?.geometry?.coordinates?.[0]
        ? { lng: currentRoute.geometry.coordinates[0][0], lat: currentRoute.geometry.coordinates[0][1] }
        : destLat && destLng ? { lat: destLat, lng: destLng } : null);
    const routeLine = currentRoute?.geometry?.coordinates?.length > 1
      ? (turf.lineString(currentRoute.geometry.coordinates) as GeoJSON.Feature<GeoJSON.LineString>)
      : null;

    try {
      const category = matchRouteSearchCategory(query);

      if (category) {
        // Category search ("coffee", "petrol stations", "hospitals"...) —
        // real OSM POIs along the route corridor, not a literal name geocode.
        const results = await searchPoisAlongRoute(category, routeLine, origin);
        setRouteSearchResults(results);
        return;
      }

      // Not a recognized category — treat it as a specific named place and
      // fall back to Nominatim, bounded to a corridor around the rider so a
      // zero-result search doesn't silently widen to the entire planet.
      const params = new URLSearchParams({ format: 'json', q: query, limit: '8' });
      if (origin) {
        params.set('viewbox', `${origin.lng - 0.4},${origin.lat + 0.4},${origin.lng + 0.4},${origin.lat - 0.4}`);
        params.set('bounded', '1');
      }
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
      const raw: any[] = await res.json();

      const results: RouteSearchResult[] = raw.map((r) => {
        const lat = parseFloat(r.lat);
        const lng = parseFloat(r.lon);
        return {
          id: `osm-place-${r.place_id ?? `${lat},${lng}`}`,
          name: r.name || r.display_name.split(',')[0],
          lat,
          lng,
          address: r.display_name,
          category: undefined,
          distFromRouteKm: routeLine ? turf.pointToLineDistance(turf.point([lng, lat]), routeLine, { units: 'kilometers' }) : null,
          distFromUserKm: origin ? turf.distance(turf.point([origin.lng, origin.lat]), turf.point([lng, lat]), { units: 'kilometers' }) : null,
          estimatedDetourKm: null,
        };
      }).sort((a, b) => {
        const scoreA = (a.distFromRouteKm ?? a.distFromUserKm ?? 0) + (a.distFromUserKm ?? 0) * 0.1;
        const scoreB = (b.distFromRouteKm ?? b.distFromUserKm ?? 0) + (b.distFromUserKm ?? 0) * 0.1;
        return scoreA - scoreB;
      });

      setRouteSearchResults(results.slice(0, 8));
    } catch (e) {
      console.error('Search along route failed', e);
      setRouteSearchResults([]);
    } finally {
      setRouteSearchHasRun(true);
    }
  };

 // rather than guessing, since guessing wrong is worse than waiting a beat.
  const DEFAULT_ORIGIN = { lat: 17.3850, lng: 78.4867 };
  const routedDestRef = useRef<string | null>(null);
  useEffect(() => {
    if (!destLat || !destLng) return;
    const destKey = `${destLat},${destLng}`;
    // Already have a route for this exact destination (either handed to us by
    // Ride planning, or built on a previous pass) — nothing to do.
    if (routedDestRef.current === destKey) return;
    if (currentRoute && routedDestRef.current === null) {
      routedDestRef.current = destKey;
      return;
    }

    let cancelled = false;
    let waitTimer: ReturnType<typeof setTimeout> | null = null;
    setRouteBuildFailed(false);

    const build = async (origin: { lat: number; lng: number }) => {
      setIsRouteLoading(true);
      try {
        const { fetchTomTomRoute } = await import('../lib/routing');
        // A hung network request must never leave the rider staring at a
        // spinner indefinitely — race it against a hard cutoff.
        const feature: any = await Promise.race([
          fetchTomTomRoute([[origin.lng, origin.lat], [destLng, destLat]], travelMode?.id || 'motorcycle'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('route-timeout')), 12000)),
        ]);
        if (cancelled) return;
        if (!feature) throw new Error('empty-route');

        const summary = feature.properties.summary;
        const etaMins = Math.max(1, Math.round(summary.duration / 60));
        routedDestRef.current = destKey;
        setCurrentRoute(feature);
        setCurrentEta(etaMins < 60 ? `${etaMins} min` : `${Math.floor(etaMins / 60)}h ${etaMins % 60}m`);
        setCurrentDistance(`${(summary.distance / 1000).toFixed(1)} km`);
        setTotalDistanceKm(summary.distance / 1000);
      } catch (e) {
        console.error('Failed to build route', e);
        if (!cancelled) {
          setRouteBuildFailed(true);
          showToast('Could not calculate a route to that destination', 'error');
        }
      } finally {
        if (!cancelled) setIsRouteLoading(false);
      }
    };

    const store = useLocationStore.getState();
    const origin = userLocation || store.coordinates || store.rawCoordinates;

    if (origin) {
      build(origin);
    } else {
    // been set yet, so it isn't skipped).
      setIsRouteLoading(true);
      waitTimer = setTimeout(() => {
        if (!cancelled) build(DEFAULT_ORIGIN);
      }, 6000);
    }

    return () => {
      cancelled = true;
      if (waitTimer) clearTimeout(waitTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destLat, destLng, userLocation, routeRetryTick]);

  const getDistanceStr = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    const d = R * c;
    if (d < 1) return `${Math.round(d * 1000)}m`;
    return `${d.toFixed(1)}km`;
  };

  useEffect(() => {
    const startNavigationSession = async () => {
      if (hasStartedSessionRef.current) return;
      
      // Don't start session if destination isn't set
      if (!destLat || !destLng) return;
      
      hasStartedSessionRef.current = true;

      // Firebase auth can be momentarily null on first render; wait briefly for it.
      const u = auth.currentUser || await new Promise<any | null>((resolve) => {
        const timeout = setTimeout(() => {
          unsubscribe();
          resolve(null);
        }, 2500);
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          clearTimeout(timeout);
          unsubscribe();
          resolve(user);
        });
      });
      const detUid = u ? getDeterministicUuid(u.uid) : null;
      const rawUid = u?.uid || null;

      if (!detUid) {
        setSessionId(crypto.randomUUID());
        return;
      }
      
      const originLat = location.state?.routeFeature?.geometry?.coordinates?.[0]?.[1] || 17.3850;
      const originLng = location.state?.routeFeature?.geometry?.coordinates?.[0]?.[0] || 78.4867;
      
      try {
        const { data: existingActive } = await supabase
          .from('navigation_sessions')
          .select('id')
          .eq('user_id', detUid)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingActive?.id) {
          setSessionId(existingActive.id);
          persistedSessionIdRef.current = existingActive.id;
          return;
        }

        const { data, error } = await supabase.from('navigation_sessions').insert([{
          user_id: detUid,
          origin_lat: originLat,
          origin_lng: originLng,
          dest_lat: destLat,
          dest_lng: destLng,
          dest_name: destName,
          status: 'active'
        }]).select().single();
        
        if (error) {
          // 409 Conflict = duplicate or constraint violation; silently use local session
          console.warn('Navigation session insert failed:', error.code, error.message);
          setSessionId(crypto.randomUUID());
        } else if (data) {
          setSessionId(data.id);
          persistedSessionIdRef.current = data.id;
        }

        // Check if user is already in a live ride
        if (rawUid) {
          let activeRideId = null;
          let activeRideCode = null;

          // 1. Check owned rides
          const { data: ownedRide } = await supabase.from('rides').select('id, ride_code').eq('owner_id', rawUid).eq('status', 'live').single();
          if (ownedRide) {
            activeRideId = ownedRide.id;
            activeRideCode = ownedRide.ride_code;
          } else {
            // 2. Check member rides
            const { data: memberRows } = await supabase.from('ride_members').select('ride_id').eq('user_id', rawUid);
            if (memberRows && memberRows.length > 0) {
              const { data: memberRide } = await supabase.from('rides').select('id, ride_code').in('id', memberRows.map((m: any) => m.ride_id)).eq('status', 'live').limit(1).maybeSingle();
              if (memberRide) {
                activeRideId = memberRide.id;
                activeRideCode = memberRide.ride_code;
              }
            }
          }

          if (activeRideId && activeRideCode) {
            setGroupRideId(activeRideId);
            setGroupRideCode(activeRideCode);
            setIsGroupMode(true);
            
            // Add self to ride_members if not already there (handled securely by upsert/insert)
            await supabase.from('ride_members').upsert({
              ride_id: activeRideId,
              user_id: rawUid,
              role: ownedRide ? 'admin' : 'member',
              display_name: u?.displayName || 'Rider',
              avatar_url: u?.photoURL
            }, { onConflict: 'ride_id,user_id' });
          } else if (isGroupMode) {
            // Create a new ride
            const { data: profile } = await supabase.from('profiles').select('username').eq('id', detUid).single();
            const rideName = profile?.username ? `${profile.username}'s Group Track` : 'My Group Track';
            const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            const { data: newRide, error: rideError } = await supabase.from('rides').insert({
               name: rideName,
               ride_code: newCode,
               owner_id: rawUid,
               status: 'live',
               ride_date: new Date().toISOString()
            }).select().single();
            
            if (!rideError && newRide) {
              setGroupRideId(newRide.id);
              setGroupRideCode(newRide.ride_code);
              showToast(`Group Created! Code: ${newRide.ride_code}`, 'success');
              
              // Add owner to ride_members
              await supabase.from('ride_members').insert({
                ride_id: newRide.id,
                user_id: rawUid,
                role: 'admin',
                display_name: u?.displayName || 'Admin',
                avatar_url: u?.photoURL
              });
            }
          }
        }

      } catch (err) {
        console.warn('Navigation session error:', err);
        setSessionId(crypto.randomUUID());
      }
    };
    
    startNavigationSession();
    
    return () => {
      const persistedId = persistedSessionIdRef.current;
      if (persistedId) {
        supabase.from('navigation_sessions').update({ status: 'completed' }).eq('id', persistedId).then();
      }
    };
  }, []);

  // ─── Group Participants: Fetch + Realtime ───────────────────────────────
  useEffect(() => {
    if (!groupRideId) return;
    const uid = auth.currentUser?.uid;
    if (uid) currentUserIdRef.current = uid;

    const fetchParticipants = async () => {
      const { data: members } = await supabase.from('ride_members').select('*').eq('ride_id', groupRideId);
      if (!members) return;

      const uids = members.map((m: any) => m.user_id.length === 36 ? m.user_id : getDeterministicUuid(m.user_id));
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', uids);
      const { data: locs } = await supabase.from('ride_locations').select('*').eq('ride_id', groupRideId);

      const init: Record<string, any> = {};
      members.forEach((m: any) => {
        const searchId = m.user_id.length === 36 ? m.user_id : getDeterministicUuid(m.user_id);
        const profile = profiles?.find((p: any) => p.id === searchId);
        init[m.user_id] = {
          user_id: m.user_id,
          display_name: profile?.full_name || profile?.username || m.display_name || 'Member',
          avatar_url: profile?.avatar_url || m.avatar_url,
          role: m.role || 'member',
          lat: null, lng: null, speed: 0, last_updated: null
        };
      });

      if (locs) {
        locs.forEach((l: any) => {
          if (init[l.user_id]) {
            init[l.user_id] = { ...init[l.user_id], lat: l.latitude, lng: l.longitude, speed: l.speed || 0, last_updated: l.updated_at || l.created_at };
          }
        });
      }
      setParticipants(init);
    };
    fetchParticipants();

    // Realtime subscriptions
    const locSub = supabase.channel(`nav-loc-${groupRideId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_locations', filter: `ride_id=eq.${groupRideId}` },
        p => {
          const l = p.new as any;
          setParticipants(prev => ({
            ...prev,
            [l.user_id]: { ...prev[l.user_id], lat: l.latitude, lng: l.longitude, speed: l.speed || 0, last_updated: l.updated_at || new Date().toISOString() }
          }));
        })
      .subscribe();

    const memSub = supabase.channel(`nav-mem-${groupRideId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_members', filter: `ride_id=eq.${groupRideId}` },
        p => {
          if (p.eventType === 'INSERT' || p.eventType === 'UPDATE') {
            const m = p.new as any;
            const searchId = m.user_id.length === 36 ? m.user_id : getDeterministicUuid(m.user_id);
            supabase.from('profiles').select('full_name, username, avatar_url').eq('id', searchId).single().then(({ data }) => {
              setParticipants(prev => ({
                ...prev,
                [m.user_id]: { ...prev[m.user_id], display_name: data?.full_name || data?.username || m.display_name, avatar_url: data?.avatar_url || m.avatar_url, role: m.role, user_id: m.user_id }
              }));
            });
          } else if (p.eventType === 'DELETE') {
            const m = p.old as any;
            setParticipants(prev => { const copy = {...prev}; delete copy[m.user_id]; return copy; });
            participantMarkersRef.current[m.user_id]?.remove();
            delete participantMarkersRef.current[m.user_id];
          }
        })
      .subscribe();

    return () => { locSub.unsubscribe(); memSub.unsubscribe(); };
  }, [groupRideId]);

  // ─── Broadcast own location to ride members ─────────────────────────────
  useEffect(() => {
    if (!groupRideId || !auth.currentUser) return;
    const rawUid = auth.currentUser.uid;
    const rt = getRealtime();
    rt.connect();
    rt.joinRide(groupRideId);

    locationBroadcastRef.current = setInterval(async () => {
      if (!userLocation) return;
      const nowStr = new Date().toISOString();

      // Instantly update local state so current user never shows as offline
      setParticipants(prev => {
        if (!prev[rawUid]) return prev;
        return {
          ...prev,
          [rawUid]: {
            ...prev[rawUid],
            lat: userLocation.lat,
            lng: userLocation.lng,
            speed: currentSpeed || 0,
            last_updated: nowStr
          }
        };
      });

      if (rt.connected) {
        rt.sendLocation(groupRideId, {
          lat: userLocation.lat, lng: userLocation.lng,
          speed: currentSpeed || 0, heading: 0
        });
      } else {
        await supabase.from('ride_locations').upsert({
          ride_id: groupRideId,
          user_id: rawUid,
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          speed: currentSpeed || 0,
          updated_at: nowStr
        }, { onConflict: 'ride_id,user_id' });
      }
    }, 5000);

    return () => {
      if (locationBroadcastRef.current) clearInterval(locationBroadcastRef.current);
      rt.leaveRide(groupRideId);
    };
  }, [groupRideId, userLocation, currentSpeed]);

  // ─── Place participant markers on map ──────────────────────────────────
  useEffect(() => {
    if (!map.current || !mapLoaded || !groupRideId) return;
    const myUid = auth.currentUser?.uid;

    Object.values(participants).forEach((p: any) => {
      if (!p.lat || !p.lng || p.user_id === myUid) return;

      const initials = (p.display_name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
      const statusColor = getParticipantStatus(p) === 'Driving' ? '#10b981' : getParticipantStatus(p) === 'Offline' ? '#9ca3af' : getParticipantStatus(p) === 'Reached' ? '#3b82f6' : '#f59e0b';

      if (participantMarkersRef.current[p.user_id]) {
        participantMarkersRef.current[p.user_id].setLngLat([p.lng, p.lat]);
        return;
      }

      const el = document.createElement('div');
      el.className = 'participant-marker cursor-pointer';
      el.style.cssText = `width:44px;height:44px;border-radius:50%;border:3px solid ${statusColor};background:white;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.2);transition:border-color 0.3s;overflow:hidden;`;

      if (p.avatar_url) {
        el.innerHTML = `<img src="${p.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
      } else {
        el.innerHTML = `<span style="font-size:14px;font-weight:900;color:#273a5a;">${initials}</span>`;
      }

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedParticipant(p);
        if (map.current) {
          map.current.flyTo({ center: [p.lng, p.lat], zoom: 16, pitch: 45, duration: 1200 });
          setIsFollowingUser(false);
        }
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .addTo(map.current!);
      participantMarkersRef.current[p.user_id] = marker;
    });
  }, [participants, mapLoaded, groupRideId]);

  // ─── Helper: derive participant status ─────────────────────────────────
  const getParticipantStatus = (p: any): string => {
    if (!p.last_updated) return 'Offline';
    const minAgo = (Date.now() - new Date(p.last_updated).getTime()) / 60000;
    if (minAgo > 10) return 'Offline';
    if (destLat && destLng && p.lat && p.lng) {
      const distToDest = Math.sqrt(Math.pow(p.lat - destLat, 2) + Math.pow(p.lng - destLng, 2)) * 111;
      if (distToDest < 0.2) return 'Reached';
    }
    if (p.speed > 5) return 'Driving';
    if (minAgo < 2) return 'Stopped';
    return 'Waiting';
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Driving': return 'bg-emerald-500';
      case 'Stopped': return 'bg-amber-500';
      case 'Waiting': return 'bg-yellow-400';
      case 'Reached': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getDistBetween = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return d < 1 ? `${Math.round(d*1000)}m` : `${d.toFixed(1)}km`;
  };

  const navigateToUser = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const handleEndGroupNavigation = async () => {
    if (!groupRideId) return;
    await supabase.from('rides').update({ status: 'ended' }).eq('id', groupRideId);
    showToast('Group navigation ended', 'success');
    navigate('/home');
  };

  const handleExitGroupNavigation = async () => {
    if (!groupRideId || !auth.currentUser) return;
    const uid = auth.currentUser.uid;
    await supabase.from('ride_members').delete().eq('ride_id', groupRideId).eq('user_id', uid);
    await supabase.from('ride_locations').delete().eq('ride_id', groupRideId).eq('user_id', uid);
    showToast('Left group navigation', 'info');
    navigate('/home');
  };

  const { categories: reportTypes } = useIncidentCategories();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Get the starting coordinate from the route. With the direct
    // Home → Navigation flow there is no route yet, so fall back to the
    // rider's real position rather than a hardcoded city centre — otherwise
    // the arrow sits somewhere unrelated to the route that arrives next.
    const knownOrigin = userLocation || useLocationStore.getState().coordinates;
    let startCoord = knownOrigin
      ? [knownOrigin.lng, knownOrigin.lat]
      : [78.4867, 17.3850]; // Default Hyderabad

    if (currentRoute && currentRoute.geometry && currentRoute.geometry.coordinates.length > 1) {
      startCoord = currentRoute.geometry.coordinates[0];
    }

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: startCoord as [number, number],
      zoom: 17,
      pitch: 0, // Always flat, north-up — see the comment block above
      bearing: 0
    });


    map.current.dragRotate.disable();
    map.current.touchZoomRotate.disableRotation();
    map.current.touchPitch.disable();
    map.current.keyboard.disableRotation();

    map.current.on('load', () => {
      if (!map.current) return;

      const el = document.createElement('div');
      el.className = 'w-16 h-16 flex items-center justify-center';
      el.innerHTML = `
        <div style="position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:38px;height:38px;border-radius:50%;background:radial-gradient(circle,rgba(255,90,0,0.35) 0%,rgba(255,90,0,0) 70%);"></div>
          <svg width="34" height="34" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
            <path d="M20 3L9 33L20 26L31 33L20 3Z" fill="#1E2A44" stroke="#FF5A00" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </div>`;

      userMarkerRef.current = new maplibregl.Marker({ element: el, rotationAlignment: 'map', pitchAlignment: 'map' })
        .setLngLat(startCoord as [number, number])
        .addTo(map.current);

      map.current.on('dragstart', () => setIsFollowingUser(false));
      map.current.on('touchstart', () => setIsFollowingUser(false));

      map.current.on('rotate', () => setMapBearing(map.current?.getBearing() ?? 0));

      setMapLoaded(true);
      fetchIncidents();
    });

    const ro = new ResizeObserver(() => map.current?.resize());
    if (mapContainer.current) ro.observe(mapContainer.current);

    return () => {
      ro.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const destMarkerRef = useRef<maplibregl.Marker | null>(null);
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded || !currentRoute?.geometry?.coordinates?.length) return;

    // Until the first GPS fix lands, park the rider arrow on the head of the
    // route and rotate the map (heading-up) so the road ahead points up,
    // matching the live-tracking behavior once GPS kicks in.
    if (!userLocation && userMarkerRef.current) {
      const coords = currentRoute.geometry.coordinates;
      const head = coords[0];
      const ahead = coords[Math.min(5, coords.length - 1)];
      const initialHeading = (Math.atan2(ahead[0] - head[0], ahead[1] - head[1]) * 180) / Math.PI;
      smoothedHeadingRef.current = initialHeading < 0 ? initialHeading + 360 : initialHeading;
      userMarkerRef.current.setLngLat(head as [number, number]);
      userMarkerRef.current.setRotation(smoothedHeadingRef.current);
    }

    // Seed the step list straight from the route so the panel is populated
    // before the rider has moved a metre; live progress refines it afterwards.
    const routeSteps = currentRoute.properties?.segments?.[0]?.steps as any[] | undefined;
    if (routeSteps?.length) {
      setUpcomingSteps(
        routeSteps.slice(0, 4).map((s: any) => ({
          text: s.instruction,
          type: s.type,
          dist: s.distance < 1000 ? `${Math.round(s.distance)} m` : `${(s.distance / 1000).toFixed(1)} km`,
        }))
      );
    }

    const existing = m.getSource('route') as maplibregl.GeoJSONSource | undefined;
    if (existing) {
      existing.setData(currentRoute);
      (m.getSource('route-remaining') as maplibregl.GeoJSONSource | undefined)?.setData(currentRoute);
    } else {
      m.addSource('route', { type: 'geojson', data: currentRoute });
      m.addSource('route-remaining', { type: 'geojson', data: currentRoute });

      // Glow behind the remaining route
      m.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route-remaining',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#F97316', 'line-width': 14, 'line-opacity': 0.28, 'line-blur': 8 }
      });
      // Full route, dimmed — what's already behind you
      m.addLayer({
        id: 'route-completed',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#9CA3AF', 'line-width': 4, 'line-opacity': 0.45 }
      });
      // The live remaining route
      m.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-remaining',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#F97316', 'line-width': 6, 'line-opacity': 1 }
      });
    }

    if (destLng && destLat && destMarkerRef.current) {
      // Destination can change mid-navigation (search along route) — move the pin.
      destMarkerRef.current.setLngLat([destLng, destLat]);
    } else if (destLng && destLat) {
      const destEl = document.createElement('div');
      destEl.className = 'flex flex-col items-center drop-shadow-lg';
      destEl.innerHTML = `<div style="width:34px;height:34px;border-radius:50%;background:#111827;border:3px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:9px;font-weight:800;">END</div><div style="width:8px;height:8px;background:#111827;transform:rotate(45deg);margin-top:-5px;border-radius:1px;"></div>`;
      destMarkerRef.current = new maplibregl.Marker({ element: destEl, anchor: 'bottom' })
        .setLngLat([destLng, destLat])
        .addTo(m);
    }

    // Frame the whole route once so the rider sees where they're going,
    // then the follow-camera takes over on the first GPS fix.
    try {
      const coords = currentRoute.geometry.coordinates as [number, number][];
      const bounds = coords.reduce(
        (b: maplibregl.LngLatBounds, c) => b.extend(c),
        new maplibregl.LngLatBounds(coords[0], coords[0])
      );
      m.fitBounds(bounds, { padding: 80, pitch: 0, bearing: smoothedHeadingRef.current, duration: 900 });
    } catch (e) { /* non-fatal framing failure */ }
  }, [currentRoute, mapLoaded, destLat, destLng]);

  const fetchIncidents = async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('pins')
      .select('*')
      .gte('created_at', twoHoursAgo)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch incidents for navigation:', error);
      return;
    }

    const incidentData = (data || []).filter((pin: any) => pin.status !== 'resolved' && pin.status !== 'inactive');

    if (incidentData.length === 0) {
      setIncidentsOnRoute([]);
      return;
    }

    if (incidentData && currentRoute && currentRoute.geometry && currentRoute.geometry.coordinates.length > 1) {
      try {
        const line = turf.lineString(currentRoute.geometry.coordinates);
        const routeOrigin = turf.point(currentRoute.geometry.coordinates[0]);

        const validPins = incidentData.map(pin => {
          if (!pin.longitude || !pin.latitude) return null;
          const pt = turf.point([pin.longitude, pin.latitude]);
          const snapped = turf.nearestPointOnLine(line, pt);
          const distToLine = snapped.properties.dist || 0;
          
          if (distToLine <= 0.5) { // within 500 meters of route
            let distFromOrigin = 0;
            try {
              distFromOrigin = turf.length(turf.lineSlice(routeOrigin, snapped, line));
            } catch (e) {
              distFromOrigin = turf.distance(routeOrigin, pt);
            }
            return { ...pin, distFromOrigin };
          }
          return null;
        }).filter(Boolean);

        validPins.sort((a, b) => a.distFromOrigin - b.distFromOrigin);

        // If no route-near incidents, still show latest incidents so Navigation isn't empty
        if (validPins.length > 0) {
          setIncidentsOnRoute(validPins);
        } else {
          setIncidentsOnRoute(incidentData.slice(0, 10));
        }
      } catch (e) {
        console.error("Turf processing error:", e);
        setIncidentsOnRoute(incidentData); // Fallback to all pins if error
      }
    } else if (incidentData) {
      setIncidentsOnRoute(incidentData);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const intervalId = setInterval(fetchIncidents, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [currentRoute]);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
          const { latitude, longitude, heading } = pos.coords;
          // Calculate speed (prefer native speed if available, otherwise estimate)
          let speedKph: number | null = null;
          try {
            if (pos.coords.speed !== null && !isNaN(pos.coords.speed)) {
              speedKph = Math.round(pos.coords.speed * 3.6);
            } else if (prevPosRef.current) {
              const dt = (pos.timestamp - prevPosRef.current.timestamp) / 1000; // seconds
              if (dt > 0) {
                const prevPt = turf.point([prevPosRef.current.lng, prevPosRef.current.lat]);
                const curPt = turf.point([longitude, latitude]);
                const distKm = turf.distance(prevPt, curPt); // kilometers
                speedKph = Math.round((distKm / dt) * 3.6);
              }
            }
            setCurrentSpeed(speedKph);
            prevPosRef.current = { lat: latitude, lng: longitude, timestamp: pos.timestamp };
          } catch (e) {
            console.warn('Speed calc error', e);
          }
        setUserLocation({ lat: latitude, lng: longitude });

        // Heading logic
        let targetHeading = heading;
        
        // At low speeds or if heading is missing, try to infer from route if close
        if ((speedKph !== null && speedKph < 5) || targetHeading === null || isNaN(targetHeading)) {
          if (currentRoute && currentRoute.geometry && currentRoute.geometry.coordinates.length > 1) {
            try {
              const line = turf.lineString(currentRoute.geometry.coordinates);
              const userPt = turf.point([longitude, latitude]);
              const snappedUser = turf.nearestPointOnLine(line, userPt);
              const distFromRoute = turf.distance(userPt, snappedUser) * 1000;
              
              if (distFromRoute < 30) {
                const routeLength = turf.length(line);
                const distanceAlong = (snappedUser.properties as any).location || 0;
                const aheadDist = Math.min(distanceAlong + 0.02, routeLength); // Look 20m ahead
                const aheadPoint = turf.along(line, aheadDist);
                targetHeading = turf.bearing(snappedUser, aheadPoint);
                if (targetHeading < 0) targetHeading += 360;
              }
            } catch(e) {}
          }
        }

        // Apply smoothing to heading
        if (targetHeading !== null && !isNaN(targetHeading)) {
          let currentSmoothed = smoothedHeadingRef.current;
          let diff = targetHeading - currentSmoothed;
          
          while (diff > 180) diff -= 360;
          while (diff < -180) diff += 360;
          
          smoothedHeadingRef.current = currentSmoothed + (diff * 0.25); // 25% smooth per tick
          if (smoothedHeadingRef.current < 0) smoothedHeadingRef.current += 360;
          if (smoothedHeadingRef.current >= 360) smoothedHeadingRef.current -= 360;
        }

        // Update user marker dynamically — heading-up mode rotates the map
        // to the rider's heading. The marker uses rotationAlignment: 'map',
        // so its rotation is relative to true north, not the screen — it
        // must match the map's own bearing to stay pointing straight up.
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([longitude, latitude]);
          userMarkerRef.current.setRotation(smoothedHeadingRef.current);
        }


        if (map.current && mapLoaded && isFollowingUserRef.current) {
          map.current.easeTo({
            center: [longitude, latitude],
            bearing: smoothedHeadingRef.current,
            pitch: 0,
            zoom: 17,
            offset: [0, 120],
            duration: 1000
          });
        }
        
        // Rerouting logic
        if (currentRoute && currentRoute.geometry && currentRoute.geometry.coordinates.length > 1) {
          const line = turf.lineString(currentRoute.geometry.coordinates);
          const userPt = turf.point([longitude, latitude]);
          try {
            const snappedUser = turf.nearestPointOnLine(line, userPt);
            // distance in kilometers
            const distFromRoute = turf.distance(userPt, snappedUser) * 1000; 
            
            if (distFromRoute > 25 && !isRerouting) {
              fetchNewRoute({ lat: latitude, lng: longitude });
            } else {
              // Update remaining route slicing
              const routeEnd = turf.point(currentRoute.geometry.coordinates[currentRoute.geometry.coordinates.length - 1]);
              try {
                const sliced = turf.lineSlice(snappedUser, routeEnd, line);
                const remainingSource = map.current?.getSource('route-remaining') as maplibregl.GeoJSONSource;
                if (remainingSource) {
                  remainingSource.setData(sliced);
                }
              } catch (e) {
                console.error("Route slicing error:", e);
              }

              // Update instruction
              if (currentRoute.properties && currentRoute.properties.segments) {
                const currentCoordIndex = snappedUser.properties?.index || 0;
                let foundStep = null;
                let foundSegment: any = null;
                let foundIndex = -1;
                const segments = currentRoute.properties.segments;
                for (const segment of segments) {
                  if (segment.steps) {
                    for (let i = 0; i < segment.steps.length; i++) {
                      const step = segment.steps[i];
                      const [start, end] = step.way_points;
                      if (currentCoordIndex >= start && currentCoordIndex <= end) {
                        foundStep = step;
                        foundSegment = segment;
                        foundIndex = i;
                        const stepEndPt = turf.point(currentRoute.geometry.coordinates[end]);
                        let distToStepEnd = turf.distance(snappedUser, stepEndPt) * 1000;
                        let nextStep = i + 1 < segment.steps.length ? segment.steps[i + 1] : null;
                        if (distToStepEnd < 25 && nextStep) {
                           foundStep = nextStep;
                           foundIndex = i + 1;
                           const nextStepEndPt = turf.point(currentRoute.geometry.coordinates[foundStep.way_points[1]]);
                           distToStepEnd = turf.distance(stepEndPt, nextStepEndPt) * 1000;
                           nextStep = i + 2 < segment.steps.length ? segment.steps[i + 2] : null;
                        }
                        foundStep = { ...foundStep, remainingDist: distToStepEnd, nextStep };
                        break;
                      }
                    }
                  }
                  if (foundStep) break;
                }

                if (foundStep) {
                  let displayText = formatInstruction(foundStep.instruction);
                  let displayType = foundStep.type;

                  // If heading straight, peek ahead to show the next meaningful turn
                  if (foundStep.nextStep && (displayType === 6 || displayType === 11 || displayText.toLowerCase().includes('head '))) {
                    displayText = formatInstruction(foundStep.nextStep.instruction);
                    displayType = foundStep.nextStep.type;
                  }

                  setCurrentInstruction({
                    text: displayText,
                    dist: foundStep.remainingDist < 1000 ? `${Math.round(foundStep.remainingDist)} m` : `${(foundStep.remainingDist/1000).toFixed(1)} km`,
                    type: displayType,
                    distMeters: foundStep.remainingDist
                  });

                  // Upcoming steps preview list (current step + the next two)
                  if (foundSegment && foundIndex >= 0) {
                    const preview = foundSegment.steps.slice(foundIndex, foundIndex + 3).map((s: any, idx: number) => ({
                      text: formatInstruction(s.instruction),
                      type: s.type,
                      dist: idx === 0
                        ? (foundStep.remainingDist < 1000 ? `${Math.round(foundStep.remainingDist)} m` : `${(foundStep.remainingDist / 1000).toFixed(1)} km`)
                        : (s.distance < 1000 ? `${Math.round(s.distance)} m` : `${(s.distance / 1000).toFixed(1)} km`),
                    }));
                    setUpcomingSteps(preview);
                  }
                }
              }
            }
          } catch (e) {
            console.error("Rerouting check error:", e);
          }
        }
      },
      (err) => {
        if (err.code === 1) {

          if (!geolocationDeniedNotifiedRef.current) {
            geolocationDeniedNotifiedRef.current = true;
            showToast('Location permission denied. Navigation is running in preview mode.', 'info');
            setIsFollowingUser(false);
          }
          return;
        }
        console.warn('Geolocation watch failed:', err);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [mapLoaded, currentRoute, isRerouting]);

  useEffect(() => {
    if (userLocation && incidentsOnRoute.length > 0 && currentRoute && currentRoute.geometry && currentRoute.geometry.coordinates.length > 1) {
      const line = turf.lineString(currentRoute.geometry.coordinates);
      const routeOrigin = turf.point(currentRoute.geometry.coordinates[0]);
      const userPt = turf.point([userLocation.lng, userLocation.lat]);
      
      let userDist = 0;
      try {
        const snappedUser = turf.nearestPointOnLine(line, userPt);
        userDist = turf.length(turf.lineSlice(routeOrigin, snappedUser, line));
      } catch (e) {
        userDist = turf.distance(routeOrigin, userPt);
      }
      
      setUserDistAlongRoute(userDist);

      let nearest = null;
      let minRemainingDist = Infinity;
      
      incidentsOnRoute.forEach(p => {
        if (p.distFromOrigin === undefined) return;
        const remaining = p.distFromOrigin - userDist;
        if (remaining >= -0.5 && remaining < minRemainingDist) {
          minRemainingDist = remaining;
          nearest = { ...p, remainingDist: Math.abs(remaining) };
        }
      });
      
      setNextHazard(nearest);
    } else {
      setNextHazard(null);
    }
  }, [userLocation, incidentsOnRoute, currentRoute]);

  // Dynamic ETA Calculation
  useEffect(() => {
    if (userDistAlongRoute !== null && totalDistanceKm > 0) {
      const remainingDistanceKm = Math.max(0, totalDistanceKm - userDistAlongRoute);
      // Time remaining should be based on live traffic (ORS duration), not avg GPS speed
      const routeSummary = currentRoute?.properties?.summary;
      if (routeSummary && routeSummary.distance > 0) {
        const routeTotalDistanceKm = routeSummary.distance / 1000;
        const fractionRemaining = Math.max(0, Math.min(1, remainingDistanceKm / routeTotalDistanceKm));
        
        const remainingSecs = routeSummary.duration * fractionRemaining;
        const etaMins = Math.ceil(remainingSecs / 60);
        setCurrentEta(`${etaMins} min`);
      }
      
      setCurrentDistance(`${remainingDistanceKm.toFixed(1)} km`);
    }
  }, [userDistAlongRoute, currentSpeed, totalDistanceKm, travelMode]);

  // Sync pins to map and update distance
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const currentPinIds = new Set(incidentsOnRoute.map(a => a.id));

    Object.keys(pinMarkersRef.current).forEach(id => {
      if (!currentPinIds.has(id)) {
        pinMarkersRef.current[id].remove();
        delete pinMarkersRef.current[id];
        delete rootsRef.current[id];
      }
    });

    incidentsOnRoute.forEach(pin => {
      if (!pin.latitude || !pin.longitude) return;

      const typeObj = reportTypes.find(t => t.id === pin.category);
      
      let distanceStr = '';
      if (userDistAlongRoute !== null && pin.distFromOrigin !== undefined) {
        const absRemaining = Math.abs(pin.distFromOrigin - userDistAlongRoute);
        distanceStr = absRemaining < 1 ? `${Math.round(absRemaining * 1000)}m` : `${absRemaining.toFixed(1)}km`;
      } else if (userLocation) {
        distanceStr = getDistanceStr(userLocation.lat, userLocation.lng, pin.latitude, pin.longitude);
      }

      if (!pinMarkersRef.current[pin.id]) {
        const el = document.createElement('div');
        const root = createRoot(el);
        rootsRef.current[pin.id] = root;

        const stopProp = (e: any) => e.stopPropagation();
        el.addEventListener('mousedown', stopProp);
        el.addEventListener('touchstart', stopProp);
        el.addEventListener('pointerdown', stopProp);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedIncident(pin);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([pin.longitude, pin.latitude])
          .addTo(map.current!);
          
        pinMarkersRef.current[pin.id] = marker;
      }

      // Re-render React root to update distance text
      if (rootsRef.current[pin.id]) {
        const IconComp = typeObj ? incidentIconMap[typeObj.iconName] : AlertTriangle;
        rootsRef.current[pin.id].render(
          <div className="flex flex-col items-center justify-center transform -translate-y-1/2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${typeObj?.bg || 'bg-gray-100'} z-10`}>
              <IconComp className={`w-4 h-4 ${typeObj?.color || 'text-gray-600'}`} />
            </div>
            {distanceStr && (
              <div className="bg-dark/90 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full mt-1 border border-white/20 whitespace-nowrap shadow-xl">
                {distanceStr}
              </div>
            )}
          </div>
        );
      }
    });
  }, [incidentsOnRoute, mapLoaded, userLocation]);

  // Sync selected route stops to the map as numbered, removable pins.
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const currentStopIds = new Set(routeStops.map((s) => s.id));
    Object.keys(stopMarkersRef.current).forEach((id) => {
      if (!currentStopIds.has(id)) {
        stopMarkersRef.current[id].remove();
        delete stopMarkersRef.current[id];
        delete stopRootsRef.current[id];
      }
    });

    routeStops.forEach((stop, idx) => {
      if (!stopMarkersRef.current[stop.id]) {
        const el = document.createElement('div');
        const root = createRoot(el);
        stopRootsRef.current[stop.id] = root;

        const stopProp = (e: any) => e.stopPropagation();
        el.addEventListener('mousedown', stopProp);
        el.addEventListener('touchstart', stopProp);
        el.addEventListener('pointerdown', stopProp);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          removeRouteStop(stop.id);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([stop.lng, stop.lat])
          .addTo(map.current!);

        stopMarkersRef.current[stop.id] = marker;
      } else {
        stopMarkersRef.current[stop.id].setLngLat([stop.lng, stop.lat]);
      }

      if (stopRootsRef.current[stop.id]) {
        stopRootsRef.current[stop.id].render(
          <div className="flex flex-col items-center transform -translate-y-1/2" title={`${stop.name} — tap to remove`}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white bg-[var(--color-hmi-accent)] text-white text-[12px] font-black">
              {idx + 1}
            </div>
          </div>
        );
      }
    });
  }, [routeStops, mapLoaded]);

  // Sync "search along route" results to the map as tappable pins — tapping
  // one opens its detail preview (name/distance/detour), same as a list row.
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const currentResultIds = new Set(routeSearchResults.map((r) => r.id));
    Object.keys(searchResultMarkersRef.current).forEach((id) => {
      if (!currentResultIds.has(id)) {
        searchResultMarkersRef.current[id].remove();
        delete searchResultMarkersRef.current[id];
        delete searchResultRootsRef.current[id];
      }
    });

    routeSearchResults.forEach((result) => {
      const CatIcon = result.category?.icon || MapPin;
      if (!searchResultMarkersRef.current[result.id]) {
        const el = document.createElement('div');
        const root = createRoot(el);
        searchResultRootsRef.current[result.id] = root;

        const stopProp = (e: any) => e.stopPropagation();
        el.addEventListener('mousedown', stopProp);
        el.addEventListener('touchstart', stopProp);
        el.addEventListener('pointerdown', stopProp);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setPreviewResult(result);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([result.lng, result.lat])
          .addTo(map.current!);

        searchResultMarkersRef.current[result.id] = marker;
      }

      if (searchResultRootsRef.current[result.id]) {
        searchResultRootsRef.current[result.id].render(
          <div className="flex flex-col items-center transform -translate-y-1/2" title={`${result.name} — tap for details`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white bg-white text-[var(--color-hmi-accent)]">
              <CatIcon className="w-4 h-4" />
            </div>
          </div>
        );
      }
    });
  }, [routeSearchResults, mapLoaded]);

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

  const isElementalMode = currentSpeed !== null && currentSpeed > 45;

  return (
    <React.Fragment>
    {/* Turn-by-turn is a landscape/car-dashboard experience — don't let
        riders drive with a cramped portrait nav screen. Block everything
        behind a rotate prompt until the device is actually landscape. */}
    <div className="portrait:fixed landscape:hidden inset-0 z-[999] bg-[#0B0F17] flex flex-col items-center justify-center gap-5 px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--color-hmi-accent)]/15 flex items-center justify-center">
        <Smartphone className="w-10 h-10 text-[var(--color-hmi-accent)]" style={{ animation: 'rotateDeviceHint 2.2s ease-in-out infinite', transformOrigin: 'center' }} />
      </div>
      <div>
        <h2 className="text-white text-[18px] font-bold mb-1.5">Rotate Your Device</h2>
        <p className="text-[#9BA3B0] text-[13px] font-medium max-w-[260px] mx-auto leading-relaxed">
          Turn-by-turn navigation works best in landscape. Rotate your phone to continue.
        </p>
      </div>
    </div>
    <RiderCockpitLayout
      topRail={<EdgeRail />}
      edgeToEdge
      mapChildren={
        <>
          <div ref={mapContainer} className="w-full h-full" />

          {/* No left column left to host this anymore — the map is full
              bleed, so the loading state is its own centered overlay. */}
          {!mapLoaded && (
            <div className="absolute inset-0 z-40 bg-[#F5F6F8] flex items-center justify-center">
              <LoadingSpinner fullScreen={false} message="Loading Map & Route..." />
            </div>
          )}

          {mapLoaded && (
            <div className="absolute top-0 left-0 bottom-0 z-30 w-[320px] max-w-[42%] flex flex-col bg-white shadow-[8px_0_24px_rgba(0,0,0,0.12)] overflow-hidden">
              {/* Next maneuver + speed/ETA/distance — the panel's header. */}
              <div className="shrink-0 border-b border-gray-100">
                <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--color-hmi-accent)]">
                    {React.cloneElement(getTurnIcon(currentInstruction.type) as React.ReactElement<{className?: string}>, { className: 'w-5 h-5 text-white' })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[16px] font-extrabold leading-tight text-gray-900 tracking-tight">
                      {(currentInstruction.distMeters == null || currentInstruction.distMeters <= TURN_CARD_VISIBLE_WITHIN_M || currentInstruction.type === 10)
                        ? (currentInstruction.dist || (destName ? `To ${destName}` : 'On your way'))
                        : `Heading to ${destName || 'destination'}`}
                    </h2>
                    <p className="text-[12px] text-gray-500 font-semibold truncate">{currentInstruction.text}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 px-4 pb-3.5">
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Speed</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[15px] font-extrabold text-gray-900 leading-none">{currentSpeed !== null ? currentSpeed : '--'}</span>
                      <span className="text-[10px] text-gray-400 font-semibold">km/h</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 border-x border-gray-100">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">ETA</span>
                    <span className="text-[15px] font-extrabold text-gray-900 leading-none">{currentEta || '--'}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Left</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[15px] font-extrabold text-gray-900 leading-none">{parseFloat(currentDistance) || '--'}</span>
                      <span className="text-[10px] text-gray-400 font-semibold">km</span>
                    </div>
                  </div>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await searchAlongRoute(routeSearchQuery);
                }}
                className="flex items-center gap-2.5 h-[46px] mx-4 my-2.5 px-3 rounded-xl bg-gray-100 shrink-0"
              >
                <SearchIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  value={routeSearchQuery}
                  onFocus={() => setShowRouteSearch(true)}
                  onChange={(e) => { setRouteSearchQuery(e.target.value); setShowRouteSearch(true); }}
                  placeholder="Search along route"
                  className="flex-1 min-w-0 bg-transparent text-[13.5px] font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-semibold outline-none"
                />
                {showRouteSearch && (
                  <button
                    type="button"
                    onClick={() => { setShowRouteSearch(false); setRouteSearchQuery(''); setRouteSearchResults([]); setRouteSearchHasRun(false); setPreviewResult(null); }}
                    className="text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Selected mid-route stops — visible and removable regardless of
                  whether the search panel is open, in routed order. */}
              {routeStops.length > 0 && (
                <div className="flex gap-1.5 px-4 pb-2.5 overflow-x-auto hide-scrollbar shrink-0">
                  {routeStops.map((stop, idx) => (
                    <span
                      key={stop.id}
                      className="shrink-0 flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-full bg-[var(--color-hmi-accent)]/10 text-[11.5px] font-bold text-[var(--color-hmi-accent)] whitespace-nowrap"
                    >
                      <span className="w-4 h-4 rounded-full bg-[var(--color-hmi-accent)] text-white text-[9px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="max-w-[120px] truncate">{stop.name}</span>
                      <button
                        type="button"
                        onClick={() => removeRouteStop(stop.id)}
                        disabled={isRerouting}
                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-[var(--color-hmi-accent)]/20 cursor-pointer shrink-0"
                        aria-label={`Remove ${stop.name} from route`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {showRouteSearch ? (
                <div className="flex-1 min-h-0 flex flex-col border-t border-gray-100">
                  {/* Quick category chips — not a second search field, just
                      shortcuts that fill and run the same search above. */}
                  <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto hide-scrollbar shrink-0">
                    {ROUTE_SEARCH_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={async () => {
                          setRouteSearchQuery(cat.label);
                          await searchAlongRoute(cat.label);
                        }}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-[11.5px] font-bold text-gray-700 hover:bg-gray-200 cursor-pointer whitespace-nowrap"
                      >
                        <cat.icon className="w-3.5 h-3.5" />
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {routeSearchResults.length > 0 && (
                    <div className="flex-1 min-h-0 overflow-y-auto border-t border-gray-100 hide-scrollbar">
                      {routeSearchResults.map((r) => {
                        const CatIcon = r.category?.icon || MapPin;
                        return (
                          <button
                            key={r.id}
                            onClick={() => {
                              setShowRouteSearch(false);
                              // View details first — adding is an explicit
                              // action from the preview card, not an instant
                              // side effect of tapping a result.
                              setPreviewResult(r);
                              if (map.current) {
                                map.current.easeTo({ center: [r.lng, r.lat], zoom: 15, duration: 600 });
                              }
                            }}
                            className="w-full text-left px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 flex items-start gap-2.5 cursor-pointer"
                          >
                            <CatIcon className="w-4 h-4 text-[var(--color-hmi-accent)] shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <p className="text-[12.5px] font-bold text-gray-900 truncate">{r.name}</p>
                                {r.distFromRouteKm != null && (
                                  <span className="text-[10.5px] font-bold text-gray-400 shrink-0">{r.distFromRouteKm.toFixed(1)} km off route</span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 truncate">
                                {r.address || (r.distFromUserKm != null ? `${r.distFromUserKm.toFixed(1)} km from you` : '')}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {routeSearchHasRun && routeSearchResults.length === 0 && (
                    <div className="px-4 py-4 text-center border-t border-gray-100">
                      <p className="text-[12.5px] font-semibold text-gray-400">No matches for "{routeSearchQuery}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Hazard alert — inline in the same panel, its own slim
                      notice rather than a separate floating pill. */}
                  {nextHazard && (
                    <div className="mx-3 mb-2 px-3.5 py-2.5 bg-red-50 rounded-xl flex items-center gap-2.5 shrink-0">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-[12px] font-bold text-red-600 truncate">{Math.max(0, Math.round(nextHazard.remainingDist * 1000))}m · Hazard ahead</span>
                    </div>
                  )}

                  {/* Upcoming steps — same panel, below the search field,
                      tertiary info per the nav hierarchy. */}
                  {upcomingSteps.length > 1 && (
                    <div className="flex-1 min-h-0 overflow-y-auto border-t border-gray-100 divide-y divide-gray-100 hide-scrollbar">
                      {upcomingSteps.slice(1).map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-gray-100 text-gray-500">
                            {React.cloneElement(getTurnIcon(step.type) as React.ReactElement<{className?: string}>, { className: 'w-3.5 h-3.5' })}
                          </div>
                          <span className="flex-1 min-w-0 truncate text-[12px] font-semibold text-gray-700">{step.text}</span>
                          <span className="text-[11px] font-semibold text-gray-400 shrink-0 tabular-nums">{step.dist}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Controls — one compact cluster for secondary actions, with
              Re-center as a distinct primary action that only surfaces once
              the camera has drifted off heading-up follow mode. Anchored
              from the TOP (matching the left panel) — anchoring from the
              bottom on a short landscape screen let this grow upward past
              the top edge and clip its first button off-screen. */}
          {mapLoaded && (
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 z-40 w-7 h-7 rounded-full bg-white/95 backdrop-blur-xl shadow-lg flex items-center justify-center text-[10px] font-bold text-[var(--color-hmi-accent)] pointer-events-none"
              style={{ transform: `translateX(-50%) rotate(${-mapBearing}deg)`, transition: 'transform 0.3s ease-out' }}
            >
              N
            </div>
          )}

          {mapLoaded && (
            <div className="absolute top-4 right-4 bottom-6 z-40 flex flex-col items-end justify-between gap-3">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg flex flex-col overflow-y-auto hide-scrollbar max-h-full">
                <button
                  onClick={() => setShowTraffic(!showTraffic)}
                  title="Traffic layer"
                  className={`w-9 h-9 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${showTraffic ? 'text-[var(--color-hmi-accent)]' : 'text-gray-600'}`}
                >
                  <Layers className="w-4 h-4" />
                </button>
                <div className="h-px bg-gray-100 mx-2 shrink-0" />
                <button
                  onClick={groupRideId ? handleEndGroupNavigation : () => navigate(-1)}
                  title="End ride"
                  className="w-9 h-9 flex items-center justify-center shrink-0 text-red-500 hover:bg-red-50 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!isFollowingUser && (
                <button
                  onClick={recenterCamera}
                  title="Re-center"
                  className="w-12 h-12 rounded-full bg-[var(--color-hmi-accent)] shadow-lg flex items-center justify-center text-white cursor-pointer active:scale-95 transition-transform shrink-0"
                >
                  <Crosshair className="w-5 h-5" />
                </button>
              )}
            </div>
          )}


          {isRouteLoading && !routeBuildFailed && (
            <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center pointer-events-none">
              <div className="bg-white/95 backdrop-blur-xl rounded-full shadow-lg px-4 py-2.5 flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-[var(--color-hmi-accent)] rounded-full animate-spin" />
                <span className="text-[13px] font-bold text-gray-900">Building route to {destName || 'destination'}...</span>
              </div>
            </div>
          )}

          {/* Route build failed — a rider can't be left with a dead end
              here, so this is an explicit, tappable retry, not a silent
              toast that scrolls away. */}
          {routeBuildFailed && !isRouteLoading && (
            <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center">
              <button
                onClick={() => setRouteRetryTick((n) => n + 1)}
                className="bg-white rounded-full shadow-lg px-4 py-2.5 flex items-center gap-2.5 cursor-pointer active:scale-95 transition-transform"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-[13px] font-bold text-gray-900">Couldn't get a route — Tap to retry</span>
              </button>
            </div>
          )}

          {/* Search-result detail preview — opened by tapping a pin or list
              row. Adding a stop is an explicit action from here, never a
              side effect of just viewing details. */}
          {previewResult && (
            <div className="absolute inset-x-0 bottom-4 z-50 flex justify-center px-4">
              <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[var(--color-hmi-accent)]/10 text-[var(--color-hmi-accent)]">
                    {(() => { const CatIcon = previewResult.category?.icon || MapPin; return <CatIcon className="w-5 h-5" />; })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-gray-900 truncate">{previewResult.name}</p>
                    {previewResult.address && (
                      <p className="text-[11.5px] text-gray-500 truncate">{previewResult.address}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setPreviewResult(null)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                  {previewResult.distFromRouteKm != null && (
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-gray-900">{previewResult.distFromRouteKm.toFixed(1)} km</span>
                      <span className="text-[10px] text-gray-400 font-semibold">off route</span>
                    </div>
                  )}
                  {previewResult.distFromUserKm != null && (
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-gray-900">{previewResult.distFromUserKm.toFixed(1)} km</span>
                      <span className="text-[10px] text-gray-400 font-semibold">from you</span>
                    </div>
                  )}
                  {previewResult.estimatedDetourKm != null && (
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-gray-900">~{previewResult.estimatedDetourKm.toFixed(1)} km</span>
                      <span className="text-[10px] text-gray-400 font-semibold">est. detour</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={async () => {
                    const r = previewResult;
                    setPreviewResult(null);
                    await addRouteStop({ id: r.id, lat: r.lat, lng: r.lng, name: r.name });
                  }}
                  disabled={isRerouting}
                  className="w-full mt-3 h-11 rounded-full bg-[var(--color-hmi-accent)] text-white font-bold text-[13px] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" /> Add as Stop
                </button>
              </div>
            </div>
          )}
        </>
      }
    />

    {selectedIncident && (
      <IncidentDrawer incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
    )}

    {emergencyState.phase === 'countdown' && (
      <EmergencyCountdownScreen
        triggerType={emergencyState.triggerType}
        expiresAt={emergencyState.expiresAt}
        isOffline={emergencyState.isOffline}
        onConfirmSafe={() => confirmSafe()}
      />
    )}
    </React.Fragment>
  );
};

export default Navigation;
