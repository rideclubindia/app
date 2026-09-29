import type { GpsContextSample, ReplayScenario, SensorSample, Vec3 } from './types';

const G = 9.80665;
const HZ = 100; // synthetic sampling rate; engine doesn't assume a fixed rate
const DT = 1000 / HZ;

// Deterministic pseudo-noise so fixtures are stable across runs/CI, not flaky.
function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1; // [-1, 1]
}

interface Segment {
  fromMs: number;
  toMs: number;
  /** returns raw accel (m/s^2, includes gravity) and gyro (deg/s) for a given t within the segment */
  sample: (t: number) => { accel: Vec3; gyro: Vec3 };
}

function baselineRiding(t: number, seedOffset: number): { accel: Vec3; gyro: Vec3 } {
  // Upright mount, gravity mostly on z; small vibration/lean jitter — ordinary riding.
  return {
    accel: {
      x: noise(t + seedOffset) * 0.6,
      y: noise(t * 1.7 + seedOffset) * 0.6,
      z: G + noise(t * 2.3 + seedOffset) * 0.4,
    },
    gyro: {
      x: noise(t * 0.5 + seedOffset) * 3,
      y: noise(t * 0.9 + seedOffset) * 3,
      z: noise(t * 1.3 + seedOffset) * 3,
    },
  };
}

function buildFromSegments(segments: Segment[]): SensorSample[] {
  const samples: SensorSample[] = [];
  const totalMs = segments[segments.length - 1].toMs;
  for (let t = 0; t <= totalMs; t += DT) {
    const seg = segments.find((s) => t >= s.fromMs && t <= s.toMs) ?? segments[segments.length - 1];
    const { accel, gyro } = seg.sample(t);
    samples.push({ t, accel, gyro });
  }
  return samples;
}

function ridingSegment(fromMs: number, toMs: number, seedOffset = 0): Segment {
  return { fromMs, toMs, sample: (t) => baselineRiding(t, seedOffset) };
}

function stationarySegment(fromMs: number, toMs: number): Segment {
  return {
    fromMs,
    toMs,
    sample: (t) => ({
      accel: { x: noise(t) * 0.02, y: noise(t * 1.1) * 0.02, z: G + noise(t * 1.3) * 0.02 },
      gyro: { x: 0, y: 0, z: 0 },
    }),
  };
}

/** A short sharp spike on top of gravity — impact-shaped, decaying over ~150ms. */
function impactSegment(fromMs: number, toMs: number, peakG: number, axis: 'x' | 'y' | 'z' = 'z'): Segment {
  const peakAt = fromMs + (toMs - fromMs) * 0.2;
  return {
    fromMs,
    toMs,
    sample: (t) => {
      const distFromPeak = Math.abs(t - peakAt);
      const decay = Math.max(0, 1 - distFromPeak / 80);
      const spike = peakG * G * decay;
      const accel: Vec3 = { x: 0, y: 0, z: G };
      accel[axis] += spike;
      return { accel, gyro: { x: noise(t) * 20 * decay, y: noise(t * 1.4) * 20 * decay, z: 0 } };
    },
  };
}

function gpsSpeedRamp(fromMs: number, toMs: number, fromKph: number, toKph: number, stepMs = 200): GpsContextSample[] {
  const out: GpsContextSample[] = [];
  for (let t = fromMs; t <= toMs; t += stepMs) {
    const frac = (t - fromMs) / (toMs - fromMs);
    out.push({ t, speedKph: fromKph + (toKph - fromKph) * frac });
  }
  return out;
}

// ---- Non-crash scenarios (must be rejected — stay in / return to MONITORING) ----

export const normalRiding: ReplayScenario = {
  scenario: 'normal_riding',
  samples: buildFromSegments([ridingSegment(0, 5000)]),
  gps: gpsSpeedRamp(0, 5000, 45, 48),
};

export const hardBraking: ReplayScenario = {
  scenario: 'hard_braking',
  // strong deceleration but no rotation spike, no stationary follow-through
  samples: buildFromSegments([
    ridingSegment(0, 1000),
    impactSegment(1000, 1400, 2.2, 'x'),
    ridingSegment(1400, 4000, 5),
  ]),
  gps: gpsSpeedRamp(0, 4000, 60, 20),
};

export const pothole: ReplayScenario = {
  scenario: 'pothole',
  // sharp vertical spike, riding continues normally right after
  samples: buildFromSegments([
    ridingSegment(0, 1000),
    impactSegment(1000, 1150, 2.8, 'z'),
    ridingSegment(1150, 4000, 9),
  ]),
  gps: gpsSpeedRamp(0, 4000, 50, 48),
};

export const speedBreaker: ReplayScenario = {
  scenario: 'speed_breaker',
  samples: buildFromSegments([
    ridingSegment(0, 1000),
    impactSegment(1000, 1300, 2.5, 'z'),
    ridingSegment(1300, 4000, 13),
  ]),
  gps: gpsSpeedRamp(0, 4000, 30, 28),
};

