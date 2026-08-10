import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { createRoot } from 'react-dom/client';
import { Crosshair, Bookmark, Share, Bike, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const renderRiderMarker = (map: maplibregl.Map, lng: number, lat: number) => {
  const el = document.createElement('div');
  el.className = 'rider-marker-container relative flex items-center justify-center';
  el.style.width = '14px';
  el.style.height = '14px';

  // Inner marker
  const dot = document.createElement('div');
  dot.className = 'w-[14px] h-[14px] bg-[#F97316] rounded-full border-[2px] border-white shadow-sm z-10';
  el.appendChild(dot);
  
  // React root for popup menu
  const menuContainer = document.createElement('div');
  menuContainer.className = 'absolute right-[24px] top-1/2 -translate-y-1/2 z-20';
  el.appendChild(menuContainer);
  
  const root = createRoot(menuContainer);
  
  let pressTimer: any = null;
  
  const handlePress = () => {
    root.render(<RiderMenu onClose={() => root.render(<></>)} />);
  };

  el.addEventListener('mousedown', () => {
    pressTimer = setTimeout(handlePress, 280);
  });
  el.addEventListener('mouseup', () => clearTimeout(pressTimer));
  el.addEventListener('mouseleave', () => clearTimeout(pressTimer));
  
  el.addEventListener('touchstart', () => {
    pressTimer = setTimeout(handlePress, 280);
  });
  el.addEventListener('touchend', () => clearTimeout(pressTimer));

  return new maplibregl.Marker({ element: el })
    .setLngLat([lng, lat])
    .addTo(map);
};

const RiderMenu = ({ onClose }: { onClose: () => void }) => {
  const actions = [Crosshair, Bookmark, Share, Bike, AlertTriangle];
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-2"
    >
      <div className="fixed inset-0" onClick={onClose}></div>
      {actions.map((Icon, idx) => (
        <button 
          key={idx}
          className="w-[44px] h-[44px] rounded-[20px] bg-white/82 backdrop-blur-[16px] shadow-md border border-white/60 flex items-center justify-center relative z-10 hover:bg-white transition-colors"
          style={{ backgroundColor: 'rgba(255,255,255,0.82)' }}
        >
          <Icon className="w-5 h-5 text-[#111827]" />
        </button>
      ))}
    </motion.div>
  );
};
