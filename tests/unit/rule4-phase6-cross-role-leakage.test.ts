import { describe, expect, it } from 'vitest';
import { evaluateSeverityAdapter } from '../../packages/clinical-contracts/src/rule4/severity/evaluateSeverityAdapter.js';
import { RULE4_CONTRACT_VERSION_PHASE6_STRUCTURED_SEVERITY } from '../../packages/clinical-contracts/src/rule4/version.js';

const RULESET = 'ehas2-rule4-ruleset-v1-frozen-doc-4c35469';
const REGISTRY = 'rule4-reason-codes-phase6-structured-severity-subset-v1';

function doc(
  score: number | null,
  band: 'LOW' | 'MODERATE' | 'HIGH' | null,
  id: string,
  extra: Record<string, unknown> = {},
) {
  return {
    evidenceItemId: id,
    severityScore: score,
    severityBand: band,
    sourceTier: 'DOCTOR_STRUCTURED' as const,
    dedupeKey: `d-${id}`,
    sequenceToken: 't1',
    parentSourceId: 'ps-doc',
    ...extra,
  };
}

function baseInput(
  records: Parameters<typeof evaluateSeverityAdapter>[0]['formulaSeverityRecords'],
  slotIds: string[],
) {
  return {
    contractVersion: RULE4_CONTRACT_VERSION_PHASE6_STRUCTURED_SEVERITY,
    rulesetVersion: RULESET,
    registryVersion: REGISTRY,
    label: 'SYNTHETIC' as const,
    trustedSyntheticBindingBypass: true,
    formulaSlotIds: slotIds,
    formulaSeverityRecords: records,
  };
}

function slot(out: ReturnType<typeof evaluateSeverityAdapter>, id: string) {
  const s = out.slotResolutions.find((r) => r.formulaSlotId === id);
  if (!s) throw new Error(`missing slot ${id}`);
  return s;
}

function evalBypass(input: Parameters<typeof evaluateSeverityAdapter>[0]) {
  return evaluateSeverityAdapter(input, { bindingGateMandatory: false });
}

