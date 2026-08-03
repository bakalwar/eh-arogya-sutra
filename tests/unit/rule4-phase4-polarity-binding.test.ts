import { describe, expect, it } from 'vitest';
import {
  evaluatePolarityAdapter,
  evaluateRule4ShadowBundle,
  Rule4PolarityAdapterValidationError,
  RULE4_CONTRACT_VERSION_PHASE4_POLARITY,
  RULE4_CONTRACT_VERSION_PHASE2,
  RULE4_REGISTRY_PHASE4_VERSION,
} from '../../packages/clinical-contracts/src/rule4/index.js';

const RULESET = 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469';

const shadowBase = {
  contractVersion: RULE4_CONTRACT_VERSION_PHASE2,
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
    ageYears: null,
    verificationStatus: 'VERIFIED' as const,
    verifiedDateOfBirth: '1990-01-01',
    consultationAssessmentDate: '2026-01-01',
  },
  patientWideSafety: {},
  structuredEvidenceItemIds: [],
  bpReadings: [],
};

const basePolarityRecord = {
  formulaSlotId: 's1',
  formulaTargetId: 't1',
  rule2RecordId: 'r2-1',
  diseasePolarity: 'POSITIVE',
  requiredTherapeuticPolarity: 'NEGATIVE',
  resolutionStatus: 'RESOLVED',
};

function polarityInput(
  overrides: Record<string, unknown> = {},
): import('../../packages/clinical-contracts/src/rule4/polarity/types.js').Rule4PolarityAdapterInput {
  return {
    contractVersion: RULE4_CONTRACT_VERSION_PHASE4_POLARITY,
    rulesetVersion: RULESET,
    registryVersion: RULE4_REGISTRY_PHASE4_VERSION,
    label: 'SYNTHETIC',
    formulaSlotIds: ['s1'],
    formulaPolarities: [basePolarityRecord],
    ...overrides,
  } as import('../../packages/clinical-contracts/src/rule4/polarity/types.js').Rule4PolarityAdapterInput;
}

const evidenceExact = {
  formulaBoundPools: [
    {
      formulaSlotId: 's1',
      formulaTargetId: 't1',
      usableFindingIds: ['f1'],
      ignoredFindingIds: [],
      corroborationDistinctParentCount: 1,
      corroboratingParentSourceIds: ['ps1'],
      contradiction: {
        evidenceStatus: 'CLEAR',
        doctorReviewRequired: true,
        reasonCodes: [],
        limitationCodes: [],
      },
    },
  ],
} as const;

