import React from 'react';
import { ArrowUp, CornerUpRight, Users } from 'lucide-react';

interface NavigationOverlayProps {
  distanceToTurn: string;
  streetName: string;
  turnDirection: 'left' | 'right' | 'straight';
  totalDistanceRemaining: string;
  timeRemaining: string;
  ridersNearby: number;
  eta: string;
}

export const NavigationOverlay: React.FC<NavigationOverlayProps> = ({
  distanceToTurn,
  streetName,
  turnDirection,
  totalDistanceRemaining,
  timeRemaining,
  ridersNearby,
  eta,
}) => {
  return (
    <div className="absolute top-3 left-3 z-20 w-[260px] bg-[#161C28]/95 backdrop-blur-md text-white rounded-[12px] overflow-hidden flex flex-col border border-[#2A3040]/60">
      {/* Primary Turn Instruction */}
      <div className="flex items-center p-3 border-b border-[#2A3040]">
        <div className="w-10 flex justify-center flex-shrink-0">
          <ArrowUp 
            size={28} 
            strokeWidth={2.5}
            className={`text-white transition-transform ${
              turnDirection === 'right' ? 'rotate-45' : 
              turnDirection === 'left' ? '-rotate-45' : ''
            }`} 
          />
        </div>
        <div className="flex-1 ml-1.5 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[20px] font-bold tracking-tight leading-none text-white">{distanceToTurn.replace(/[^\d]/g, '') || '--'}</span>
            <span className="text-[12px] font-medium text-[#C0C6D0]">{distanceToTurn.replace(/[\d]/g, '').trim() || 'm'}</span>
          </div>
          <div className="text-[#9BA3B0] font-medium text-[10px] mt-0.5 truncate">
            {streetName}
          </div>
        </div>
        <div className="flex-shrink-0 ml-1.5 text-right">
          <CornerUpRight size={16} className="text-[#8890A0] ml-auto" />
        </div>
      </div>
      
      {/* Secondary Metrics */}
      <div className="flex items-center justify-between p-2 px-3 text-[9px] font-semibold text-[#9BA3B0]">
        <span>{totalDistanceRemaining}</span>
        <span>{timeRemaining}</span>
        <div className="flex items-center gap-0.5">
          <Users size={9} />
          <span>{ridersNearby}</span>
        </div>
        <span className="text-white">{eta}</span>
      </div>
    </div>
  );
};