describe('Rule 4 Phase 6 acute/chronic cross-role leakage guard', () => {
  it('1 proper flare assertion in flare slot resolves independently', () => {
    const out = evalBypass(
      baseInput(
        [
          {
            formulaSlotId: 'flare',
            formulaTargetId: 't-flare',
            targetRole: 'CURRENT_ACUTE_FLARE',
            severityEvidenceAssertions: [doc(8, 'HIGH', 'ef')],
          },
        ],
        ['flare'],
      ),
    );
    expect(slot(out, 'flare').severityStatus).toBe('RESOLVED_NUMERIC');
    expect(slot(out, 'flare').severityScore).toBe(8);
  });

  it('2 proper chronic assertion in chronic slot resolves independently', () => {
    const out = evalBypass(
      baseInput(
        [
          {
            formulaSlotId: 'chronic',
            formulaTargetId: 't-chronic',
            targetRole: 'UNDERLYING_CHRONIC_TARGET',
            severityEvidenceAssertions: [doc(4, 'MODERATE', 'ec')],
          },
        ],
        ['chronic'],
      ),
    );
    expect(slot(out, 'chronic').severityStatus).toBe('RESOLVED_NUMERIC');
    expect(slot(out, 'chronic').severityScore).toBe(4);
  });

  it('3 flare evidence copied to chronic slot blocks chronic, preserves flare', () => {
    const out = evalBypass(
      baseInput(
        [
          {
            formulaSlotId: 'flare',
            formulaTargetId: 't-flare',
            targetRole: 'CURRENT_ACUTE_FLARE',
            severityEvidenceAssertions: [doc(8, 'HIGH', 'shared')],
          },
          {
            formulaSlotId: 'chronic',
            formulaTargetId: 't-chronic',
            targetRole: 'UNDERLYING_CHRONIC_TARGET',
            severityEvidenceAssertions: [
              doc(8, 'HIGH', 'shared', { boundTargetRole: 'CURRENT_ACUTE_FLARE' }),
            ],
          },
        ],
        ['flare', 'chronic'],
      ),
    );
    expect(slot(out, 'flare').severityStatus).toBe('RESOLVED_NUMERIC');
    expect(slot(out, 'chronic').severityStatus).toBe('NOT_EVALUATED');
    expect(slot(out, 'chronic').reasonCodes).toContain(
      'CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_BLOCKED',
    );
  });

  it('4 chronic evidence copied to flare slot blocks flare, preserves chronic', () => {
    const out = evalBypass(
      baseInput(
        [
          {
            formulaSlotId: 'chronic',
            formulaTargetId: 't-chronic',
            targetRole: 'UNDERLYING_CHRONIC_TARGET',
            severityEvidenceAssertions: [doc(4, 'MODERATE', 'shared2')],
          },
          {
            formulaSlotId: 'flare',
            formulaTargetId: 't-flare',
            targetRole: 'CURRENT_ACUTE_FLARE',
            severityEvidenceAssertions: [
              doc(4, 'MODERATE', 'shared2', { boundTargetRole: 'UNDERLYING_CHRONIC_TARGET' }),
            ],
          },
        ],
        ['flare', 'chronic'],
      ),
    );
    expect(slot(out, 'chronic').severityStatus).toBe('RESOLVED_NUMERIC');
    expect(slot(out, 'flare').severityStatus).toBe('NOT_EVALUATED');
    expect(slot(out, 'flare').reasonCodes).toContain(
      'CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_BLOCKED',
    );
  });

  it('5 same evidence ID in both roles without authoritative role blocks both', () => {
    const out = evalBypass(
      baseInput(
        [
          {
            formulaSlotId: 'flare',
            formulaTargetId: 't-flare',
            targetRole: 'CURRENT_ACUTE_FLARE',
            severityEvidenceAssertions: [doc(7, 'HIGH', 'dup')],
          },
          {
            formulaSlotId: 'chronic',
            formulaTargetId: 't-chronic',
            targetRole: 'UNDERLYING_CHRONIC_TARGET',
            severityEvidenceAssertions: [doc(7, 'HIGH', 'dup')],
          },
        ],
        ['flare', 'chronic'],
      ),
    );
    expect(slot(out, 'flare').severityStatus).toBe('NOT_EVALUATED');
    expect(slot(out, 'chronic').severityStatus).toBe('NOT_EVALUATED');
    expect(slot(out, 'flare').reasonCodes).toContain(
      'CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_BLOCKED',
    );
    expect(slot(out, 'chronic').reasonCodes).toContain(
      'CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_BLOCKED',
    );
  });

  it('6 patient-global maximum uses GLOBAL not cross-acute code', () => {
    const out = evalBypass(
      baseInput(
        [
          {
            formulaSlotId: 'flare',
            formulaTargetId: 't-flare',
            targetRole: 'CURRENT_ACUTE_FLARE',
            patientGlobalMaxSeverityLabelOnly: true,
            severityEvidenceAssertions: [],
          },
        ],
        ['flare'],
      ),
    );
    expect(slot(out, 'flare').severityStatus).toBe('SEVERITY_CONTRADICTORY');
    expect(slot(out, 'flare').reasonCodes).toContain('GLOBAL_SEVERITY_LEAKAGE_BLOCKED');
    expect(slot(out, 'flare').reasonCodes).not.toContain(
      'CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_BLOCKED',
    );
  });

  it('7 separate valid evidence IDs for flare/chronic both resolve', () => {
    const out = evalBypass(
      baseInput(
        [
          {
            formulaSlotId: 'flare',
            formulaTargetId: 't-flare',
            targetRole: 'CURRENT_ACUTE_FLARE',
            severityEvidenceAssertions: [doc(8, 'HIGH', 'ef-only')],
          },
          {
            formulaSlotId: 'chronic',
            formulaTargetId: 't-chronic',
            targetRole: 'UNDERLYING_CHRONIC_TARGET',
            severityEvidenceAssertions: [doc(4, 'MODERATE', 'ec-only')],
          },
        ],
        ['flare', 'chronic'],
      ),
    );
    expect(slot(out, 'flare').severityStatus).toBe('RESOLVED_NUMERIC');
    expect(slot(out, 'chronic').severityStatus).toBe('RESOLVED_NUMERIC');
  });

  it('8 cross-role blocked sibling does not erase valid standard formula slot', () => {
    const out = evalBypass(
      baseInput(
        [
          {
            formulaSlotId: 's1',
            formulaTargetId: 't1',
            targetRole: 'STANDARD_FORMULA_TARGET',
            severityEvidenceAssertions: [doc(5, 'MODERATE', 'std')],
          },
          {
            formulaSlotId: 'flare',
            formulaTargetId: 't-flare',
            targetRole: 'CURRENT_ACUTE_FLARE',
            severityEvidenceAssertions: [doc(8, 'HIGH', 'dup-x')],
          },
          {
            formulaSlotId: 'chronic',
            formulaTargetId: 't-chronic',
            targetRole: 'UNDERLYING_CHRONIC_TARGET',
            severityEvidenceAssertions: [doc(8, 'HIGH', 'dup-x')],
          },
        ],
        ['s1', 'flare', 'chronic'],
      ),
    );
    expect(slot(out, 's1').severityStatus).toBe('RESOLVED_NUMERIC');
    expect(slot(out, 'flare').severityStatus).toBe('NOT_EVALUATED');
    expect(slot(out, 'chronic').severityStatus).toBe('NOT_EVALUATED');
  });

  it('missing boundTargetRole on flare in PRODUCTION fails closed', () => {
    const out = evaluateSeverityAdapter(
      {
        ...baseInput(
          [
            {
              formulaSlotId: 'flare',
              formulaTargetId: 't-flare',
              targetRole: 'CURRENT_ACUTE_FLARE',
              severityEvidenceAssertions: [doc(8, 'HIGH', 'e1')],
            },
          ],
          ['flare'],
        ),
        label: 'PRODUCTION',
        trustedSyntheticBindingBypass: undefined,
      },
      { bindingGateMandatory: false },
    );
    expect(slot(out, 'flare').severityStatus).toBe('NOT_EVALUATED');
    expect(slot(out, 'flare').severityScore).toBeNull();
    expect(slot(out, 'flare').reasonCodes).toContain('TARGET_BINDING_MISSING');
  });

  it('invalid boundTargetRole fails validation', () => {
    expect(() =>
      evaluateSeverityAdapter(
        baseInput(
          [
            {
              formulaSlotId: 'flare',
              formulaTargetId: 't-flare',
              targetRole: 'CURRENT_ACUTE_FLARE',
              severityEvidenceAssertions: [
                doc(8, 'HIGH', 'e1', {
                  boundTargetRole: 'NOT_A_REAL_ROLE' as unknown as 'CURRENT_ACUTE_FLARE',
                }),
              ],
            },
          ],
          ['flare'],
        ),
      ),
    ).toThrow(/RULE4_SEVERITY_BOUND_TARGET_ROLE_INVALID/);
  });

  it('emits CROSS_ACUTE_CHRONIC from implementation not registry-only', () => {
    const out = evalBypass(
      baseInput(
        [
          {
            formulaSlotId: 'chronic',
            formulaTargetId: 't-chronic',
            targetRole: 'UNDERLYING_CHRONIC_TARGET',
            severityEvidenceAssertions: [
              doc(5, 'MODERATE', 'e1', { boundTargetRole: 'CURRENT_ACUTE_FLARE' }),
            ],
          },
        ],
        ['chronic'],
      ),
    );
    expect(out.reasonCodes).toContain('CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_BLOCKED');
  });
});

