import { useEffect, useState } from 'react';
import { MapPin, Sun, Cloud, CloudRain, CloudFog, CloudLightning, Snowflake } from 'lucide-react';
import { useLocationStore } from '../../store/useLocationStore';

interface SpeedometerClusterProps {
  speed: number;
  leanAngle?: number;
  gForce?: number;
  isCalibrated?: boolean;
  turn?: 'left' | 'right' | null;
  redlineKph?: number;
  hideSpeedInPortrait?: boolean;
}

const MAX_KPH = 200;
const BARS = 44;

// Seven-segment digit: segments a–g as polygons in a 60 × 100 box
const SEGMENTS: Record<string, string> = {
  a: '10,4 50,4 44,12 16,12',
  b: '52,6 52,46 46,42 46,14',
  c: '52,54 52,94 46,86 46,58',
  d: '10,96 50,96 44,88 16,88',
  e: '8,54 8,94 14,86 14,58',
  f: '8,6 8,46 14,42 14,14',
  g: '12,50 18,45 42,45 48,50 42,55 18,55',
};
const DIGIT_ON: Record<string, string> = {
  '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc',
  '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcfgd',
};

const Digit = ({ ch }: { ch: string | null }) => (
  <svg viewBox="0 0 60 100" className="h-full w-auto" aria-hidden="true">
    {Object.entries(SEGMENTS).map(([seg, pts]) => (
      <polygon key={seg} points={pts} fill={ch && DIGIT_ON[ch]?.includes(seg) ? '#111827' : 'rgba(17,24,39,0.06)'} />
    ))}
  </svg>
);

const Arrow = ({ dir, on }: { dir: 'left' | 'right'; on: boolean }) => (
  <svg viewBox="0 0 40 40" className="w-7 h-7 @min-[520px]:w-9 @min-[520px]:h-9 shrink-0" aria-label={on ? `Turn ${dir}` : undefined}>
    <polygon
      points={dir === 'right' ? '4,14 22,14 22,4 38,20 22,36 22,26 4,26' : '36,14 18,14 18,4 2,20 18,36 18,26 36,26'}
      fill={on ? '#16A34A' : '#E5E7EB'}
      style={on ? { filter: 'drop-shadow(0 0 5px rgba(22,163,74,0.45))' } : undefined}
    />
  </svg>
);

const weatherIcon = (code: number) => {
  if (code === 0) return { Icon: Sun, label: 'Clear' };
  if (code <= 3) return { Icon: Cloud, label: 'Cloudy' };
  if (code <= 48) return { Icon: CloudFog, label: 'Fog' };
  if (code <= 67 || (code >= 80 && code <= 82)) return { Icon: CloudRain, label: 'Rain' };
  if (code <= 77 || code === 85 || code === 86) return { Icon: Snowflake, label: 'Snow' };
  return { Icon: CloudLightning, label: 'Storm' };
};

