import { describe, expect, it } from 'vitest';
import { evaluateSelectionAdapter } from '../../packages/clinical-contracts/src/rule4/selection/evaluateSelectionAdapter.js';
import {
  loadRule4NumericSelectionFixture,
  selectionAdapterInputFromFixture,
  selectionEvaluationContextFromFixture,
  slotSelectionView,
} from './rule4-numeric-selection-fixture-loader.ts';

describe('Rule 4 Phase 8 fixture scenario parity', () => {
  const fixture = loadRule4NumericSelectionFixture();

  it('scenario count matches fixture metadata', () => {
    expect(fixture.scenarios.length).toBe(fixture.scenarioCount);
    expect(fixture.scenarioCount).toBeGreaterThanOrEqual(60);
  });

  it.each(fixture.scenarios.map((s) => [s.id, s] as const))('parity %s', (_id, scenario) => {
    const out = evaluateSelectionAdapter(
      selectionAdapterInputFromFixture(scenario),
      selectionEvaluationContextFromFixture(scenario),
    );
    expect(out.executionStatus).toBe('NOT_IMPLEMENTED');
    expect(out.automaticNumericPotencyRuntime).toBe(false);
    expect(out.prescriptionIssueAllowed).toBe(false);
    expect(out.finalDoctorApprovalRequired).toBe(true);
    const view = slotSelectionView(out, scenario.expected.formula_slot_id as string | undefined);
    for (const [key, expected] of Object.entries(scenario.expected)) {
      if (key === 'formula_slot_id') continue;
      if (key === 'reason_includes') {
        for (const r of expected as string[]) {
          expect(view.reason_codes).toContain(r);
        }
      } else {
        expect(view[key]).toBe(expected);
      }
    }
  });
});
