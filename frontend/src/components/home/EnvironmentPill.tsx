import React from 'react';
import { Sun, Cloud, CloudRain } from 'lucide-react';

interface EnvironmentPillProps {
  weather: { temp: number, code: number, aqi: number } | null;
}

export const EnvironmentPill: React.FC<EnvironmentPillProps> = ({ weather }) => {
  if (!weather) return null;

  return (
    <div className="absolute top-8 right-8 z-40 h-[36px] bg-white/82 backdrop-blur-[16px] rounded-[20px] shadow-sm border border-white/60 px-4 flex items-center gap-4 pointer-events-auto" style={{ backgroundColor: 'rgba(255,255,255,0.82)' }}>
      <div className="flex items-center gap-2">
        <Sun className="w-5 h-5 text-[#F97316]" />
        <div>
          <span className="text-[14px] font-black text-[#111827] leading-none block">{weather.temp}°</span>
          <span className="text-[10px] font-medium text-[#6B7280] leading-none block mt-0.5">Clear</span>
        </div>
      </div>
      <div className="w-[1px] h-[16px] bg-gray-200"></div>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
        <div>
           <span className="text-[10px] font-black text-[#6B7280] uppercase block leading-none">AQI {weather.aqi}</span>
           <span className="text-[10px] font-medium text-[#111827] block mt-0.5 leading-none">Good</span>
        </div>
      </div>
    </div>
  );
};
