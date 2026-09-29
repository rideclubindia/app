// Phase 1 of Crash Detection & Emergency Response Architecture.md â€”
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
  /** low-pass gravity estimate (m/s^2), used for orientation change */
  gravity?: Vec3;
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
    speedDrop: number;
    orientation: number;
  };
  /** GPS speed (km/h) that counts as "riding"; impacts are ignored unless reached within ridingContextWindowMs */
  minRidingSpeedKph: number;
  ridingContextWindowMs: number;
  /** pre-impact minus post-impact speed (km/h) that scores a full speed-drop signal */
  speedDropKph: number;
  /** gravity-direction change (degrees) across the impact that scores a full orientation signal */
  orientationChangeDeg: number;
  /** total-accel magnitude (g) below which the phone is treated as free-falling */
  freefallThresholdG: number;
  /** minimum free-fall duration, and how soon before an impact it must end, to be treated as a dropped phone */
  freefallMinMs: number;
  freefallBeforeImpactMs: number;
  /** confidence multiplier applied when a dropped-phone pattern precedes the impact */
  freefallPenalty: number;
  /** extra confidence required when no GPS speed is available at all */
  noGpsConfidencePenalty: number;
}

export const DEFAULT_ENGINE_CONFIG: CrashDetectionEngineConfig = {
  impactThresholdG: 3.5,
  validationWindowMs: 4000,
  motionStopThresholdG: 0.25,
  rotationChangeThresholdDegPerSec: 120,
  confidenceThreshold: 0.65,
  weights: { impact: 0.3, motionStop: 0.3, rotation: 0.2, gps: 0.2, speedDrop: 0.15, orientation: 0.1 },
  minRidingSpeedKph: 12,
  ridingContextWindowMs: 15000,
  speedDropKph: 20,
  orientationChangeDeg: 45,
  freefallThresholdG: 0.35,
  freefallMinMs: 120,
  freefallBeforeImpactMs: 400,
  freefallPenalty: 0.5,
  noGpsConfidencePenalty: 0.05,
};

/** Rider-facing accident flow settings, kept next to the engine thresholds so both are tuned in one place. */
export const ACCIDENT_FLOW_CONFIG = {
  countdownSeconds: 15,
  cooldownAfterCancelMs: 60_000,
};

export type AccidentLevel = 'NORMAL' | 'SUSPICIOUS' | 'POSSIBLE_ACCIDENT' | 'CONFIRMED_ACCIDENT';

export interface CrashSignals {
  impact: number;
  motionStop: number;
  rotation: number;
  gps: number | null;
  speedDrop: number | null;
  orientation: number;
  freefall: boolean;
  preImpactSpeedKph: number | null;
  postImpactSpeedKph: number | null;
  orientationChangeDeg: number;
}

export interface CrashCandidateEvent {
  state: 'CRASH_SUSPECTED';
  t: number;
  confidence: number;
  peakAccelMagnitudeG: number;
  rotationChangeDegPerSec: number;
  stationaryDurationMs: number;
  signals?: CrashSignals;
}

/** The replayable sensor-data format from Architecture.md Â§14 â€” used by tests and future field-recording tooling. */
export interface ReplayScenario {
  scenario: string;
  samples: SensorSample[];
  gps?: GpsContextSample[];
}
