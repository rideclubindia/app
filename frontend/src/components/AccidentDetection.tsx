import React, { useState } from 'react';
import { Activity, ShieldAlert, X } from 'lucide-react';
import type { EngineDebugSnapshot } from '../lib/crashDetection/engine';
import type { AccidentLevel } from '../lib/crashDetection/types';
import { ACCIDENT_FLOW_CONFIG } from '../lib/crashDetection/types';
import type { SensorAvailability } from '../lib/crashDetection/useAccidentDetection';

export const AccidentCountdownOverlay = ({ secondsLeft, onOk, onSos }: { secondsLeft: number; onOk: () => void; onSos: () => void }) => {
  const total = ACCIDENT_FLOW_CONFIG.countdownSeconds;
  const pct = Math.max(0, Math.min(1, secondsLeft / total));
  return (
    <div role="alertdialog" aria-live="assertive" aria-label="Possible accident detected" className="fixed inset-0 z-[300] bg-[#B91C1C] text-white flex flex-col px-6 pt-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
        <p className="text-[15px] font-bold tracking-[0.2em]">POSSIBLE ACCIDENT</p>
        <p className="text-[20px] leading-snug font-semibold max-w-xs">We detected an unusual impact. Are you okay?</p>
        <div className="relative w-44 h-44">
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="6" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${pct * 282.7} 283`} className="transition-[stroke-dasharray] duration-200" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[72px] font-black leading-none tabular-nums">{secondsLeft}</span>
            <span className="text-[13px] font-semibold opacity-90 mt-1">seconds</span>
          </div>
        </div>
        <p className="text-[14px] opacity-90 max-w-xs">If you don't respond, SOS goes to your ride group and emergency contacts.</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
        <button onClick={onOk} className="h-20 rounded-2xl bg-white text-[#B91C1C] text-[24px] font-black active:scale-[0.98] transition-transform">I'M OK</button>
        <button onClick={onSos} className="h-16 rounded-2xl bg-black/25 border-2 border-white text-white text-[18px] font-bold active:scale-[0.98] transition-transform">SEND SOS NOW</button>
      </div>
    </div>
  );
};

export const AccidentSetupPrompt = ({ onAllow, onLater, busy }: { onAllow: () => void; onLater: () => void; busy?: boolean }) => (
  <div className="fixed inset-0 z-[120] bg-black/50 flex items-end sm:items-center justify-center p-4">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-5 flex gap-4">
        <span className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0"><ShieldAlert className="w-6 h-6" /></span>
        <div>
          <h3 className="text-[17px] font-bold text-gray-950">Accident Detection</h3>
          <p className="text-[14px] text-gray-600 mt-1 leading-relaxed">
            RideClub can use your phone's motion and location sensors to detect a possible accident while you're riding and automatically start an emergency response.
          </p>
        </div>
      </div>
      <ul className="px-5 pb-4 text-[13px] text-gray-600 space-y-1.5">
        <li>• Runs only during a live ride, and stops when the ride ends.</li>
        <li>• Detection happens on your phone and works without internet.</li>
        <li>• You get {ACCIDENT_FLOW_CONFIG.countdownSeconds} seconds to tap "I'm OK" before SOS is sent.</li>
        <li>• Raw sensor readings are never uploaded, only the detected event.</li>
      </ul>
      <div className="grid grid-cols-2 gap-3 p-4 border-t border-gray-100">
        <button onClick={onLater} className="h-12 rounded-xl border border-gray-200 text-[15px] font-semibold text-gray-800">Not now</button>
        <button onClick={onAllow} disabled={busy} className="h-12 rounded-xl bg-red-600 text-white text-[15px] font-bold disabled:opacity-60">Turn on</button>
      </div>
    </div>
  </div>
);

export const accidentStatusText = (enabled: boolean, availability: SensorAvailability) => {
  if (!enabled) return 'Off';
  if (availability === 'native' || availability === 'web') return 'Active';
  if (availability === 'denied') return 'Motion access denied';
  if (availability === 'unsupported') return 'Sensors unavailable on this device';
  return 'Starting…';
};

// Development builds only; never rendered in production.
export const AccidentDebugPanel = ({ snap, level, availability }: { snap: EngineDebugSnapshot | null; level: AccidentLevel; availability: SensorAvailability }) => {
  const [open, setOpen] = useState(false);
  if (!import.meta.env.DEV) return null;
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="fixed top-24 right-3 z-[90] w-10 h-10 rounded-full bg-black/80 text-lime-300 flex items-center justify-center" aria-label="Accident debug">
        <Activity className="w-5 h-5" />
      </button>
    );
  }
  const f = snap?.lastFrame;
  const s = snap?.lastSignals;
  const row = (k: string, v: React.ReactNode) => <div className="flex justify-between gap-3"><span className="opacity-70">{k}</span><span className="tabular-nums">{v}</span></div>;
  return (
    <div className="fixed top-24 right-3 z-[90] w-64 rounded-xl bg-black/85 text-lime-200 font-mono text-[11px] p-3 space-y-0.5">
      <div className="flex justify-between items-center mb-1 text-white font-bold">DEV accident debug <button onClick={() => setOpen(false)} aria-label="Close"><X className="w-4 h-4" /></button></div>
      {row('sensors', availability)}
      {row('level', level)}
      {row('engine', snap?.state ?? '—')}
      {row('armed', String(snap?.armed ?? '—'))}
      {row('accel g', f ? f.accelMagnitudeG.toFixed(2) : '—')}
      {row('linear g', f ? f.linearAccelMagnitudeG.toFixed(2) : '—')}
      {row('gyro °/s', f ? f.gyroMagnitudeDegPerSec.toFixed(0) : '—')}
      {row('motion', f?.motionState ?? '—')}
      {row('speed km/h', snap?.latestSpeedKph != null ? snap.latestSpeedKph.toFixed(0) : '—')}
      <div className="border-t border-white/10 my-1" />
      {row('confidence', snap?.lastConfidence != null ? snap.lastConfidence.toFixed(2) : '—')}
      {s && <>
        {row('impact', s.impact.toFixed(2))}
        {row('stillness', s.motionStop.toFixed(2))}
        {row('rotation', s.rotation.toFixed(2))}
        {row('orientation', `${s.orientation.toFixed(2)} (${s.orientationChangeDeg.toFixed(0)}°)`)}
        {row('gps stop', s.gps != null ? s.gps.toFixed(2) : 'n/a')}
        {row('speed drop', s.speedDrop != null ? s.speedDrop.toFixed(2) : 'n/a')}
        {row('drop pattern', String(s.freefall))}
      </>}
      {row('reject', snap?.lastRejectReason ?? '—')}
    </div>
  );
};
