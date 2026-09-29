import { SignalProcessor } from './signalProcessing';
import type {
  CrashCandidateEvent,
  CrashDetectionEngineConfig,
  CrashSignals,
  DetectionState,
  GpsContextSample,
  ProcessedFrame,
  SensorSample,
  Vec3,
} from './types';
import { DEFAULT_ENGINE_CONFIG } from './types';

export interface EngineStepResult {
  state: DetectionState;
  frame: ProcessedFrame;
  /** only present the instant the engine transitions into CRASH_SUSPECTED */
  event?: CrashCandidateEvent;
}

export interface EngineDebugSnapshot {
  state: DetectionState;
  armed: boolean;
  lastFrame: ProcessedFrame | null;
  latestSpeedKph: number | null;
  lastSignals: CrashSignals | null;
  lastConfidence: number | null;
  lastRejectReason: string | null;
}

// Multi-signal crash state machine (MONITORING -> VALIDATING -> CRASH_SUSPECTED); countdown and SOS belong to the caller.
export class CrashDetectionEngine {
  private readonly config: CrashDetectionEngineConfig;
  private readonly processor = new SignalProcessor();

  private state: DetectionState = 'MONITORING';
  private impactAt: number | null = null;
  private peakAccelSinceImpactG = 0;
  private gyroBaselineDegPerSec = 0;
  private peakGyroSinceImpactDegPerSec = 0;
  private stationarySinceImpactMs = 0;
  private lastFrameT: number | null = null;
  private latestGps: GpsContextSample | null = null;
  private speedHistory: GpsContextSample[] = [];
  private gravityBeforeImpact: Vec3 | null = null;
  private lastGravity: Vec3 | null = null;
  private freefallStartT: number | null = null;
  private lastFreefallEndT: number | null = null;
  private impactFollowsFreefall = false;
  private preImpactSpeedKph: number | null = null;
  private lastFrame: ProcessedFrame | null = null;
  private lastSignals: CrashSignals | null = null;
  private lastConfidence: number | null = null;
  private lastRejectReason: string | null = null;

