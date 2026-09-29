import React from 'react';

/**
 * A stylized lean-angle gauge drawn as line art — the same information
 * the app's HUD shows, rendered in the site's own graphic language
 * instead of a photo of a screen.
 */
export const GaugeArt: React.FC = () => {
  const cx = 200;
  const cy = 200;
  const r = 150;
  // Arc from 210° to 330° (bottom-open dial), needle at 255° (~lean left)
  const toXY = (deg: number, radius: number) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
  };
  const [needleX, needleY] = toXY(255, r * 0.72);
  const ticks = Array.from({ length: 13 }, (_, i) => 210 + i * 10);

  return (
    <svg className="rc-gauge-art" viewBox="0 0 400 400" fill="none" role="img" aria-label="Lean angle gauge, 24 degrees left">
      <circle cx={cx} cy={cy} r={r} className="rc-gauge-ring" />
      <circle cx={cx} cy={cy} r={r - 26} className="rc-gauge-ring-inner" />
      {ticks.map((deg) => {
        const [x1, y1] = toXY(deg, r);
        const [x2, y2] = toXY(deg, r - 14);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} className="rc-gauge-tick" />;
      })}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} className="rc-gauge-needle" />
      <circle cx={cx} cy={cy} r={6} className="rc-gauge-hub" />
      <text x={cx} y={cy + 46} textAnchor="middle" className="rc-gauge-value">24°</text>
      <text x={cx} y={cy + 68} textAnchor="middle" className="rc-gauge-caption">LEAN ANGLE</text>
    </svg>
  );
};
