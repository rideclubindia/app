import React from 'react';
import { Satellite } from 'lucide-react';

interface CockpitStatusStripProps {
  locationName: string | null;
  gpsLocked: boolean;
  gpsError: string | null;
}

export const CockpitStatusStrip: React.FC<CockpitStatusStripProps> = ({ locationName, gpsLocked, gpsError }) => {
  const gpsLabel = gpsError
    ? 'GPS ERROR'
    : gpsLocked
      ? 'GPS LOCK'
      : 'ACQUIRING';
  const gpsColor = gpsError
    ? '#FF2222'
    : gpsLocked
      ? '#00FF00'
      : '#FFBF00';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-1 pb-3">

        {/* Left: GPS + Location */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <Satellite className="w-3.5 h-3.5" style={{ color: gpsColor }} />
            <span
              className="text-[10px] font-semibold tracking-[0.18em]"
              style={{ color: gpsColor }}
            >
              {gpsLabel}
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: gpsColor, boxShadow: `0 0 6px ${gpsColor}` }}
            />
          </div>
          <div className="w-px h-3 bg-[#2A3040] shrink-0" />
          <span className="text-[12px] font-medium text-[#AAB1BD] truncate">
            {locationName ?? 'Location unavailable'}
          </span>
        </div>

        {/* Right: Telemetry source tag */}
        <div className="flex items-center gap-2 shrink-0 pl-4">
          <span className="text-[9px] font-semibold tracking-[0.22em] text-[#66707D]">
            RIDECLUB OS
          </span>
        </div>

      </div>

      {/* Thin technical rule */}
      <div className="h-px w-full bg-gradient-to-r from-[#2A3040] via-[#2A3040]/60 to-transparent" />
    </div>
  );
};
