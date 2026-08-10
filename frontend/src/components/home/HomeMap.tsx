import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface HomeMapProps {
  userLocation: { lat: number; lng: number } | null;
  onMapLoad: (map: maplibregl.Map) => void;
}

export const HomeMap: React.FC<HomeMapProps> = ({ userLocation, onMapLoad }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

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
      onMapLoad(map.current!);
    });

    return () => {
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

  return (
    <div ref={mapContainer} className="absolute inset-0 w-full h-full z-0" />
  );
};
