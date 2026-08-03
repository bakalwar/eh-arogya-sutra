import { describe, expect, it } from 'vitest';
import { evaluatePhaseAdapter } from '../../packages/clinical-contracts/src/rule4/phase/evaluatePhaseAdapter.js';
import {
  firstSlotView,
  loadRule4PhaseResolutionFixture,
  phaseAdapterInputFromFixture,
  phaseEvaluationContextFromFixture,
} from './rule4-phase-fixture-loader.ts';

describe('Rule 4 Phase 5 fixture scenario parity', () => {
  const fixture = loadRule4PhaseResolutionFixture();

  it('scenario count matches fixture metadata', () => {
    expect(fixture.scenarios.length).toBeGreaterThanOrEqual(38);
    expect(fixture.scenarios.length).toBe(fixture.scenarioCount);
  });

  it.each(fixture.scenarios.map((s) => [s.id, s] as const))('parity %s', (_id, scenario) => {
    const out = evaluatePhaseAdapter(
      phaseAdapterInputFromFixture(scenario),
      phaseEvaluationContextFromFixture(scenario),
    );
    expect(out.executionStatus).toBe('NOT_IMPLEMENTED');
    expect(out.automaticPhaseRuntime).toBe(false);
    expect(out.prescriptionIssueAllowed).toBe(false);
    for (const slot of out.slotResolutions) {
      expect(slot.selectedCascade).toBeNull();
      expect(slot.selectedDilution).toBeNull();
    }
    const view = firstSlotView(out);
    for (const [key, expected] of Object.entries(scenario.expected)) {
      if (key === 'reason_includes') {
        for (const r of expected as string[]) {
          expect(view.reason_codes).toContain(r);
        }
      } else if (key === 'limitation_includes') {
        for (const code of expected as string[]) {
          expect(view.limitation_codes).toContain(code);
        }
      } else {
        expect(view[key]).toBe(expected);
      }
    }
  });
});
