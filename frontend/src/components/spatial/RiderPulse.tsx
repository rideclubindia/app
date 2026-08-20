import React from 'react';

interface RiderPulseProps {
  status: 'healthy' | 'caution' | 'critical' | 'offline';
  pulseRate?: number; // visual representation of movement/activity
  className?: string;
}

export const RiderPulse: React.FC<RiderPulseProps> = ({ 
  status, 
  pulseRate = 1,
  className = '' 
}) => {
  const statusColors = {
    healthy: 'var(--color-hmi-live)',
    caution: 'var(--color-hmi-warning)',
    critical: 'var(--color-hmi-critical)',
    offline: 'var(--color-hmi-text-muted)'
  };

  const color = statusColors[status];
  const isAnimating = status !== 'offline';

  return (
    <div className={`relative flex items-center justify-center w-16 h-16 ${className}`}>
      {/* Outer Pulse Rings */}
      {isAnimating && (
        <>
          <div 
            className="absolute inset-0 rounded-full border border-current opacity-20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" 
            style={{ color, animationDuration: `${3 / pulseRate}s` }} 
          />
          <div 
            className="absolute inset-2 rounded-full border border-current opacity-40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" 
            style={{ color, animationDuration: `${2 / pulseRate}s`, animationDelay: '0.5s' }} 
          />
        </>
      )}

      {/* Core Node */}
      <div 
        className="w-4 h-4 rounded-full shadow-[0_0_15px_currentColor]"
        style={{ backgroundColor: color, color }}
      />
      
      {/* Status Ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="opacity-30"
          style={{ color }}
        />
        {isAnimating && (
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="40 140"
            className="opacity-80 animate-[spin_4s_linear_infinite]"
            style={{ color, animationDuration: `${4 / pulseRate}s` }}
          />
        )}
      </svg>
    </div>
  );
};