describe('Rule 4 Phase 6 binding slot mismatch', () => {
  it('record slot A with evidence pool on slot B blocks slot A', () => {
    const out = evaluateSeverityAdapter(
      {
        ...baseInput(
          [
            {
              formulaSlotId: 's-a',
              formulaTargetId: 't1',
              targetRole: 'STANDARD_FORMULA_TARGET',
              severityEvidenceAssertions: [doc(5, 'MODERATE', 'e1')],
            },
          ],
          ['s-a'],
        ),
        trustedSyntheticBindingBypass: false,
      },
      {
        bindingGateMandatory: true,
        evidenceAdapter: {
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
          formulaBoundPools: [
            {
              formulaSlotId: 's-b',
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
          reasonCodes: [],
          limitationCodes: [],
          deterministicEvidencePoolFingerprint: 'test',
          quarantineReasonCodes: [],
        },
      },
    );
    expect(slot(out, 's-a').severityStatus).toBe('NOT_EVALUATED');
    expect(slot(out, 's-a').severityScore).toBeNull();
    expect(slot(out, 's-a').reasonCodes).toContain('RULE3_BINDING_PORT_NOT_RESOLVED');
  });
});

describe('Rule 4 Phase 6 registry emission', () => {
  it('includes cross-acute reason in Phase 6 subset', async () => {
    const { RULE4_PHASE6_REASON_CODE_REGISTRY } =
      await import('../../packages/clinical-contracts/src/rule4/reasonCodesPhase6.js');
    expect(
      RULE4_PHASE6_REASON_CODE_REGISTRY.some(
        (e) => e.code === 'CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_BLOCKED',
      ),
    ).toBe(true);
  });
});
