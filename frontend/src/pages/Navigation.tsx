import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUp, Navigation2, X, AlertTriangle, Car, Ban, Waves, Shield, Hammer, MoreHorizontal, Compass, Layers, Crosshair, Map, CornerUpLeft, CornerUpRight, ArrowLeft, ArrowRight, MapPin, Users, Crown, Phone, LogOut, Search as SearchIcon } from 'lucide-react';
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
import { useToast } from '../components/ToastContext';
import { RiderCockpitLayout } from '../components/spatial/RiderCockpitLayout';
import { EdgeRail } from '../components/spatial/EdgeRail';
import { CommandDock } from '../components/spatial/CommandDock';
import { Telemetry } from '../components/spatial/Telemetry';
import { SpatialMembrane } from '../components/spatial/SpatialMembrane';
import LoadingSpinner from '../components/LoadingSpinner';const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { routeFeature, eta: initialEta, distance: initialDistance, destName, destLat, destLng, travelMode, isGroupMode: initialGroupMode } = location.state || {};

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
  const [is3D, setIs3D] = useState(true);
  const [showTraffic, setShowTraffic] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
  const prevPosRef = useRef<{lat: number; lng: number; timestamp: number} | null>(null);
  const smoothedHeadingRef = useRef<number>(0);
  
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

  const [currentInstruction, setCurrentInstruction] = useState(() => {
    let text = 'Head straight';
    let dist = '';
    let type = 6;
    if (routeFeature?.properties?.segments?.[0]?.steps?.[0]) {
      const step = routeFeature.properties.segments[0].steps[0];
      text = formatInstruction(step.instruction);
      type = step.type;
      dist = step.distance < 1000 ? `${Math.round(step.distance)} m` : `${(step.distance/1000).toFixed(1)} km`;
    }
    return { text, dist, type };
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

  const fetchNewRoute = async (origin: {lat: number, lng: number}) => {
    if (!destLat || !destLng || isRerouting || !map.current) return;
    try {
      setIsRerouting(true);
      setCurrentInstruction({ text: 'Rerouting...', dist: '', type: 6 });
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

  // ─── Broadcast own location to ride_locations ──────────────────────────
  useEffect(() => {
    if (!groupRideId || !auth.currentUser) return;
    const rawUid = auth.currentUser.uid;

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

      await supabase.from('ride_locations').upsert({
        ride_id: groupRideId,
        user_id: rawUid,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        speed: currentSpeed || 0,
        updated_at: nowStr
      }, { onConflict: 'ride_id,user_id' });
    }, 5000);

    return () => { if (locationBroadcastRef.current) clearInterval(locationBroadcastRef.current); };
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

    // Get the starting coordinate from the route
    let startCoord = [78.4867, 17.3850]; // Default Hyderabad
    let bearing = 0;

    if (currentRoute && currentRoute.geometry && currentRoute.geometry.coordinates.length > 1) {
      startCoord = currentRoute.geometry.coordinates[0];
      const nextCoord = currentRoute.geometry.coordinates[Math.min(5, currentRoute.geometry.coordinates.length - 1)];
      // Calculate rough bearing for camera
      const dy = nextCoord[1] - startCoord[1];
      const dx = nextCoord[0] - startCoord[0];
      bearing = (Math.atan2(dx, dy) * 180) / Math.PI;
    }

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: startCoord as [number, number],
      zoom: 17,
      pitch: 60, // 3D Tilt for navigation
      bearing: bearing
    });

    map.current.on('load', () => {
      if (!map.current) return;



      // Removed default GeolocateControl as requested

      if (currentRoute) {
        map.current.addSource('route', {
          type: 'geojson',
          data: currentRoute
        });

        // Background glow for remaining route
        map.current.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route-remaining',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#F97316',
            'line-width': 13, /* 5px + 8px glow */
            'line-opacity': 0.3,
            'line-blur': 8
          }
        });

        // Completed line (gray)
        map.current.addLayer({
          id: 'route-completed',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#9CA3AF',
            'line-width': 3,
            'line-opacity': 0.45
          }
        });

        // Main remaining line
        map.current.addSource('route-remaining', {
          type: 'geojson',
          data: currentRoute
        });

        map.current.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-remaining',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#F97316',
            'line-width': 5,
            'line-opacity': 1
          }
        });

        // Add a navigation arrow to represent the car
        const el = document.createElement('div');
        el.className = 'w-24 h-24 flex items-center justify-center drop-shadow-xl';
        el.innerHTML = `<svg width="120" height="120" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M20 4L8 32L20 25L32 32L20 4Z" fill="#273a5a" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>`;
        
        userMarkerRef.current = new maplibregl.Marker({ element: el, rotationAlignment: 'map', pitchAlignment: 'map' })
          .setLngLat(startCoord as [number, number])
          .addTo(map.current);

        // Add destination marker if destLng, destLat exist
        if (destLng && destLat) {
          const destEl = document.createElement('div');
          destEl.className = 'w-8 h-8 rounded-full flex shrink-0 flex-col items-center justify-center text-[10px] font-bold shadow-lg border-2 border-white bg-danger text-white';
          destEl.innerText = 'END';
          new maplibregl.Marker({ element: destEl })
            .setLngLat([destLng, destLat])
            .addTo(map.current);
        }
      }

      map.current.on('dragstart', () => setIsFollowingUser(false));
      map.current.on('touchstart', () => setIsFollowingUser(false));

      setMapLoaded(true);
      fetchIncidents();
      
      if (startCoord) {
        // Initial fly-in to the user location in 3D
        let currentBearing = 0;
        if (currentRoute) {
          try {
            const line = turf.lineString(currentRoute.geometry.coordinates);
            const routeLength = turf.length(line);
            const aheadPoint = turf.along(line, Math.min(0.05, routeLength));
            currentBearing = turf.bearing(turf.point(startCoord as [number, number]), aheadPoint);
          } catch(e) {}
        }
        map.current.flyTo({
          center: startCoord as [number, number],
          zoom: 20,
          pitch: 60,
          bearing: currentBearing,
          duration: 2000
        });
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

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

        // Force camera to follow user in 3D mode
        if (map.current && is3D && mapLoaded && isFollowingUser) {
          map.current.easeTo({
            center: [longitude, latitude],
            bearing: smoothedHeadingRef.current,
            pitch: 60,
            zoom: 20,
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
                const segments = currentRoute.properties.segments;
                for (const segment of segments) {
                  if (segment.steps) {
                    for (let i = 0; i < segment.steps.length; i++) {
                      const step = segment.steps[i];
                      const [start, end] = step.way_points;
                      if (currentCoordIndex >= start && currentCoordIndex <= end) {
                        foundStep = step;
                        const stepEndPt = turf.point(currentRoute.geometry.coordinates[end]);
                        let distToStepEnd = turf.distance(snappedUser, stepEndPt) * 1000;
                        let nextStep = i + 1 < segment.steps.length ? segment.steps[i + 1] : null;
                        if (distToStepEnd < 25 && nextStep) {
                           foundStep = nextStep;
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
                    type: displayType
                  });
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
          }
          setIsFollowingUser(false);
          return;
        }
        console.warn('Geolocation watch failed:', err);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [is3D, mapLoaded, currentRoute, isRerouting, isFollowingUser]);

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
              <div className="bg-dark/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full mt-1 border border-white/20 whitespace-nowrap shadow-xl">
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
    <RiderCockpitLayout
      topRail={<EdgeRail />}
      mapChildren={
        <>
          <div ref={mapContainer} className="w-full h-full" />
          
          {/* Map Controls */}
          {mapLoaded && (
            <div className={`absolute bottom-[100px] right-6 z-20 flex flex-col gap-3 transition-opacity duration-300`}>
              <button 
                onClick={() => setShowTraffic(!showTraffic)}
                className={`w-[48px] h-[48px] rounded-full flex items-center justify-center transition-colors shadow-lg ${showTraffic ? 'bg-[var(--color-hmi-surface)] border border-[var(--color-hmi-accent)] text-[var(--color-hmi-accent)]' : 'bg-[var(--color-hmi-surface)] border border-[var(--color-hmi-text-muted)] text-[var(--color-hmi-text-primary)]'}`}
              >
                <Layers className="w-6 h-6" />
              </button>
              <button 
                onClick={() => {
                  if (!map.current) return;
                  const next3D = !is3D;
                  setIs3D(next3D);
                  if (next3D) map.current.easeTo({ pitch: 60, duration: 1000 });
                  else map.current.easeTo({ pitch: 0, duration: 1000 });
                }}
                className={`w-[48px] h-[48px] rounded-full flex items-center justify-center transition-colors shadow-lg ${is3D ? 'bg-[var(--color-hmi-surface)] border border-[var(--color-hmi-accent)] text-[var(--color-hmi-accent)]' : 'bg-[var(--color-hmi-surface)] border border-[var(--color-hmi-text-muted)] text-[var(--color-hmi-text-primary)]'}`}
              >
                {is3D ? <Compass className="w-6 h-6" /> : <Navigation2 className="w-6 h-6" />}
              </button>
              <button 
                onClick={() => {
                  setIsFollowingUser(true);
                  if (userLocation && map.current) {
                    map.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 17, pitch: is3D ? 60 : 0 });
                  }
                }}
                className={`w-[48px] h-[48px] rounded-full flex items-center justify-center transition-colors shadow-lg ${!isFollowingUser ? 'bg-[var(--color-hmi-surface)] border border-[var(--color-hmi-accent)] text-[var(--color-hmi-accent)] animate-pulse' : 'bg-[var(--color-hmi-surface)] border border-[var(--color-hmi-text-muted)] text-[var(--color-hmi-text-primary)]'}`}
              >
                <Crosshair className="w-6 h-6" />
              </button>
            </div>
          )}
        </>
      }
      leftPanel={
        <div className="flex flex-col gap-6 p-6 h-full justify-start mt-6">
          {!mapLoaded ? (
            <LoadingSpinner fullScreen={false} message="Loading Map & Route..." />
          ) : (
            <>
              {/* TOP SECTION: Turn instruction */}
              <div className={`p-6 bg-[var(--color-hmi-surface)]/80 backdrop-blur-xl rounded-[32px] border border-[var(--color-hmi-accent)]/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col gap-4 items-center justify-center w-full max-w-[400px] pointer-events-auto transition-all duration-300`}>
                 <div className="w-20 h-20 bg-[var(--color-hmi-accent)]/10 rounded-full flex items-center justify-center shrink-0 border border-[var(--color-hmi-accent)]/30">
                    {React.cloneElement(getTurnIcon(currentInstruction.type) as React.ReactElement<{className?: string}>, { className: 'w-10 h-10 text-[var(--color-hmi-accent)]' })}
                 </div>
                 <div className="flex flex-col items-center text-center">
                   <h2 className="text-[32px] font-black leading-none text-[var(--color-hmi-text-primary)] mb-2">{currentInstruction.dist || `to ${destName || 'destination'}`}</h2>
                   <p className="text-[18px] text-[var(--color-hmi-text-secondary)] font-bold">{currentInstruction.text}</p>
                 </div>
              </div>

              {/* MIDDLE SECTION: Hazard Alerts */}
              {nextHazard && (
                <div className="p-4 bg-[var(--color-hmi-critical)]/10 rounded-[20px] border border-[var(--color-hmi-critical)]/50 w-full max-w-[400px] pointer-events-auto mt-2">
                   <div className="text-[var(--color-hmi-critical)] font-black text-[16px] flex items-center justify-center gap-3">
                     <AlertTriangle className="w-6 h-6" />
                     <span className="truncate uppercase">{Math.max(0, Math.round(nextHazard.remainingDist * 1000))}m - Hazard Ahead</span>
                   </div>
                </div>
              )}

              {/* BOTTOM SECTION: Speed & ETA */}
              <div className="flex flex-col gap-4 mt-auto pointer-events-auto w-full max-w-[400px]">
                 <div className="flex gap-4 p-6 bg-[var(--color-hmi-surface)]/80 backdrop-blur-xl rounded-[32px] border border-[var(--color-hmi-text-muted)]/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] justify-between items-center">
                   <Telemetry label="Speed" value={currentSpeed !== null ? currentSpeed : '--'} unit="KM/H" size="lg" color="live" />
                   <div className="w-[1px] h-16 bg-[var(--color-hmi-text-muted)]/30" />
                   <div className="flex flex-col">
                     <Telemetry label="ETA" value={currentEta} size="md" color="primary" />
                     <span className="text-[14px] text-[var(--color-hmi-text-muted)] font-bold mt-1">{currentDistance} left</span>
                   </div>
                 </div>
              </div>
            </>
          )}
        </div>
      }
      bottomDock={
        <CommandDock 
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
      }
    />
    
    {selectedIncident && (
      <IncidentDrawer incident={selectedIncident} onClose={() => setSelectedIncident(null)} />
    )}
    </React.Fragment>
  );
};

export default Navigation;
