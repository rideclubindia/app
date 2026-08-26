import React, { useState, useEffect } from 'react';
import { Thermometer, Signal, ChevronDown } from 'lucide-react';

interface EdgeRailProps {
  variant?: 'dark' | 'light';
}

export const EdgeRail: React.FC<EdgeRailProps> = ({ variant = 'dark' }) => {
  const [time, setTime] = useState(new Date());
  const isLight = variant === 'light';

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const iconColor = isLight ? 'text-[#6B7280]' : 'text-[#AAB1BD]';
  const labelColor = isLight ? 'text-[#6B7280]' : 'text-[#AAB1BD]';
  const barColor = isLight ? 'bg-[#374151]' : 'bg-[#F4F7FA]';

  return (
    <div className="w-full px-4 py-2 flex items-center justify-between">
      {/* Left: RC Logo + Hi */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#F97316] flex items-center justify-center shadow-sm">
            <span className="text-white text-[9px] font-semibold tracking-tight">RC</span>
          </div>
          <div className="flex items-end gap-[2px] h-3">
            <div className={`w-[2px] h-[4px] ${barColor} rounded-full`} />
            <div className={`w-[2px] h-[6px] ${barColor} rounded-full`} />
            <div className={`w-[2px] h-[8px] ${barColor} rounded-full`} />
            <div className={`w-[2px] h-[10px] ${barColor} rounded-full`} />
            <div className={`w-[2px] h-[12px] ${barColor} rounded-full`} />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className={`text-[13px] font-medium ${labelColor}`}>Hi</span>
          <ChevronDown className={`w-3 h-3 ${isLight ? 'text-[#9CA3AF]' : 'text-[#66707D]'}`} />
        </div>
      </div>

      {/* Right: Status icons + Temp + Time */}
      <div className="flex items-center gap-5">
        <Signal className={`w-3.5 h-3.5 ${iconColor}`} />

        <div className={`flex items-center gap-1 ${labelColor}`}>
          <Thermometer className="w-3 h-3" />
          <span className="text-[12px] font-semibold tabular-nums">25&deg;</span>
        </div>

        <div className={`text-[16px] font-semibold tracking-wider tabular-nums ${isLight ? 'text-[#111827]' : 'text-[#F4F7FA]'}`}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
      </div>
    </div>
  );
};
