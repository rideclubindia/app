import React from 'react';
import { BikeHero } from './BikeHero';
import { MusicPlayer } from './MusicPlayer';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HomeStageProps {
  currentRide: any;
}

export const HomeStage: React.FC<HomeStageProps> = ({ currentRide }) => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-full flex flex-col">

      {/* Bike visualization */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden px-8">
        <div className="w-full max-w-[520px]">
          <BikeHero />
        </div>
      </div>

      {/* Active ride strip */}
      {currentRide && (
        <button
          onClick={() => navigate(`/ride-plus/live/${currentRide.id}`)}
          className="mx-3 mb-2 min-h-[52px] px-4 flex items-center justify-between gap-3 bg-white border border-[#E9ECF0] rounded-[14px] transition-colors hover:border-[#F97316]/40 group shadow-[0_1px_6px_rgba(17,24,39,0.04)]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#F97316] shrink-0 animate-pulse" />
            <div className="min-w-0 text-left">
              <div className="text-[13px] font-semibold text-[#111827] truncate">{currentRide.name || 'Joined Ride'}</div>
              <div className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.14em]">Active ride</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#111827] shrink-0" />
        </button>
      )}

      {/* Media band */}
      <MusicPlayer />
    </div>
  );
};
