import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  RULE8_ELIGIBILITY_STATES,
  RULE8_FAILURE_CODES,
  RULE8_INDICATION_KEY_ORDER,
  RULE8_INPUT_CONTRACT_VERSION,
  RULE8_INPUT_KEY_ORDER,
  RULE8_ORCHESTRATION_STATUS,
  RULE8_OUTCOMES,
  RULE8_OUTPUT_CONTRACT_VERSION,
  RULE8_OUTPUT_KEY_ORDER,
  RULE8_PRESCRIPTION_EFFECT,
  RULE8_PRODUCTION_MAPPING_REGISTRY,
  RULE8_RULE1_COMPARISON_STATES,
  RULE8_RULE_IDENTITY,
  RULE8_RULE_NUMBER,
  RULE8_RUNTIME_STATUS,
  RULE8_SYNTHETIC_TEST_CLASSIFICATION,
  Rule8EvaluationError,
  evaluateRule8Shadow,
  type Rule8PrakritiEvidenceEntry,
} from '../src/index.ts';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function baseEntry(
  over: Partial<Rule8PrakritiEvidenceEntry> &
    Pick<Rule8PrakritiEvidenceEntry, 'entryId' | 'diseaseConditionRef' | 'prakritiCategoryRef'>,
): Rule8PrakritiEvidenceEntry {
  return {
    applicabilityConditions: [],
    contradictionMarkers: [],
    evidenceSourceId: 'EV_SYN_R8_1',
    evidenceValidationStatus: 'validated',
    ownerClinicalApprovalStatus: 'approved',
    version: 'entry-v1',
    effectiveStatus: 'approved-and-active',
    supersessionMetadata: null,
    testClassification: RULE8_SYNTHETIC_TEST_CLASSIFICATION,
    ...over,
  };
}

function baseInput(over: Record<string, unknown> = {}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    contractVersion: RULE8_INPUT_CONTRACT_VERSION,
    requestId: 'req-r8-synthetic-001',
    diseaseConditionRefs: ['DX_SYN_A'],
    rule1TemperamentRef: { status: 'UNAVAILABLE' },
    prakritiEvidenceRegistry: {
      registryVersion: 'reg-r8-v1',
      entries: [
        baseEntry({
          entryId: 'ENTRY_SYN_1',
          diseaseConditionRef: 'DX_SYN_A',
          prakritiCategoryRef: 'PK_SYN_CAT_1',
        }),
      ],
    },
    evidenceDataVersions: {
      diseaseDataVersion: 'dx-v1',
      evidenceDataVersion: 'ev-v1',
      prakritiRegistryVersion: 'reg-r8-v1',
      contractVersion: RULE8_INPUT_CONTRACT_VERSION,
    },
    upstreamApplicability: { status: 'APPLICABLE', notes: [] },
  };
  return { ...base, ...over };
}

