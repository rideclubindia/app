import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopStatusBar } from './TopStatusBar';
import { BottomNavigation } from './BottomNavigation';
import { useLocationStore } from '../../store/useLocationStore';
import { auth } from '../../lib/firebase';
import { getDeterministicUuid } from '../../lib/user';
import { supabase } from '../../lib/supabase';
import type maplibregl from 'maplibre-gl';
import { MapEngine } from '../../map/MapEngine';

export const HmiLayout = () => {
  const location = useLocation();
  const { coordinates: userLocation, locationName, isMapReporting } = useLocationStore();
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [currentRide, setCurrentRide] = useState<any>(null);
  const [activeNavigation, setActiveNavigation] = useState<any>(null);
  const [nearbyRiderCount, setNearbyRiderCount] = useState(0);

  // Fetch Current Ride
  useEffect(() => {
    const fetchRide = async () => {
      const u = auth.currentUser;
      if (!u) return;
      const userId = getDeterministicUuid(u.uid);

      const { data: ownedRides } = await supabase
        .from('rides')
        .select('*')
        .eq('owner_id', userId)
        .neq('status', 'ended')
        .order('created_at', { ascending: false });

      if (ownedRides && ownedRides.length > 0) {
        setCurrentRide(ownedRides[0]);
      } else {
        const { data: participatingRides } = await supabase
          .from('ride_participants')
          .select('rides(*)')
          .eq('user_id', userId)
          .eq('status', 'joined');

        if (participatingRides && participatingRides.length > 0) {
          const active = participatingRides.find((pr: any) => (pr.rides as any).status !== 'ended');
          if (active) {
            setCurrentRide(active.rides);
          }
        }
      }
    };

    fetchRide();
    const interval = setInterval(fetchRide, 30000);
    return () => clearInterval(interval);
  }, []);

  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (mapInstance && userLocation) {
      if (!markerRef.current) {
        import('../../components/home/RiderMarker').then(({ renderRiderMarker }) => {
          markerRef.current = renderRiderMarker(mapInstance, userLocation.lng, userLocation.lat);
        });
      } else {
        markerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
      }
    }
  }, [mapInstance, userLocation]);

  return (
    <div 
      className="w-full relative bg-[#E8F1F2] overflow-hidden flex flex-col font-sans" 
      style={{ height: '100dvh' }}
    >
      <TopStatusBar />
      
      {/* 
        The map is rendered persistently in the background. 
        Active screens (Outlets) overlay on top using a split pane or full screen as needed.
      */}
      <div className="absolute inset-0 z-0">
        <MapEngine
          userLocation={userLocation}
          onMapLoad={(map: maplibregl.Map) => setMapInstance(map)}
          mode={location.pathname.includes('/navigation') ? 'navigation' : 'explore'}
          traffic={true}
        />
      </div>

      {/* Active Screen Content (Foreground) */}
      <div className="flex-1 flex w-full h-full relative z-10 min-h-0 pt-[48px] pb-[80px]">
        <Outlet context={{ map: mapInstance, currentRide, activeNavigation, nearbyRiderCount }} />
      </div>
      
      <BottomNavigation />
    </div>
  );
};
