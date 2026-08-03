import { describe, expect, it } from 'vitest';
import { evaluateEligibilityAdapter } from '../../packages/clinical-contracts/src/rule4/eligibility/evaluateEligibilityAdapter.js';
import { rule4CandidateEligibilityFingerprintV1Hash } from '../../packages/clinical-contracts/src/rule4/eligibility/eligibilityFingerprintV1.js';
import { RULE4_CONTRACT_VERSION_PHASE7_CANDIDATE_ELIGIBILITY } from '../../packages/clinical-contracts/src/rule4/version.js';

const RULESET = 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469';
const REG = 'rule4-reason-codes-phase7-candidate-eligibility-subset-v1';

describe('Rule 4 Phase 7 fingerprint collision', () => {
  it('different gate outcomes produce different fingerprints', () => {
    const baseContext = {
      polarityRouting: {
        slotRoutings: [
          {
            formulaSlotId: 's1',
            formulaTargetId: 't1',
            rule2RecordId: 'r1',
            diseasePolarity: 'NEGATIVE',
            requiredTherapeuticPolarity: 'POSITIVE',
            resolutionStatus: 'RESOLVED',
            pathway: 'NEGATIVE_DISEASE_POSITIVE_THERAPEUTIC_GROUP',
            potencyStatus: 'NOT_EVALUATED',
            selectedCascade: null,
            selectedDilution: null,
            reasonCodes: [],
            limitationCodes: [],
          },
        ],
      },
      severityResolution: {
        slotResolutions: [
          {
            formulaSlotId: 's1',
            formulaTargetId: 't1',
            targetRole: 'STANDARD_FORMULA_TARGET',
            severityStatus: 'RESOLVED_NUMERIC',
            severityScore: 4,
            severityBand: 'MODERATE',
            severityResolutionSource: 'DOCTOR_STRUCTURED',
            bindingStatus: 'BOUND',
            evidenceItemIds: ['e1'],
            corroboratingSourceIds: [],
            selectedCascade: null,
            selectedDilution: null,
            reasonCodes: [],
            limitationCodes: [],
            upstreamContextStatus: 'NOT_EVALUATED',
          },
        ],
      },
    };

    const inputA = {
      contractVersion: RULE4_CONTRACT_VERSION_PHASE7_CANDIDATE_ELIGIBILITY,
      rulesetVersion: RULESET,
      registryVersion: REG,
      label: 'SYNTHETIC' as const,
      trustedSyntheticEligibilityBypass: true,
      formulaSlotIds: ['s1'],
      formulaEligibilityRecords: [
        {
          formulaSlotId: 's1',
          formulaTargetId: 't1',
          targetRole: 'STANDARD_FORMULA_TARGET' as const,
          commonGateBundle: {
            negComplete: true,
            posComplete: false,
            organSystemResolved: true,
            evidenceItemIds: ['e1'],
          },
          structuredHypofunctionEvidence: { pass: true, evidenceItemIds: ['e1'] },
        },
      ],
    };

    const inputB = {
      ...inputA,
      formulaEligibilityRecords: [
        {
          ...inputA.formulaEligibilityRecords[0]!,
          structuredHypofunctionEvidence: { pass: false, evidenceItemIds: [] },
        },
      ],
    };

    const outA = evaluateEligibilityAdapter(inputA, baseContext);
    const outB = evaluateEligibilityAdapter(inputB, baseContext);
    const hashA = rule4CandidateEligibilityFingerprintV1Hash({
      rulesetVersion: outA.rulesetVersion,
      registryVersion: outA.registryVersion,
      selectionStatus: outA.selectionStatus,
      slotResolutions: outA.slotResolutions,
      reasonCodes: outA.reasonCodes,
      limitationCodes: outA.limitationCodes,
    });
    const hashB = rule4CandidateEligibilityFingerprintV1Hash({
      rulesetVersion: outB.rulesetVersion,
      registryVersion: outB.registryVersion,
      selectionStatus: outB.selectionStatus,
      slotResolutions: outB.slotResolutions,
      reasonCodes: outB.reasonCodes,
      limitationCodes: outB.limitationCodes,
    });
    expect(hashA).not.toBe(hashB);
  });
});
