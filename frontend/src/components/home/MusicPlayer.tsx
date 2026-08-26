import React, { useState } from 'react';
import { SkipBack, Play, Pause, SkipForward, Heart, Repeat, Music } from 'lucide-react';

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress] = useState(45);

  return (
    <div className="mx-3 mb-3 bg-white rounded-[14px] overflow-hidden border border-[#E9ECF0] flex items-center p-2.5 gap-3 shadow-[0_1px_6px_rgba(17,24,39,0.04)]">
      {/* Album Art */}
      <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#3B82F6]/15 to-[#F3F4F6] flex-shrink-0 flex items-center justify-center">
        <Music className="w-4 h-4 text-[#3B82F6]" />
      </div>

      {/* Song Info + Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-[#111827] truncate">Someone Like You</span>
          <span className="text-[9px] font-medium text-[#9CA3AF] uppercase flex-shrink-0">YANNI</span>
        </div>
        <div className="mt-1.5 h-[3px] bg-[#F0F2F5] rounded-full w-full relative overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-[#3B82F6] rounded-full transition-all duration-500"
            style={{ width: `${isPlaying ? progress : 0}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button className="w-8 h-8 flex items-center justify-center text-[#9CA3AF] hover:text-[#111827] transition-colors">
          <SkipBack size={15} />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-9 h-9 rounded-full bg-[#111827] flex items-center justify-center text-white hover:bg-[#1F2937] transition-colors active:scale-95"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>
        <button className="w-8 h-8 flex items-center justify-center text-[#9CA3AF] hover:text-[#111827] transition-colors">
          <SkipForward size={15} />
        </button>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 pl-1 border-l border-[#F0F2F5]">
        <button className="w-8 h-8 flex items-center justify-center text-[#9CA3AF] hover:text-[#EF4444] transition-colors">
          <Heart size={14} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center text-[#9CA3AF] hover:text-[#111827] transition-colors">
          <Repeat size={14} />
        </button>
      </div>
    </div>
  );
};
