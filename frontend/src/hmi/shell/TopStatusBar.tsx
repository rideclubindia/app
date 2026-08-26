import React from 'react';
import { Battery, MapPin } from 'lucide-react';
import { useLocationStore } from '../../store/useLocationStore';

export const TopStatusBar = () => {
  return (
    <div className="absolute top-0 left-0 right-0 h-10 bg-white/90 backdrop-blur border-b border-gray-100 flex justify-between items-center px-4 z-50">
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#FF5A00]" />
        <span className="text-xs font-semibold text-[#111111]">Connected</span>
      </div>
      <div className="flex items-center gap-4 text-[#111111]">
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold">4G</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold">85%</span>
          <Battery className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};
