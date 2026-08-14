import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  RULE1_FAILURE_CODES,
  RULE1_INPUT_CONTRACT_VERSION,
  RULE1_INPUT_KEY_ORDER,
  RULE1_ORCHESTRATION_STATUS,
  RULE1_OUTCOMES,
  RULE1_OUTPUT_CONTRACT_VERSION,
  RULE1_OUTPUT_KEY_ORDER,
  RULE1_PRESCRIPTION_EFFECT,
  RULE1_PRODUCTION_MAPPING_REGISTRY,
  RULE1_RULE_IDENTITY,
  RULE1_RULE_NUMBER,
  RULE1_RUNTIME_STATUS,
  RULE1_NOT_CLINICALLY_ACTIVATED_PRESCRIPTION,
  RULE1_SYNTHETIC_TEST_CLASSIFICATION,
  RULE1_TEMPERAMENT_TOKENS,
  Rule1EvaluationError,
  evaluateRule1Shadow,
  type Rule1TemperamentEvidenceEntry,
} from '../src/index.ts';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function baseEntry(
  over: Partial<Rule1TemperamentEvidenceEntry> &
    Pick<Rule1TemperamentEvidenceEntry, 'entryId' | 'temperamentToken'>,
): Rule1TemperamentEvidenceEntry {
  return {
    evidenceKind: 'SYMPTOM_OR_OBSERVATION',
    supportUnits: 1,
    contradictionMarkers: [],
    evidenceSourceId: 'EVID_SYN_R1_1',
    evidenceValidationStatus: 'validated',
    ownerClinicalApprovalStatus: 'approved',
    version: 'entry-v1',
    effectiveStatus: 'APPROVED_AND_ACTIVE',
    supersessionMetadata: null,
    testClassification: RULE1_SYNTHETIC_TEST_CLASSIFICATION,
    biliousSecondaryRequired: false,
    ...over,
  };
}

function baseInput(over: Record<string, unknown> = {}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    contractVersion: RULE1_INPUT_CONTRACT_VERSION,
    requestId: 'CASE_SYN_R1_001',
    caseTemperamentEvidenceRegistry: {
      registryVersion: 'reg-r1-v1',
      entries: [
        baseEntry({
          entryId: 'R1MAP_SYN_1',
          temperamentToken: 'SANGUINE',
        }),
      ],
    },
    doctorSuppliedEvidenceItems: [
      { itemId: 'EVID_SYN_ITEM_1', evidenceClass: 'DOCTOR_RECORDED_SYMPTOM' },
    ],
    bloodPressureEvidence: { status: 'NOT_SUPPLIED' },
    photoEvidenceRef: { status: 'NOT_SUPPLIED' },
    bloodLymphAxisContext: { status: 'NOT_SUPPLIED' },
    rule8ComparisonRef: { status: 'NOT_SUPPLIED' },
    evidenceDataVersions: {
      evidenceDataVersion: 'ev-v1',
      temperamentRegistryVersion: 'reg-r1-v1',
      contractVersion: RULE1_INPUT_CONTRACT_VERSION,
      governanceVersion: 'gov-v1',
    },
    upstreamApplicability: { status: 'APPLICABLE', notes: [] },
  };
  return { ...base, ...over };
}

function expectFail(fn: () => void, code: (typeof RULE1_FAILURE_CODES)[number]): void {
  try {
    fn();
    expect.fail('expected Rule1EvaluationError');
  } catch (e) {
    expect(e).toBeInstanceOf(Rule1EvaluationError);
    const err = e as Rule1EvaluationError;
    expect(err.failureCode).toBe(code);
    expect(err.message).toBe(code);
  }
}

function outputKeys(out: Record<string, unknown>): string[] {
  return Object.keys(out);
}

