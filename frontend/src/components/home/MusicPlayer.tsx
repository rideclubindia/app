import React, { useState } from 'react';
import { SkipBack, Play, Pause, SkipForward, Heart, Repeat, Maximize2 } from 'lucide-react';

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress] = useState(45);

  return (
    <div className="absolute bottom-14 left-3 right-14 z-20 bg-[#131823]/90 backdrop-blur-md rounded-[12px] overflow-hidden border border-[#1A1F2E]/40 flex items-center p-2 gap-2.5">
      {/* Album Art */}
      <div className="w-9 h-9 rounded-[8px] bg-gradient-to-br from-[#F97316]/30 to-[#1A1F2E] flex-shrink-0 flex items-center justify-center">
        <span className="text-[14px]">🎵</span>
      </div>

      {/* Song Info + Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-semibold text-[#F4F7FA] truncate">Someone Like You</span>
          <span className="text-[9px] font-medium text-[#66707D] uppercase flex-shrink-0">YANNI</span>
        </div>
        <div className="mt-1 h-[2px] bg-[#1A1F2E] rounded-full w-full relative">
          <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button className="text-[#66707D] hover:text-[#F4F7FA]"><SkipBack size={13} /></button>
        <button onClick={() => setIsPlaying(!isPlaying)} className="w-7 h-7 rounded-full bg-[#F4F7FA] flex items-center justify-center text-[#050607]">
          {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
        </button>
        <button className="text-[#66707D] hover:text-[#F4F7FA]"><SkipForward size={13} /></button>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button className="text-[#66707D] hover:text-[#F4F7FA]"><Heart size={12} /></button>
        <button className="text-[#66707D] hover:text-[#F4F7FA]"><Repeat size={12} /></button>
      </div>

      <button className="text-[#66707D] hover:text-[#F4F7FA] flex-shrink-0"><Maximize2 size={11} /></button>
    </div>
  );
};
