import { describe, expect, it } from 'vitest';
import {
  evaluateRule4Empty,
  evaluateRule4ShadowBundle,
} from '../../packages/clinical-contracts/src/rule4/evaluator.js';
import { RULE4_CONTRACT_VERSION_PHASE6_STRUCTURED_SEVERITY } from '../../packages/clinical-contracts/src/rule4/version.js';
import { RULE4_CONTRACT_VERSION_PHASE2 } from '../../packages/clinical-contracts/src/rule4/version.js';

const RULESET = 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469';

const shadowBase = {
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
    verifiedDateOfBirth: '1990-01-01',
    consultationAssessmentDate: '2026-01-01',
  },
  patientWideSafety: {},
  structuredEvidenceItemIds: [],
};

const severityAdapter = {
  contractVersion: RULE4_CONTRACT_VERSION_PHASE6_STRUCTURED_SEVERITY,
  rulesetVersion: RULESET,
  registryVersion: 'rule4-reason-codes-phase6-structured-severity-subset-v1',
  label: 'SYNTHETIC' as const,
  trustedSyntheticBindingBypass: true,
  formulaSlotIds: ['s1'],
  formulaSeverityRecords: [
    {
      formulaSlotId: 's1',
      formulaTargetId: 't1',
      targetRole: 'STANDARD_FORMULA_TARGET' as const,
      severityEvidenceAssertions: [
        {
          evidenceItemId: 'e1',
          severityScore: 5,
          severityBand: 'MODERATE' as const,
          sourceTier: 'DOCTOR_STRUCTURED' as const,
          dedupeKey: 'd1',
          sequenceToken: 't1',
        },
      ],
    },
  ],
};

describe('Rule 4 Phase 6 shadow/public equivalence', () => {
  it('public Rule4Result unchanged when severityAdapter supplied in shadow', () => {
    const shadowWithout = evaluateRule4ShadowBundle(shadowBase);
    const shadowWith = evaluateRule4ShadowBundle({
      ...shadowBase,
      severityAdapter,
    });
    expect(shadowWith.result.deterministicFingerprint).toBe(
      shadowWithout.result.deterministicFingerprint,
    );
    expect(JSON.stringify(shadowWith.result)).not.toContain('severityResolution');
  });

  it('severityResolution only on internal bundle', () => {
    const bundle = evaluateRule4ShadowBundle({ ...shadowBase, severityAdapter });
    expect(bundle.severityResolution).not.toBeNull();
    expect(bundle.severityResolution?.slotResolutions[0]?.severityStatus).toBe('NOT_EVALUATED');
    expect('severityResolution' in bundle.result).toBe(false);
  });

  it('active mode remains blocked', () => {
    expect(() => evaluateRule4Empty({ ...shadowBase, engineMode: 'active' })).toThrow();
  });
});