describe('Rule 1 Temperament Engine shadow proofs P01–P18', () => {
  it('P01 strict input schema and unknown keys', () => {
    expectFail(() => evaluateRule1Shadow({ ...baseInput(), extra: 1 }), 'INVALID_INPUT');
    expectFail(() => evaluateRule1Shadow('x'), 'INVALID_INPUT');
    expect(RULE1_INPUT_KEY_ORDER).toHaveLength(10);
    expect(RULE1_OUTPUT_KEY_ORDER).toHaveLength(20);
  });

  it('P02 empty production registry / mappings 0', () => {
    expect(RULE1_PRODUCTION_MAPPING_REGISTRY.entries).toEqual([]);
    expect(RULE1_PRODUCTION_MAPPING_REGISTRY.activeRealMappingCount).toBe(0);
    expect(Object.isFrozen(RULE1_PRODUCTION_MAPPING_REGISTRY)).toBe(true);
  });

  it('P03 no evidence → UNKNOWN + ADDITIONAL_INFORMATION_REQUIRED', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        caseTemperamentEvidenceRegistry: { registryVersion: 'reg-r1-v1', entries: [] },
        doctorSuppliedEvidenceItems: [],
      }),
    );
    expect(out.status).toBe('ADDITIONAL_INFORMATION_REQUIRED');
    expect(out.primaryTemperament).toBe('UNKNOWN');
    expect(out.resolutionState).toBe('ADDITIONAL_INFORMATION_REQUIRED');
  });

  it('P04 no default LYMPHATIC / MIXED / Balanced on empty', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        caseTemperamentEvidenceRegistry: { registryVersion: 'reg-r1-v1', entries: [] },
        doctorSuppliedEvidenceItems: [],
      }),
    );
    expect(out.primaryTemperament).not.toBe('LYMPHATIC');
    expect(out.primaryTemperament).not.toBe('MIXED');
    expect(out.primaryTemperament).toBe('UNKNOWN');
  });

  it('P05 BP alone and photo alone insufficient', () => {
    const bpAlone = evaluateRule1Shadow(
      baseInput({
        caseTemperamentEvidenceRegistry: { registryVersion: 'reg-r1-v1', entries: [] },
        doctorSuppliedEvidenceItems: [],
        bloodPressureEvidence: { status: 'SUPPLIED', systolicMmHg: 150, unit: 'mmHg' },
      }),
    );
    expect(bpAlone.status).toBe('ADDITIONAL_INFORMATION_REQUIRED');
    expect(bpAlone.primaryTemperament).toBe('UNKNOWN');

    const photoAlone = evaluateRule1Shadow(
      baseInput({
        caseTemperamentEvidenceRegistry: { registryVersion: 'reg-r1-v1', entries: [] },
        doctorSuppliedEvidenceItems: [],
        photoEvidenceRef: { status: 'SUPPLIED', mediaRefId: 'MEDIA_SYN_1' },
      }),
    );
    expect(photoAlone.status).toBe('ADDITIONAL_INFORMATION_REQUIRED');
    expect(photoAlone.primaryTemperament).toBe('UNKNOWN');
  });

  it('P06 Q3 evidence lifecycle non-activating classes respected', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        caseTemperamentEvidenceRegistry: {
          registryVersion: 'reg-r1-v1',
          entries: [
            baseEntry({
              entryId: 'R1MAP_SYN_STALE',
              temperamentToken: 'NERVOUS',
              effectiveStatus: 'STALE',
            }),
          ],
        },
      }),
    );
    expect(out.status).toBe('UNRESOLVED_EVIDENCE');
    expect(out.primaryTemperament).toBeNull();
  });

  it('P07 exact tie → UNRESOLVED_TIE; Q3G no question bank', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        caseTemperamentEvidenceRegistry: {
          registryVersion: 'reg-r1-v1',
          entries: [
            baseEntry({ entryId: 'R1MAP_SYN_A', temperamentToken: 'SANGUINE', supportUnits: 2 }),
            baseEntry({
              entryId: 'R1MAP_SYN_B',
              temperamentToken: 'NERVOUS',
              supportUnits: 2,
              evidenceSourceId: 'EVID_SYN_R1_2',
            }),
          ],
        },
      }),
    );
    expect(out.status).toBe('UNRESOLVED_TIE');
    expect(out.resolutionState).toBe('UNRESOLVED_TIE');
    expect(out.primaryTemperament).toBeNull();
    expect(out.mixedComponents).toEqual(['NERVOUS', 'SANGUINE']);
    expect(out.reasonCodes).toContain('R1_NO_QUESTION_BANK');
  });

  it('P08 Bilious unresolved secondary fail-closed', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        caseTemperamentEvidenceRegistry: {
          registryVersion: 'reg-r1-v1',
          entries: [
            baseEntry({
              entryId: 'R1MAP_SYN_BIL',
              temperamentToken: 'BILIOUS_HEPATIC',
              biliousSecondaryRequired: true,
            }),
          ],
        },
      }),
    );
    expect(out.status).toBe('UNRESOLVED_EVIDENCE');
    expect(out.primaryTemperament).toBeNull();
    expect(out.blockersOrUnresolvedEvidence).toContain('R1_BILIOUS_SECONDARY_UNRESOLVED');
  });

  it('P09 Rule 8 separation — no overwrite / silent merge', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        rule8ComparisonRef: {
          status: 'CONSISTENT',
          refId: 'R8REF_SYN_1',
          version: 'r8-v1',
        },
      }),
    );
    expect(out.status).toBe('SHADOW_TEMPERAMENT_INDICATION_PROPOSED');
    expect(out.rule8ComparisonState).toBe('CONSISTENT');
    expect(out.primaryTemperament).toBe('SANGUINE');
    expect(Object.prototype.hasOwnProperty.call(out, 'prakriti')).toBe(false);
  });

  it('P10 Rule 8 CONFLICT → BLOCKED_BY_RULE8_CONTRADICTION', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        rule8ComparisonRef: {
          status: 'CONFLICT',
          refId: 'R8REF_SYN_CONFLICT',
          version: 'r8-v1',
        },
      }),
    );
    expect(out.status).toBe('BLOCKED_BY_RULE8_CONTRADICTION');
    expect(out.primaryTemperament).toBeNull();
  });

  it('P11 no medicine / formula / Rx fields', () => {
    const out = evaluateRule1Shadow(baseInput()) as unknown as Record<string, unknown>;
    for (const k of [
      'medicineId',
      'formulaId',
      'potency',
      'dosage',
      'electricity',
      'tabletA',
      'mixtureCount',
      'prescription',
    ]) {
      expect(out[k]).toBeUndefined();
    }
  });

  it('P12 medicine influence / activation / Rx NONE; shadowOnly true', () => {
    const out = evaluateRule1Shadow(baseInput());
    expect(out.shadowOnly).toBe(true);
    expect(out.medicineSelectionInfluence).toBe('NONE');
    expect(out.clinicalActivation).toBe('NONE');
    expect(out.prescriptionEffect).toBe('NONE');
  });

  it('P13 input non-mutation', () => {
    const input = baseInput();
    const snap = JSON.stringify(input);
    evaluateRule1Shadow(input);
    expect(JSON.stringify(input)).toBe(snap);
  });

  it('P14 deep-freeze output', () => {
    const out = evaluateRule1Shadow(baseInput());
    expect(Object.isFrozen(out)).toBe(true);
    expect(Object.isFrozen(out.reasonCodes)).toBe(true);
    expect(() => {
      (out as { status: string }).status = 'NOT_EVALUABLE';
    }).toThrow();
  });

  it('P15 deterministic key order / fingerprint', () => {
    const a = evaluateRule1Shadow(baseInput());
    const b = evaluateRule1Shadow(baseInput());
    expect(outputKeys(a as unknown as Record<string, unknown>)).toEqual([
      ...RULE1_OUTPUT_KEY_ORDER,
    ]);
    expect(a.deterministicFingerprint).toBe(b.deterministicFingerprint);
    expect(a.contractVersion).toBe(RULE1_OUTPUT_CONTRACT_VERSION);
  });

  it('P16 fixed errors / closed vocabularies', () => {
    expectFail(
      () => evaluateRule1Shadow(baseInput({ contractVersion: 'wrong' })),
      'UNSUPPORTED_CONTRACT_VERSION',
    );
    expect(RULE1_OUTCOMES).toHaveLength(7);
    expect(RULE1_FAILURE_CODES).toHaveLength(5);
    expect(RULE1_TEMPERAMENT_TOKENS).toHaveLength(6);
  });

  it('P17 PHI / protected-path / raw image rejection', () => {
    expectFail(() => evaluateRule1Shadow(baseInput({ patientName: 'x' })), 'INVALID_INPUT');
    expectFail(
      () =>
        evaluateRule1Shadow(
          baseInput({
            photoEvidenceRef: { status: 'SUPPLIED', mediaRefId: 'C:/secrets/img.png' },
          }),
        ),
      'INVALID_INPUT',
    );
  });

  it('P18 no orchestration / runtime wiring; package invariants', () => {
    expect(RULE1_ORCHESTRATION_STATUS).toBe('NOT_CONNECTED');
    expect(RULE1_RUNTIME_STATUS).toBe('NOT_CONNECTED');
    expect(RULE1_PRESCRIPTION_EFFECT).toBe('NONE');
    expect(RULE1_NOT_CLINICALLY_ACTIVATED_PRESCRIPTION).toBe(true);
    expect(RULE1_RULE_NUMBER).toBe(1);
    expect(RULE1_RULE_IDENTITY).toBe('TEMPERAMENT_ENGINE');
    const srcFiles = readdirSync(path.join(PKG_ROOT, 'src'));
    const blob = srcFiles
      .map((f) => readFileSync(path.join(PKG_ROOT, 'src', f), 'utf8'))
      .join('\n');
    expect(blob).not.toMatch(/analyzeComplete|ORCHESTRATION_CONNECT|fs\.readFile|fetch\(/);
  });
});

