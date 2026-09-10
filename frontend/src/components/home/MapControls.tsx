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
    <div className="absolute bottom-[120px] right-3 z-20 flex flex-col gap-2">
      <button onClick={handleCompass} className="w-11 h-11 card-app flex items-center justify-center text-gray-700 hover:text-[#FF6B22] transition-colors cursor-pointer" aria-label="Reset compass orientation">
        <Compass size={18} />
      </button>
      <button onClick={handleRecenter} className="w-11 h-11 card-app flex items-center justify-center text-gray-700 hover:text-[#FF6B22] transition-colors cursor-pointer" aria-label="Recenter on my location">
        <Focus size={18} />
      </button>
      <button onClick={handleLayers} className="w-11 h-11 card-app flex items-center justify-center text-gray-700 hover:text-[#FF6B22] transition-colors cursor-pointer" aria-label="Toggle map layer">
        <Layers size={18} />
      </button>
      <button onClick={handleSound} className="w-11 h-11 card-app flex items-center justify-center text-gray-700 hover:text-[#FF6B22] transition-colors cursor-pointer" aria-label={isMuted ? 'Unmute navigation audio' : 'Mute navigation audio'}>
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
};
