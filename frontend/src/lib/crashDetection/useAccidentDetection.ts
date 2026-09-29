import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../apiClient';
import { notify } from '../notify';
import { enqueueSyncEvent, getPendingSyncEvents } from '../offlineSyncDB';
import { flushQueuedEmergencyEvents } from './emergencyManager';
import { CrashDetectionEngine, type EngineDebugSnapshot } from './engine';
import { CrashSensor, type SampleBatchEvent } from './nativeSensorPlugin';
import { ACCIDENT_FLOW_CONFIG, type AccidentLevel, type CrashCandidateEvent, type SensorSample } from './types';

const PREF_KEY = 'rc_accident_detection';
const PENDING_KEY = 'rc_accident_pending';
const LOG_KEY = 'rc_accident_events';

export type AccidentPreference = 'on' | 'off' | 'unset';
export type SensorAvailability = 'unknown' | 'native' | 'web' | 'denied' | 'unsupported';
export type AccidentOutcome = 'user_ok' | 'sos_now' | 'countdown_expired';

export interface AccidentEventRecord {
  id: string;
  rideId: string;
  detectedAt: string;
  level: AccidentLevel;
  confidence: number;
  outcome: AccidentOutcome | null;
  userConfirmedOk: boolean;
  sosTriggered: boolean;
  syncStatus: 'local' | 'synced' | 'queued';
  signals: CrashCandidateEvent['signals'] | null;
}

export interface AccidentLocation { lat: number; lng: number; accuracy?: number | null; speedKph?: number | null; isStale?: boolean }

export const getAccidentPreference = (): AccidentPreference => {
  try { const v = localStorage.getItem(PREF_KEY); return v === 'on' || v === 'off' ? v : 'unset'; } catch { return 'unset'; }
};
export const setAccidentPreference = (v: 'on' | 'off') => { try { localStorage.setItem(PREF_KEY, v); } catch { /* ignore */ } };

const readLog = (): AccidentEventRecord[] => { try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; } };
const writeLog = (rec: AccidentEventRecord) => {
  try { localStorage.setItem(LOG_KEY, JSON.stringify([...readLog().filter((r) => r.id !== rec.id), rec].slice(-20))); } catch { /* ignore */ }
};

// iOS Safari needs an explicit user gesture to grant motion access; Android and desktop grant it implicitly.
export const requestMotionPermission = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') return true;
  const DME: any = typeof DeviceMotionEvent !== 'undefined' ? DeviceMotionEvent : null;
  if (!DME) return false;
  if (typeof DME.requestPermission === 'function') {
    try { return (await DME.requestPermission()) === 'granted'; } catch { return false; }
  }
  return true;
};

interface Options {
  rideId: string | undefined;
  enabled: boolean;
  speedKph: number | null;
  getLocation: () => AccidentLocation | null;
  onConfirmed: (candidate: CrashCandidateEvent, outcome: Exclude<AccidentOutcome, 'user_ok'>) => void;
  debug?: boolean;
}

