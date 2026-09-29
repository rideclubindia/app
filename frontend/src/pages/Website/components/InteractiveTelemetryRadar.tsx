import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import {
  Compass,
  Play,
  RotateCcw,
  Zap,
  Activity,
  Radio,
  MapPin,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const InteractiveTelemetryRadar: React.FC = () => {
  const [speed, setSpeed] = useState<number>(78);
  const [lean, setLean] = useState<number>(24);
  const [gForce, setGForce] = useState<number>(1.12);
  const [rpm, setRpm] = useState<number>(6200);
  const [packDistance, setPackDistance] = useState<number>(35);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Live simulation tick
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setSpeed((prev) => Math.min(145, Math.max(45, prev + (Math.random() * 8 - 4))));
      setLean((prev) => Math.min(48, Math.max(-48, prev + (Math.random() * 10 - 5))));
      setGForce((prev) => Math.min(1.85, Math.max(0.85, Number((prev + (Math.random() * 0.1 - 0.05)).toFixed(2)))));
      setRpm((prev) => Math.min(9500, Math.max(3000, Math.round(prev + (Math.random() * 400 - 200)))));
      setPackDistance((prev) => Math.min(90, Math.max(12, Math.round(prev + (Math.random() * 6 - 3)))));
    }, 600);

    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="dev-radar-box">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">
            Hardware Engine: 6-Axis IMU Stream
          </span>
        </div>

        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className="font-mono text-xs flex items-center gap-1 text-zinc-400 hover:text-white px-2 py-1 border border-zinc-800 bg-zinc-900"
        >
          {isSimulating ? <RotateCcw size={12} /> : <Play size={12} />}
          {isSimulating ? 'Pause Stream' : 'Resume Stream'}
        </button>
      </div>

      <div className="dev-radar-grid">
        {/* Left: Graphic Lean Angle Gauge */}
        <div className="relative flex flex-col items-center justify-center p-6 bg-zinc-950/70 border border-zinc-800/80">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Compass / Degree circles */}
            <div className="absolute inset-0 rounded-full border border-dashed border-zinc-700/60" />
            <div className="absolute inset-4 rounded-full border border-zinc-800" />
            <div className="absolute inset-10 rounded-full border border-zinc-800/50" />

            {/* Crosshair markers */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-800" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-800" />

            {/* Motorcycle lean needle */}
            <div
              className="absolute w-1 h-36 bg-gradient-to-t from-transparent via-orange-500 to-orange-400 transition-transform duration-300 origin-center"
              style={{ transform: `rotate(${lean}deg)` }}
            />

            {/* Pivot point */}
            <div className="w-5 h-5 rounded-full bg-zinc-900 border-2 border-orange-500 z-10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>

            {/* Lean Readout in center-bottom */}
            <div className="absolute bottom-2 font-mono text-[11px] text-zinc-400">
              LEAN: <span className="text-white font-bold">{lean > 0 ? `+${lean.toFixed(1)}° R` : `${lean.toFixed(1)}° L`}</span>
            </div>
          </div>

          <div className="mt-4 font-mono text-xs text-zinc-500 flex items-center gap-2">
            <Compass size={14} className="text-orange-500" />
            <span>GYRO TILT: ROLL & PITCH CALIBRATED</span>
          </div>
        </div>

        {/* Right: Real-time Metric Tiles */}
        <div className="grid grid-cols-2 gap-px bg-zinc-800">
          <div className="p-4 bg-zinc-950">
            <div className="font-mono text-[11px] text-zinc-500 uppercase">Velocity</div>
            <div className="font-mono text-2xl font-bold text-white mt-1">
              {Math.round(speed)} <span className="text-xs font-normal text-zinc-400">km/h</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1 font-mono">
              <CheckCircle2 size={10} /> GNSS Lock: 18 Sats
            </div>
          </div>

          <div className="p-4 bg-zinc-950">
            <div className="font-mono text-[11px] text-zinc-500 uppercase">Lateral G-Force</div>
            <div className="font-mono text-2xl font-bold text-white mt-1">
              {gForce.toFixed(2)} <span className="text-xs font-normal text-zinc-400">G</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-2 font-mono">
              Peak: 1.62G
            </div>
          </div>

          <div className="p-4 bg-zinc-950">
            <div className="font-mono text-[11px] text-zinc-500 uppercase">Tachometer</div>
            <div className="font-mono text-2xl font-bold text-white mt-1">
              {rpm.toLocaleString()} <span className="text-xs font-normal text-zinc-400">RPM</span>
            </div>
            <div className="w-full bg-zinc-800 h-1 mt-2 overflow-hidden">
              <div
                className="bg-orange-500 h-full transition-all duration-300"
                style={{ width: `${(rpm / 10000) * 100}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-zinc-950">
            <div className="font-mono text-[11px] text-zinc-500 uppercase">Pack Proximity</div>
            <div className="font-mono text-2xl font-bold text-white mt-1">
              {packDistance} <span className="text-xs font-normal text-zinc-400">m</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1 font-mono">
              <Radio size={10} /> Lead Rider: Locked
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-emerald-400" />
          <span>WebSocket Stream active on port 443 with TLS 1.3</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/features" className="text-orange-400 hover:text-orange-300 transition-colors">
            View Telemetry Specs &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTelemetryRadar;
