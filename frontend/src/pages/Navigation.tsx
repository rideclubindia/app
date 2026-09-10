import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUp, X, AlertTriangle, Car, Ban, Waves, Shield, Hammer, MoreHorizontal, Compass, Layers, Crosshair, Map, CornerUpLeft, CornerUpRight, ArrowLeft, ArrowRight, MapPin, Users, Crown, Phone, LogOut, Search as SearchIcon, Smartphone, Gauge, Clock, Route as RouteIcon, Volume2, VolumeX, Plus, Minus } from 'lucide-react';
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
import { CommandDock } from '../components/spatial/CommandDock';
import { Telemetry } from '../components/spatial/Telemetry';
import { SpatialMembrane } from '../components/spatial/SpatialMembrane';
import LoadingSpinner from '../components/LoadingSpinner';
import { getRealtime } from '../realtime';
import { useOrientationLock } from '../hooks/useOrientationLock';

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
  const [upcomingSteps, setUpcomingSteps] = useState<{ text: string; type: number; dist: string }[]>([]);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [routeBuildFailed, setRouteBuildFailed] = useState(false);
  const [routeRetryTick, setRouteRetryTick] = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const [showRouteSearch, setShowRouteSearch] = useState(false);
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [routeSearchResults, setRouteSearchResults] = useState<any[]>([]);
  const [routeSearchHasRun, setRouteSearchHasRun] = useState(false);

  const fetchNewRoute = async (origin: {lat: number, lng: number}) => {
    if (!destLat || !destLng || isRerouting || !map.current) return;
    try {
      setIsRerouting(true);
      setCurrentInstruction({ text: 'Rerouting...', dist: '', type: 6, distMeters: 0 });
      const profile = travelMode?.id || 'driving-car';
      const { fetchTomTomRoute } = await import('../lib/routing');
      const coordinates = [
        [origin.lng, origin.lat],
        [destLng, destLat]
      ];
      
      const newRouteFeature = await fetchTomTomRoute(coordinates, profile);
      
      if (newRouteFeature) {
        const summary = newRouteFeature.properties.summary;
        
        const adjustedDurationSecs = summary.duration;
        const adjustedEtaMins = Math.round(adjustedDurationSecs / 60);

        setCurrentRoute(newRouteFeature);
        setCurrentEta(`${adjustedEtaMins} min`);
        setCurrentDistance(`${(summary.distance / 1000).toFixed(1)} km`);
        
        const source = map.current.getSource('route') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData(newRouteFeature);
        }
        const remainingSource = map.current.getSource('route-remaining') as maplibregl.GeoJSONSource;
        if (remainingSource) {
          remainingSource.setData(newRouteFeature);
        }
      }
    } catch (error) {
      console.error("Failed to recalculate route", error);
    } finally {
      setIsRerouting(false);
    }
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
      bearing: 0,
      pitch: 0,
      zoom: 17,
      offset: [0, 120],
      duration: 900,
    });
  };

  const searchAlongRoute = async (query: string) => {
    if (!query.trim()) return;
    setRouteSearchHasRun(false);
    const origin = userLocation
      || useLocationStore.getState().coordinates
      || (currentRoute?.geometry?.coordinates?.[0]
        ? { lng: currentRoute.geometry.coordinates[0][0], lat: currentRoute.geometry.coordinates[0][1] }
        : destLat && destLng ? { lat: destLat, lng: destLng } : null);
    try {
      const params = new URLSearchParams({ format: 'json', q: query, limit: '8' });
      if (origin) {
        // ~0.4° square (~40-45km) around the rider — wide enough to cover
        // the whole trip corridor for most local searches, narrow enough to
        // keep "near me" results actually near.
        params.set('viewbox', `${origin.lng - 0.4},${origin.lat + 0.4},${origin.lng + 0.4},${origin.lat - 0.4}`);
        params.set('bounded', '1');
      }
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
      let results: any[] = await res.json();
      if (results.length === 0 && origin) {
        const fallbackParams = new URLSearchParams({ format: 'json', q: query, limit: '8' });
        const fallbackRes = await fetch(`https://nominatim.openstreetmap.org/search?${fallbackParams.toString()}`);
        results = await fallbackRes.json();
      }

      if (origin) {
        results = results
          .map((r) => ({ ...r, __dist: Math.hypot(parseFloat(r.lat) - origin.lat, parseFloat(r.lon) - origin.lng) }))
          .sort((a, b) => a.__dist - b.__dist);
      }
      setRouteSearchResults(results.slice(0, 5));
    } catch {
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
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: startCoord as [number, number],
      zoom: 17,
      pitch: 0, // Always flat, north-up — see the comment block above
      bearing: 0
    });

    // MapLibre enables two-finger rotate/pitch touch gestures by default —
    // an ordinary two-finger drag or pinch on a phone can rotate or tilt
    // the map completely outside our own state, no matter what pitch/
    // bearing the code sets elsewhere. On a driving/navigation screen an
    // accidental rotation like that is exactly the "map is tilted/rotated
    // for no reason" symptom, so it's locked out entirely — the only way
    // to change bearing/pitch is through the compass button, which stays
    // under our control.
    map.current.dragRotate.disable();
    map.current.touchZoomRotate.disableRotation();
    map.current.touchPitch.disable();
    map.current.keyboard.disableRotation();

    map.current.on('load', () => {
      if (!map.current) return;



      // Removed default GeolocateControl as requested

      // The navigation arrow representing the rider. Added regardless of
      // whether a route exists yet — with the direct Home → Navigation flow
      // the route arrives a moment later (see syncRouteLayers).
      //
      // Heading model: rotationAlignment 'map' means the rotation we set is
      // a *geographic* bearing (clockwise from true north), not a screen
      // angle — so it rotates together with the map itself. As long as this
      // rotation and the map's own bearing are driven from the same heading
      // value (see the geolocation watcher and recenterCamera below), the
      // two cancel out and the arrow always points straight up on screen,
      // matching the road it's actually facing. A fixed offset would break
      // that the moment the map rotates.
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
      // Live map rotation, for the compass icon — this is what actually lets
      // you *see* whether the map is north-up or rotated, instead of having
      // to infer it from the tilt/mode toggle state alone.
      map.current.on('rotate', () => setMapBearing(map.current?.getBearing() ?? 0));

      setMapLoaded(true);
      fetchIncidents();
    });

    // MapLibre only measures its container once at creation — it never
    // notices a later CSS-driven resize (e.g. rotating the device from the
    // portrait "rotate your phone" gate into landscape). Without this the
    // canvas can be left rendering at its stale size, or effectively blank
    // if the container was 0×0 at creation time.
    const ro = new ResizeObserver(() => map.current?.resize());
    if (mapContainer.current) ro.observe(mapContainer.current);

    return () => {
      ro.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Draws (or refreshes) the route on the map. Kept out of the map's own
  // `load` handler because the route can arrive after the map is ready —
  // normal navigation fetches it on this screen rather than being handed a
  // pre-built one. Sources are created before the layers that reference
  // them; getting that order wrong silently drops the layer.
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);
  useEffect(() => {
    const m = map.current;
    if (!m || !mapLoaded || !currentRoute?.geometry?.coordinates?.length) return;

    // Until the first GPS fix lands, park the rider arrow on the head of the
    // route (and point it down the road) so marker, route and camera agree.
    if (!userLocation && userMarkerRef.current) {
      const coords = currentRoute.geometry.coordinates;
      const head = coords[0];
      const ahead = coords[Math.min(5, coords.length - 1)];
      userMarkerRef.current.setLngLat(head as [number, number]);
      userMarkerRef.current.setRotation(
        (Math.atan2(ahead[0] - head[0], ahead[1] - head[1]) * 180) / Math.PI
      );
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
      m.fitBounds(bounds, { padding: 80, pitch: 0, bearing: 0, duration: 900 });
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

        // Update user marker dynamically
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([longitude, latitude]);
          userMarkerRef.current.setRotation(smoothedHeadingRef.current);
        }

        // Follow camera: bearing/pitch stay pinned to 0 — north is always
        // "up" on screen. Only the center (the rider's live position)
        // moves. zoom 17 (not 20) keeps the road ahead and the next turn in
        // frame, and the offset biases the vehicle toward the lower half of
        // the screen so there's always more road visible ahead than behind.
        if (map.current && mapLoaded && isFollowingUserRef.current) {
          map.current.easeTo({
            center: [longitude, latitude],
            bearing: 0,
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
          // Denied permission doesn't change mid-session — react to it once.
          // Repeatedly calling setIsFollowingUser(false) here (this fires on
          // every watch (re)subscription, including the one caused by the
          // very state change it's about to make) is what produced the
          // flicker: tap Re-center → isFollowingUser true → effect
          // resubscribes → denied fires again → false again.
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

          {/* THE split panel — flush against the left edge, full height,
              solid (not a floating margined card). This is the actual
              "2 split layout": a real left pane and a real right pane, the
              way a split screen reads at a glance. The map canvas itself is
              untouched underneath — full width, full height, edge to edge —
              this only sits on top of it on the left; it isn't a column
              that shrinks the map. */}
          {mapLoaded && (
            <div className="absolute top-0 left-0 bottom-0 z-30 w-[320px] max-w-[42%] flex flex-col bg-white shadow-[8px_0_24px_rgba(0,0,0,0.12)]">
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
                <div className="flex items-center justify-between px-4 pb-3.5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[15px] font-extrabold text-gray-900 leading-none">{currentSpeed !== null ? currentSpeed : '--'}</span>
                    <span className="text-[10px] text-gray-400 font-semibold">km/h</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-200" />
                  <div className="flex items-baseline gap-1">
                    <span className="text-[15px] font-extrabold text-gray-900 leading-none">{currentEta || '--'}</span>
                    <span className="text-[10px] text-gray-400 font-semibold">ETA</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-gray-200" />
                  <div className="flex items-baseline gap-1">
                    <span className="text-[15px] font-extrabold text-gray-900 leading-none">{parseFloat(currentDistance) || '--'}</span>
                    <span className="text-[10px] text-gray-400 font-semibold">km left</span>
                  </div>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await searchAlongRoute(routeSearchQuery);
                }}
                className="flex items-center gap-2.5 h-[46px] mx-3 my-2.5 px-3 rounded-xl bg-gray-100 shrink-0"
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
                    onClick={() => { setShowRouteSearch(false); setRouteSearchQuery(''); setRouteSearchResults([]); setRouteSearchHasRun(false); }}
                    className="text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              {showRouteSearch ? (
                <div className="flex-1 min-h-0 flex flex-col border-t border-gray-100">
                  {/* Quick category chips — not a second search field, just
                      shortcuts that fill and run the same search above. */}
                  <div className="flex gap-1.5 px-3 py-2.5 overflow-x-auto hide-scrollbar shrink-0">
                    {['Fuel', 'Food', 'Parking', 'Coffee', 'Charging'].map((chip) => (
                      <button
                        key={chip}
                        onClick={async () => {
                          setRouteSearchQuery(chip);
                          await searchAlongRoute(chip);
                        }}
                        className="shrink-0 px-3 py-1.5 rounded-full bg-gray-100 text-[11.5px] font-bold text-gray-700 hover:bg-gray-200 cursor-pointer whitespace-nowrap"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {routeSearchResults.length > 0 && (
                    <div className="flex-1 min-h-0 overflow-y-auto border-t border-gray-100 hide-scrollbar">
                      {routeSearchResults.map((r, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setShowRouteSearch(false);
                            setRouteSearchResults([]);
                            setRouteSearchQuery('');
                            setRouteSearchHasRun(false);
                            // Re-target navigation at the new destination; the
                            // screen rebuilds its route from scratch.
                            navigate('/navigation', {
                              replace: true,
                              state: {
                                destLat: parseFloat(r.lat),
                                destLng: parseFloat(r.lon),
                                destName: r.name || r.display_name.split(',')[0],
                              },
                            });
                          }}
                          className="w-full text-left px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 flex items-start gap-2.5 cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-[12.5px] font-bold text-gray-900 truncate">{r.name || r.display_name.split(',')[0]}</p>
                              {/* __dist is degrees, not km — a rough straight-line
                                  hint so a result the distance fallback pulled in
                                  from far away still reads as far, not "nearby". */}
                              {typeof r.__dist === 'number' && (
                                <span className="text-[10.5px] font-bold text-gray-400 shrink-0">{(r.__dist * 111).toFixed(1)} km</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 truncate">{r.display_name}</p>
                          </div>
                        </button>
                      ))}
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
                        <div key={idx} className="flex items-center gap-2.5 px-4 py-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-gray-100 text-gray-500">
                            {React.cloneElement(getTurnIcon(step.type) as React.ReactElement<{className?: string}>, { className: 'w-3.5 h-3.5' })}
                          </div>
                          <span className="flex-1 min-w-0 truncate text-[12px] font-semibold text-gray-700">{step.text}</span>
                          <span className="text-[11px] font-semibold text-gray-400 shrink-0">{step.dist}</span>
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
            <div className="absolute top-4 right-4 bottom-6 z-20 flex flex-col items-end justify-between">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg flex flex-col overflow-y-auto hide-scrollbar max-h-full">
                <button
                  onClick={() => {
                    // This used to toggle INTO a tilted heading-up 3D mode,
                    // which kept confusing "why is the map rotated" reports
                    // — it looked like a bug even when working as coded,
                    // because tapping this compass icon is exactly what a
                    // rider would naturally do, without meaning to tilt the
                    // whole view. It's now strictly a "reset to north"
                    // action: it only ever resets bearing/pitch to 0, it
                    // never rotates or tilts the map.
                    if (!map.current) return;
                    map.current.easeTo({ pitch: 0, bearing: 0, duration: 500 });
                  }}
                  title={`Reset to north (currently rotated ${Math.round(mapBearing)}°)`}
                  className="w-9 h-9 flex items-center justify-center shrink-0 transition-colors cursor-pointer text-gray-600"
                >
                  {/* Rotates opposite the map's bearing so it always points
                      to true north — a live, at-a-glance answer to "is the
                      map actually north-up right now", not just a static icon. */}
                  <Compass className="w-4 h-4" style={{ transform: `rotate(${-mapBearing}deg)`, transition: 'transform 0.3s ease-out' }} />
                </button>
                <div className="h-px bg-gray-100 mx-2 shrink-0" />
                <button
                  onClick={() => setShowTraffic(!showTraffic)}
                  title="Traffic layer"
                  className={`w-9 h-9 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${showTraffic ? 'text-[var(--color-hmi-accent)]' : 'text-gray-600'}`}
                >
                  <Layers className="w-4 h-4" />
                </button>
                <div className="h-px bg-gray-100 mx-2 shrink-0" />
                <button
                  onClick={() => setVoiceOn(v => !v)}
                  title={voiceOn ? 'Mute voice guidance' : 'Unmute voice guidance'}
                  className={`w-9 h-9 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${voiceOn ? 'text-gray-600' : 'text-[var(--color-hmi-accent)]'}`}
                >
                  {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <div className="h-px bg-gray-100 mx-2 shrink-0" />
                <button
                  onClick={() => map.current?.zoomIn({ duration: 300 })}
                  title="Zoom in"
                  className="w-9 h-9 flex items-center justify-center shrink-0 text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => map.current?.zoomOut({ duration: 300 })}
                  title="Zoom out"
                  className="w-9 h-9 flex items-center justify-center shrink-0 text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
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

          {/* Route still being built — never show a bare empty map. This is
              bounded (see the route-build effect: 6s origin wait, 12s fetch
              timeout) so it can't spin forever — a failure always resolves
              into the tappable retry state below instead. */}
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

          {/* Command dock — floats ON the map like the search/controls
              overlays, rather than occupying its own row below it. Giving it
              a separate row (via bottomDock) left a dead strip under the map
              the full width of the screen; this keeps the map genuinely
              edge to edge all the way to the bottom. Centered on the full
              screen width (not just the map area) — the split panel is
              capped at 42% width, so screen-center always clears it. */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
            <CommandDock
              compact
              primaryAction={{
                id: 'end',
                label: 'END RIDE',
                icon: X,
                onClick: groupRideId ? handleEndGroupNavigation : () => navigate(-1),
                variant: 'danger'
              }}
              secondaryActions={[
                { id: 'sos', label: 'SOS', icon: AlertTriangle, onClick: () => navigate('/support'), variant: 'danger' },
                { id: 'group', label: 'Group', icon: Users, onClick: () => setShowParticipantList(!showParticipantList), isActive: showParticipantList }
              ]}
            />
          </div>
        </>
      }
    />
    
    {selectedIncident && (
      <IncidentDrawer incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
    )}
    </React.Fragment>
  );
};

export default Navigation;
