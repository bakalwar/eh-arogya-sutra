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

function countingProxy<T extends object>(target: T): { proxy: T; hits: { get: number } } {
  const hits = { get: 0 };
  const proxy = new Proxy(target, {
    get(t, p, r) {
      hits.get += 1;
      return Reflect.get(t, p, r);
    },
  });
  return { proxy, hits };
}

describe('Rule 6 shadow evaluator P01–P20', () => {
  it('P01 strict input schema validation', () => {
    expectFail(() => evaluateRule6Shadow({ ...baseInput(), extra: true }), 'INVALID_INPUT');
    expectFail(() => evaluateRule6Shadow('x'), 'INVALID_INPUT');
    const out = evaluateRule6Shadow(baseInput());
    expect(out.contractVersion).toBe(RULE6_OUTPUT_CONTRACT_VERSION);
  });

  it('P02 deterministic canonical copy', () => {
    const input = baseInput();
    const before = JSON.stringify(input);
    const a = evaluateRule6Shadow(input);
    const b = evaluateRule6Shadow(JSON.parse(before) as Record<string, unknown>);
    expect(JSON.stringify(input)).toBe(before);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('P03 full candidate-pool consideration', () => {
    const out = evaluateRule6Shadow(
      baseInput({ candidateMedicinePool: ['MED_SYN_B', 'MED_SYN_A', 'MED_SYN_C'] }),
    );
    expect(out.candidateEvaluations.map((c) => c.medicineId)).toEqual([
      'MED_SYN_A',
      'MED_SYN_B',
      'MED_SYN_C',
    ]);
  });

  it('P04 approved edge activation', () => {
    const out = evaluateRule6Shadow(baseInput());
    expect(out.status).toBe('SHADOW_CANDIDATES_PROPOSED');
    expect(out.selectedEligibleCandidates).toEqual(['MED_SYN_A', 'MED_SYN_B']);
    expect(out.proposedCompositionCandidates).toHaveLength(1);
    expect(out.proposedCompositionCandidates[0]?.medicineIds).toEqual(['MED_SYN_A', 'MED_SYN_B']);
    expect(out.rule9SectionFValidationRequired).toBe(true);
  });

  it('P05 unvalidated edge rejection', () => {
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

  it('P06 missing evidence yields NOT_EVALUABLE', () => {
    const out = evaluateRule6Shadow(
      baseInput({
        rule1TemperamentRef: { refId: 'r1-ref', status: 'NOT_EVALUABLE', version: 'r1-v1' },
      }),
    );
    expect(out.status).toBe('NOT_EVALUABLE');
    expect(out.rule9SectionFValidationRequired).toBe(false);
  });

  it('P07 contradictory evidence fail-closed', () => {
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

  it('P08 safety exclusion precedence', () => {
    const out = evaluateRule6Shadow(
      baseInput({
        safetyExclusionRefs: ['MED_SYN_A', 'MED_SYN_B'],
      }),
    );
    expect(out.status).toBe('BLOCKED_BY_SAFETY');
    expect(out.rejectedCandidates).toEqual(['MED_SYN_A', 'MED_SYN_B']);
  });

  it('P09 no fixed medicine or formula', () => {
    const out = evaluateRule6Shadow(
      baseInput({
        candidateMedicinePool: ['ZZ_SYN_1'],
        relationshipEvidenceRegistry: { registryVersion: 'reg-v1', edges: [] },
      }),
    );
    expect(out.candidateEvaluations[0]?.medicineId).toBe('ZZ_SYN_1');
    expect(out.status).toBe('EVALUATED_NO_ELIGIBLE_CANDIDATE');
  });

  it('P10 no duplicate medicine', () => {
    const out = evaluateRule6Shadow(baseInput());
    for (const c of out.proposedCompositionCandidates) {
      expect(new Set(c.medicineIds).size).toBe(c.medicineIds.length);
    }
  });

  it('P11 deterministic tie unresolved behavior', () => {
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
            }),
            baseEdge({
              edgeId: 'EDGE_B',
              sourceMedicineId: 'MED_SYN_B',
              targetMedicineIdOrSet: 'MED_SYN_B',
              evidenceSourceId: 'EV_SYN_2',
            }),
          ],
        },
      }),
    );
    expect(out.status).toBe('UNRESOLVED_EVIDENCE');
    expect(out.proposedCompositionCandidates).toEqual([]);
  });

  it('P12 Rule 9 mixture-count ownership respected', () => {
    const proposed = evaluateRule6Shadow(baseInput());
    expect(proposed.rule9SectionFValidationRequired).toBe(true);
    expect(proposed.proposedCompositionCandidates.every((c) => c.rule9ValidationRequired)).toBe(
      true,
    );
    const empty = evaluateRule6Shadow(
      baseInput({ relationshipEvidenceRegistry: { registryVersion: 'reg-v1', edges: [] } }),
    );
    expect(empty.rule9SectionFValidationRequired).toBe(false);
  });

  it('P13 potency dosage electricity tablet external monitoring exclusions', () => {
    const out = evaluateRule6Shadow(baseInput());
    for (const forbidden of [
      'potency',
      'dosage',
      'electricity',
      'tablet',
      'external',
      'monitoringPlan',
    ]) {
      expect(outputKeys(out)).not.toContain(forbidden);
    }
    expect(out.clinicalActivation).toBe('NONE');
    expect(out.shadowOnly).toBe(true);
    expect(out.ruleNumber).toBe(RULE6_RULE_NUMBER);
    expect(out.ruleIdentity).toBe(RULE6_RULE_IDENTITY);
  });

  it('P14 input non-mutation', () => {
    const input = baseInput();
    const before = JSON.stringify(input);
    const out = evaluateRule6Shadow(input);
    expect(JSON.stringify(input)).toBe(before);
    (input.candidateMedicinePool as string[]).push('MED_SYN_Z');
    expect(out.candidateEvaluations.some((c) => c.medicineId === 'MED_SYN_Z')).toBe(false);
  });

  it('P15 deep-freeze output', () => {
    const out = evaluateRule6Shadow(baseInput());
    expect(Object.isFrozen(out)).toBe(true);
    expect(Object.isFrozen(out.candidateEvaluations)).toBe(true);
    expect(() => {
      (out as { status: string }).status = 'NOT_APPLICABLE';
    }).toThrow();
  });

  it('P16 exact key order', () => {
    const out = evaluateRule6Shadow(baseInput());
    expect(outputKeys(out)).toEqual([...RULE6_OUTPUT_KEY_ORDER]);
    expect(RULE6_OUTPUT_KEY_ORDER).toHaveLength(18);
    expect(RULE6_INPUT_KEY_ORDER).toHaveLength(12);
    expect(RULE6_EDGE_KEY_ORDER).toHaveLength(13);
  });

  it('P17 code-only errors', () => {
    const sentinel = 'SYNTHETIC_PRIVATE_TEXT_5550001111';
    try {
      evaluateRule6Shadow({ ...baseInput(), requestId: { leak: sentinel } });
      expect.fail('expected failure');
    } catch (e) {
      const err = e as Rule6EvaluationError;
      expect(err.message).toBe(err.failureCode);
      expect(err.message).not.toContain(sentinel);
    }
  });

  it('P18 no PHI leakage', () => {
    expectFail(() => evaluateRule6Shadow({ ...baseInput(), patientName: 'X' }), 'INVALID_INPUT');
  });

  it('P19 no legacy / runtime connection', () => {
    const out = evaluateRule6Shadow(baseInput());
    expect(out.shadowOnly).toBe(true);
    expect(out.clinicalActivation).toBe('NONE');
  });

  it('P20 outcome / error vocabulary closed-set enforcement', () => {
    expect(RULE6_OUTCOMES).toHaveLength(6);
    expect(RULE6_FAILURE_CODES).toHaveLength(5);
    expect(RULE6_OUTCOMES).not.toContain('PASS');
    expect(new Set(RULE6_OUTCOMES).size).toBe(6);
    expect(new Set(RULE6_FAILURE_CODES).size).toBe(5);
  });
});

