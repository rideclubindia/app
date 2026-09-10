import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Compass, Navigation2, Crosshair } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLocationStore } from '../../store/useLocationStore';
import { useIncidentCategories } from '../../hooks/useIncidentCategories';
import { filterActiveIncidents } from '../../lib/incidentExpiry';
import { addIncidentMarker, pruneIncidentMarkers } from '../map/IncidentMarkers';
import { offlineProtocol } from '../../lib/offlineProtocol';

// Register offline protocol once
let protocolRegistered = false;
if (!protocolRegistered) {
  try {
    maplibregl.addProtocol('https', offlineProtocol);
    protocolRegistered = true;
  } catch (e) {
    // Protocol might already be registered in HMR
  }
}

interface HomeMapProps {
  userLocation: { lat: number; lng: number; } | null;
  onMapLoad: (map: maplibregl.Map) => void;
}

export const HomeMap: React.FC<HomeMapProps> = ({ userLocation, onMapLoad }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const incidentMarkersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const navigate = useNavigate();

  const { categories: reportTypes } = useIncidentCategories();
  const [showTraffic, setShowTraffic] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialLng = userLocation?.lng || 78.4867;
    const initialLat = userLocation?.lat || 17.3850;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [initialLng, initialLat],
      zoom: 14,
      attributionControl: false,
    });

    map.current.on('load', () => {
      setMapReady(true);
      onMapLoad(map.current!);
    });

    // MapLibre only ever measures its container once at creation — it has
    // no way to know the surrounding flex/grid layout later resized it (e.g.
    // the side panel collapsing to give the map the full screen while
    // reporting an incident). Watch the actual container box and resize the
    // canvas to match whenever it changes, instead of guessing a timeout.
    const ro = new ResizeObserver(() => map.current?.resize());
    ro.observe(mapContainer.current);

    return () => {
      ro.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (map.current && userLocation) {
      // Don't auto pan if user is interacting, but for now just jump
      // map.current.easeTo({ center: [userLocation.lng, userLocation.lat] });
    }
  }, [userLocation]);

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
              tiles: [`idb://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=GkjXLzDVKuB5KI8iXmBBYKVtYTDu6LhJ`],
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
            markersRef: incidentMarkersRef.current,
            onClick: () => navigate(`/incident/${alert.id}`)
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

  // Control handlers (same as /ride-plus/live)
  const handle3D = () => {
    if (!map.current) return;
    const next3D = !is3D;
    if (next3D) {
      map.current.easeTo({ pitch: 60, duration: 1000 });
    } else {
      map.current.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
    }
    setIs3D(next3D);
  };

  const handleFollow = () => {
    if (!map.current) return;
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
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

    </div>
  );
};
