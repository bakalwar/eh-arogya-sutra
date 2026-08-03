import { describe, expect, it } from 'vitest';
import {
  evaluateRule4Empty,
  evaluateRule4ShadowBundle,
} from '../../packages/clinical-contracts/src/rule4/evaluator.js';
import { RULE4_CONTRACT_VERSION_PHASE7_CANDIDATE_ELIGIBILITY } from '../../packages/clinical-contracts/src/rule4/version.js';
import { RULE4_CONTRACT_VERSION_PHASE2 } from '../../packages/clinical-contracts/src/rule4/version.js';

const RULESET = 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469';

describe('Rule 4 Phase 7 shadow/public equivalence', () => {
  it('public result unchanged when eligibility adapter present in shadow', () => {
    const base = {
      contractVersion: RULE4_CONTRACT_VERSION_PHASE2,
      caseId: 'c1',
      consultationId: 'consult',
      rulesetVersion: RULESET,
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
      verifiedAge: {
        ageYears: 30,
        verificationStatus: 'VERIFIED' as const,
      },
      patientWideSafety: {},
      structuredEvidenceItemIds: [],
      eligibilityAdapter: {
        contractVersion: RULE4_CONTRACT_VERSION_PHASE7_CANDIDATE_ELIGIBILITY,
        rulesetVersion: RULESET,
        registryVersion: 'rule4-reason-codes-phase7-candidate-eligibility-subset-v1',
        label: 'SYNTHETIC' as const,
        formulaSlotIds: ['s1'],
        formulaEligibilityRecords: [],
      },
    };
    const without = evaluateRule4Empty({ ...base, eligibilityAdapter: undefined });
    const bundle = evaluateRule4ShadowBundle(base);
    expect(bundle.result.deterministicFingerprint).toBe(without.deterministicFingerprint);
    expect(bundle.eligibilityResolution).not.toBeNull();
    expect(bundle.eligibilityResolution?.selectionStatus).toBe('NOT_STARTED');
  });
});