  constructor(config: Partial<CrashDetectionEngineConfig> = {}) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config, weights: { ...DEFAULT_ENGINE_CONFIG.weights, ...config.weights } };
  }

  reportGps(sample: GpsContextSample): void {
    this.latestGps = sample;
    if (sample.speedKph == null) return;
    this.speedHistory.push(sample);
    const cutoff = sample.t - Math.max(this.config.ridingContextWindowMs, 5000);
    while (this.speedHistory.length && this.speedHistory[0].t < cutoff) this.speedHistory.shift();
  }

  getState(): DetectionState {
    return this.state;
  }

  getDebug(): EngineDebugSnapshot {
    return {
      state: this.state,
      armed: this.isArmed(this.lastFrame?.t ?? 0),
      lastFrame: this.lastFrame,
      latestSpeedKph: this.latestGps?.speedKph ?? null,
      lastSignals: this.lastSignals,
      lastConfidence: this.lastConfidence,
      lastRejectReason: this.lastRejectReason,
    };
  }

  // Armed only while riding; with no GPS speed at all we stay armed but demand more confidence.
  private isArmed(t: number): boolean {
    if (!this.speedHistory.length) return true;
    const since = t - this.config.ridingContextWindowMs;
    return this.speedHistory.some((s) => s.t >= since && (s.speedKph ?? 0) >= this.config.minRidingSpeedKph);
  }

  private trackFreefall(frame: ProcessedFrame): void {
    if (frame.accelMagnitudeG < this.config.freefallThresholdG) {
      if (this.freefallStartT == null) this.freefallStartT = frame.t;
    } else if (this.freefallStartT != null) {
      if (frame.t - this.freefallStartT >= this.config.freefallMinMs) this.lastFreefallEndT = frame.t;
      this.freefallStartT = null;
    }
  }

  processSample(sample: SensorSample): EngineStepResult {
    const frame = this.processor.processSample(sample);
    this.lastFrame = frame;
    this.trackFreefall(frame);

    switch (this.state) {
      case 'MONITORING':
        // Slow rotation baseline so a later rotation *change* is measured against normal lean/vibration.
        this.gyroBaselineDegPerSec = this.gyroBaselineDegPerSec * 0.98 + frame.gyroMagnitudeDegPerSec * 0.02;

        if (frame.linearAccelMagnitudeG >= this.config.impactThresholdG) {
          if (!this.isArmed(frame.t)) {
            this.lastRejectReason = 'impact while not riding';
            this.lastGravity = frame.gravity ?? null;
            return { state: this.state, frame };
          }
          this.impactAt = frame.t;
          this.peakAccelSinceImpactG = frame.linearAccelMagnitudeG;
          this.peakGyroSinceImpactDegPerSec = frame.gyroMagnitudeDegPerSec;
          this.stationarySinceImpactMs = 0;
          this.lastFrameT = frame.t;
          this.gravityBeforeImpact = this.lastGravity;
          this.impactFollowsFreefall =
            this.freefallStartT != null && frame.t - this.freefallStartT >= this.config.freefallMinMs ||
            this.lastFreefallEndT != null && frame.t - this.lastFreefallEndT <= this.config.freefallBeforeImpactMs;
          const before = this.speedHistory.filter((s) => s.t >= frame.t - 5000 && s.t <= frame.t);
          this.preImpactSpeedKph = before.length ? Math.max(...before.map((s) => s.speedKph ?? 0)) : null;
          this.state = 'VALIDATING';
        }
        this.lastGravity = frame.gravity ?? null;
        return { state: this.state, frame };

      case 'VALIDATING': {
        const impactAt = this.impactAt!;
        this.peakAccelSinceImpactG = Math.max(this.peakAccelSinceImpactG, frame.linearAccelMagnitudeG);
        this.peakGyroSinceImpactDegPerSec = Math.max(this.peakGyroSinceImpactDegPerSec, frame.gyroMagnitudeDegPerSec);

        const dt = this.lastFrameT != null ? frame.t - this.lastFrameT : 0;
        this.lastFrameT = frame.t;
        if (frame.motionState === 'stationary') {
          this.stationarySinceImpactMs += Math.max(dt, 0);
        } else {
          this.stationarySinceImpactMs = 0;
        }

        if (frame.t - impactAt < this.config.validationWindowMs) {
          return { state: this.state, frame };
        }

        const { confidence, signals, threshold } = this.scoreConfidence(frame);
        this.lastSignals = signals;
        this.lastConfidence = confidence;
        if (confidence >= threshold) {
          this.state = 'CRASH_SUSPECTED';
          this.lastRejectReason = null;
          const event: CrashCandidateEvent = {
            state: 'CRASH_SUSPECTED',
            t: frame.t,
            confidence,
            peakAccelMagnitudeG: this.peakAccelSinceImpactG,
            rotationChangeDegPerSec: Math.max(0, this.peakGyroSinceImpactDegPerSec - this.gyroBaselineDegPerSec),
            stationaryDurationMs: this.stationarySinceImpactMs,
            signals,
          };
          return { state: this.state, frame, event };
        }

        this.lastRejectReason = signals.freefall ? 'dropped-phone pattern' : 'not corroborated';
        this.state = 'MONITORING';
        this.impactAt = null;
        return { state: this.state, frame };
      }

      case 'CRASH_SUSPECTED':
      case 'USER_CANCELLED':
      case 'IDLE':
      default:
        return { state: this.state, frame };
    }
  }

  /** External cancel/reset hook — e.g. ride ended, or the rider pressed "I'm OK". */
  resetToMonitoring(): void {
    this.state = 'MONITORING';
    this.impactAt = null;
  }

  private scoreConfidence(frame: ProcessedFrame): { confidence: number; signals: CrashSignals; threshold: number } {
    const c = this.config;
    const { weights } = c;

    const impact = clamp01(this.peakAccelSinceImpactG / (c.impactThresholdG * 1.5));
    const motionStop = clamp01(this.stationarySinceImpactMs / c.validationWindowMs);
    const rotation = clamp01(Math.max(0, this.peakGyroSinceImpactDegPerSec - this.gyroBaselineDegPerSec) / c.rotationChangeThresholdDegPerSec);

    const postSpeed = this.latestGps?.speedKph ?? null;
    const gps = postSpeed != null ? clamp01(1 - postSpeed / 15) : null;
    const speedDrop = postSpeed != null && this.preImpactSpeedKph != null
      ? clamp01((this.preImpactSpeedKph - postSpeed) / c.speedDropKph)
      : null;

    const orientationChangeDeg = this.gravityBeforeImpact && frame.gravity ? angleDeg(this.gravityBeforeImpact, frame.gravity) : 0;
    const orientation = clamp01(orientationChangeDeg / c.orientationChangeDeg);

    const parts: { weight: number; score: number }[] = [
      { weight: weights.impact, score: impact },
      { weight: weights.motionStop, score: motionStop },
      { weight: weights.rotation, score: rotation },
      { weight: weights.orientation, score: orientation },
    ];
    if (gps != null) parts.push({ weight: weights.gps, score: gps });
    if (speedDrop != null) parts.push({ weight: weights.speedDrop, score: speedDrop });

    const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
    let confidence = totalWeight ? clamp01(parts.reduce((sum, p) => sum + p.weight * p.score, 0) / totalWeight) : 0;
    if (this.impactFollowsFreefall) confidence *= c.freefallPenalty;

    const threshold = c.confidenceThreshold + (gps == null ? c.noGpsConfidencePenalty : 0);
    return {
      confidence,
      threshold,
      signals: {
        impact, motionStop, rotation, gps, speedDrop, orientation,
        freefall: this.impactFollowsFreefall,
        preImpactSpeedKph: this.preImpactSpeedKph,
        postImpactSpeedKph: postSpeed,
        orientationChangeDeg,
      },
    };
  }
}

function angleDeg(a: Vec3, b: Vec3): number {
  const ma = Math.hypot(a.x, a.y, a.z), mb = Math.hypot(b.x, b.y, b.z);
  if (!ma || !mb) return 0;
  const cos = Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y + a.z * b.z) / (ma * mb)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
