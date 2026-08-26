import React from 'react';

export const SpeedometerCluster = ({ speed }: { speed: number }) => {
  // Cap speed between 0 and 200
  const displaySpeed = Math.max(0, Math.min(speed || 0, 200));
  
  // Math for the static circular arc (260 degree sweep)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const arcDegrees = 260; // From 140 to 400 degrees
  const maxDash = (circumference * arcDegrees) / 360; 
  
  // Needle Angle Calculation
  // 0 km/h = 140 degrees (bottom-left)
  // Unrotated needle points UP (-90 or 270 degrees).
  // To make it point to 140 degrees, we must rotate it by 140 - (-90) = 230 degrees.
  const needleAngle = 230 + (displaySpeed * (260 / 200));

  const speedPercent = Math.min(displaySpeed / 200, 1);
  const currentDash = speedPercent * maxDash;

  // Generate ticks
  // Major ticks every 40 (0, 40, 80, 120, 160, 200) -> 6 major ticks
  // Minor ticks between them
  const ticks = [];
  for (let i = 0; i <= 40; i++) {
    const isMajor = i % 8 === 0;
    const isMedium = i % 4 === 0 && !isMajor;
    const val = i * 5; // 0 to 200 in steps of 5
    
    const angle = 140 + (i * (260 / 40));
    const angleRad = (angle * Math.PI) / 180;
    
    const outerR = 38;
    const innerR = isMajor ? 32 : (isMedium ? 34 : 36);
    
    const x1 = 50 + innerR * Math.cos(angleRad);
    const y1 = 50 + innerR * Math.sin(angleRad);
    const x2 = 50 + outerR * Math.cos(angleRad);
    const y2 = 50 + outerR * Math.sin(angleRad);
    
    // Ticks and labels are always white as requested
    ticks.push(
      <line 
        key={`tick-${i}`}
        x1={x1} y1={y1} x2={x2} y2={y2} 
        stroke="white" 
        strokeWidth={isMajor ? "1" : "0.5"} 
        strokeOpacity={isMajor ? 1 : 0.4}
        strokeLinecap="square"
      />
    );

    // Draw labels for major ticks
    if (isMajor) {
      const labelR = 25; // Pulled outwards slightly to avoid overlap
      const lx = 50 + labelR * Math.cos(angleRad);
      const ly = 50 + labelR * Math.sin(angleRad);
      ticks.push(
        <text
          key={`label-${i}`}
          x={lx}
          y={ly}
          fill="white"
          fontSize="5"
          fontWeight="bold"
          fontFamily="sans-serif"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {val}
        </text>
      );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full relative">
      {/* Speedometer Gauge Container */}
      <div className="relative flex flex-col items-center justify-center w-[200px] h-[200px] portrait:w-[148px] portrait:h-[148px] shrink-0 bg-[#0A0B0E] rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] border-4 border-[#1A1C23] overflow-hidden">
        
        {/* SVG Engine */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full z-0 scale-[1.15]">
          <defs>
            {/* 
              Multi-color gradient for the arc 
              gradientUnits="userSpaceOnUse" ensures the gradient is mapped to the viewBox (0 to 100)
              and NOT rotated along with the circle element.
            */}
            <linearGradient id="rainbowGradient" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00FF41" />     {/* Green (Bottom Left) */}
              <stop offset="50%" stopColor="#FFD700" />    {/* Yellow (Center Diagonal) */}
              <stop offset="100%" stopColor="#FF003C" />   {/* Red (Top Right) */}
            </linearGradient>

            <linearGradient id="needleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#007BFF" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Faint Background Track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#1F2229"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${maxDash} ${circumference}`}
            transform="rotate(140 50 50)"
          />

          {/* Glowing Dynamic Gradient Arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="url(#rainbowGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${currentDash} ${circumference}`}
            transform="rotate(140 50 50)"
            filter="url(#glow)"
            className="transition-all duration-300 ease-out"
          />

          {/* Core Solid Arc over the glow */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="url(#rainbowGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={`${currentDash} ${circumference}`}
            transform="rotate(140 50 50)"
            className="transition-all duration-300 ease-out"
          />

          {/* Inner dark rim separating ticks */}
          <circle cx="50" cy="50" r="39.5" fill="none" stroke="#1F2229" strokeWidth="1" />

          {/* Tick Marks & Labels */}
          {ticks}

          {/* Center GPS Indicator - Moved down to avoid overlapping the 80/120 labels */}
          <g transform="translate(50, 36)">
            <circle cx="-7" cy="0" r="1.2" fill="#00FF41" filter="url(#glow)" />
            <text x="3" y="1" fill="white" fontSize="3.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" dominantBaseline="central">GPS</text>
          </g>

          {/* Rotating Needle */}
          <g transform={`rotate(${needleAngle} 50 50)`} className="transition-all duration-300 ease-out">
            {/* Needle Body */}
            <polygon 
              points="48.5,50 51.5,50 50.2,16 49.8,16" 
              fill="url(#needleGradient)" 
              filter="url(#needleGlow)"
            />
            {/* Needle Highlight */}
            <line x1="50" y1="50" x2="50" y2="17" stroke="#FFFFFF" strokeWidth="0.5" />
          </g>

          {/* Center Pivot */}
          <circle cx="50" cy="50" r="4.5" fill="#1A1C23" stroke="#007BFF" strokeWidth="0.8" filter="url(#needleGlow)" />
          <circle cx="50" cy="50" r="2" fill="#8892B0" />
        </svg>

        {/* Center Text (Digital Speed) - Positioned explicitly at the bottom to avoid pivot overlap */}
        <div className="absolute left-0 right-0 top-[120px] portrait:top-[86px] flex flex-col items-center justify-center z-10 text-center">
          <span className="text-[34px] portrait:text-[25px] leading-none font-semibold text-white tabular-nums tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
            {displaySpeed}
          </span>
          <span className="text-[10px] font-semibold text-[#007BFF] uppercase tracking-widest mt-0.5">
            KM/H
          </span>
        </div>
        
      </div>
    </div>
  );
};
