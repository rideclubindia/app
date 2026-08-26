import React from 'react';

export const BikeHero: React.FC = () => {
  const spokes = [0, 60, 120];

  const Wheel = ({ cx, cy }: { cx: number; cy: number }) => (
    <g>
      <circle cx={cx} cy={cy} r="56" fill="none" stroke="#E3E6EB" strokeWidth="17" />
      <circle cx={cx} cy={cy} r="56" fill="none" stroke="#D3D8DF" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="32" fill="none" stroke="#3B82F6" strokeWidth="2.5" opacity="0.5" />
      <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'wheelSpin 5s linear infinite' }}>
        {spokes.map(a => (
          <line
            key={a}
            x1={cx - 28 * Math.cos((a * Math.PI) / 180)}
            y1={cy - 28 * Math.sin((a * Math.PI) / 180)}
            x2={cx + 28 * Math.cos((a * Math.PI) / 180)}
            y2={cy + 28 * Math.sin((a * Math.PI) / 180)}
            stroke="#C7CDD6"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}
      </g>
      <circle cx={cx} cy={cy} r="7" fill="#C7CDD6" />
      <circle cx={cx} cy={cy} r="2.5" fill="#3B82F6" />
    </g>
  );

  return (
    <svg viewBox="0 0 640 360" className="w-full h-auto overflow-visible">
      <defs>
        <linearGradient id="bh-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#93C5FD" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="bh-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bh-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F2F4F7" />
          <stop offset="100%" stopColor="#E4E7EC" />
        </linearGradient>
        <linearGradient id="bh-ground" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D3D8DF" stopOpacity="0" />
          <stop offset="50%" stopColor="#D3D8DF" stopOpacity="1" />
          <stop offset="100%" stopColor="#D3D8DF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Underglow */}
      <ellipse cx="330" cy="330" rx="230" ry="26" fill="url(#bh-glow)" />

      {/* Headlight beam */}
      <polygon points="472,196 640,148 640,252" fill="url(#bh-beam)" />

      {/* Ground line */}
      <rect x="40" y="337" width="560" height="2" fill="url(#bh-ground)" />

      {/* Speed dashes */}
      <line x1="30" y1="180" x2="78" y2="180" stroke="#D3D8DF" strokeWidth="3" strokeLinecap="round" />
      <line x1="12" y1="215" x2="70" y2="215" stroke="#E3E6EB" strokeWidth="3" strokeLinecap="round" />
      <line x1="34" y1="250" x2="82" y2="250" stroke="#D3D8DF" strokeWidth="3" strokeLinecap="round" />

      {/* Swingarm + fork */}
      <line x1="170" y1="280" x2="248" y2="238" stroke="#C7CDD6" strokeWidth="9" strokeLinecap="round" />
      <line x1="462" y1="204" x2="490" y2="280" stroke="#C7CDD6" strokeWidth="8" strokeLinecap="round" />

      {/* Body */}
      <path
        d="M126,180
           C152,160 192,150 226,157
           C246,138 278,130 308,137
           C348,146 392,161 430,179
           L464,193
           L470,212
           L432,221
           C402,238 342,249 292,247
           C252,245 222,238 206,228
           L162,239
           C142,226 129,206 126,180 Z"
        fill="url(#bh-body)"
        stroke="#D3D8DF"
        strokeWidth="1.5"
      />

      {/* Seat + tail accent */}
      <path d="M128,176 C160,158 200,152 228,158 L222,168 C192,162 158,168 134,184 Z" fill="#DDE1E7" />
      {/* Tank accent */}
      <path d="M262,140 C292,130 322,132 348,142 L340,154 C316,146 290,144 268,150 Z" fill="#3B82F6" opacity="0.3" />
      {/* Tail light */}
      <circle cx="127" cy="180" r="4" fill="#EF4444" opacity="0.85" />
      {/* Headlight */}
      <circle cx="466" cy="200" r="6" fill="#93C5FD" />
      <circle cx="466" cy="200" r="10" fill="#93C5FD" opacity="0.25" />

      {/* Handlebar */}
      <line x1="404" y1="152" x2="428" y2="138" stroke="#C7CDD6" strokeWidth="6" strokeLinecap="round" />

      {/* Wheels */}
      <Wheel cx={170} cy={280} />
      <Wheel cx={490} cy={280} />
    </svg>
  );
};
