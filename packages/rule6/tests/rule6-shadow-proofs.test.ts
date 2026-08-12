import { describe, expect, it } from 'vitest';
import {
  RULE6_EDGE_KEY_ORDER,
  RULE6_FAILURE_CODES,
  RULE6_INPUT_CONTRACT_VERSION,
  RULE6_INPUT_KEY_ORDER,
  RULE6_OUTCOMES,
  RULE6_OUTPUT_CONTRACT_VERSION,
  RULE6_OUTPUT_KEY_ORDER,
  RULE6_RULE_IDENTITY,
  RULE6_RULE_NUMBER,
  Rule6EvaluationError,
  evaluateRule6Shadow,
  type Rule6RelationshipEdge,
} from '../src/index.ts';

function baseEdge(
  over: Partial<Rule6RelationshipEdge> &
    Pick<Rule6RelationshipEdge, 'edgeId' | 'sourceMedicineId' | 'targetMedicineIdOrSet'>,
): Rule6RelationshipEdge {
  return {
    directionality: 'UNDIRECTED',
    relationshipType: 'SYNTHETIC_REL',
    applicabilityConditions: ['COND_A'],
    prohibitionConditions: [],
    evidenceSourceId: 'EV_SYN_1',
    evidenceValidationStatus: 'approved',
    ownerClinicalApprovalStatus: 'approved',
    version: 'edge-v1',
    effectiveStatus: 'active',
    supersessionMetadata: null,
    ...over,
  };
}

function baseInput(over: Record<string, unknown> = {}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    contractVersion: RULE6_INPUT_CONTRACT_VERSION,
    requestId: 'req-synthetic-001',
    diseaseConditionRefs: ['DIS_SYN_1'],
    clinicalTargetRefs: ['COND_A'],
    rule1TemperamentRef: { refId: 'r1-ref', status: 'RESOLVED', version: 'r1-v1' },
    rule3OrganSystemRef: { refId: 'r3-ref', status: 'RESOLVED', version: 'r3-v1' },
    severityRef: { status: 'UNAVAILABLE' },
    candidateMedicinePool: ['MED_SYN_A', 'MED_SYN_B'],
    relationshipEvidenceRegistry: {
      registryVersion: 'reg-v1',
      edges: [
        baseEdge({
          edgeId: 'EDGE_SYN_1',
          sourceMedicineId: 'MED_SYN_A',
          targetMedicineIdOrSet: 'MED_SYN_B',
        }),
      ],
    },
    safetyExclusionRefs: [],
    evidenceDataVersions: {
      medicineDataVersion: 'med-v1',
      diseaseDataVersion: 'dis-v1',
      evidenceDataVersion: 'ev-v1',
      contractVersion: RULE6_INPUT_CONTRACT_VERSION,
    },
    upstreamApplicability: { status: 'APPLICABLE', notes: [] },
  };
  return { ...base, ...over };
}

function expectFail(fn: () => void, code: (typeof RULE6_FAILURE_CODES)[number]): void {
  try {
    fn();
    expect.fail('expected Rule6EvaluationError');
  } catch (e) {
    expect(e).toBeInstanceOf(Rule6EvaluationError);
    const err = e as Rule6EvaluationError;
    expect(err.failureCode).toBe(code);
    expect(err.message).toBe(code);
  }
}

function outputKeys(out: object): string[] {
  return Object.keys(out);
}

