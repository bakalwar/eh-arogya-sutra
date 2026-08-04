import { describe, expect, it } from 'vitest';
import { evaluateRule4ShadowBundle } from '../../packages/clinical-contracts/src/rule4/evaluator.js';
import {
  doctorReviewContextFromScenario,
  doctorReviewInputFromScenario,
  loadRule4DoctorReviewFixture,
} from './rule4-doctor-review-fixture-loader.ts';

describe('Rule 4 Phase 10 shadow public isolation', () => {
  it('public Rule4Result unchanged when doctor review attached', () => {
    const fixture = loadRule4DoctorReviewFixture();
    const scenario = fixture.scenarios.find((s) => s.id === 'valid-adult-approve')!;
    const reviewIn = doctorReviewInputFromScenario(scenario);
    const base = {
      contractVersion: 'ehas2-rule4-contract-v1-phase2-safety' as const,
      caseId: 'c1',
      consultationId: null,
      rulesetVersion: 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469',
      engineMode: 'shadow' as const,
      label: 'SYNTHETIC' as const,
      formulaSlots: [
        {
          formulaSlotId: 's1',
          formulaTargetId: 't1',
          polarityRef: null,
          organTargetRef: null,
          temperamentRef: null,
          phaseRef: null,
          severityRef: null,
          structuredEvidenceItemIds: [],
        },
      ],
      verifiedAge: { ageYears: 35, verificationStatus: 'VERIFIED' as const },
      patientWideSafety: {},
      structuredEvidenceItemIds: [],
    };
    const without = evaluateRule4ShadowBundle(base);
    const withReview = evaluateRule4ShadowBundle({
      ...base,
      doctorReviewAdapter: reviewIn,
      doctorReviewContext: doctorReviewContextFromScenario(scenario),
    });
    expect(withReview.doctorReviewResolution).not.toBeNull();
    expect(withReview.doctorReviewResolution?.issuanceEligibilityStatus).toBe('ISSUANCE_ELIGIBLE');
    expect(withReview.doctorReviewResolution?.prescriptionIssueAllowed).toBe(false);
    expect(without.result.deterministicFingerprint).toBe(
      withReview.result.deterministicFingerprint,
    );
    expect(without.result.slots[0]?.selectedDilution).toBeNull();
  });
});