function expectFail(fn: () => void, code: (typeof RULE8_FAILURE_CODES)[number]): void {
  try {
    fn();
    expect.fail('expected Rule8EvaluationError');
  } catch (e) {
    expect(e).toBeInstanceOf(Rule8EvaluationError);
    const err = e as Rule8EvaluationError;
    expect(err.failureCode).toBe(code);
    expect(err.message).toBe(code);
    expect(err.message).toBe(err.failureCode);
  }
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

describe('Rule 8 shadow evaluator P01–P16', () => {
  it('P01 strict 7-key input schema validation (reject unknown keys)', () => {
    expect(RULE8_INPUT_KEY_ORDER).toHaveLength(7);
    expectFail(() => evaluateRule8Shadow({ ...baseInput(), extra: true }), 'INVALID_INPUT');
    expectFail(() => evaluateRule8Shadow('x'), 'INVALID_INPUT');
    const missing = { ...baseInput() };
    delete missing.requestId;
    expectFail(() => evaluateRule8Shadow(missing), 'INVALID_INPUT');
    const out = evaluateRule8Shadow(baseInput());
    expect(out.contractVersion).toBe(RULE8_OUTPUT_CONTRACT_VERSION);
  });

  it('P02 deterministic canonical copy / reorder-stable', () => {
    const a = evaluateRule8Shadow(
      baseInput({
        diseaseConditionRefs: ['DX_SYN_B', 'DX_SYN_A'],
        prakritiEvidenceRegistry: {
          registryVersion: 'reg-r8-v1',
          entries: [
            baseEntry({
              entryId: 'ENTRY_SYN_2',
              diseaseConditionRef: 'DX_SYN_B',
              prakritiCategoryRef: 'PK_SYN_CAT_2',
            }),
            baseEntry({
              entryId: 'ENTRY_SYN_1',
              diseaseConditionRef: 'DX_SYN_A',
              prakritiCategoryRef: 'PK_SYN_CAT_1',
            }),
          ],
        },
      }),
    );
    const b = evaluateRule8Shadow(
      baseInput({
        diseaseConditionRefs: ['DX_SYN_A', 'DX_SYN_B'],
        prakritiEvidenceRegistry: {
          registryVersion: 'reg-r8-v1',
          entries: [
            baseEntry({
              entryId: 'ENTRY_SYN_1',
              diseaseConditionRef: 'DX_SYN_A',
              prakritiCategoryRef: 'PK_SYN_CAT_1',
            }),
            baseEntry({
              entryId: 'ENTRY_SYN_2',
              diseaseConditionRef: 'DX_SYN_B',
              prakritiCategoryRef: 'PK_SYN_CAT_2',
            }),
          ],
        },
      }),
    );
    expect(a.deterministicFingerprint).toBe(b.deterministicFingerprint);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.evaluatedDiseaseRefs).toEqual(['DX_SYN_A', 'DX_SYN_B']);
  });

  it('P03 positive synthetic indication only with conjunctive approved active evidence', () => {
    const out = evaluateRule8Shadow(baseInput());
    expect(out.status).toBe('SHADOW_PRAKRUTI_INDICATIONS_PROPOSED');
    expect(out.prakritiIndications).toHaveLength(1);
    expect(out.prakritiIndications[0]?.eligibilityState).toBe('ELIGIBLE');
    expect(out.prakritiIndications[0]?.prakritiCategoryRef).toBe('PK_SYN_CAT_1');
    expect(out.shadowOnly).toBe(true);
    expect(out.clinicalActivation).toBe('NONE');
    expect(out.medicineSelectionInfluence).toBe('NONE');
    expect(out.notRequiredForPrescription).toBe(true);
    expect(RULE8_PRODUCTION_MAPPING_REGISTRY.entries).toHaveLength(0);
  });

  it('P04 unvalidated / inventory evidence non-activating', () => {
    for (const st of [
      'unvalidated',
      'inventory-only',
      'draft',
      'queued-for-validation',
      'under-review',
      'submitted',
    ] as const) {
      const out = evaluateRule8Shadow(
        baseInput({
          prakritiEvidenceRegistry: {
            registryVersion: 'reg-r8-v1',
            entries: [
              baseEntry({
                entryId: 'ENTRY_SYN_1',
                diseaseConditionRef: 'DX_SYN_A',
                prakritiCategoryRef: 'PK_SYN_CAT_1',
                evidenceValidationStatus: st,
              }),
            ],
          },
        }),
      );
      expect(out.status).toBe('NOT_CLINICALLY_INDICATED');
      expect(out.prakritiIndications).toEqual([]);
      expect(out.notClinicallyIndicated).toBe(true);
    }
  });

  it('P05 missing evidence → NOT_EVALUABLE or NOT_CLINICALLY_INDICATED', () => {
    const empty = evaluateRule8Shadow(
      baseInput({
        prakritiEvidenceRegistry: { registryVersion: 'reg-r8-v1', entries: [] },
      }),
    );
    expect(empty.status).toBe('NOT_CLINICALLY_INDICATED');
    expect(empty.notClinicallyIndicated).toBe(true);
    const unevaluableUpstream = evaluateRule8Shadow(
      baseInput({
        upstreamApplicability: { status: 'NOT_EVALUABLE', notes: ['upstream-gap'] },
      }),
    );
    expect(unevaluableUpstream.status).toBe('NOT_EVALUABLE');
    expect(unevaluableUpstream.notClinicallyIndicated).toBe(false);
    const missing = evaluateRule8Shadow(
      baseInput({
        prakritiEvidenceRegistry: {
          registryVersion: 'reg-r8-v1',
          entries: [
            baseEntry({
              entryId: 'ENTRY_SYN_1',
              diseaseConditionRef: 'DX_SYN_A',
              prakritiCategoryRef: 'PK_SYN_CAT_1',
              effectiveStatus: 'missing-evidence',
            }),
          ],
        },
      }),
    );
    expect(missing.status).toBe('NOT_EVALUABLE');
  });

  it('P06 contradictory evidence fail-closed', () => {
    const out = evaluateRule8Shadow(
      baseInput({
        prakritiEvidenceRegistry: {
          registryVersion: 'reg-r8-v1',
          entries: [
            baseEntry({
              entryId: 'ENTRY_SYN_A',
              diseaseConditionRef: 'DX_SYN_A',
              prakritiCategoryRef: 'PK_SYN_CAT_1',
            }),
            baseEntry({
              entryId: 'ENTRY_SYN_B',
              diseaseConditionRef: 'DX_SYN_A',
              prakritiCategoryRef: 'PK_SYN_CAT_2',
              evidenceSourceId: 'EV_SYN_R8_2',
            }),
          ],
        },
      }),
    );
    expect(out.status).toBe('UNRESOLVED_EVIDENCE');
    expect(out.prakritiIndications).toEqual([]);
    expect(out.notClinicallyIndicated).toBe(false);
  });

  it('P07 Rule 1 separation — no overwrite / no silent merge', () => {
    const withRule1 = evaluateRule8Shadow(
      baseInput({
        rule1TemperamentRef: { refId: 'R1_SYN_REF', status: 'RESOLVED', version: 'r1-v1' },
      }),
    );
    expect(withRule1.rule1ComparisonState).toBe('NOT_COMPARED');
    expect(withRule1.ruleIdentity).toBe(RULE8_RULE_IDENTITY);
    expect(withRule1.ruleNumber).toBe(8);
    expect(JSON.stringify(withRule1)).not.toMatch(/Temperament \(Prakriti\)|overwrite|mergeScore/i);
    const unavailable = evaluateRule8Shadow(baseInput());
    expect(unavailable.rule1ComparisonState).toBe('UNAVAILABLE');
    // Rule 1 envelope is reference only — Rule 8 does not redefine Rule 1 identity.
    expect(unavailable.ruleIdentity).not.toBe('TEMPERAMENT');
  });

  it('P08 Rule 1 conflict → fail-closed (no hidden positive)', () => {
    const out = evaluateRule8Shadow(
      baseInput({
        rule1TemperamentRef: { refId: 'R1_SYN_REF', status: 'CONFLICT', version: 'r1-v1' },
      }),
    );
    expect(out.status).toBe('BLOCKED_BY_RULE1_CONTRADICTION');
    expect(out.rule1ComparisonState).toBe('CONFLICT');
    expect(out.prakritiIndications).toEqual([]);
    expect(out.notClinicallyIndicated).toBe(false);
    expect(out.shadowOnly).toBe(true);
    expect(out.clinicalActivation).toBe('NONE');
  });

  it('P09 no medicine / formula / treatment / Rx-effect / runtime influence (§9.2.1)', () => {
    const out = evaluateRule8Shadow(baseInput());
    const blob = JSON.stringify(out);
    const forbidden = [
      'medicineId',
      'formulaId',
      'strength',
      'concentration',
      'quantity',
      'frequency',
      'duration',
      'preparationMethod',
      'applicationInstructions',
      'potency',
      'dosage',
      'electricity',
      'tabletA',
      'tabletB',
      'externalApplication',
      'monitoringPlan',
      'mixtureCount',
      'treatmentInstructions',
      'finalRx',
      'prescriptionEffect',
    ];
    for (const k of forbidden) {
      expect(blob).not.toContain(`"${k}"`);
    }
    // §9.2.1 items 2–5
    expect(out.medicineSelectionInfluence).toBe('NONE');
    expect(RULE8_PRESCRIPTION_EFFECT).toBe('NONE');
    expect(out.clinicalActivation).toBe('NONE');
    expect(out.notRequiredForPrescription).toBe(true);
    // §9.2.1 item 6 — orchestration/runtime NOT_CONNECTED (package posture; not an output key)
    expect(RULE8_ORCHESTRATION_STATUS).toBe('NOT_CONNECTED');
    expect(RULE8_RUNTIME_STATUS).toBe('NOT_CONNECTED');
    expect(Object.keys(out)).not.toContain('orchestrationStatus');
    expect(Object.keys(out)).not.toContain('runtimeStatus');
    // §9.2.1 item 7 — no medicine alter/approve/block/rank/boost/demote/reject fields
    expect(blob).not.toMatch(
      /boost|demote|rankMedicine|approveMedicine|rejectMedicine|blockMedicine/i,
    );
    expect(Object.keys(out.prakritiIndications[0]!)).toEqual([...RULE8_INDICATION_KEY_ORDER]);
    // §9.2.1 item 6b — no orchestration/runtime wiring inside package allowlist
    const srcDir = path.join(PKG_ROOT, 'src');
    const srcFiles = readdirSync(srcDir).filter((f) => f.endsWith('.ts'));
    let srcBlob = '';
    for (const f of srcFiles) {
      srcBlob += readFileSync(path.join(srcDir, f), 'utf8');
    }
    expect(srcBlob).not.toMatch(
      /connectOrchestrat|wireRuntime|productionActivate|AnalyzeComplete|prescriptionEngine/i,
    );
  });

  it('P10 NOT_CLINICALLY_INDICATED valid empty success-path outcome (§6.3)', () => {
    const out = evaluateRule8Shadow(
      baseInput({
        prakritiEvidenceRegistry: { registryVersion: 'reg-r8-v1', entries: [] },
      }),
    );
    expect(out.status).toBe('NOT_CLINICALLY_INDICATED');
    expect(out.notClinicallyIndicated).toBe(true);
    expect(typeof out.notClinicallyIndicated).toBe('boolean');
    expect(out.shadowOnly).toBe(true);
    expect(out.clinicalActivation).toBe('NONE');
    expect(out.prakritiIndications).toEqual([]);
  });

  it('P11 input non-mutation', () => {
    const input = baseInput();
    const before = JSON.stringify(input);
    evaluateRule8Shadow(input);
    expect(JSON.stringify(input)).toBe(before);
    (input.diseaseConditionRefs as string[]).push('MUTATED');
    expect(JSON.stringify(input)).not.toBe(before);
    const again = evaluateRule8Shadow(JSON.parse(before) as Record<string, unknown>);
    expect(again.requestId).toBe('req-r8-synthetic-001');
  });

  it('P12 deep-freeze output', () => {
    const out = evaluateRule8Shadow(baseInput());
    expect(Object.isFrozen(out)).toBe(true);
    expect(Object.isFrozen(out.prakritiIndications)).toBe(true);
    expect(Object.isFrozen(out.prakritiIndications[0]!)).toBe(true);
    expect(() => {
      (out as { status: string }).status = 'HACK';
    }).toThrow();
  });

  it('P13 exact key order (18 output + 6 indication)', () => {
    expect(RULE8_OUTPUT_KEY_ORDER).toHaveLength(18);
    expect(RULE8_INDICATION_KEY_ORDER).toHaveLength(6);
    const out = evaluateRule8Shadow(baseInput());
    expect(Object.keys(out)).toEqual([...RULE8_OUTPUT_KEY_ORDER]);
    expect(Object.keys(out.prakritiIndications[0]!)).toEqual([...RULE8_INDICATION_KEY_ORDER]);
    expect(out.ruleNumber).toBe(RULE8_RULE_NUMBER);
    expect(out.ruleIdentity).toBe(RULE8_RULE_IDENTITY);
  });

  it('P14 code-only errors (message === failureCode)', () => {
    expectFail(() => evaluateRule8Shadow({ foo: 1 }), 'INVALID_INPUT');
    expectFail(
      () => evaluateRule8Shadow(baseInput({ contractVersion: 'ehas2-rule8-input-v999' })),
      'UNSUPPORTED_CONTRACT_VERSION',
    );
    expectFail(
      () =>
        evaluateRule8Shadow(
          baseInput({
            prakritiEvidenceRegistry: { registryVersion: 'x', entries: [{ bad: true }] },
          }),
        ),
      'INVALID_EVIDENCE_REGISTRY',
    );
    expectFail(
      () =>
        evaluateRule8Shadow(
          baseInput({
            upstreamApplicability: { status: 'WEIRD', notes: [] },
          }),
        ),
      'CONTRADICTORY_UPSTREAM_STATE',
    );
  });

  it('P15 no PHI / protected-path leakage', () => {
    expectFail(
      () => evaluateRule8Shadow({ ...baseInput(), patientName: 'Alice' }),
      'INVALID_INPUT',
    );
    expectFail(() => evaluateRule8Shadow({ ...baseInput(), mrn: '123' }), 'INVALID_INPUT');
    try {
      evaluateRule8Shadow({ ...baseInput(), patient_name: 'x' });
    } catch (e) {
      const err = e as Rule8EvaluationError;
      expect(err.message).toBe(err.failureCode);
      expect(err.message).not.toMatch(/patient|Alice|path|\\\\|C:\\/i);
    }
  });

  it('P16 outcome / error vocabulary closed-set (§6.3 outcomes + §6.4 errors)', () => {
    expect(RULE8_OUTCOMES).toHaveLength(6);
    expect(RULE8_FAILURE_CODES).toHaveLength(5);
    expect(RULE8_ELIGIBILITY_STATES).toHaveLength(4);
    expect(RULE8_RULE1_COMPARISON_STATES).toHaveLength(5);
    const statuses = new Set<string>();
    statuses.add(evaluateRule8Shadow(baseInput()).status);
    statuses.add(
      evaluateRule8Shadow(
        baseInput({ upstreamApplicability: { status: 'NOT_APPLICABLE', notes: [] } }),
      ).status,
    );
    statuses.add(
      evaluateRule8Shadow(
        baseInput({ upstreamApplicability: { status: 'NOT_EVALUABLE', notes: [] } }),
      ).status,
    );
    statuses.add(
      evaluateRule8Shadow(
        baseInput({ prakritiEvidenceRegistry: { registryVersion: 'reg-r8-v1', entries: [] } }),
      ).status,
    );
    statuses.add(
      evaluateRule8Shadow(
        baseInput({
          rule1TemperamentRef: { refId: 'R1_SYN_REF', status: 'CONFLICT', version: 'r1-v1' },
        }),
      ).status,
    );
    statuses.add(
      evaluateRule8Shadow(
        baseInput({
          prakritiEvidenceRegistry: {
            registryVersion: 'reg-r8-v1',
            entries: [
              baseEntry({
                entryId: 'ENTRY_SYN_A',
                diseaseConditionRef: 'DX_SYN_A',
                prakritiCategoryRef: 'PK_SYN_CAT_1',
              }),
              baseEntry({
                entryId: 'ENTRY_SYN_B',
                diseaseConditionRef: 'DX_SYN_A',
                prakritiCategoryRef: 'PK_SYN_CAT_2',
                evidenceSourceId: 'EV_2',
              }),
            ],
          },
        }),
      ).status,
    );
    for (const s of statuses) {
      expect(RULE8_OUTCOMES).toContain(s);
    }
    expect(statuses.has('BLOCKED_BY_RULE1_CONTRADICTION')).toBe(true);
    expect(statuses.has('UNRESOLVED_EVIDENCE')).toBe(true);
    expect(statuses.has('SHADOW_PRAKRUTI_INDICATIONS_PROPOSED')).toBe(true);
  });
});

