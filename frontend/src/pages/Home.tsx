import React, { useEffect, useState, useRef } from 'react';
import { HomeShell } from '../components/home/HomeShell';
import { HomeMap } from '../components/home/HomeMap';
import { LeftGravityRail } from '../components/home/LeftGravityRail';
import { ActiveRideMembrane } from '../components/home/ActiveRideMembrane';
import { EnvironmentPill } from '../components/home/EnvironmentPill';
import { MapControls } from '../components/home/MapControls';
import { renderRiderMarker } from '../components/home/RiderMarker';
import { renderHazardMarker } from '../components/home/HazardMarker';
import { renderRiderPresence } from '../components/home/RiderPresence';
import { useLocationStore } from '../store/useLocationStore';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { getDeterministicUuid } from '../lib/user';
import maplibregl from 'maplibre-gl';
import { Helmet } from 'react-helmet-async';

const Home = () => {
  const { coordinates: userLocation } = useLocationStore();
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [weather, setWeather] = useState<{ temp: number, code: number, aqi: number } | null>(null);
  const [currentRide, setCurrentRide] = useState<any>(null);
  const riderMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Fetch Weather
  useEffect(() => {
    const lat = userLocation?.lat || 17.3850;
    const lng = userLocation?.lng || 78.4867;
    
    async function fetchWeather() {
      try {
        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`);
        const wData = await wRes.json();
        const aRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi`);
        const aData = await aRes.json();
        
        setWeather({
          temp: Math.round(wData.current.temperature_2m),
          code: wData.current.weather_code,
          aqi: Math.round(aData.current.us_aqi)
        });
      } catch (err) {
        console.error("Weather fetch failed", err);
      }
    }
    fetchWeather();
  }, [userLocation]);

  // Fetch Current Ride
  useEffect(() => {
    const fetchRide = async () => {
      const u = auth.currentUser;
      if (!u) return;
      const rawUid = u.uid;
      
      const { data: ownedRides } = await supabase
        .from('rides')
        .select('*')
        .eq('owner_id', rawUid)
        .neq('status', 'ended');
        
      if (ownedRides && ownedRides.length > 0) {
        setCurrentRide(ownedRides[0]);
      }
    };
    fetchRide();
  }, []);

  // Update Rider Marker
  useEffect(() => {
    if (mapInstance && userLocation) {
      if (!riderMarkerRef.current) {
        riderMarkerRef.current = renderRiderMarker(mapInstance, userLocation.lng, userLocation.lat);
      } else {
        riderMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
      }
    }
  }, [mapInstance, userLocation]);

  // Render dummy hazards and nearby riders for visual validation of the prompt
  useEffect(() => {
    if (mapInstance && userLocation) {
      const hazards = [
        { lat: userLocation.lat + 0.005, lng: userLocation.lng + 0.005 },
        { lat: userLocation.lat - 0.003, lng: userLocation.lng + 0.008 },
      ];
      const riders = [
        { lat: userLocation.lat + 0.002, lng: userLocation.lng - 0.004 },
        { lat: userLocation.lat - 0.006, lng: userLocation.lng - 0.002 },
      ];
      
      renderHazardMarker(mapInstance, hazards);
      renderRiderPresence(mapInstance, riders);
    }
  }, [mapInstance, userLocation]);

  return (
    <HomeShell>
      <Helmet>
        <title>Home | Ride Club</title>
      </Helmet>
      
      <HomeMap 
        userLocation={userLocation} 
        onMapLoad={(map) => setMapInstance(map)} 
      />
      
      <LeftGravityRail />
      
      <EnvironmentPill weather={weather} />
      
      <MapControls />
      
      <ActiveRideMembrane ride={currentRide || { name: 'Araku Valley Escape', id: 'dummy' }} />
      
    </HomeShell>
  );
};

export default Home;