export const sharpTurn: ReplayScenario = {
  scenario: 'sharp_turn',
  // rotation present but no impact spike, no stationary follow-through
  samples: buildFromSegments([
    ridingSegment(0, 1000),
    {
      fromMs: 1000,
      toMs: 2000,
      sample: (t) => ({
        accel: { x: noise(t) * 0.8, y: noise(t * 1.2) * 0.8, z: G + noise(t * 1.5) * 0.5 },
        gyro: { x: noise(t) * 40, y: noise(t * 1.3) * 40, z: 90 + noise(t * 0.7) * 10 },
      }),
    },
    ridingSegment(2000, 4000, 17),
  ]),
  gps: gpsSpeedRamp(0, 4000, 35, 33),
};

export const phoneDrop: ReplayScenario = {
  scenario: 'phone_drop',
  // free-fall-like dip then impact, but phone keeps moving afterward (in a pocket/bag) — not stationary
  samples: buildFromSegments([
    ridingSegment(0, 1000),
    { fromMs: 1000, toMs: 1200, sample: () => ({ accel: { x: 0, y: 0, z: 0.3 * G }, gyro: { x: 60, y: 40, z: 30 } }) },
    impactSegment(1200, 1400, 3.2, 'y'),
    {
      fromMs: 1400,
      toMs: 4000,
      sample: (t) => ({
        accel: { x: noise(t) * 1.5, y: noise(t * 1.6) * 1.5, z: G + noise(t * 2.1) * 1.2 },
        gyro: { x: noise(t) * 25, y: noise(t * 1.2) * 25, z: noise(t * 0.8) * 25 },
      }),
    },
  ]),
};

export const suddenStop: ReplayScenario = {
  scenario: 'sudden_stop',
  // deceleration only, gradual not spike-shaped, no rotation event
  samples: buildFromSegments([
    ridingSegment(0, 1000),
    {
      fromMs: 1000,
      toMs: 2000,
      sample: (t) => ({
        accel: { x: -1.2 + noise(t) * 0.2, y: 0, z: G },
        gyro: { x: noise(t) * 3, y: noise(t * 1.1) * 3, z: noise(t * 0.9) * 3 },
      }),
    },
    stationarySegment(2000, 5000),
  ]),
  gps: gpsSpeedRamp(0, 2000, 25, 0),
};

export const normalParking: ReplayScenario = {
  scenario: 'normal_parking',
  samples: buildFromSegments([ridingSegment(0, 1000, 21), stationarySegment(1000, 4000)]),
  gps: gpsSpeedRamp(0, 1000, 8, 0),
};

// ---- Crash-positive scenarios (must reach CRASH_SUSPECTED) ----

export const simulatedImpact: ReplayScenario = {
  // isolated spike only, no follow-through — per Architecture.md §14 this is a
  // distinct fixture from the full crash sequence and is expected to be REJECTED
  // (single-signal spikes are exactly what VALIDATING exists to filter out).
  scenario: 'simulated_impact',
  samples: buildFromSegments([
    ridingSegment(0, 1000),
    impactSegment(1000, 1150, 2.6, 'z'),
    ridingSegment(1150, 4000, 25),
  ]),
  gps: gpsSpeedRamp(0, 4000, 50, 47),
};

export const simulatedCrashSequence: ReplayScenario = {
  scenario: 'simulated_crash_sequence',
  // impact -> rotation spike (tip-over) -> genuinely stationary for the rest of the window
  samples: buildFromSegments([
    ridingSegment(0, 1000),
    impactSegment(1000, 1300, 6, 'x'),
    {
      fromMs: 1300,
      toMs: 1800,
      sample: (t) => ({
        accel: { x: noise(t) * 0.3, y: noise(t * 1.1) * 0.3, z: 0.4 * G },
        gyro: { x: 150 + noise(t) * 20, y: 100 + noise(t * 1.2) * 20, z: 60 + noise(t * 0.8) * 20 },
      }),
    },
    stationarySegment(1800, 4500),
  ]),
  gps: gpsSpeedRamp(0, 1300, 55, 2),
};

export const ALL_SCENARIOS: { scenario: ReplayScenario; expectCrashSuspected: boolean }[] = [
  { scenario: normalRiding, expectCrashSuspected: false },
  { scenario: hardBraking, expectCrashSuspected: false },
  { scenario: pothole, expectCrashSuspected: false },
  { scenario: speedBreaker, expectCrashSuspected: false },
  { scenario: sharpTurn, expectCrashSuspected: false },
  { scenario: phoneDrop, expectCrashSuspected: false },
  { scenario: suddenStop, expectCrashSuspected: false },
  { scenario: normalParking, expectCrashSuspected: false },
  { scenario: simulatedImpact, expectCrashSuspected: false },
  { scenario: simulatedCrashSequence, expectCrashSuspected: true },
];
