import maplibregl from 'maplibre-gl';
import { createRoot } from 'react-dom/client';
import { AlertTriangle } from 'lucide-react';

export const renderHazardMarker = (map: maplibregl.Map, hazards: any[]) => {
  hazards.forEach(hazard => {
    const el = document.createElement('div');
    el.className = 'relative flex items-center justify-center';
    
    const root = createRoot(el);
    root.render(
      <div className="relative">
        <div className="absolute inset-0 bg-[#F97316] rounded-full opacity-20 animate-ping" style={{ animationDuration: '2.4s' }}></div>
        <div className="w-[16px] h-[16px] bg-white rounded-full flex items-center justify-center border-2 border-[#F97316] shadow-sm relative z-10">
          <AlertTriangle className="w-[8px] h-[8px] text-[#F97316]" strokeWidth={3} />
        </div>
      </div>
    );

    new maplibregl.Marker({ element: el })
      .setLngLat([hazard.lng, hazard.lat])
      .addTo(map);
  });
};
