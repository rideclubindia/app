import React, { useState, useEffect } from 'react';
import { Wifi, Bluetooth, Thermometer, Signal } from 'lucide-react';

export const EdgeRail: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full px-4 py-2 flex items-center justify-between">
      {/* Left: RC Logo + Hi */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#F97316] flex items-center justify-center">
            <span className="text-white text-[9px] font-black tracking-tight">RC</span>
          </div>
          <div className="flex items-center gap-0.5">
            {/* Signal bars */}
            <div className="flex items-end gap-[2px] h-3">
              <div className="w-[2px] h-[4px] bg-[#F4F7FA] rounded-full" />
              <div className="w-[2px] h-[6px] bg-[#F4F7FA] rounded-full" />
              <div className="w-[2px] h-[8px] bg-[#F4F7FA] rounded-full" />
              <div className="w-[2px] h-[10px] bg-[#F4F7FA] rounded-full" />
              <div className="w-[2px] h-[12px] bg-[#F4F7FA] rounded-full" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-[13px] font-medium text-[#AAB1BD]">Hi</span>
          <span className="text-[10px] text-[#66707D]">▾</span>
        </div>
      </div>

      {/* Right: Status icons + Temp + Time */}
      <div className="flex items-center gap-5">
        <Wifi className="w-3.5 h-3.5 text-[#AAB1BD]" />
        <Bluetooth className="w-3.5 h-3.5 text-[#AAB1BD]" />
        <Signal className="w-3.5 h-3.5 text-[#AAB1BD]" />
        
        <div className="flex items-center gap-1 text-[#AAB1BD]">
          <Thermometer className="w-3 h-3" />
          <span className="text-[12px] font-semibold tabular-nums">25°</span>
        </div>
        
        <div className="text-[16px] font-bold tracking-wider text-[#F4F7FA] tabular-nums">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
      </div>
    </div>
  );
};
