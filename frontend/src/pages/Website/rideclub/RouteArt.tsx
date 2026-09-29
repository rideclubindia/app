import React from 'react';

interface Waypoint {
  x: number;
  y: number;
  label: string;
  sub?: string;
  accent?: boolean;
}

const waypoints: Waypoint[] = [
  { x: 62, y: 46, label: 'Start', sub: 'Angeles Crest' },
  { x: 168, y: 158, label: 'Overlook', sub: '38 km' },
  { x: 118, y: 292, label: 'Rest Stop', sub: '76 km' },
  { x: 246, y: 372, label: 'Summit', sub: '110 km' },
  { x: 322, y: 456, label: 'Finish', sub: '124 km', accent: true }
];

const path =
  'M62,46 C 120,80 90,130 168,158 C 230,182 70,230 118,292 C 160,330 200,330 246,372 C 280,400 290,420 322,456';

/**
 * Hand-built route-line artwork — a winding road drawn as an SVG path
 * with real waypoints, not a stock photo or a dashboard screenshot.
 * This is the hero's dominant visual.
 */
export const RouteArt: React.FC = () => {
  return (
    <svg
      className="rc-route-art"
      viewBox="0 0 460 500"
      fill="none"
      role="img"
      aria-label="Route map for Angeles Crest Night Run, 124 kilometers with four waypoints"
    >
      {/* faint contour lines for texture, never competing with the route */}
      <path d="M0,120 C 110,90 240,150 460,110" className="rc-route-contour" />
      <path d="M0,260 C 120,300 310,220 460,270" className="rc-route-contour" />
      <path d="M0,400 C 130,370 290,430 460,390" className="rc-route-contour" />

      <path d={path} className="rc-route-line" />

      {waypoints.map((w, i) => (
        <g key={w.label}>
          <line
            x1={w.x}
            y1={w.y}
            x2={w.x + 46}
            y2={w.y - 8}
            className="rc-route-leader"
          />
          <circle cx={w.x} cy={w.y} r={w.accent ? 7 : 4.5} className={`rc-route-node ${w.accent ? 'is-accent' : ''}`} />
          <text x={w.x + 52} y={w.y - 12} className="rc-route-label">{w.label}</text>
          {w.sub && <text x={w.x + 52} y={w.y + 3} className="rc-route-sublabel">{w.sub}</text>}
        </g>
      ))}
    </svg>
  );
};
