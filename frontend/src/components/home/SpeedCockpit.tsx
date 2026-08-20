import React, { useMemo } from 'react';

interface SpeedCockpitProps {
  speed: number;
  mode: 'Eco' | 'Comfort' | 'Sport';
  onModeChange?: (mode: 'Eco' | 'Comfort' | 'Sport') => void;
}

export const SpeedCockpit: React.FC<SpeedCockpitProps> = ({ speed, mode, onModeChange }) => {
  const maxSpeed = 200; 
  
  // SVG Dimensions & Arc Math
  const size = 460;
  const center = size / 2;
  const radius = 170;
  const circumference = 2 * Math.PI * radius;
  
  // Angle sweep: 240 degrees (from 150 deg to 390 deg)
  const sweepAngle = 240;
  const startAngle = 150;
  const arcLength = circumference * (sweepAngle / 360);
  
  // Speed Ratio
  const currentSpeed = Math.min(Math.max(speed, 0), maxSpeed);
  const speedRatio = currentSpeed / maxSpeed;
  const activeArcLength = speedRatio * arcLength;

  // Generate Ticks
  const ticks = useMemo(() => {
    const t = [];
    for (let i = 20; i <= maxSpeed; i += 20) {
      const angle = startAngle + (i / maxSpeed) * sweepAngle;
      t.push({ value: i, angle });
    }
    return t;
  }, [maxSpeed]);

  return (
    <div className="flex flex-col items-center relative w-full h-full justify-center">
      
      {/* SVG Speedometer Gauge */}
      <div className="relative flex items-center justify-center w-full max-w-[500px] mx-auto">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto overflow-visible">
          <defs>
            {/* The beautiful cyan -> white -> red gradient from the image */}
            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8EF1FF" />   {/* Cyan/Ice Blue */}
              <stop offset="40%" stopColor="#FFFFFF" />  {/* White transition */}
              <stop offset="70%" stopColor="#FF3B30" />  {/* Bright Red */}
              <stop offset="100%" stopColor="#FF0000" /> {/* Deep Red */}
            </linearGradient>
            
            <filter id="slight-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Track Arc (Dark Grey) */}
          <g transform={`rotate(${startAngle} ${center} ${center})`}>
            <circle 
              cx={center} 
              cy={center} 
              r={radius} 
              fill="none" 
              stroke="#1C1C1E" 
              strokeWidth="12" 
              strokeDasharray={`${arcLength} ${circumference}`} 
              strokeLinecap="round"
            />
          </g>

          {/* Active Speed Arc */}
          <g transform={`rotate(${startAngle} ${center} ${center})`}>
            <circle 
              cx={center} 
              cy={center} 
              r={radius} 
              fill="none" 
              stroke="url(#arcGradient)" 
              strokeWidth="12" 
              strokeLinecap="round"
              strokeDasharray={`${activeArcLength} ${circumference}`}
              className="transition-all duration-700 ease-out"
            />
          </g>

          {/* Tick Marks & Numbers */}
          {ticks.map(tick => {
            const rad = (tick.angle * Math.PI) / 180;
            
            // Ticks are on the INSIDE of the arc
            const r1 = radius - 16;
            const r2 = radius - 24;
            const x1 = center + r1 * Math.cos(rad);
            const y1 = center + r1 * Math.sin(rad);
            const x2 = center + r2 * Math.cos(rad);
            const y2 = center + r2 * Math.sin(rad);
            
            // Text is further inside
            const rText = radius - 48;
            const textX = center + rText * Math.cos(rad);
            const textY = center + rText * Math.sin(rad);

            return (
              <g key={tick.value}>
                <line 
                  x1={x1} y1={y1} x2={x2} y2={y2} 
                  stroke="#FFFFFF" 
                  strokeWidth="2"
                  opacity={0.7}
                />
                <text 
                  x={textX} y={textY} 
                  fill="#FFFFFF" 
                  fontSize="22" 
                  fontWeight="400" 
                  textAnchor="middle" 
                  dominantBaseline="central"
                  className="font-sans"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {tick.value}
                </text>
              </g>
            );
          })}
          
          {/* Needle */}
          <g>
            {(() => {
              const currentAngle = startAngle + (speedRatio * sweepAngle);
              const rad = (currentAngle * Math.PI) / 180;
              // Needle goes from center to just before the arc
              const nX1 = center + 50 * Math.cos(rad);
              const nY1 = center + 50 * Math.sin(rad);
              const nX2 = center + (radius - 12) * Math.cos(rad);
              const nY2 = center + (radius - 12) * Math.sin(rad);
              
              // Determine needle color based on angle (mimicking the gradient)
              const isRedZone = currentAngle > 270;
              
              return (
                <line 
                  x1={nX1} y1={nY1} x2={nX2} y2={nY2} 
                  stroke={isRedZone ? "#FF3B30" : "#FFFFFF"} 
                  strokeWidth="4" 
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                  filter="url(#slight-glow)"
                />
              )
            })()}
          </g>

          {/* Central Speed Display */}
          <text x={center} y={center + 15} textAnchor="middle" fill="#FFFFFF" fontSize="120" fontWeight="500" className="font-sans tracking-tight">
            {Math.round(currentSpeed)}
          </text>
          <text x={center} y={center + 55} textAnchor="middle" fill="#A1A1A6" fontSize="20" fontWeight="400" className="font-sans lowercase">
            km/h
          </text>

          {/* Odometer / Total Distance */}
          <text x={center} y={center + 110} textAnchor="middle" fill="#A1A1A6" fontSize="16" fontWeight="400" className="font-sans">
            Total distance (km)
          </text>
          <text x={center} y={center + 135} textAnchor="middle" fill="#FFFFFF" fontSize="24" fontWeight="400" className="font-sans">
            16416<tspan fill="#A1A1A6">.7</tspan>
          </text>
          
          {/* Top Clock and Temp */}
          <g transform={`translate(${center}, 40)`}>
             <text x="-40" y="0" fill="#FFFFFF" fontSize="16" textAnchor="middle" fontWeight="400">🕒 06:40</text>
             <text x="40" y="0" fill="#FFFFFF" fontSize="16" textAnchor="middle" fontWeight="400">🌡 22°C</text>
          </g>

        </svg>
      </div>

    </div>
  );
};
