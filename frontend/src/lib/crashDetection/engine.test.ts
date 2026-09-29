import { describe, expect, it } from 'vitest';
import { replayScenario } from './replay';
import { ALL_SCENARIOS } from './scenarios';

describe('CrashDetectionEngine — replay scenarios (Architecture.md §14)', () => {
  for (const { scenario, expectCrashSuspected } of ALL_SCENARIOS) {
    it(`${scenario.scenario}: ${expectCrashSuspected ? 'reaches CRASH_SUSPECTED' : 'is rejected (stays in MONITORING)'}`, () => {
      const result = replayScenario(scenario);

      if (expectCrashSuspected) {
        expect(result.finalState).toBe('CRASH_SUSPECTED');
        expect(result.event).not.toBeNull();
        expect(result.event!.confidence).toBeGreaterThanOrEqual(0.65);
      } else {
        expect(result.finalState).toBe('MONITORING');
        expect(result.event).toBeNull();
      }
    });
  }
});
