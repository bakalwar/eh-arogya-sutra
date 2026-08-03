import { describe, expect, it } from 'vitest';
import type { Rule4EvidenceAdapterOutput } from '../../packages/clinical-contracts/src/rule4/evidence/types.js';
import { evaluateRule4ShadowBundle } from '../../packages/clinical-contracts/src/rule4/evaluator.js';
import { evaluateSeverityAdapter } from '../../packages/clinical-contracts/src/rule4/severity/evaluateSeverityAdapter.js';
import { RULE4_CONTRACT_VERSION_PHASE6_STRUCTURED_SEVERITY } from '../../packages/clinical-contracts/src/rule4/version.js';

const RULESET = 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469';
const REGISTRY = 'rule4-reason-codes-phase6-structured-severity-subset-v1';

const baseRecord = {
  formulaSlotId: 's1',
  formulaTargetId: 't1',
  targetRole: 'STANDARD_FORMULA_TARGET' as const,
  severityEvidenceAssertions: [
    {
      evidenceItemId: 'e1',
      severityScore: 5,
      severityBand: 'MODERATE',
      sourceTier: 'DOCTOR_STRUCTURED' as const,
      dedupeKey: 'd1',
      sequenceToken: 't1',
      parentSourceId: 'ps-doc',
    },
  ],
};

function severityInput(overrides: Partial<Parameters<typeof evaluateSeverityAdapter>[0]> = {}) {
  return {
    contractVersion: RULE4_CONTRACT_VERSION_PHASE6_STRUCTURED_SEVERITY,
    rulesetVersion: RULESET,
    registryVersion: REGISTRY,
    label: 'SYNTHETIC' as const,
    formulaSlotIds: ['s1'],
    formulaSeverityRecords: [baseRecord],
    ...overrides,
  };
}

function evidenceAdapter(
  pools: Array<{ formulaSlotId: string; formulaTargetId: string; usableFindingIds: string[] }>,
): Rule4EvidenceAdapterOutput {
  return {
    contractVersion: 'ehas2-rule4-contract-v1-phase3-evidence',
    rulesetVersion: RULESET,
    registryVersion: 'rule4-reason-codes-phase3-evidence-subset-v1',
    dataAssetVersion: null,
    executionStatus: 'NOT_IMPLEMENTED',
    currentRuntimePotencyDelta: 'NONE',
    registryQ16SelectorStatus: 'NOT_EXECUTABLE_AS_Q16_SELECTOR',
    documentGateResults: [],
    itemGateResults: [],
    ignoredAudit: [],
    dedupeSupersession: [],
    formulaBoundPools: pools.map((p) => ({
      formulaSlotId: p.formulaSlotId,
      formulaTargetId: p.formulaTargetId,
      usableFindingIds: p.usableFindingIds,
      ignoredFindingIds: [],
      corroborationDistinctParentCount: 1,
      corroboratingParentSourceIds: ['ps1'],
      contradiction: {
        evidenceStatus: 'CLEAR',
        doctorReviewRequired: true,
        reasonCodes: [],
        limitationCodes: [],
      },
    })),
    reasonCodes: [],
    limitationCodes: [],
    deterministicEvidencePoolFingerprint: 'test',
    quarantineReasonCodes: [],
  };
}

describe('Rule 4 Phase 6 binding gate', () => {
  it('shadow bundle ignores synthetic bypass', () => {
    const bundle = evaluateRule4ShadowBundle({
      contractVersion: 'ehas2-rule4-contract-v1-phase2-safety',
      caseId: null,
      consultationId: null,
      rulesetVersion: RULESET,
      engineMode: 'shadow',
      label: 'SYNTHETIC',
      formulaSlots: [
        {
          formulaSlotId: 's1',
          formulaTargetId: 't1',
          structuredEvidenceItemIds: [],
          polarityRef: null,
          organTargetRef: null,
          temperamentRef: null,
          phaseRef: null,
          severityRef: null,
        },
      ],
      verifiedAge: {
        ageYears: 30,
        verificationStatus: 'VERIFIED',
        verifiedDateOfBirth: '1990-01-01',
        consultationAssessmentDate: '2026-01-01',
      },
      patientWideSafety: {},
      structuredEvidenceItemIds: [],
      severityAdapter: severityInput({ trustedSyntheticBindingBypass: true }),
    });
    expect(bundle.severityResolution?.slotResolutions[0]?.severityStatus).toBe('NOT_EVALUATED');
  });

  it('production rejects bypass flag', () => {
    expect(() =>
      evaluateSeverityAdapter(
        severityInput({ label: 'PRODUCTION', trustedSyntheticBindingBypass: true }),
      ),
    ).toThrow();
  });

  it('exact slot and target with usable evidence resolves severity', () => {
    const out = evaluateSeverityAdapter(severityInput(), {
      bindingGateMandatory: true,
      evidenceAdapter: evidenceAdapter([
        { formulaSlotId: 's1', formulaTargetId: 't1', usableFindingIds: ['f1'] },
      ]),
    });
    expect(out.slotResolutions[0]?.severityStatus).toBe('RESOLVED_NUMERIC');
    expect(out.slotResolutions[0]?.severityScore).toBe(5);
  });
});
