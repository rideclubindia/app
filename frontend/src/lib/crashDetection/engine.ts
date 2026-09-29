import { SignalProcessor } from './signalProcessing';
import type {
  CrashCandidateEvent,
  CrashDetectionEngineConfig,
  DetectionState,
  GpsContextSample,
  ProcessedFrame,
  SensorSample,
} from './types';
import { DEFAULT_ENGINE_CONFIG } from './types';

export interface EngineStepResult {
  state: DetectionState;
  frame: ProcessedFrame;
  /** only present the instant the engine transitions into CRASH_SUSPECTED */
  event?: CrashCandidateEvent;
}

/**
 * The crash detection state machine from Architecture.md §4, scoped to the
 * engine's own responsibility: MONITORING -> IMPACT_DETECTED -> VALIDATING ->
 * CRASH_SUSPECTED (or back to MONITORING). COUNTDOWN/EMERGENCY_TRIGGERED/
 * USER_CANCELLED belong to the Emergency Manager (Phase 3), not this engine —
 * this keeps the safety-critical detection logic testable in isolation.
 */
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

  constructor(config: Partial<CrashDetectionEngineConfig> = {}) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config, weights: { ...DEFAULT_ENGINE_CONFIG.weights, ...config.weights } };
  }

  reportGps(sample: GpsContextSample): void {
    this.latestGps = sample;
  }

  getState(): DetectionState {
    return this.state;
  }

  processSample(sample: SensorSample): EngineStepResult {
    const frame = this.processor.processSample(sample);

    switch (this.state) {
      case 'MONITORING':
        // Track a slow rotation baseline so a later rotation *change* is measured
        // against normal riding lean/vibration, not an absolute threshold.
        this.gyroBaselineDegPerSec =
          this.gyroBaselineDegPerSec * 0.98 + frame.gyroMagnitudeDegPerSec * 0.02;

        if (frame.linearAccelMagnitudeG >= this.config.impactThresholdG) {
          this.state = 'IMPACT_DETECTED';
          this.impactAt = frame.t;
          this.peakAccelSinceImpactG = frame.linearAccelMagnitudeG;
          this.peakGyroSinceImpactDegPerSec = frame.gyroMagnitudeDegPerSec;
          this.stationarySinceImpactMs = 0;
          this.lastFrameT = frame.t;
          // fall through to VALIDATING immediately — IMPACT_DETECTED is a
          // single-frame trigger per §4, the window itself is VALIDATING.
          this.state = 'VALIDATING';
        }
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

        const windowElapsed = frame.t - impactAt >= this.config.validationWindowMs;
        if (!windowElapsed) {
          return { state: this.state, frame };
        }

        const confidence = this.scoreConfidence();
        if (confidence >= this.config.confidenceThreshold) {
          this.state = 'CRASH_SUSPECTED';
          const event: CrashCandidateEvent = {
            state: 'CRASH_SUSPECTED',
            t: frame.t,
            confidence,
            peakAccelMagnitudeG: this.peakAccelSinceImpactG,
            rotationChangeDegPerSec: Math.max(
              0,
              this.peakGyroSinceImpactDegPerSec - this.gyroBaselineDegPerSec
            ),
            stationaryDurationMs: this.stationarySinceImpactMs,
          };
          return { state: this.state, frame, event };
        }

        // Not corroborated — reject and resume monitoring, per §12.
        this.state = 'MONITORING';
        this.impactAt = null;
        return { state: this.state, frame };
      }

      case 'CRASH_SUSPECTED':
      case 'USER_CANCELLED':
      case 'IDLE':
      default:
        // Terminal-for-this-engine states: the Emergency Manager owns what
        // happens next (countdown/cancel/trigger). Replay tests stop reading
        // engine output once CRASH_SUSPECTED is reached.
        return { state: this.state, frame };
    }
  }

  /** External cancel/reset hook — e.g. ride ended, or an Emergency Manager resuming monitoring after USER_CANCELLED. */
  resetToMonitoring(): void {
    this.state = 'MONITORING';
    this.impactAt = null;
  }

  private scoreConfidence(): number {
    const { weights, motionStopThresholdG, rotationChangeThresholdDegPerSec, validationWindowMs } =
      this.config;

    const impactScore = clamp01(this.peakAccelSinceImpactG / (this.config.impactThresholdG * 1.5));

    // Fraction of the validation window spent stationary after impact.
    const motionStopScore = clamp01(this.stationarySinceImpactMs / validationWindowMs);

    const rotationDelta = Math.max(0, this.peakGyroSinceImpactDegPerSec - this.gyroBaselineDegPerSec);
    const rotationScore = clamp01(rotationDelta / rotationChangeThresholdDegPerSec);

    const gpsSample = this.latestGps;
    const hasGps = gpsSample != null && gpsSample.speedKph != null;
    const gpsContextScore = hasGps
      ? clamp01(1 - (gpsSample!.speedKph as number) / 15) // near-zero post-impact speed reads as corroborating
      : null;

    const parts: { weight: number; score: number }[] = [
      { weight: weights.impact, score: impactScore },
      { weight: weights.motionStop, score: motionStopScore },
      { weight: weights.rotation, score: rotationScore },
    ];
    if (gpsContextScore != null) {
      parts.push({ weight: weights.gps, score: gpsContextScore });
    }

    const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
    if (totalWeight === 0) return 0;
    const weighted = parts.reduce((sum, p) => sum + p.weight * p.score, 0) / totalWeight;
    return clamp01(weighted);
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