describe('Rule 4 Phase 4 binding gate regressions', () => {
  it('1 shadow polarity without evidence → no GROUP', () => {
    const bundle = evaluateRule4ShadowBundle({
      ...shadowBase,
      polarityAdapter: polarityInput(),
    });
    expect(bundle.polarityRouting?.slotRoutings[0]?.pathway).toBe('NOT_EVALUATED');
  });

  it('2 PRODUCTION label without evidence → fail closed', () => {
    const out = evaluatePolarityAdapter(polarityInput({ label: 'PRODUCTION' }));
    expect(out.slotRoutings[0]?.pathway).toBe('NOT_EVALUATED');
    expect(out.slotRoutings[0]?.reasonCodes).toContain('PRODUCTION_POLARITY_ROUTING_NOT_CONNECTED');
  });

  it('3 PRODUCTION label with synthetic bypass → validation error', () => {
    expect(() =>
      evaluatePolarityAdapter(
        polarityInput({ label: 'PRODUCTION', trustedSyntheticBindingBypass: true }),
      ),
    ).toThrow(Rule4PolarityAdapterValidationError);
  });

  it('4 SYNTHETIC without bypass and without evidence → no GROUP', () => {
    const out = evaluatePolarityAdapter(polarityInput(), { bindingGateMandatory: true });
    expect(out.slotRoutings[0]?.pathway).toBe('NOT_EVALUATED');
  });

  it('5 SYNTHETIC with explicit bypass → GROUP allowed', () => {
    const out = evaluatePolarityAdapter(polarityInput({ trustedSyntheticBindingBypass: true }), {
      bindingGateMandatory: false,
    });
    expect(out.slotRoutings[0]?.pathway).toBe('POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP');
    expect(out.limitationCodes).toContain('TRUSTED_SYNTHETIC_BINDING_BYPASS_TEST_ONLY');
  });

  it('6 evidence slot matches but target mismatches → no GROUP', () => {
    const out = evaluatePolarityAdapter(polarityInput(), {
      bindingGateMandatory: true,
      evidenceAdapter: {
        ...evidenceExact,
        formulaBoundPools: [
          {
            ...evidenceExact.formulaBoundPools[0],
            formulaTargetId: 't-other',
          },
        ],
      } as never,
    });
    expect(out.slotRoutings[0]?.pathway).toBe('NOT_EVALUATED');
    expect(out.slotRoutings[0]?.reasonCodes).toContain('CROSS_FORMULA_POLARITY_LEAKAGE_BLOCKED');
  });

  it('7 valid evidence and exact Rule 2 binding → GROUP', () => {
    const out = evaluatePolarityAdapter(polarityInput(), {
      bindingGateMandatory: true,
      evidenceAdapter: evidenceExact as never,
    });
    expect(out.slotRoutings[0]?.pathway).toBe('POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP');
  });

  it('8 valid slot + unresolved sibling', () => {
    const out = evaluatePolarityAdapter(
      polarityInput({
        formulaSlotIds: ['s-ok', 's-un'],
        formulaPolarities: [
          {
            formulaSlotId: 's-ok',
            formulaTargetId: 't-ok',
            rule2RecordId: 'r2-ok',
            diseasePolarity: 'POSITIVE',
            requiredTherapeuticPolarity: 'NEGATIVE',
            resolutionStatus: 'RESOLVED',
          },
          {
            formulaSlotId: 's-un',
            formulaTargetId: 't-un',
            rule2RecordId: 'r2-un',
            diseasePolarity: 'UNRESOLVED',
            requiredTherapeuticPolarity: 'NEUTRAL',
            resolutionStatus: 'UNRESOLVED',
          },
        ],
        trustedSyntheticBindingBypass: true,
      }),
      { bindingGateMandatory: false },
    );
    expect(out.slotRoutings.find((r) => r.formulaSlotId === 's-ok')?.pathway).toBe(
      'POSITIVE_DISEASE_NEGATIVE_THERAPEUTIC_GROUP',
    );
    expect(out.slotRoutings.find((r) => r.formulaSlotId === 's-un')?.pathway).toBe(
      'UNRESOLVED_NO_CASCADE',
    );
  });

  it('9 cross-slot evidence leakage → receiving slot not GROUP routed', () => {
    const out = evaluatePolarityAdapter(
      polarityInput({
        formulaSlotIds: ['s-only'],
        formulaPolarities: [
          {
            ...basePolarityRecord,
            formulaSlotId: 's-only',
            rule2RecordId: 'r2-only',
          },
        ],
      }),
      {
        bindingGateMandatory: true,
        evidenceAdapter: {
          formulaBoundPools: [
            {
              formulaSlotId: 's-other',
              formulaTargetId: 't1',
              usableFindingIds: ['f1'],
              ignoredFindingIds: [],
              corroborationDistinctParentCount: 1,
              corroboratingParentSourceIds: [],
              contradiction: {
                evidenceStatus: 'CLEAR',
                doctorReviewRequired: true,
                reasonCodes: [],
                limitationCodes: [],
              },
            },
          ],
        } as never,
      },
    );
    expect(out.slotRoutings[0]?.pathway).toBe('NOT_EVALUATED');
  });

  it('10 safety hold wins over valid evidence/polarity', () => {
    const out = evaluatePolarityAdapter(polarityInput(), {
      bindingGateMandatory: true,
      evidenceAdapter: evidenceExact as never,
      safetyGate: {
        patientWideHold: true,
        d13HardStopActive: false,
        reasonCodes: [],
        limitationCodes: ['PHASE2_NO_POTENCY_CASCADE'],
      } as never,
    });
    expect(out.slotRoutings[0]?.pathway).toBe('BLOCKED_BY_SAFETY_GATE');
  });

  it('11 D13 hard stop wins', () => {
    const out = evaluatePolarityAdapter(polarityInput(), {
      bindingGateMandatory: true,
      evidenceAdapter: evidenceExact as never,
      safetyGate: {
        patientWideHold: false,
        d13HardStopActive: true,
        reasonCodes: [],
        limitationCodes: ['PHASE2_NO_POTENCY_CASCADE'],
      } as never,
    });
    expect(out.slotRoutings[0]?.pathway).toBe('BLOCKED_BY_SAFETY_GATE');
  });

  it('12 shadow bundle ignores synthetic bypass on polarity input', () => {
    const bundle = evaluateRule4ShadowBundle({
      ...shadowBase,
      polarityAdapter: polarityInput({ trustedSyntheticBindingBypass: true }),
    });
    expect(bundle.polarityRouting?.slotRoutings[0]?.pathway).toBe('NOT_EVALUATED');
  });
});