export function useAccidentDetection({ rideId, enabled, speedKph, getLocation, onConfirmed, debug = false }: Options) {
  const [level, setLevel] = useState<AccidentLevel>('NORMAL');
  const [secondsLeft, setSecondsLeft] = useState(ACCIDENT_FLOW_CONFIG.countdownSeconds);
  const [availability, setAvailability] = useState<SensorAvailability>('unknown');
  const [debugSnap, setDebugSnap] = useState<EngineDebugSnapshot | null>(null);

  const engineRef = useRef<CrashDetectionEngine | null>(null);
  const clockOffsetRef = useRef<number | null>(null);
  const candidateRef = useRef<CrashCandidateEvent | null>(null);
  const recordRef = useRef<AccidentEventRecord | null>(null);
  const expiresAtRef = useRef<number | null>(null);
  const cooldownUntilRef = useRef(0);
  const onConfirmedRef = useRef(onConfirmed);
  const getLocationRef = useRef(getLocation);
  onConfirmedRef.current = onConfirmed;
  getLocationRef.current = getLocation;

  const reportToBackend = useCallback(async (candidate: CrashCandidateEvent, rec: AccidentEventRecord) => {
    const loc = getLocationRef.current();
    if (!rideId || !loc) return;
    const body = {
      ride_id: rideId,
      location: { lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy ?? null, speedKph: loc.speedKph ?? null, isStale: !!loc.isStale },
      confidence: candidate.confidence,
      peak_acceleration: candidate.peakAccelMagnitudeG,
      rotation_change: candidate.rotationChangeDegPerSec,
      stationary_duration_s: candidate.stationaryDurationMs / 1000,
      device_platform: Capacitor.getPlatform(),
    };
    try {
      await apiClient.post('/api/crash-events', body, { timeout: 10000 });
      writeLog({ ...rec, syncStatus: 'synced' });
    } catch {
      await enqueueSyncEvent('crash_event', rideId, body).catch(() => {});
      writeLog({ ...rec, syncStatus: 'queued' });
    }
  }, [rideId]);

  const finish = useCallback((outcome: AccidentOutcome) => {
    const candidate = candidateRef.current;
    const rec = recordRef.current;
    candidateRef.current = null;
    expiresAtRef.current = null;
    try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
    if (!candidate || !rec) return;

    if (outcome === 'user_ok') {
      writeLog({ ...rec, outcome, userConfirmedOk: true, level: 'NORMAL' });
      cooldownUntilRef.current = Date.now() + ACCIDENT_FLOW_CONFIG.cooldownAfterCancelMs;
      engineRef.current?.resetToMonitoring();
      setLevel('NORMAL');
      return;
    }
    const done: AccidentEventRecord = { ...rec, outcome, level: 'CONFIRMED_ACCIDENT', sosTriggered: true };
    writeLog(done);
    setLevel('CONFIRMED_ACCIDENT');
    onConfirmedRef.current(candidate, outcome);
    reportToBackend(candidate, done);
    engineRef.current?.resetToMonitoring();
  }, [reportToBackend]);

  const startCountdown = useCallback((candidate: CrashCandidateEvent, expiresAt?: number) => {
    if (!rideId) return;
    candidateRef.current = candidate;
    expiresAtRef.current = expiresAt ?? Date.now() + ACCIDENT_FLOW_CONFIG.countdownSeconds * 1000;
    const rec: AccidentEventRecord = {
      id: crypto.randomUUID(), rideId, detectedAt: new Date().toISOString(), level: 'POSSIBLE_ACCIDENT',
      confidence: candidate.confidence, outcome: null, userConfirmedOk: false, sosTriggered: false, syncStatus: 'local',
      signals: candidate.signals ?? null,
    };
    recordRef.current = rec;
    writeLog(rec);
    notify({ title: 'Possible accident detected', body: 'Are you OK? Open RideClub to cancel before your emergency contact is alerted.', route: `/ride-plus/live/${rideId}`, tag: 'accident' });
    try { localStorage.setItem(PENDING_KEY, JSON.stringify({ candidate, rideId, expiresAt: expiresAtRef.current, rec })); } catch { /* ignore */ }
    setSecondsLeft(Math.max(0, Math.ceil((expiresAtRef.current - Date.now()) / 1000)));
    setLevel('POSSIBLE_ACCIDENT');
    try { navigator.vibrate?.([600, 300, 600, 300, 600]); } catch { /* ignore */ }
  }, [rideId]);

  const onCandidate = useCallback((candidate: CrashCandidateEvent) => {
    if (candidateRef.current || Date.now() < cooldownUntilRef.current) { engineRef.current?.resetToMonitoring(); return; }
    startCountdown(candidate);
  }, [startCountdown]);

  // Resume a countdown that was interrupted by an app restart; if it already expired, escalate now.
  useEffect(() => {
    if (!rideId) return;
    try {
      const p = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
      if (p?.rideId === rideId && p.candidate) {
        recordRef.current = p.rec;
        candidateRef.current = p.candidate;
        if (Date.now() >= p.expiresAt) finish('countdown_expired');
        else { startCountdown(p.candidate, p.expiresAt); recordRef.current = p.rec; }
      }
    } catch { /* ignore */ }
  }, [rideId, finish, startCountdown]);

  // Countdown ticker
  useEffect(() => {
    if (level !== 'POSSIBLE_ACCIDENT') return;
    const h = setInterval(() => {
      const exp = expiresAtRef.current;
      if (exp == null) return;
      const left = Math.max(0, Math.ceil((exp - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) finish('countdown_expired');
    }, 250);
    return () => clearInterval(h);
  }, [level, finish]);

  // GPS speed context into the engine, on the sensor clock
  useEffect(() => {
    const e = engineRef.current;
    if (!e || clockOffsetRef.current == null) return;
    e.reportGps({ t: performance.now() - clockOffsetRef.current, speedKph });
  }, [speedKph]);

  // Sensor lifecycle: runs only during an active ride with detection enabled
  useEffect(() => {
    if (!rideId || !enabled) { setLevel((l) => (l === 'POSSIBLE_ACCIDENT' ? l : 'NORMAL')); return; }
    const engine = new CrashDetectionEngine();
    engineRef.current = engine;
    clockOffsetRef.current = null;
    let cancelled = false;
    let handle: PluginListenerHandle | null = null;

    const feed = (s: SensorSample) => {
      if (clockOffsetRef.current == null) clockOffsetRef.current = performance.now() - s.t;
      const r = engine.processSample(s);
      if (r.state === 'VALIDATING') setLevel((l) => (l === 'NORMAL' ? 'SUSPICIOUS' : l));
      else if (r.state === 'MONITORING') setLevel((l) => (l === 'SUSPICIOUS' ? 'NORMAL' : l));
      if (r.event) onCandidate(r.event);
    };

    const native = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
    let onMotion: ((e: DeviceMotionEvent) => void) | null = null;
    if (native) {
      (async () => {
        const h = await CrashSensor.addListener('sampleBatch', (ev: SampleBatchEvent) => { for (const s of ev.samples) feed(s); });
        if (cancelled) { await h.remove(); return; }
        handle = h;
        await CrashSensor.start();
        setAvailability('native');
      })().catch(() => setAvailability('unsupported'));
    } else if (typeof DeviceMotionEvent !== 'undefined') {
      let last = 0;
      let received = false;
      onMotion = (e: DeviceMotionEvent) => {
        const a = e.accelerationIncludingGravity;
        if (!a || a.x == null || a.y == null || a.z == null) return;
        const t = performance.now();
        if (t - last < 10) return;
        last = t;
        if (!received) { received = true; setAvailability('web'); }
        const r = e.rotationRate;
        feed({ t, accel: { x: a.x, y: a.y, z: a.z }, gyro: { x: r?.beta ?? 0, y: r?.gamma ?? 0, z: r?.alpha ?? 0 } });
      };
      window.addEventListener('devicemotion', onMotion);
      setTimeout(() => { if (!received && !cancelled) setAvailability('unsupported'); }, 4000);
    } else {
      setAvailability('unsupported');
    }

    const onOnline = () => { flushQueuedEmergencyEvents().catch(() => {}); };
    window.addEventListener('online', onOnline);
    getPendingSyncEvents().then((p) => { if (p.some((x) => x.type === 'crash_event') && navigator.onLine) onOnline(); }).catch(() => {});

    return () => {
      cancelled = true;
      if (native) { CrashSensor.stop().catch(() => {}); handle?.remove(); }
      if (onMotion) window.removeEventListener('devicemotion', onMotion);
      window.removeEventListener('online', onOnline);
      engineRef.current = null;
    };
  }, [rideId, enabled, onCandidate]);

  // Development-only debug feed
  useEffect(() => {
    if (!debug || !enabled) return;
    const h = setInterval(() => { const e = engineRef.current; if (e) setDebugSnap(e.getDebug()); }, 250);
    return () => clearInterval(h);
  }, [debug, enabled]);

  return {
    level,
    secondsLeft,
    availability,
    debugSnap,
    candidate: candidateRef.current,
    confirmOk: () => finish('user_ok'),
    sendSosNow: () => finish('sos_now'),
    acknowledgeConfirmed: () => setLevel('NORMAL'),
  };
}
