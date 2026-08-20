/// <reference types="google.maps" />
import React from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useLocationStore } from '../store/useLocationStore';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TrafficLayerComponent = () => {
  const map = useMap();
  
  React.useEffect(() => {
    if (!map) return;
    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);
    
    return () => {
      trafficLayer.setMap(null);
    };
  }, [map]);

  return null;
};

export const SoloRide: React.FC = () => {
  const navigate = useNavigate();
  const { coordinates: userLocation } = useLocationStore();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-[#050607] flex flex-col items-center justify-center p-6 text-center font-sans text-white">
        <h2 className="text-2xl font-bold mb-4">Google Maps API Key Missing</h2>
        <p className="text-[#8890A0] max-w-sm mb-6">
          Please add VITE_GOOGLE_MAPS_API_KEY to your .env file to enable Solo Riding with live traffic.
        </p>
        <button 
          onClick={() => navigate('/home')}
          className="px-6 py-3 bg-[#1E2536] hover:bg-[#2A3040] rounded-xl font-bold transition-colors"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const defaultCenter = userLocation || { lat: 37.7749, lng: -122.4194 };

  return (
    <div className="w-full h-full relative font-sans">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={15}
          mapId="DEMO_MAP_ID"
          disableDefaultUI={false}
          className="w-full h-full"
        >
          <TrafficLayerComponent />
          
          {userLocation && (
            <AdvancedMarker position={userLocation}>
              <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg animate-pulse" />
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>

      {/* Floating UI Elements */}
      <div className="absolute top-12 left-4 z-10 flex flex-col gap-4">
        <button 
          onClick={() => navigate('/home')}
          className="w-12 h-12 bg-[#161C28]/90 backdrop-blur-md rounded-full shadow-lg border border-white/10 flex items-center justify-center text-white hover:bg-[#1E2536] transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
      </div>
      
      <div className="absolute top-12 left-20 right-4 z-10">
        <div className="w-full max-w-md bg-[#161C28]/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/10 p-4 text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <h3 className="font-bold text-lg mb-1">Solo Navigation</h3>
          <p className="text-sm text-[#8890A0]">Live traffic enabled. Places search coming up next.</p>
        </div>
      </div>
    </div>
  );
};
