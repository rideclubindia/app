import React from 'react';

export interface TelemetryRow {
  label: string;
  value: string;
  accent?: boolean;
}

interface TelemetryBandProps {
  rows: TelemetryRow[];
}

export const TelemetryBand: React.FC<TelemetryBandProps> = ({ rows }) => {
  return (
    <div className="w-full flex flex-col">
      {rows.map((row, i) => (
        <div key={row.label}>
          {i > 0 && <div className="h-px w-full bg-[#2A3040]/60" />}
          <div className="flex items-center justify-between py-2.5 px-1 min-h-[44px]">
            <span className="text-[10px] font-semibold tracking-[0.2em] text-[#66707D] uppercase shrink-0">
              {row.label}
            </span>
            <div className="flex-1 mx-4 border-b border-dotted border-[#2A3040]" />
            <span
              className={`text-[14px] font-medium tabular-nums shrink-0 ${
                row.accent ? 'text-[#FF4D21]' : 'text-[#F4F7FA]'
              }`}
              style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
            >
              {row.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
