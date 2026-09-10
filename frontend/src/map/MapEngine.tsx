import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Compass, Navigation2, Crosshair } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLocationStore } from '../store/useLocationStore';
import { useIncidentCategories } from '../hooks/useIncidentCategories';
import { filterActiveIncidents } from '../lib/incidentExpiry';
import { addIncidentMarker, pruneIncidentMarkers } from '../components/map/IncidentMarkers';
import { offlineProtocol } from '../lib/offlineProtocol';

let protocolRegistered = false;
if (!protocolRegistered) {
  try {
    maplibregl.addProtocol('https', offlineProtocol);
    protocolRegistered = true;
  } catch (e) {
    // Protocol might already be registered
  }
}

export interface MapEngineProps {
  userLocation: { lat: number; lng: number } | null;
  destinationLocation?: { lat: number; lng: number } | null;
  onMapLoad: (map: maplibregl.Map) => void;
  mode?: 'navigation' | 'explore' | 'incidents';
  traffic?: boolean;
  incidents?: boolean;
  riders?: boolean;
  onRouteInfo?: (info: { distance: number, duration: number } | null) => void;
}
export const MapEngine: React.FC<MapEngineProps> = ({ 
  userLocation,
  destinationLocation,
  onMapLoad,
  mode = 'explore',
  traffic = false,
  incidents = false,
  riders = false,
  onRouteInfo
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);
  const initialBearingRef = useRef<number>(0);
  const prevModeRef = useRef<string | undefined>(undefined);
  const userLocationRef = useRef(userLocation);
  const cameraLockUntilRef = useRef(0);
  const fetchSeqRef = useRef(0);
  const lastRouteKeyRef = useRef<string | null>(null);
  const incidentMarkersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const isFollowingRef = useRef<boolean>(false);
  const { categories: reportTypes } = useIncidentCategories();
  const [showTraffic, setShowTraffic] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Keep latest location accessible to effects that must NOT re-run on every GPS tick
  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    const initialLng = userLocation?.lng || 78.4867;
    const initialLat = userLocation?.lat || 17.3850;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [initialLng, initialLat],
      zoom: mode === 'navigation' ? 17 : 14,
      pitch: mode === 'navigation' ? 60 : 0,
      attributionControl: false,
      fadeDuration: 0,
    });

    map.current.on('load', () => {
      setMapReady(true);
      onMapLoad(map.current!);
    });

    // Stop following when the user takes manual control (same as /ride-plus/live)
    map.current.on('dragstart', () => { isFollowingRef.current = false; setIsFollowingUser(false); });
    map.current.on('touchstart', () => { isFollowingRef.current = false; setIsFollowingUser(false); });

    // MapLibre only measures its container once at creation, so a later
    // layout resize (e.g. a panel collapsing/expanding around it) leaves the
    // canvas stuck at its old size unless we watch the container ourselves.
    const ro = new ResizeObserver(() => map.current?.resize());
    ro.observe(mapContainer.current);

    return () => {
      ro.disconnect();
      userMarkerRef.current?.remove();
      destMarkerRef.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Sync user location marker and camera for navigation
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !userLocation) return;

    if (!userMarkerRef.current) {
      // Create custom user marker element
      const el = document.createElement('div');
      el.className = 'w-6 h-6 bg-[#FF5A00] rounded-full border-[3px] border-white shadow-[0_0_15px_rgba(255,90,0,0.5)] flex items-center justify-center';
      const inner = document.createElement('div');
      inner.className = 'w-1.5 h-1.5 bg-white rounded-full';
      el.appendChild(inner);

      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(mapInstance);
    } else {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    }

    const modeChanged = prevModeRef.current !== mode;
    prevModeRef.current = mode;
    const now = Date.now();

    if (mode === 'navigation') {
      if (modeChanged) {
        // Single decisive camera transition when entering navigation
        cameraLockUntilRef.current = now + 1400;
        mapInstance.easeTo({
          center: [userLocation.lng, userLocation.lat],
          zoom: 17,
          pitch: 60,
          bearing: initialBearingRef.current,
          duration: 1200
        });
      } else if (now >= cameraLockUntilRef.current) {
        // Gentle follow only - never interrupts the entering transition
        mapInstance.easeTo({
          center: [userLocation.lng, userLocation.lat],
          duration: 800,
          easing: (t) => t
        });
      }
    } else {
      // Reset bearing if exiting navigation mode
      if (modeChanged && mapInstance.getPitch() > 0.1) {
        cameraLockUntilRef.current = now + 1100;
        mapInstance.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
      }
      // Explore mode: gently follow the user when follow is enabled (nav/crosshair buttons)
      if (isFollowingRef.current && !modeChanged && now >= cameraLockUntilRef.current) {
        mapInstance.easeTo({
          center: [userLocation.lng, userLocation.lat],
          duration: 800,
          easing: (t) => t
        });
      }
    }
  }, [userLocation, mode]);

  // Sync destination marker and Route
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance) return;

    if (!destinationLocation) {
      if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }
      if (mapInstance.getLayer('route')) {
        mapInstance.removeLayer('route');
      }
      if (mapInstance.getSource('route')) {
        mapInstance.removeSource('route');
      }
      if (onRouteInfo) {
        onRouteInfo(null);
      }
      lastRouteKeyRef.current = null;
      return;
    }

    if (!destMarkerRef.current) {
      // Create custom dest marker element
      const el = document.createElement('div');
      el.className = 'w-8 h-8 flex flex-col items-center justify-center';
      el.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="#EF4444" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3" fill="white"></circle>
        </svg>
      `;
      destMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([destinationLocation.lng, destinationLocation.lat])
        .addTo(mapInstance);
    } else {
      destMarkerRef.current.setLngLat([destinationLocation.lng, destinationLocation.lat]);
    }

    const origin = userLocationRef.current;
    if (!origin) {
      if (mode !== 'navigation') {
        mapInstance.easeTo({ center: [destinationLocation.lng, destinationLocation.lat], zoom: 15 });
      }
      return;
    }

    const routeKey = `${origin.lat},${origin.lng}|${destinationLocation.lat},${destinationLocation.lng}|${mode}`;

    const fetchRoute = () => {
      const seq = ++fetchSeqRef.current;
      fetch(`https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destinationLocation.lng},${destinationLocation.lat}?overview=full&geometries=geojson&steps=true`)
        .then(res => res.json())
        .then(data => {
          // Ignore stale responses if a newer request has been issued
          if (seq !== fetchSeqRef.current || !map.current) return;
          const routeData = data?.routes?.[0];
          if (!routeData) return;

          const bearingAfter = routeData.legs?.[0]?.steps?.[0]?.maneuver?.bearing_after;
          if (typeof bearingAfter === 'number') {
            initialBearingRef.current = bearingAfter;
          }

          if (onRouteInfo) {
            onRouteInfo({ distance: routeData.distance, duration: routeData.duration });
          }

          if (mode === 'navigation') {
            cameraLockUntilRef.current = Date.now() + 1200;
            map.current.easeTo({ bearing: initialBearingRef.current, duration: 1000 });
          }

          if (map.current.getSource('route')) {
            (map.current.getSource('route') as maplibregl.GeoJSONSource).setData(routeData.geometry);
          } else {
            map.current.addSource('route', {
              type: 'geojson',
              data: routeData.geometry
            });
            map.current.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#007BFF',
                'line-width': 6,
                'line-opacity': 0.8
              }
            });
          }
        })
        .catch(err => console.error("Failed to fetch route:", err));
    };

    // Fetch only when origin/destination/mode actually changes - NOT on every GPS tick
    if (lastRouteKeyRef.current !== routeKey) {
      lastRouteKeyRef.current = routeKey;

      // Auto-fit to show both user and destination ONLY when entering explore view
      if (mode !== 'navigation') {
        const bounds = new maplibregl.LngLatBounds()
          .extend([origin.lng, origin.lat])
          .extend([destinationLocation.lng, destinationLocation.lat]);
        mapInstance.fitBounds(bounds, { padding: 80, maxZoom: 15 });
      }

      fetchRoute();
    }

    // While actively navigating, recalculate periodically instead of every tick
    let recalcTimer: number | undefined;
    if (mode === 'navigation') {
      recalcTimer = window.setInterval(fetchRoute, 15000);
    }

    return () => {
      if (recalcTimer !== undefined) window.clearInterval(recalcTimer);
    };
  }, [destinationLocation, mode]);

  // Traffic Layer logic (same as /ride-plus/live)
  useEffect(() => {
    if (!map.current || !mapReady) return;
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
            map.current.addLayer({
              id: 'tomtom-traffic-layer',
              type: 'raster',
              source: 'tomtom-traffic',
              paint: { 'raster-opacity': 0.8 }
            });
          }
        } else {
          if (map.current.getLayer('tomtom-traffic-layer')) map.current.removeLayer('tomtom-traffic-layer');
        }
      } catch (e) { console.warn('Traffic error:', e); }
    };
    updateTraffic();
    map.current.on('styledata', updateTraffic);
    return () => { map.current?.off('styledata', updateTraffic); }
  }, [mapReady, showTraffic]);

  // Incident pins (expired after 2h from last vote/creation)
  useEffect(() => {
    if (!map.current || !mapReady) return;

    const fetchPins = async () => {
      try {
        const { data } = await supabase.from('pins')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(50);
        if (!data) return;
        const active = await filterActiveIncidents(data);

        pruneIncidentMarkers(incidentMarkersRef.current, new Set(active.map(a => a.id)));
        active.forEach(alert => {
          const lng = alert.location?.coordinates?.[0] ?? alert.longitude;
          const lat = alert.location?.coordinates?.[1] ?? alert.latitude;
          if (lat == null || lng == null) return;
          addIncidentMarker(map.current!, {
            id: alert.id,
            lng,
            lat,
            category: alert.category,
            iconName: alert.icon_name,
            categories: reportTypes,
            markersRef: incidentMarkersRef.current
          });
        });
      } catch (e) {
        console.warn('Failed to render incident pins:', e);
      }
    };

    fetchPins();
    const interval = setInterval(fetchPins, 30000);
    return () => clearInterval(interval);
  }, [mapReady, reportTypes]);

  // Map control handlers (same as /ride-plus/live)
  const handle3D = () => {
    if (!map.current) return;
    const next3D = !is3D;
    let currentBearing = 0;
    let targetCenter: [number, number] | null = null;

    if (userLocationRef.current) {
      targetCenter = [userLocationRef.current.lng, userLocationRef.current.lat];
    }

    if (next3D) {
      // Jump straight to the navigation starting view (user location, 3D tilt) and follow
      isFollowingRef.current = true;
      const options: any = { pitch: 60, zoom: 17, bearing: currentBearing, duration: 1000 };
      if (targetCenter) options.center = targetCenter;
      map.current.easeTo(options);
      setIsFollowingUser(true);
    } else {
      isFollowingRef.current = false;
      map.current.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
      setIsFollowingUser(false);
    }
    setIs3D(next3D);
  };

  const handleFollow = () => {
    if (!map.current) return;
    isFollowingRef.current = true;
    setIsFollowingUser(true);
    const fly = (lat: number, lng: number) => {
      if (!userMarkerRef.current) {
        const el = document.createElement('div');
        el.style.cssText = 'width:18px;height:18px;background:#007BFF;border-radius:50%;border:3px solid white;box-shadow:0 0 0 6px rgba(0,123,255,0.2);';
        userMarkerRef.current = new maplibregl.Marker(el).setLngLat([lng, lat]).addTo(map.current!);
      } else {
        userMarkerRef.current.setLngLat([lng, lat]);
      }
      map.current?.easeTo({ center: [lng, lat], zoom: 15, duration: 1000 });
    };
    if (userLocation) {
      fly(userLocation.lat, userLocation.lng);
    } else {
      useLocationStore.getState().fetchLocationOnce().then(loc => fly(loc.lat, loc.lng)).catch(() => {});
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full pointer-events-auto" />

      {/* Map Controls (same as /ride-plus/live) */}
      {mapReady && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
          <button
            onClick={() => setShowTraffic(!showTraffic)}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all duration-300 ${showTraffic ? 'bg-[#FF5A00] text-white shadow-[0_4px_16px_rgba(255,90,0,0.4)]' : 'bg-white/95 backdrop-blur border border-gray-100 text-[#111111] hover:bg-gray-50'}`}
            title="Toggle Traffic"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={handle3D}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all duration-300 ${is3D ? 'bg-[#FF5A00] text-white shadow-[0_4px_16px_rgba(255,90,0,0.4)]' : 'bg-white/95 backdrop-blur border border-gray-100 text-[#111111] hover:bg-gray-50'}`}
            title="3D View"
          >
            {is3D ? <Compass className="w-4 h-4" /> : <Navigation2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleFollow}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all duration-300 ${isFollowingUser ? 'bg-[#FF5A00] text-white shadow-[0_4px_16px_rgba(255,90,0,0.4)]' : 'bg-white/95 backdrop-blur border border-gray-100 text-[#111111] hover:bg-gray-50'}`}
            title="My Location"
            aria-label="My Location"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
