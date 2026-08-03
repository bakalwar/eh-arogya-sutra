import { describe, expect, it } from 'vitest';
import type { Rule4EvidenceAdapterOutput } from '../../packages/clinical-contracts/src/rule4/evidence/types.js';
import { evaluatePhaseAdapter } from '../../packages/clinical-contracts/src/rule4/phase/evaluatePhaseAdapter.js';
import { RULE4_CONTRACT_VERSION_PHASE5_STRUCTURED_PHASE } from '../../packages/clinical-contracts/src/rule4/version.js';
import { evaluateRule4ShadowBundle } from '../../packages/clinical-contracts/src/rule4/evaluator.js';

const RULESET = 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469';
const REGISTRY = 'rule4-reason-codes-phase5-structured-phase-subset-v1';

const basePhaseRecord = {
  formulaSlotId: 's1',
  formulaTargetId: 't1',
  targetRole: 'STANDARD_FORMULA_TARGET' as const,
  rawDurationDays: 10,
  phaseEvidenceAssertions: [],
};

function phaseInput(overrides: Partial<Parameters<typeof evaluatePhaseAdapter>[0]> = {}) {
  return {
    contractVersion: RULE4_CONTRACT_VERSION_PHASE5_STRUCTURED_PHASE,
    rulesetVersion: RULESET,
    registryVersion: REGISTRY,
    label: 'SYNTHETIC' as const,
    formulaSlotIds: ['s1'],
    formulaPhaseRecords: [basePhaseRecord],
    ...overrides,
  };
}

function evidenceAdapter(
  pools: Array<{
    formulaSlotId: string;
    formulaTargetId: string;
    usableFindingIds: string[];
  }>,
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
      corroborationDistinctParentCount: p.usableFindingIds.length > 0 ? 1 : 0,
      corroboratingParentSourceIds: p.usableFindingIds.length > 0 ? ['ps1'] : [],
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

describe('Rule 4 Phase 5 binding gate', () => {
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
      phaseAdapter: phaseInput({ trustedSyntheticBindingBypass: true }),
    });
    expect(bundle.phaseResolution?.slotResolutions[0]?.phaseStatus).toBe('NOT_EVALUATED');
  });

  it('production rejects bypass flag', () => {
    expect(() =>
      evaluatePhaseAdapter(
        phaseInput({ label: 'PRODUCTION', trustedSyntheticBindingBypass: true }),
      ),
    ).toThrow();
  });

  it('exact slot and target with usable evidence resolves phase', () => {
    const out = evaluatePhaseAdapter(phaseInput(), {
      bindingGateMandatory: true,
      evidenceAdapter: evidenceAdapter([
        { formulaSlotId: 's1', formulaTargetId: 't1', usableFindingIds: ['f1'] },
      ]),
    });
    expect(out.slotResolutions[0]?.phaseStatus).toBe('RESOLVED_BY_DAY_BAND');
    expect(out.slotResolutions[0]?.resolvedPhase).toBe('ACUTE');
  });

  it('slot match but target mismatch is blocked', () => {
    const out = evaluatePhaseAdapter(phaseInput(), {
      bindingGateMandatory: true,
      evidenceAdapter: evidenceAdapter([
        { formulaSlotId: 's1', formulaTargetId: 't-other', usableFindingIds: ['f1'] },
      ]),
    });
    expect(out.slotResolutions[0]?.phaseStatus).toBe('NOT_EVALUATED');
    expect(out.slotResolutions[0]?.reasonCodes).toContain('CROSS_FORMULA_PHASE_LEAKAGE_BLOCKED');
  });

  it('target match but slot mismatch is blocked', () => {
    const out = evaluatePhaseAdapter(phaseInput(), {
      bindingGateMandatory: true,
      evidenceAdapter: evidenceAdapter([
        { formulaSlotId: 's-other', formulaTargetId: 't1', usableFindingIds: ['f1'] },
      ]),
    });
    expect(out.slotResolutions[0]?.phaseStatus).toBe('NOT_EVALUATED');
    expect(out.slotResolutions[0]?.reasonCodes).toContain('RULE3_BINDING_PORT_NOT_RESOLVED');
  });

  it('sibling slot evidence does not resolve target slot', () => {
    const out = evaluatePhaseAdapter(
      phaseInput({
        formulaSlotIds: ['s1', 's2'],
        formulaPhaseRecords: [
          basePhaseRecord,
          { ...basePhaseRecord, formulaSlotId: 's2', formulaTargetId: 't2' },
        ],
      }),
      {
        bindingGateMandatory: true,
        evidenceAdapter: evidenceAdapter([
          { formulaSlotId: 's2', formulaTargetId: 't2', usableFindingIds: ['f1'] },
        ]),
      },
    );
    expect(out.slotResolutions[0]?.phaseStatus).toBe('NOT_EVALUATED');
    expect(out.slotResolutions[1]?.phaseStatus).toBe('RESOLVED_BY_DAY_BAND');
  });

  it('missing evidence adapter collapses to NOT_EVALUATED', () => {
    const out = evaluatePhaseAdapter(phaseInput(), { bindingGateMandatory: true });
    expect(out.slotResolutions[0]?.phaseStatus).toBe('NOT_EVALUATED');
    expect(out.slotResolutions[0]?.reasonCodes).toContain('RULE3_BINDING_PORT_NOT_RESOLVED');
  });

  it('empty usable evidence collapses to NOT_EVALUATED', () => {
    const out = evaluatePhaseAdapter(phaseInput(), {
      bindingGateMandatory: true,
      evidenceAdapter: evidenceAdapter([
        { formulaSlotId: 's1', formulaTargetId: 't1', usableFindingIds: [] },
      ]),
    });
    expect(out.slotResolutions[0]?.phaseStatus).toBe('NOT_EVALUATED');
  });

  it('valid slot resolves independently when sibling lacks binding', () => {
    const out = evaluatePhaseAdapter(
      phaseInput({
        formulaSlotIds: ['s1', 's2'],
        formulaPhaseRecords: [
          basePhaseRecord,
          { ...basePhaseRecord, formulaSlotId: 's2', formulaTargetId: 't2' },
        ],
      }),
      {
        bindingGateMandatory: true,
        evidenceAdapter: evidenceAdapter([
          { formulaSlotId: 's1', formulaTargetId: 't1', usableFindingIds: ['f1'] },
        ]),
      },
    );
    expect(out.slotResolutions[0]?.phaseStatus).toBe('RESOLVED_BY_DAY_BAND');
    expect(out.slotResolutions[1]?.phaseStatus).toBe('NOT_EVALUATED');
  });

  it('cross-formula leakage reason on target mismatch', () => {
    const out = evaluatePhaseAdapter(phaseInput(), {
      bindingGateMandatory: true,
      evidenceAdapter: evidenceAdapter([
        { formulaSlotId: 's1', formulaTargetId: 't-wrong', usableFindingIds: ['f1'] },
      ]),
    });
    expect(out.slotResolutions[0]?.reasonCodes).toContain('CROSS_FORMULA_PHASE_LEAKAGE_BLOCKED');
  });
});
