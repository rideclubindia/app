// Phase 1 of Crash Detection & Emergency Response Architecture.md —
// pure types shared by signal processing, the detection engine, and the replay harness.

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** One raw sample as the native sensor abstraction layer would deliver it. */
export interface SensorSample {
  /** milliseconds since the start of the recording/session */
  t: number;
  accel: Vec3;
  gyro: Vec3;
}

/** Optional GPS context available alongside a sample, when the fix is fresh enough to trust. */
export interface GpsContextSample {
  t: number;
  speedKph: number | null;
}

export type DetectionState =
  | 'IDLE'
  | 'MONITORING'
  | 'IMPACT_DETECTED'
  | 'VALIDATING'
  | 'CRASH_SUSPECTED'
  | 'USER_CANCELLED';

export interface ProcessedFrame {
  t: number;
  /** total acceleration magnitude including gravity, in g */
  accelMagnitudeG: number;
  /** gravity-compensated (linear) acceleration magnitude, in g */
  linearAccelMagnitudeG: number;
  gyroMagnitudeDegPerSec: number;
  motionState: 'moving' | 'stationary';
}

export interface CrashDetectionEngineConfig {
  /** linear-acceleration spike, in g, that can trigger IMPACT_DETECTED */
  impactThresholdG: number;
  /** how long after an impact to keep collecting corroborating frames before deciding */
  validationWindowMs: number;
  /** linear-accel magnitude (g) below which motion counts as "stopped" during validation */
  motionStopThresholdG: number;
  /** gyro magnitude (deg/s) change vs. pre-impact baseline that counts as a rotation event */
  rotationChangeThresholdDegPerSec: number;
  /** weighted confidence in [0,1] required to advance VALIDATING -> CRASH_SUSPECTED */
  confidenceThreshold: number;
  /** relative weights for each signal; re-normalized when a signal (e.g. GPS) is unavailable */
  weights: {
    impact: number;
    motionStop: number;
    rotation: number;
    gps: number;
  };
}

export const DEFAULT_ENGINE_CONFIG: CrashDetectionEngineConfig = {
  impactThresholdG: 3.5,
  validationWindowMs: 2000,
  motionStopThresholdG: 0.25,
  rotationChangeThresholdDegPerSec: 120,
  confidenceThreshold: 0.65,
  weights: { impact: 0.3, motionStop: 0.3, rotation: 0.2, gps: 0.2 },
};

export interface CrashCandidateEvent {
  state: 'CRASH_SUSPECTED';
  t: number;
  confidence: number;
  peakAccelMagnitudeG: number;
  rotationChangeDegPerSec: number;
  stationaryDurationMs: number;
}

/** The replayable sensor-data format from Architecture.md §14 — used by tests and future field-recording tooling. */
export interface ReplayScenario {
  scenario: string;
  samples: SensorSample[];
  gps?: GpsContextSample[];
}
