import React from 'react';

export const Tachometer: React.FC = () => {
  const size = 300;
  const center = size / 2;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  
  const sweepAngle = 270; // 135 to 405
  const startAngle = 135;
  const arcLength = circumference * (sweepAngle / 360);
  
  // Fake RPM value
  const currentRpmRatio = 0.7; // 7 / 10
  const activeArcLength = currentRpmRatio * arcLength;

  // Ticks
  const ticks = [];
  for (let i = 0; i <= 8; i++) {
    const angle = startAngle + (i / 8) * sweepAngle;
    ticks.push({ value: i, angle });
  }

  return (
    <div className="relative flex items-center justify-center w-full h-full max-w-[300px] mx-auto">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="tachoGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8EF1FF" />
            <stop offset="50%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FF9500" />
          </linearGradient>
          <filter id="glow-tacho" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Arc */}
        <g transform={`rotate(${startAngle} ${center} ${center})`}>
          <circle 
            cx={center} 
            cy={center} 
            r={radius} 
            fill="none" 
            stroke="#1C1C1E" 
            strokeWidth="8" 
            strokeDasharray={`${arcLength} ${circumference}`} 
            strokeLinecap="round"
          />
        </g>

        {/* Active Arc */}
        <g transform={`rotate(${startAngle} ${center} ${center})`}>
          <circle 
            cx={center} 
            cy={center} 
            r={radius} 
            fill="none" 
            stroke="url(#tachoGradient)" 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray={`${activeArcLength} ${circumference}`}
            className="transition-all duration-700 ease-out"
          />
        </g>

        {/* Ticks & Numbers */}
        {ticks.map(tick => {
          const rad = (tick.angle * Math.PI) / 180;
          const rText = radius + 24; // text outside
          const textX = center + rText * Math.cos(rad);
          const textY = center + rText * Math.sin(rad);

          return (
            <text 
              key={tick.value}
              x={textX} y={textY} 
              fill="#FFFFFF" 
              fontSize="14" 
              fontWeight="400" 
              textAnchor="middle" 
              dominantBaseline="central"
              className="font-sans"
            >
              {tick.value}
            </text>
          );
        })}

        {/* F and E markers for fuel (simulated on the bottom right) */}
        <text x={center + radius + 15} y={center + 30} fill="#FFFFFF" fontSize="12" fontWeight="600" textAnchor="middle">F</text>
        <text x={center + 30} y={center + radius + 15} fill="#FF3B30" fontSize="12" fontWeight="600" textAnchor="middle">E</text>

        {/* Center Text */}
        <text x={center} y={center + 10} textAnchor="middle" fill="#FFFFFF" fontSize="72" fontWeight="500" className="font-sans tracking-tight">
          7
        </text>
        <text x={center} y={center + 40} textAnchor="middle" fill="#A1A1A6" fontSize="12" fontWeight="400" className="font-sans">
          rpm x 1000
        </text>

      </svg>
    </div>
  );
};
