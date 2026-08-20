import React from 'react';
import { Car, Navigation, Phone, ChevronLeft, ChevronRight, Music, Volume2, Bluetooth } from 'lucide-react';

interface BottomStatusBarProps {
  temperature: number | null;
}

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({ temperature }) => {
  const tempDisplay = temperature !== null ? `${temperature}°` : '--°';

  return (
    <div className="w-full px-4 py-2 flex items-center justify-between">
      {/* Left Icons */}
      <div className="flex items-center gap-5">
        <button className="text-[#C0C6D0] hover:text-white transition-colors">
          <Car size={18} />
        </button>
        <button className="text-[#C0C6D0] hover:text-white transition-colors">
          <Navigation size={18} />
        </button>
        <button className="text-[#C0C6D0] hover:text-white transition-colors">
          <Phone size={18} />
        </button>
      </div>

      {/* Center: Real temperature */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1 text-[#C0C6D0]">
          <ChevronLeft size={12} />
          <span className="text-[13px] font-semibold tabular-nums">{tempDisplay}</span>
          <ChevronRight size={12} />
        </div>
        <div className="text-[#8890A0]">
          <span className="text-[11px] font-medium">$</span>
        </div>
        <div className="flex items-center gap-1 text-[#C0C6D0]">
          <ChevronLeft size={12} />
          <span className="text-[13px] font-semibold tabular-nums">{tempDisplay}</span>
          <ChevronRight size={12} />
        </div>
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-5">
        <button className="text-[#C0C6D0] hover:text-white transition-colors">
          <Music size={18} />
        </button>
        <button className="text-[#C0C6D0] hover:text-white transition-colors">
          <Volume2 size={18} />
        </button>
        <button className="text-[#C0C6D0] hover:text-white transition-colors">
          <Bluetooth size={18} />
        </button>
      </div>
    </div>
  );
};
