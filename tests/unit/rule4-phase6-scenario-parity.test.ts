import { describe, expect, it } from 'vitest';
import { evaluateSeverityAdapter } from '../../packages/clinical-contracts/src/rule4/severity/evaluateSeverityAdapter.js';
import {
  loadRule4SeverityResolutionFixture,
  severityAdapterInputFromFixture,
  severityEvaluationContextFromFixture,
  slotView,
} from './rule4-severity-fixture-loader.ts';

describe('Rule 4 Phase 6 fixture scenario parity', () => {
  const fixture = loadRule4SeverityResolutionFixture();

  it('scenario count matches fixture metadata', () => {
    expect(fixture.scenarios.length).toBeGreaterThanOrEqual(63);
    expect(fixture.scenarios.length).toBe(fixture.scenarioCount);
  });

  it.each(fixture.scenarios.map((s) => [s.id, s] as const))('parity %s', (_id, scenario) => {
    const out = evaluateSeverityAdapter(
      severityAdapterInputFromFixture(scenario),
      severityEvaluationContextFromFixture(scenario),
    );
    expect(out.executionStatus).toBe('NOT_IMPLEMENTED');
    expect(out.automaticSeverityRuntime).toBe(false);
    expect(out.automaticPotencyRuntime).toBe(false);
    expect(out.prescriptionIssueAllowed).toBe(false);
    for (const slot of out.slotResolutions) {
      expect(slot.selectedCascade).toBeNull();
      expect(slot.selectedDilution).toBeNull();
    }
    const slotId = scenario.expected.formula_slot_id as string | undefined;
    const view = slotView(out, slotId);
    for (const [key, expected] of Object.entries(scenario.expected)) {
      if (key === 'formula_slot_id') continue;
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
