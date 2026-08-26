import React, { useEffect, useRef, useState } from 'react';

interface SpeedCockpitProps {
  speed: number;
}

const MAX_SPEED = 200;
const REDLINE_FROM = 150;

export const SpeedCockpit: React.FC<SpeedCockpitProps> = ({ speed }) => {
  const size = 360;
  const center = size / 2;
  const radius = 150;
  const circumference = 2 * Math.PI * radius;

  const sweepAngle = 260;
  const startAngle = 140;
  const arcLength = circumference * (sweepAngle / 360);

  const target = Math.min(Math.max(speed, 0), MAX_SPEED);

  const [displaySpeed, setDisplaySpeed] = useState(target);
  const displayedRef = useRef(target);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const diff = target - displayedRef.current;
      if (Math.abs(diff) < 0.05) {
        displayedRef.current = target;
      } else {
        displayedRef.current += diff * 0.12;
        raf = requestAnimationFrame(tick);
      }
      setDisplaySpeed(displayedRef.current);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const ratio = displaySpeed / MAX_SPEED;
  const activeArcLength = ratio * arcLength;
  const isRedline = ratio >= REDLINE_FROM / MAX_SPEED;

  const polar = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: center + r * Math.cos(rad), y: center + r * Math.sin(rad) };
  };

  const ticks: React.ReactElement[] = [];
  for (let v = 0; v <= MAX_SPEED; v += 10) {
    const angle = startAngle + (v / MAX_SPEED) * sweepAngle;
    const isMajor = v % 40 === 0;
    const isRed = v >= REDLINE_FROM;
    const lit = v <= displaySpeed + 2;

    const rOut = radius - 4;
    const rIn = radius - (isMajor ? 20 : 13);
    const p1 = polar(angle, rIn);
    const p2 = polar(angle, rOut);

    let stroke = isRed ? '#F3C6C6' : '#D1D5DB';
    if (lit) stroke = isRed ? '#DC2626' : '#2563EB';

    ticks.push(
      <line
        key={`t${v}`}
        x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={stroke}
        strokeWidth={isMajor ? 3.5 : 2}
        strokeLinecap="round"
      />
    );

    if (isMajor) {
      const lp = polar(angle, radius - 34);
      ticks.push(
        <text
          key={`l${v}`}
          x={lp.x} y={lp.y}
          fill={isRed ? '#DC2626' : lit ? '#111827' : '#9CA3AF'}
          fontSize="14"
          fontWeight="600"
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
        >
          {v}
        </text>
      );
    }
  }

  return (
    <div className="relative flex items-center justify-center w-full select-none" style={{ maxWidth: 'min(460px, 64vh)' }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="sc-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>

        {/* Dial */}
        <circle cx={center} cy={center} r={radius + 12} fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />

        {/* Redline base arc */}
        <g transform={`rotate(${startAngle} ${center} ${center})`}>
          <circle
            cx={center} cy={center} r={radius}
            fill="none"
            stroke="url(#sc-red)"
            strokeWidth="6"
            opacity="0.5"
            strokeDasharray={`${arcLength * (1 - REDLINE_FROM / MAX_SPEED)} ${circumference}`}
            strokeDashoffset={-arcLength * (REDLINE_FROM / MAX_SPEED)}
            strokeLinecap="round"
          />
        </g>

        {/* Track */}
        <g transform={`rotate(${startAngle} ${center} ${center})`}>
          <circle
            cx={center} cy={center} r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="6"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
        </g>

        {/* Active arc */}
        <g transform={`rotate(${startAngle} ${center} ${center})`}>
          <circle
            cx={center} cy={center} r={radius}
            fill="none"
            stroke={isRedline ? '#DC2626' : '#2563EB'}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${activeArcLength} ${circumference}`}
          />
        </g>

        {/* Ticks + labels */}
        {ticks}

        {/* THE NUMBER */}
        <text
          x={center}
          y={center - 14}
          textAnchor="middle"
          dominantBaseline="central"
          fill={isRedline ? '#DC2626' : '#111827'}
          fontSize="104"
          fontWeight="700"
          style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em' }}
        >
          {Math.round(displaySpeed)}
        </text>

        {/* Unit */}
        <text
          x={center}
          y={center + 48}
          textAnchor="middle"
          fill="#6B7280"
          fontSize="22"
          fontWeight="600"
          style={{ letterSpacing: '0.2em' }}
        >
          KM/H
        </text>
      </svg>
    </div>
  );
};
