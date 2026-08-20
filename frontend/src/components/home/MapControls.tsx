import React, { useState } from 'react';
import { Compass, Focus, Layers, Volume2, VolumeX } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import { useLocationStore } from '../../store/useLocationStore';
import { useToast } from '../ToastContext';

export const MapControls: React.FC<{ map?: maplibregl.Map | null }> = ({ map }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const { showToast } = useToast();

  const handleCompass = () => {
    if (map) {
      map.resetNorthPitch({ duration: 1000 });
    }
  };

  const handleRecenter = () => {
    useLocationStore.getState().fetchLocationOnce().then((loc) => {
      if (map) {
        map.flyTo({ center: [loc.lng, loc.lat], zoom: 15, duration: 1200 });
      }
    }).catch(() => {
      showToast('Unable to get your location', 'error');
    });
  };

  const handleLayers = () => {
    if (map) {
      const newStyle = isDarkMode 
        ? 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
        : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
      map.setStyle(newStyle);
      setIsDarkMode(!isDarkMode);
    }
  };

  const handleSound = () => {
    setIsMuted(!isMuted);
    showToast(isMuted ? 'Navigation audio enabled' : 'Navigation audio muted', 'info');
  };

  return (
    <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
      <button onClick={handleCompass} className="w-9 h-9 bg-[#161C28]/80 backdrop-blur-md rounded-[10px] flex items-center justify-center text-[#C0C6D0] hover:text-white hover:bg-[#1E2536] transition-colors border border-[#2A3040]/40" aria-label="Compass">
        <Compass size={16} />
      </button>
      <button onClick={handleRecenter} className="w-9 h-9 bg-[#161C28]/80 backdrop-blur-md rounded-[10px] flex items-center justify-center text-[#C0C6D0] hover:text-white hover:bg-[#1E2536] transition-colors border border-[#2A3040]/40" aria-label="Recenter">
        <Focus size={16} />
      </button>
      <button onClick={handleLayers} className="w-9 h-9 bg-[#161C28]/80 backdrop-blur-md rounded-[10px] flex items-center justify-center text-[#C0C6D0] hover:text-white hover:bg-[#1E2536] transition-colors border border-[#2A3040]/40" aria-label="Layers">
        <Layers size={16} />
      </button>
      <button onClick={handleSound} className="w-9 h-9 bg-[#161C28]/80 backdrop-blur-md rounded-[10px] flex items-center justify-center text-[#C0C6D0] hover:text-white hover:bg-[#1E2536] transition-colors border border-[#2A3040]/40" aria-label="Sound">
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  );
};