describe('Rule 8 additional regressions / negative probes', () => {
  it('R01 Proxy top-level / nested / array / registry: zero trap hits', () => {
    const nested = countingProxy({ status: 'UNAVAILABLE' as const });
    const top = countingProxy(baseInput({ rule1TemperamentRef: nested.proxy }));
    expectFail(() => evaluateRule8Shadow(top.proxy), 'INVALID_INPUT');
    expect(top.hits.get).toBe(0);
    expect(nested.hits.get).toBe(0);

    const regInner = countingProxy({
      registryVersion: 'reg-r8-v1',
      entries: [],
    });
    const withReg = countingProxy(baseInput({ prakritiEvidenceRegistry: regInner.proxy }));
    expectFail(() => evaluateRule8Shadow(withReg.proxy), 'INVALID_INPUT');
    expect(withReg.hits.get).toBe(0);
    expect(regInner.hits.get).toBe(0);

    const arrProxy = countingProxy(['DX_SYN_A']);
    const withArr = countingProxy(baseInput({ diseaseConditionRefs: arrProxy.proxy }));
    expectFail(() => evaluateRule8Shadow(withArr.proxy), 'INVALID_INPUT');
    expect(withArr.hits.get).toBe(0);
    expect(arrProxy.hits.get).toBe(0);
  });

  it('R02 getters at reachable levels never invoked (incl. throwing getter)', () => {
    let invoked = 0;
    const input = baseInput();
    Object.defineProperty(input, 'requestId', {
      get() {
        invoked += 1;
        return 'req-r8-synthetic-001';
      },
      enumerable: true,
      configurable: true,
    });
    expectFail(() => evaluateRule8Shadow(input), 'INVALID_INPUT');
    expect(invoked).toBe(0);

    let throwHits = 0;
    const throwing = baseInput();
    Object.defineProperty(throwing, 'requestId', {
      get() {
        throwHits += 1;
        throw new Error('should-not-run');
      },
      enumerable: true,
      configurable: true,
    });
    expectFail(() => evaluateRule8Shadow(throwing), 'INVALID_INPUT');
    expect(throwHits).toBe(0);
  });

  it('R03 cycles rejected', () => {
    const input = baseInput();
    const notes = (input.upstreamApplicability as { notes: unknown[] }).notes;
    notes.push(notes);
    expectFail(() => evaluateRule8Shadow(input), 'INVALID_INPUT');
  });

  it('R04 sparse arrays and symbol keys rejected', () => {
    const sparse = baseInput();
    const refs = [] as string[];
    refs[1] = 'DX_SYN_A';
    sparse.diseaseConditionRefs = refs;
    expectFail(() => evaluateRule8Shadow(sparse), 'INVALID_INPUT');

    const withSym = baseInput();
    Object.defineProperty(withSym, Symbol('x'), { value: 1, enumerable: true });
    expectFail(() => evaluateRule8Shadow(withSym), 'INVALID_INPUT');
  });

  it('R05 unknown keys / PHI-like / duplicate IDs / malformed evidence / unsupported version', () => {
    expectFail(() => evaluateRule8Shadow({ ...baseInput(), mystery: 1 }), 'INVALID_INPUT');
    expectFail(() => evaluateRule8Shadow({ ...baseInput(), email: 'a@b.c' }), 'INVALID_INPUT');
    expectFail(
      () =>
        evaluateRule8Shadow(
          baseInput({
            prakritiEvidenceRegistry: {
              registryVersion: 'reg-r8-v1',
              entries: [
                baseEntry({
                  entryId: 'DUP',
                  diseaseConditionRef: 'DX_SYN_A',
                  prakritiCategoryRef: 'PK_SYN_CAT_1',
                }),
                baseEntry({
                  entryId: 'DUP',
                  diseaseConditionRef: 'DX_SYN_A',
                  prakritiCategoryRef: 'PK_SYN_CAT_2',
                }),
              ],
            },
          }),
        ),
      'INVALID_EVIDENCE_REGISTRY',
    );
    expectFail(
      () =>
        evaluateRule8Shadow(
          baseInput({
            prakritiEvidenceRegistry: { registryVersion: 'x', entries: [{ bad: true }] },
          }),
        ),
      'INVALID_EVIDENCE_REGISTRY',
    );
    expectFail(
      () => evaluateRule8Shadow(baseInput({ contractVersion: 'nope' })),
      'UNSUPPORTED_CONTRACT_VERSION',
    );
  });

  it('R06 validation-only / owner-approval-only / inactive-stale-disputed-superseded', () => {
    const validationOnly = evaluateRule8Shadow(
      baseInput({
        prakritiEvidenceRegistry: {
          registryVersion: 'reg-r8-v1',
          entries: [
            baseEntry({
              entryId: 'ENTRY_SYN_1',
              diseaseConditionRef: 'DX_SYN_A',
              prakritiCategoryRef: 'PK_SYN_CAT_1',
              evidenceValidationStatus: 'validated',
              ownerClinicalApprovalStatus: 'owner-unapproved',
            }),
          ],
        },
      }),
    );
    expect(validationOnly.status).toBe('NOT_CLINICALLY_INDICATED');
    expect(validationOnly.prakritiIndications).toEqual([]);

    const ownerOnly = evaluateRule8Shadow(
      baseInput({
        prakritiEvidenceRegistry: {
          registryVersion: 'reg-r8-v1',
          entries: [
            baseEntry({
              entryId: 'ENTRY_SYN_1',
              diseaseConditionRef: 'DX_SYN_A',
              prakritiCategoryRef: 'PK_SYN_CAT_1',
              evidenceValidationStatus: 'unvalidated',
              ownerClinicalApprovalStatus: 'approved',
            }),
          ],
        },
      }),
    );
    expect(ownerOnly.status).toBe('NOT_CLINICALLY_INDICATED');

    for (const st of ['inactive', 'stale', 'disputed', 'superseded'] as const) {
      const out = evaluateRule8Shadow(
        baseInput({
          prakritiEvidenceRegistry: {
            registryVersion: 'reg-r8-v1',
            entries: [
              baseEntry({
                entryId: 'ENTRY_SYN_1',
                diseaseConditionRef: 'DX_SYN_A',
                prakritiCategoryRef: 'PK_SYN_CAT_1',
                effectiveStatus: st,
              }),
            ],
          },
        }),
      );
      expect(out.status).toBe('NOT_CLINICALLY_INDICATED');
    }
  });

  it('R07 Rule 6 / Rule 7 / legacy-shaped inputs rejected', () => {
    expectFail(
      () =>
        evaluateRule8Shadow({
          ...baseInput(),
          relationshipEvidenceRegistry: { registryVersion: 'r6', edges: [] },
        }),
      'INVALID_INPUT',
    );
    expectFail(
      () =>
        evaluateRule8Shadow({
          ...baseInput(),
          routeEvidenceRegistry: { registryVersion: 'r7', entries: [] },
        }),
      'INVALID_INPUT',
    );
    expectFail(
      () =>
        evaluateRule8Shadow({
          ...baseInput(),
          selectedEligibleCandidates: ['MED_X'],
        }),
      'INVALID_INPUT',
    );
    expectFail(
      () =>
        evaluateRule8Shadow({
          ...baseInput(),
          infer_disease_prakruti: { votes: [] },
        }),
      'INVALID_INPUT',
    );
    expectFail(
      () =>
        evaluateRule8Shadow({
          ...baseInput(),
          resolve_prakriti: { legacy: true },
        }),
      'INVALID_INPUT',
    );
  });

  it('R08 synthetic ID without all gates never activates; non-synthetic classification blocked', () => {
    const noClass = evaluateRule8Shadow(
      baseInput({
        prakritiEvidenceRegistry: {
          registryVersion: 'reg-r8-v1',
          entries: [
            baseEntry({
              entryId: 'ENTRY_SYN_1',
              diseaseConditionRef: 'DX_SYN_A',
              prakritiCategoryRef: 'PK_SYN_CAT_1',
              testClassification: 'inventory-derived',
            }),
          ],
        },
      }),
    );
    expect(noClass.status).toBe('NOT_CLINICALLY_INDICATED');
    expect(noClass.prakritiIndications).toEqual([]);
  });

  it('R09 caller mutation after evaluation + output mutation attempts', () => {
    const input = baseInput();
    const out = evaluateRule8Shadow(input);
    (input.diseaseConditionRefs as string[]).push('DX_MUT');
    expect(out.evaluatedDiseaseRefs).not.toContain('DX_MUT');
    expect(() => {
      (out.evaluatedDiseaseRefs as string[]).push('X');
    }).toThrow();
    expect(() => {
      (out as { medicineSelectionInfluence: string }).medicineSelectionInfluence = 'RANK';
    }).toThrow();
  });

  it('R10 repeat and reorder determinism + closed vocabularies', () => {
    const first = evaluateRule8Shadow(baseInput());
    const second = evaluateRule8Shadow(baseInput());
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(RULE8_OUTCOMES).toEqual([
      'NOT_APPLICABLE',
      'NOT_EVALUABLE',
      'NOT_CLINICALLY_INDICATED',
      'SHADOW_PRAKRUTI_INDICATIONS_PROPOSED',
      'BLOCKED_BY_RULE1_CONTRADICTION',
      'UNRESOLVED_EVIDENCE',
    ]);
    expect(RULE8_FAILURE_CODES).toEqual([
      'INVALID_INPUT',
      'INVALID_EVIDENCE_REGISTRY',
      'UNSUPPORTED_CONTRACT_VERSION',
      'CONTRADICTORY_UPSTREAM_STATE',
      'INTERNAL_FAILURE',
    ]);
  });

  it('R11 contradictionMarkers → UNRESOLVED_EVIDENCE', () => {
    const out = evaluateRule8Shadow(
      baseInput({
        prakritiEvidenceRegistry: {
          registryVersion: 'reg-r8-v1',
          entries: [
            baseEntry({
              entryId: 'ENTRY_SYN_1',
              diseaseConditionRef: 'DX_SYN_A',
              prakritiCategoryRef: 'PK_SYN_CAT_1',
              contradictionMarkers: ['MARKER_SYN_CONFLICT'],
            }),
          ],
        },
      }),
    );
    expect(out.status).toBe('UNRESOLVED_EVIDENCE');
    expect(out.prakritiIndications).toEqual([]);
  });

  it('R12 no orchestration/runtime/network/legacy coupling markers in package surface', async () => {
    const src = await import('../src/index.ts');
    expect(src.evaluateRule8Shadow).toBeTypeOf('function');
    expect(src.RULE8_ORCHESTRATION_STATUS).toBe('NOT_CONNECTED');
    expect(src.RULE8_PRESCRIPTION_EFFECT).toBe('NONE');
    expect(JSON.stringify(Object.keys(src).sort())).not.toMatch(
      /mongoose|fetch|axios|fs\.|path\.|net\.|http|legacy|external_application/i,
    );
  });
});