describe('Rule 6 additional regressions', () => {
  it('rejects unsupported contract version', () => {
    expectFail(
      () => evaluateRule6Shadow({ ...baseInput(), contractVersion: 'ehas2-rule6-input-v0' }),
      'UNSUPPORTED_CONTRACT_VERSION',
    );
  });

  it('deterministic reordered pool result', () => {
    const a = evaluateRule6Shadow(baseInput({ candidateMedicinePool: ['MED_SYN_B', 'MED_SYN_A'] }));
    const b = evaluateRule6Shadow(baseInput({ candidateMedicinePool: ['MED_SYN_A', 'MED_SYN_B'] }));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('stale disputed superseded edge non-activation', () => {
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

  it('B1 incomplete pair after partner safety exclusion does not emit singleton', () => {
    const out = evaluateRule6Shadow(baseInput({ safetyExclusionRefs: ['MED_SYN_B'] }));
    expect(out.proposedCompositionCandidates).toEqual([]);
    expect(
      out.proposedCompositionCandidates.some((c) => c.medicineIds.join() === 'MED_SYN_A'),
    ).toBe(false);
    expect(out.status).toBe('UNRESOLVED_EVIDENCE');
    expect(out.rejectedCandidates).toEqual(['MED_SYN_B']);
    const a = out.candidateEvaluations.find((c) => c.medicineId === 'MED_SYN_A');
    expect(a?.state).toBe('UNRESOLVED');
  });

  it('B1 incomplete pair when partner absent from pool does not emit singleton', () => {
    const out = evaluateRule6Shadow(
      baseInput({
        candidateMedicinePool: ['MED_SYN_A'],
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
      }),
    );
    expect(out.proposedCompositionCandidates).toEqual([]);
    expect(out.status).toBe('UNRESOLVED_EVIDENCE');
  });

  it('B1 complete approved pair still proposes', () => {
    const out = evaluateRule6Shadow(baseInput());
    expect(out.status).toBe('SHADOW_CANDIDATES_PROPOSED');
    expect(out.proposedCompositionCandidates[0]?.medicineIds).toEqual(['MED_SYN_A', 'MED_SYN_B']);
    expect(out.proposedCompositionCandidates[0]?.relationshipEdgeIds).toEqual(['EDGE_SYN_1']);
  });

  it('B1 legitimate self-edge singleton remains authorized', () => {
    const out = evaluateRule6Shadow(
      baseInput({
        candidateMedicinePool: ['MED_SYN_A'],
        relationshipEvidenceRegistry: {
          registryVersion: 'reg-v1',
          edges: [
            baseEdge({
              edgeId: 'EDGE_SELF',
              sourceMedicineId: 'MED_SYN_A',
              targetMedicineIdOrSet: 'MED_SYN_A',
            }),
          ],
        },
      }),
    );
    expect(out.status).toBe('SHADOW_CANDIDATES_PROPOSED');
    expect(out.proposedCompositionCandidates).toHaveLength(1);
    expect(out.proposedCompositionCandidates[0]?.medicineIds).toEqual(['MED_SYN_A']);
    expect(out.proposedCompositionCandidates[0]?.relationshipEdgeIds).toEqual(['EDGE_SELF']);
    expect(out.rule9SectionFValidationRequired).toBe(true);
  });

  it('B2 partial safety with remaining insufficient is not BLOCKED_BY_SAFETY', () => {
    const out = evaluateRule6Shadow(
      baseInput({
        safetyExclusionRefs: ['MED_SYN_A'],
        relationshipEvidenceRegistry: { registryVersion: 'reg-v1', edges: [] },
      }),
    );
    expect(out.status).toBe('EVALUATED_NO_ELIGIBLE_CANDIDATE');
    expect(out.status).not.toBe('BLOCKED_BY_SAFETY');
  });

  it('B2 all candidates safety-excluded remains BLOCKED_BY_SAFETY', () => {
    const out = evaluateRule6Shadow(baseInput({ safetyExclusionRefs: ['MED_SYN_A', 'MED_SYN_B'] }));
    expect(out.status).toBe('BLOCKED_BY_SAFETY');
  });

  it('B2 partial safety with complete remaining pair partner self-edge proposes only complete evidence', () => {
    const out = evaluateRule6Shadow(
      baseInput({
        safetyExclusionRefs: ['MED_SYN_A'],
        relationshipEvidenceRegistry: {
          registryVersion: 'reg-v1',
          edges: [
            baseEdge({
              edgeId: 'EDGE_PAIR',
              sourceMedicineId: 'MED_SYN_A',
              targetMedicineIdOrSet: 'MED_SYN_B',
            }),
            baseEdge({
              edgeId: 'EDGE_SELF_B',
              sourceMedicineId: 'MED_SYN_B',
              targetMedicineIdOrSet: 'MED_SYN_B',
              evidenceSourceId: 'EV_SYN_2',
            }),
          ],
        },
      }),
    );
    expect(out.status).toBe('SHADOW_CANDIDATES_PROPOSED');
    expect(out.proposedCompositionCandidates).toHaveLength(1);
    expect(out.proposedCompositionCandidates[0]?.medicineIds).toEqual(['MED_SYN_B']);
    expect(out.proposedCompositionCandidates[0]?.relationshipEdgeIds).toEqual(['EDGE_SELF_B']);
    expect(out.rejectedCandidates).toEqual(['MED_SYN_A']);
  });

  it('B3 top-level Proxy get trap rejected with zero hits', () => {
    const { proxy, hits } = countingProxy(baseInput());
    expectFail(() => evaluateRule6Shadow(proxy), 'INVALID_INPUT');
    expect(hits.get).toBe(0);
  });

  it('B3 nested Proxy in candidate pool rejected with zero hits', () => {
    const input = baseInput();
    const { proxy, hits } = countingProxy(['MED_SYN_A', 'MED_SYN_B']);
    input.candidateMedicinePool = proxy;
    expectFail(() => evaluateRule6Shadow(input), 'INVALID_INPUT');
    expect(hits.get).toBe(0);
  });

  it('B3 Proxy registry entry maps to INVALID_EVIDENCE_REGISTRY with zero hits', () => {
    const input = baseInput();
    const { proxy, hits } = countingProxy({
      registryVersion: 'reg-v1',
      edges: [],
    });
    input.relationshipEvidenceRegistry = proxy;
    expectFail(() => evaluateRule6Shadow(input), 'INVALID_EVIDENCE_REGISTRY');
    expect(hits.get).toBe(0);
  });

  it('B3 throwing Proxy fails closed without raw leakage', () => {
    const proxy = new Proxy(
      {},
      {
        get() {
          throw new Error('RAW_PROXY_THROW_SHOULD_NOT_LEAK');
        },
      },
    );
    try {
      evaluateRule6Shadow(proxy);
      expect.fail('expected failure');
    } catch (e) {
      expect(e).toBeInstanceOf(Rule6EvaluationError);
      const err = e as Rule6EvaluationError;
      expect(err.failureCode).toBe('INVALID_INPUT');
      expect(String(err)).not.toContain('RAW_PROXY_THROW_SHOULD_NOT_LEAK');
    }
  });

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

  it('B4 registry failures use INVALID_EVIDENCE_REGISTRY', () => {
    const cases: Array<{ name: string; over: Record<string, unknown> }> = [
      {
        name: 'malformed edgeId',
        over: {
          relationshipEvidenceRegistry: {
            registryVersion: 'reg-v1',
            edges: [
              baseEdge({
                edgeId: 'bad id!',
                sourceMedicineId: 'MED_SYN_A',
                targetMedicineIdOrSet: 'MED_SYN_B',
              }),
            ],
          },
        },
      },
      {
        name: 'malformed source',
        over: {
          relationshipEvidenceRegistry: {
            registryVersion: 'reg-v1',
            edges: [
              baseEdge({
                edgeId: 'EDGE_SYN_1',
                sourceMedicineId: 'bad id!',
                targetMedicineIdOrSet: 'MED_SYN_B',
              }),
            ],
          },
        },
      },
      {
        name: 'malformed target',
        over: {
          relationshipEvidenceRegistry: {
            registryVersion: 'reg-v1',
            edges: [
              baseEdge({
                edgeId: 'EDGE_SYN_1',
                sourceMedicineId: 'MED_SYN_A',
                targetMedicineIdOrSet: 'bad id!',
              }),
            ],
          },
        },
      },
      {
        name: 'missing field',
        over: {
          relationshipEvidenceRegistry: {
            registryVersion: 'reg-v1',
            edges: [
              {
                edgeId: 'EDGE_SYN_1',
                sourceMedicineId: 'MED_SYN_A',
                targetMedicineIdOrSet: 'MED_SYN_B',
                directionality: 'UNDIRECTED',
                relationshipType: 'SYNTHETIC_REL',
                applicabilityConditions: ['COND_A'],
                prohibitionConditions: [],
                evidenceSourceId: 'EV_SYN_1',
                evidenceValidationStatus: 'approved',
                ownerClinicalApprovalStatus: 'approved',
                version: 'edge-v1',
                // effectiveStatus missing
                supersessionMetadata: null,
              },
            ],
          },
        },
      },
      {
        name: 'unknown field',
        over: {
          relationshipEvidenceRegistry: {
            registryVersion: 'reg-v1',
            edges: [
              {
                ...baseEdge({
                  edgeId: 'EDGE_SYN_1',
                  sourceMedicineId: 'MED_SYN_A',
                  targetMedicineIdOrSet: 'MED_SYN_B',
                }),
                extraField: true,
              },
            ],
          },
        },
      },
      {
        name: 'duplicate edge id',
        over: {
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
        },
      },
      {
        name: 'invalid directionality',
        over: {
          relationshipEvidenceRegistry: {
            registryVersion: 'reg-v1',
            edges: [
              {
                ...baseEdge({
                  edgeId: 'EDGE_SYN_1',
                  sourceMedicineId: 'MED_SYN_A',
                  targetMedicineIdOrSet: 'MED_SYN_B',
                }),
                directionality: 'SIDEWAYS',
              },
            ],
          },
        },
      },
    ];
    for (const c of cases) {
      expectFail(() => evaluateRule6Shadow(baseInput(c.over)), 'INVALID_EVIDENCE_REGISTRY');
    }
  });

  it('B4 accessor and Proxy edge map to INVALID_EVIDENCE_REGISTRY', () => {
    const edge = baseEdge({
      edgeId: 'EDGE_SYN_1',
      sourceMedicineId: 'MED_SYN_A',
      targetMedicineIdOrSet: 'MED_SYN_B',
    }) as Record<string, unknown>;
    Object.defineProperty(edge, 'edgeId', {
      get() {
        return 'EDGE_SYN_1';
      },
      enumerable: true,
    });
    expectFail(
      () =>
        evaluateRule6Shadow(
          baseInput({
            relationshipEvidenceRegistry: { registryVersion: 'reg-v1', edges: [edge] },
          }),
        ),
      'INVALID_EVIDENCE_REGISTRY',
    );

    const { proxy, hits } = countingProxy(
      baseEdge({
        edgeId: 'EDGE_SYN_1',
        sourceMedicineId: 'MED_SYN_A',
        targetMedicineIdOrSet: 'MED_SYN_B',
      }),
    );
    expectFail(
      () =>
        evaluateRule6Shadow(
          baseInput({
            relationshipEvidenceRegistry: { registryVersion: 'reg-v1', edges: [proxy] },
          }),
        ),
      'INVALID_EVIDENCE_REGISTRY',
    );
    expect(hits.get).toBe(0);
  });

  it('B4 cycle inside registry maps to INVALID_EVIDENCE_REGISTRY', () => {
    const cycle: Record<string, unknown> = { registryVersion: 'reg-v1' };
    cycle.edges = cycle;
    expectFail(
      () => evaluateRule6Shadow(baseInput({ relationshipEvidenceRegistry: cycle })),
      'INVALID_EVIDENCE_REGISTRY',
    );
  });

  it('malformed candidate medicine id remains INVALID_INPUT', () => {
    expectFail(
      () => evaluateRule6Shadow(baseInput({ candidateMedicinePool: ['bad id!'] })),
      'INVALID_INPUT',
    );
  });

  it('rejects duplicate candidate ids', () => {
    expectFail(
      () => evaluateRule6Shadow(baseInput({ candidateMedicinePool: ['MED_SYN_A', 'MED_SYN_A'] })),
      'INVALID_INPUT',
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

  it('output retains no caller references', () => {
    const input = baseInput();
    const out = evaluateRule6Shadow(input);
    expect(out).not.toBe(input);
    expect(out.candidateEvaluations).not.toBe(input.candidateMedicinePool);
  });
});