describe('Rule 6 shadow evaluator P01–P20', () => {
  it('P01 strict input schema validation', () => {
    expectFail(() => evaluateRule6Shadow({ ...baseInput(), extra: true }), 'INVALID_INPUT');
    expectFail(() => evaluateRule6Shadow('x'), 'INVALID_INPUT');
    const out = evaluateRule6Shadow(baseInput());
    expect(out.contractVersion).toBe(RULE6_OUTPUT_CONTRACT_VERSION);
  });

  it('P02 unsupported contract version', () => {
    expectFail(
      () => evaluateRule6Shadow({ ...baseInput(), contractVersion: 'ehas2-rule6-input-v0' }),
      'UNSUPPORTED_CONTRACT_VERSION',
    );
  });

  it('P03 deterministic canonical copy and non-mutation', () => {
    const input = baseInput();
    const before = JSON.stringify(input);
    const out = evaluateRule6Shadow(input);
    expect(JSON.stringify(input)).toBe(before);
    (input.candidateMedicinePool as string[]).push('MED_SYN_Z');
    expect(out.candidateEvaluations.some((c) => c.medicineId === 'MED_SYN_Z')).toBe(false);
    expect(out.candidateEvaluations).toHaveLength(2);
  });

  it('P04 deep-freeze output', () => {
    const out = evaluateRule6Shadow(baseInput());
    expect(Object.isFrozen(out)).toBe(true);
    expect(Object.isFrozen(out.candidateEvaluations)).toBe(true);
    expect(() => {
      (out as { status: string }).status = 'NOT_APPLICABLE';
    }).toThrow();
  });

  it('P05 exact output key order', () => {
    const out = evaluateRule6Shadow(baseInput());
    expect(outputKeys(out)).toEqual([...RULE6_OUTPUT_KEY_ORDER]);
    expect(RULE6_OUTPUT_KEY_ORDER).toHaveLength(18);
    expect(RULE6_INPUT_KEY_ORDER).toHaveLength(12);
    expect(RULE6_EDGE_KEY_ORDER).toHaveLength(13);
  });

  it('P06 complete supplied pool consideration', () => {
    const out = evaluateRule6Shadow(
      baseInput({ candidateMedicinePool: ['MED_SYN_B', 'MED_SYN_A', 'MED_SYN_C'] }),
    );
    const ids = out.candidateEvaluations.map((c) => c.medicineId);
    expect(ids).toEqual(['MED_SYN_A', 'MED_SYN_B', 'MED_SYN_C']);
  });

  it('P07 approved edge activation', () => {
    const out = evaluateRule6Shadow(baseInput());
    expect(out.status).toBe('SHADOW_CANDIDATES_PROPOSED');
    expect(out.selectedEligibleCandidates).toEqual(['MED_SYN_A', 'MED_SYN_B']);
    expect(out.rule9SectionFValidationRequired).toBe(true);
    expect(out.proposedCompositionCandidates.every((c) => c.rule9ValidationRequired === true)).toBe(
      true,
    );
  });

  it('P08 unvalidated edge non-activation', () => {
    const out = evaluateRule6Shadow(
      baseInput({
        relationshipEvidenceRegistry: {
          registryVersion: 'reg-v1',
          edges: [
            baseEdge({
              edgeId: 'EDGE_SYN_1',
              sourceMedicineId: 'MED_SYN_A',
              targetMedicineIdOrSet: 'MED_SYN_B',
              evidenceValidationStatus: 'unvalidated',
            }),
          ],
        },
      }),
    );
    expect(out.status).toBe('EVALUATED_NO_ELIGIBLE_CANDIDATE');
    expect(out.selectedEligibleCandidates).toEqual([]);
  });

  it('P09 stale disputed superseded edge non-activation', () => {
    for (const effectiveStatus of ['stale', 'disputed', 'superseded'] as const) {
      const out = evaluateRule6Shadow(
        baseInput({
          relationshipEvidenceRegistry: {
            registryVersion: 'reg-v1',
            edges: [
              baseEdge({
                edgeId: 'EDGE_SYN_1',
                sourceMedicineId: 'MED_SYN_A',
                targetMedicineIdOrSet: 'MED_SYN_B',
                effectiveStatus,
              }),
            ],
          },
        }),
      );
      expect(out.status).toBe('EVALUATED_NO_ELIGIBLE_CANDIDATE');
    }
  });

  it('P10 missing evidence yields NOT_EVALUABLE', () => {
    const out = evaluateRule6Shadow(
      baseInput({
        rule1TemperamentRef: { refId: 'r1-ref', status: 'NOT_EVALUABLE', version: 'r1-v1' },
      }),
    );
    expect(out.status).toBe('NOT_EVALUABLE');
    expect(out.rule9SectionFValidationRequired).toBe(false);
  });

  it('P11 contradictory evidence fail-closed', () => {
    const out = evaluateRule6Shadow(
      baseInput({
        clinicalTargetRefs: ['COND_A', 'PROHIB_X'],
        relationshipEvidenceRegistry: {
          registryVersion: 'reg-v1',
          edges: [
            baseEdge({
              edgeId: 'EDGE_SYN_1',
              sourceMedicineId: 'MED_SYN_A',
              targetMedicineIdOrSet: 'MED_SYN_B',
              prohibitionConditions: ['PROHIB_X'],
            }),
          ],
        },
      }),
    );
    expect(out.status).toBe('UNRESOLVED_EVIDENCE');
  });

  it('P12 safety exclusion precedence', () => {
    const out = evaluateRule6Shadow(
      baseInput({
        safetyExclusionRefs: ['MED_SYN_A', 'MED_SYN_B'],
      }),
    );
    expect(out.status).toBe('BLOCKED_BY_SAFETY');
    expect(out.rejectedCandidates).toEqual(['MED_SYN_A', 'MED_SYN_B']);
  });

  it('P13 no hardcoded medicine or formula', () => {
    const out = evaluateRule6Shadow(
      baseInput({
        candidateMedicinePool: ['ZZ_SYN_1'],
        relationshipEvidenceRegistry: { registryVersion: 'reg-v1', edges: [] },
      }),
    );
    expect(out.candidateEvaluations).toHaveLength(1);
    expect(out.candidateEvaluations[0]?.medicineId).toBe('ZZ_SYN_1');
    expect(out.status).toBe('EVALUATED_NO_ELIGIBLE_CANDIDATE');
  });

  it('P14 no duplicate medicines in composition', () => {
    const out = evaluateRule6Shadow(baseInput());
    for (const c of out.proposedCompositionCandidates) {
      expect(new Set(c.medicineIds).size).toBe(c.medicineIds.length);
    }
  });

  it('P15 deterministic tie unresolved handling', () => {
    const out = evaluateRule6Shadow(
      baseInput({
        candidateMedicinePool: ['MED_SYN_A', 'MED_SYN_B'],
        relationshipEvidenceRegistry: {
          registryVersion: 'reg-v1',
          edges: [
            baseEdge({
              edgeId: 'EDGE_A',
              sourceMedicineId: 'MED_SYN_A',
              targetMedicineIdOrSet: 'MED_SYN_A',
              applicabilityConditions: ['COND_A'],
            }),
            baseEdge({
              edgeId: 'EDGE_B',
              sourceMedicineId: 'MED_SYN_B',
              targetMedicineIdOrSet: 'MED_SYN_B',
              applicabilityConditions: ['COND_A'],
              evidenceSourceId: 'EV_SYN_2',
            }),
          ],
        },
      }),
    );
    // self-edges make both eligible as singles with equal evidence and no pair → unresolved tie
    expect(out.status).toBe('UNRESOLVED_EVIDENCE');
    expect(out.proposedCompositionCandidates).toEqual([]);
  });

  it('P16 Rule 9 / section F count ownership marker', () => {
    const proposed = evaluateRule6Shadow(baseInput());
    expect(proposed.rule9SectionFValidationRequired).toBe(true);
    const empty = evaluateRule6Shadow(
      baseInput({ relationshipEvidenceRegistry: { registryVersion: 'reg-v1', edges: [] } }),
    );
    expect(empty.rule9SectionFValidationRequired).toBe(false);
    expect(empty.status).not.toBe('SHADOW_CANDIDATES_PROPOSED');
  });

  it('P17 potency dosage electricity tablet external monitoring exclusions', () => {
    const out = evaluateRule6Shadow(baseInput());
    const keys = outputKeys(out);
    for (const forbidden of [
      'potency',
      'dosage',
      'electricity',
      'tablet',
      'external',
      'monitoringPlan',
    ]) {
      expect(keys).not.toContain(forbidden);
    }
    expect(out.clinicalActivation).toBe('NONE');
    expect(out.shadowOnly).toBe(true);
    expect(out.ruleNumber).toBe(RULE6_RULE_NUMBER);
    expect(out.ruleIdentity).toBe(RULE6_RULE_IDENTITY);
  });

  it('P18 code-only fixed errors with no leakage', () => {
    const sentinel = 'SYNTHETIC_PRIVATE_TEXT_5550001111';
    try {
      evaluateRule6Shadow({ ...baseInput(), requestId: { leak: sentinel } });
      expect.fail('expected failure');
    } catch (e) {
      expect(e).toBeInstanceOf(Rule6EvaluationError);
      const err = e as Rule6EvaluationError;
      expect(err.message).toBe(err.failureCode);
      expect(err.message).not.toContain(sentinel);
      expect(String(err)).not.toContain(sentinel);
      expect(JSON.stringify({ code: err.failureCode, msg: err.message })).not.toContain(sentinel);
    }
  });

  it('P19 no PHI protected runtime legacy connection', () => {
    expectFail(() => evaluateRule6Shadow({ ...baseInput(), patientName: 'X' }), 'INVALID_INPUT');
    const out = evaluateRule6Shadow(baseInput());
    expect(out.shadowOnly).toBe(true);
    expect(out.clinicalActivation).toBe('NONE');
  });

  it('P20 deterministic repeated and reordered-input result', () => {
    const a = evaluateRule6Shadow(baseInput({ candidateMedicinePool: ['MED_SYN_B', 'MED_SYN_A'] }));
    const b = evaluateRule6Shadow(baseInput({ candidateMedicinePool: ['MED_SYN_A', 'MED_SYN_B'] }));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(evaluateRule6Shadow(baseInput()))).toBe(
      JSON.stringify(evaluateRule6Shadow(baseInput())),
    );
  });
});

