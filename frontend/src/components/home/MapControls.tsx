import React from 'react';
import { Compass, Layers, Volume2, Crosshair } from 'lucide-react';

export const MapControls: React.FC = () => {
  const controls = [
    { icon: Compass, onClick: () => {} },
    { icon: Layers, onClick: () => {} },
    { icon: Volume2, onClick: () => {} },
    { icon: Crosshair, onClick: () => {} },
  ];

  return (
    <div className="absolute right-[24px] top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3 pointer-events-auto">
      {controls.map((ctrl, idx) => (
        <button 
          key={idx}
          onClick={ctrl.onClick}
          className="w-[48px] h-[48px] rounded-full bg-white/82 backdrop-blur-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-white/60 flex items-center justify-center active:scale-95 transition-transform"
          style={{ backgroundColor: 'rgba(255,255,255,0.82)' }}
        >
          <ctrl.icon className="w-6 h-6 text-[#111827]" />
        </button>
      ))}
    </div>
  );
};
