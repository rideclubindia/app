import { CrashDetectionEngine } from './engine';
import type { CrashCandidateEvent, CrashDetectionEngineConfig, ReplayScenario } from './types';

export interface ReplayResult {
  scenario: string;
  finalState: string;
  event: CrashCandidateEvent | null;
}

/**
 * Feeds a recorded/synthetic ReplayScenario (Architecture.md §14) straight into
 * a fresh CrashDetectionEngine, bypassing the Sensor Abstraction Layer entirely.
 * This is the harness Phase 1 is built around: no device, no native code, no
 * real crash ever required to validate detection logic.
 */
export function replayScenario(
  scenario: ReplayScenario,
  config?: Partial<CrashDetectionEngineConfig>
): ReplayResult {
  const engine = new CrashDetectionEngine(config);
  let lastGpsIndex = 0;
  let event: CrashCandidateEvent | null = null;

  for (const sample of scenario.samples) {
    if (scenario.gps) {
      while (lastGpsIndex < scenario.gps.length && scenario.gps[lastGpsIndex].t <= sample.t) {
        engine.reportGps(scenario.gps[lastGpsIndex]);
        lastGpsIndex += 1;
      }
    }
    const result = engine.processSample(sample);
    if (result.event) {
      event = result.event;
      break; // CRASH_SUSPECTED is terminal for this engine — see engine.ts
    }
  }

  return { scenario: scenario.scenario, finalState: engine.getState(), event };
}