describe('Rule 6 additional regressions', () => {
  it('rejects getters and accessors', () => {
    const input = baseInput();
    Object.defineProperty(input, 'requestId', {
      get() {
        return 'req-synthetic-001';
      },
      enumerable: true,
    });
    expectFail(() => evaluateRule6Shadow(input), 'INVALID_INPUT');
  });

  it('rejects cycles', () => {
    const input = baseInput() as Record<string, unknown>;
    const cycle: Record<string, unknown> = { a: 1 };
    cycle.self = cycle;
    input.evidenceDataVersions = cycle;
    expectFail(() => evaluateRule6Shadow(input), 'INVALID_INPUT');
  });

  it('rejects duplicate candidate and edge ids', () => {
    expectFail(
      () => evaluateRule6Shadow(baseInput({ candidateMedicinePool: ['MED_SYN_A', 'MED_SYN_A'] })),
      'INVALID_INPUT',
    );
    expectFail(
      () =>
        evaluateRule6Shadow(
          baseInput({
            relationshipEvidenceRegistry: {
              registryVersion: 'reg-v1',
              edges: [
                baseEdge({
                  edgeId: 'EDGE_DUP',
                  sourceMedicineId: 'MED_SYN_A',
                  targetMedicineIdOrSet: 'MED_SYN_B',
                }),
                baseEdge({
                  edgeId: 'EDGE_DUP',
                  sourceMedicineId: 'MED_SYN_A',
                  targetMedicineIdOrSet: 'MED_SYN_B',
                }),
              ],
            },
          }),
        ),
      'INVALID_EVIDENCE_REGISTRY',
    );
  });

  it('rejects malformed registry', () => {
    expectFail(
      () =>
        evaluateRule6Shadow(
          baseInput({ relationshipEvidenceRegistry: { registryVersion: 'reg-v1' } }),
        ),
      'INVALID_EVIDENCE_REGISTRY',
    );
  });

  it('rejects contradictory upstream state', () => {
    expectFail(
      () =>
        evaluateRule6Shadow(
          baseInput({
            upstreamApplicability: { status: 'CONTRADICTORY', notes: [] },
          }),
        ),
      'CONTRADICTORY_UPSTREAM_STATE',
    );
  });

  it('NOT_APPLICABLE outcome and empty composition marker false', () => {
    const out = evaluateRule6Shadow(
      baseInput({ upstreamApplicability: { status: 'NOT_APPLICABLE', notes: [] } }),
    );
    expect(out.status).toBe('NOT_APPLICABLE');
    expect(out.rule9SectionFValidationRequired).toBe(false);
  });

  it('closed outcome and error vocabularies', () => {
    expect(RULE6_OUTCOMES).toHaveLength(6);
    expect(RULE6_FAILURE_CODES).toHaveLength(5);
    expect(RULE6_OUTCOMES).not.toContain('PASS');
  });

  it('output retains no caller references', () => {
    const input = baseInput();
    const out = evaluateRule6Shadow(input);
    expect(out).not.toBe(input);
    expect(out.candidateEvaluations).not.toBe(input.candidateMedicinePool);
  });
});
