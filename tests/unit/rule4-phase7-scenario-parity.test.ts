import { describe, expect, it } from 'vitest';
import { evaluateEligibilityAdapter } from '../../packages/clinical-contracts/src/rule4/eligibility/evaluateEligibilityAdapter.js';
import { rule4CandidateEligibilityFingerprintV1Hash } from '../../packages/clinical-contracts/src/rule4/eligibility/eligibilityFingerprintV1.js';
import {
  eligibilityAdapterInputFromFixture,
  eligibilityEvaluationContextFromFixture,
  loadRule4CandidateEligibilityFixture,
  slotEligibilityView,
} from './rule4-eligibility-fixture-loader.ts';

describe('Rule 4 Phase 7 fixture scenario parity', () => {
  const fixture = loadRule4CandidateEligibilityFixture();

  it('scenario count matches fixture metadata', () => {
    expect(fixture.scenarios.length).toBe(fixture.scenarioCount);
    expect(fixture.scenarioCount).toBeGreaterThanOrEqual(50);
  });

  it.each(fixture.scenarios.map((s) => [s.id, s] as const))('parity %s', (_id, scenario) => {
    const out = evaluateEligibilityAdapter(
      eligibilityAdapterInputFromFixture(scenario),
      eligibilityEvaluationContextFromFixture(scenario),
    );
    expect(out.executionStatus).toBe('NOT_IMPLEMENTED');
    expect(out.automaticPotencyRuntime).toBe(false);
    expect(out.prescriptionIssueAllowed).toBe(false);
    expect(out.selectionStatus).toBe('NOT_STARTED');
    for (const slot of out.slotResolutions) {
      expect(slot.selectedCascade).toBeNull();
      expect(slot.selectedDilution).toBeNull();
      expect(slot.selectionStatus).toBe('NOT_STARTED');
    }
    const view = slotEligibilityView(out, scenario.expected.formula_slot_id as string | undefined);
    for (const [key, expected] of Object.entries(scenario.expected)) {
      if (key === 'formula_slot_id') continue;
      if (key === 'reason_includes') {
        for (const r of expected as string[]) {
          expect(view.reason_codes).toContain(r);
        }
      } else if (key === 'gate_includes') {
        for (const g of expected as string[]) {
          expect(view.gate_ids).toContain(g);
        }
      } else {
        expect(view[key]).toBe(expected);
      }
    }
  });
});

describe('Rule 4 Phase 7 fingerprint references', () => {
  const fixture = loadRule4CandidateEligibilityFixture();

  it('fixed fingerprint refs match independently authored payloads', () => {
    for (const ref of fixture.fingerprintV1References) {
      const scenario = fixture.scenarios.find((s) => s.id === ref.scenario_id);
      expect(scenario).toBeDefined();
      const out = evaluateEligibilityAdapter(
        eligibilityAdapterInputFromFixture(scenario!),
        eligibilityEvaluationContextFromFixture(scenario!),
      );
      const hash = rule4CandidateEligibilityFingerprintV1Hash({
        rulesetVersion: out.rulesetVersion,
        registryVersion: out.registryVersion,
        selectionStatus: out.selectionStatus,
        slotResolutions: out.slotResolutions,
        reasonCodes: out.reasonCodes,
        limitationCodes: out.limitationCodes,
      });
      expect(hash).toBe(ref.candidate_eligibility_sha256);
      expect(ref.canonical_payload).toContain('rule4-candidate-eligibility-fingerprint-v1');
    }
  });
});