export const SpeedometerCluster = ({
  speed,
  leanAngle = 0.0,
  gForce = 1.0,
  isCalibrated = true,
  turn = null,
  redlineKph = 120,
  hideSpeedInPortrait = false,
}: SpeedometerClusterProps) => {
  const { coordinates, locationName } = useLocationStore();
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(t);
  }, []);

  // refresh weather at most every 10 minutes per ~1 km cell
  const cellLat = coordinates?.lat.toFixed(2);
  const cellLng = coordinates?.lng.toFixed(2);
  useEffect(() => {
    if (!cellLat || !cellLng) return;
    const ctrl = new AbortController();
    const load = () =>
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${cellLat}&longitude=${cellLng}&current=temperature_2m,weather_code`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => { if (d?.current) setWeather({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code }); })
        .catch(() => {});
    load();
    const t = setInterval(load, 10 * 60 * 1000);
    return () => { ctrl.abort(); clearInterval(t); };
  }, [cellLat, cellLng]);

  const kph = Math.max(0, Math.min(Math.round(speed || 0), MAX_KPH));
  const digits = String(kph).padStart(3, ' ').split('').map((c) => (c === ' ' ? null : c));
  const lit = Math.round((kph / MAX_KPH) * BARS);
  const redFrom = Math.round((redlineKph / MAX_KPH) * BARS);

  // Bars along a shallow arc: circle centred below the view
  const CX = 200, CY = 330, R = 300, A0 = -128, A1 = -52;
  const bars = Array.from({ length: BARS }, (_, i) => {
    const a = ((A0 + ((A1 - A0) * (i + 0.5)) / BARS) * Math.PI) / 180;
    const x = CX + R * Math.cos(a), y = CY + R * Math.sin(a);
    const deg = (a * 180) / Math.PI + 90;
    const isRed = i >= redFrom;
    const on = i < lit;
    const fill = on ? (isRed ? '#FF5A00' : '#111827') : isRed ? 'rgba(255,90,0,0.2)' : '#E5E7EB';
    return <rect key={i} x={x - 2.4} y={y - 11} width={4.8} height={22} rx={1} fill={fill} transform={`rotate(${deg} ${x} ${y})`} />;
  });
  const labels = [0, 40, 80, 120, 160, 200].map((v) => {
    const a = ((A0 + ((A1 - A0) * v) / MAX_KPH) * Math.PI) / 180;
    const x = CX + (R - 30) * Math.cos(a), y = CY + (R - 30) * Math.sin(a);
    return (
      <text key={v} x={x} y={y} fill={v >= redlineKph ? '#FF5A00' : '#6B7280'} fontSize="13" fontWeight="800" fontStyle="italic" textAnchor="middle" dominantBaseline="central" fontFamily="system-ui, sans-serif">
        {v}
      </text>
    );
  });

  const W = weather ? weatherIcon(weather.code) : null;
  const place = (locationName || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 2).join(', ') || 'Locating…';
  const leanDir = leanAngle < -1 ? 'L' : leanAngle > 1 ? 'R' : '';

  return (
    <div className={`w-full px-2 @container ${hideSpeedInPortrait ? 'portrait:px-4' : ''}`}>
      <div className={`relative w-full rounded-2xl bg-white border border-gray-100 shadow-sm px-3 pt-2 pb-3 text-gray-950 overflow-hidden ${hideSpeedInPortrait ? 'portrait:border-gray-200/80 portrait:shadow-none portrait:px-4 portrait:py-4' : ''}`}>
        <div className="flex flex-col @min-[520px]:flex-row gap-2">
          <div className={`flex-1 min-w-0 ${hideSpeedInPortrait ? 'portrait:hidden' : ''}`}>
            <svg viewBox="8 16 384 110" className="w-full h-auto block" aria-hidden="true">
              {bars}
              {labels}
            </svg>

            <div className="flex items-center justify-center gap-3 -mt-1">
              <Arrow dir="left" on={turn === 'left'} />
              <div className="flex items-end gap-1.5" aria-label={`${kph} kilometres per hour`}>
                <div className="flex h-[50px] @min-[360px]:h-[58px] @min-[520px]:h-[76px] gap-1">
                  {digits.map((d, i) => <Digit key={i} ch={d} />)}
                </div>
                <span className="text-[15px] font-bold text-gray-500 mb-0.5">km/h</span>
              </div>
              <Arrow dir="right" on={turn === 'right'} />
            </div>
          </div>

          <div className={`shrink-0 ${hideSpeedInPortrait ? 'portrait:border-t-0 portrait:pt-0' : ''} border-t @min-[520px]:border-t-0 @min-[520px]:border-l border-gray-100 pt-2 @min-[520px]:pt-0 @min-[520px]:pl-3 @min-[520px]:w-[150px] flex flex-col @min-[300px]:flex-row @min-[520px]:flex-col @min-[300px]:items-center @min-[520px]:items-start justify-between gap-1.5`}>
            <div className="flex items-center gap-3 @min-[520px]:flex-col @min-[520px]:items-start @min-[520px]:gap-0">
              <span className="text-[17px] @min-[520px]:text-[20px] font-bold tabular-nums leading-none">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="flex items-center gap-1.5 @min-[520px]:mt-1.5">
                <span className="text-[17px] @min-[520px]:text-[20px] font-bold tabular-nums leading-none">{weather ? `${weather.temp}°C` : '--°C'}</span>
                {W && <W.Icon className="w-5 h-5 text-amber-500" aria-label={W.label} />}
              </span>
            </div>
            <span className="flex items-center gap-1 text-[12px] font-semibold text-gray-500 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[#FF5A00] shrink-0" />
              <span className="truncate">{place}</span>
            </span>
          </div>
        </div>

        <div className={`mt-2.5 grid grid-cols-3 rounded-xl bg-gray-50 border border-gray-100 divide-x divide-gray-100 ${hideSpeedInPortrait ? 'portrait:mt-4 portrait:bg-transparent portrait:border-0 portrait:border-t portrait:border-gray-100 portrait:rounded-none portrait:pt-3' : ''}`}>
          <div className="py-1.5 flex flex-col items-center">
            <span className="text-[9px] font-bold tracking-wider text-gray-500 uppercase">Lean</span>
            <span className="text-[14px] font-black tabular-nums">
              {Math.abs(leanAngle).toFixed(1)}°
              {leanDir && <span className={`ml-1 text-[11px] ${leanDir === 'L' ? 'text-[#FF5A00]' : 'text-blue-600'}`}>{leanDir}</span>}
            </span>
          </div>
          <div className="py-1.5 flex flex-col items-center">
            <span className="text-[9px] font-bold tracking-wider text-gray-500 uppercase">G-Force</span>
            <span className="text-[14px] font-black tabular-nums">{gForce.toFixed(2)}G</span>
          </div>
          <div className="py-1.5 flex flex-col items-center">
            <span className="text-[9px] font-bold tracking-wider text-gray-500 uppercase">IMU</span>
            <span className="text-[12px] font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isCalibrated ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              {isCalibrated ? '60Hz' : 'Idle'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