describe('Rule 1 focused regressions', () => {
  it('Proxy / getter rejection', () => {
    const proxy = new Proxy(baseInput(), {
      get(t, p, r) {
        return Reflect.get(t, p, r);
      },
    });
    expectFail(() => evaluateRule1Shadow(proxy), 'INVALID_INPUT');

    const withGetter = baseInput();
    Object.defineProperty(withGetter, 'requestId', {
      get() {
        return 'CASE_SYN_BAD';
      },
      enumerable: true,
    });
    expectFail(() => evaluateRule1Shadow(withGetter), 'INVALID_INPUT');
  });

  it('sparse array / cycle / symbol rejection', () => {
    const sparse = baseInput();
    const arr: unknown[] = [];
    arr[1] = { itemId: 'EVID_SYN_X', evidenceClass: 'DOCTOR_RECORDED_SYMPTOM' };
    sparse.doctorSuppliedEvidenceItems = arr;
    expectFail(() => evaluateRule1Shadow(sparse), 'INVALID_INPUT');

    const cyclic: Record<string, unknown> = baseInput();
    (cyclic as { self?: unknown }).self = cyclic;
    // cycle via unknown key already fails key count; build cycle inside notes
    const c2 = baseInput({
      upstreamApplicability: { status: 'APPLICABLE', notes: [] },
    });
    const node: Record<string, unknown> = { a: 1 };
    node.b = node;
    // notes must be strings — invalid type / cycle
    (c2.upstreamApplicability as { notes: unknown }).notes = [node];
    expectFail(() => evaluateRule1Shadow(c2), 'INVALID_INPUT');

    const sym = baseInput();
    Object.defineProperty(sym, Symbol('x'), { value: 1, enumerable: true });
    // symbols on own keys fail accessors/symbol check during assertNoAccessors
    expectFail(() => evaluateRule1Shadow(sym), 'INVALID_INPUT');
  });

  it('duplicate evidence IDs / unsupported version / unknown nested keys', () => {
    expectFail(
      () =>
        evaluateRule1Shadow(
          baseInput({
            caseTemperamentEvidenceRegistry: {
              registryVersion: 'reg-r1-v1',
              entries: [
                baseEntry({ entryId: 'R1MAP_SYN_DUP', temperamentToken: 'SANGUINE' }),
                baseEntry({ entryId: 'R1MAP_SYN_DUP', temperamentToken: 'NERVOUS' }),
              ],
            },
          }),
        ),
      'INVALID_EVIDENCE_REGISTRY',
    );
    expectFail(
      () => evaluateRule1Shadow(baseInput({ contractVersion: 'ehas2-rule1-input-v0' })),
      'UNSUPPORTED_CONTRACT_VERSION',
    );
  });

  it('BP boundary values and order independence on equal scores', () => {
    const withBp = evaluateRule1Shadow(
      baseInput({
        bloodPressureEvidence: { status: 'SUPPLIED', systolicMmHg: 140, unit: 'mmHg' },
      }),
    );
    expect(withBp.status).toBe('SHADOW_TEMPERAMENT_INDICATION_PROPOSED');
    expect(withBp.primaryTemperament).toBe('SANGUINE');

    const lymphBp = evaluateRule1Shadow(
      baseInput({
        caseTemperamentEvidenceRegistry: {
          registryVersion: 'reg-r1-v1',
          entries: [
            baseEntry({ entryId: 'R1MAP_SYN_L', temperamentToken: 'LYMPHATIC', supportUnits: 1 }),
          ],
        },
        bloodPressureEvidence: { status: 'SUPPLIED', systolicMmHg: 99, unit: 'mmHg' },
      }),
    );
    expect(lymphBp.primaryTemperament).toBe('LYMPHATIC');

    const orderA = evaluateRule1Shadow(
      baseInput({
        caseTemperamentEvidenceRegistry: {
          registryVersion: 'reg-r1-v1',
          entries: [
            baseEntry({ entryId: 'R1MAP_SYN_Z', temperamentToken: 'NERVOUS', supportUnits: 1 }),
            baseEntry({
              entryId: 'R1MAP_SYN_Y',
              temperamentToken: 'SANGUINE',
              supportUnits: 1,
              evidenceSourceId: 'EVID_SYN_R1_2',
            }),
          ],
        },
      }),
    );
    const orderB = evaluateRule1Shadow(
      baseInput({
        caseTemperamentEvidenceRegistry: {
          registryVersion: 'reg-r1-v1',
          entries: [
            baseEntry({
              entryId: 'R1MAP_SYN_Y',
              temperamentToken: 'SANGUINE',
              supportUnits: 1,
              evidenceSourceId: 'EVID_SYN_R1_2',
            }),
            baseEntry({ entryId: 'R1MAP_SYN_Z', temperamentToken: 'NERVOUS', supportUnits: 1 }),
          ],
        },
      }),
    );
    expect(orderA.status).toBe('UNRESOLVED_TIE');
    expect(orderB.status).toBe('UNRESOLVED_TIE');
    expect(orderA.mixedComponents).toEqual(orderB.mixedComponents);
  });

  it('post-evaluation caller mutation cannot alter output; export surface', () => {
    const input = baseInput();
    const out = evaluateRule1Shadow(input);
    (
      (input.caseTemperamentEvidenceRegistry as { entries: Rule1TemperamentEvidenceEntry[] })
        .entries as Rule1TemperamentEvidenceEntry[]
    ).push(baseEntry({ entryId: 'R1MAP_SYN_MUT', temperamentToken: 'NERVOUS' }));
    expect(out.primaryTemperament).toBe('SANGUINE');
    expect(() => {
      (out.reasonCodes as string[]).push('x');
    }).toThrow();
    expect(() => {
      (out as { medicineSelectionInfluence: string }).medicineSelectionInfluence = 'RANK';
    }).toThrow();
  });

  it('NOT_APPLICABLE upstream', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        upstreamApplicability: { status: 'NOT_APPLICABLE', notes: ['n/a'] },
      }),
    );
    expect(out.status).toBe('NOT_APPLICABLE');
  });
});
