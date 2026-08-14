import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  RULE2_ANNOTATION_KEY_ORDER,
  RULE2_DISEASE_POLARITY_TOKENS,
  RULE2_EVIDENCE_CATALOG_STATUS,
  RULE2_FAILURE_CODES,
  RULE2_INPUT_CONTRACT_VERSION,
  RULE2_INPUT_KEY_ORDER,
  RULE2_NOT_CLINICALLY_ACTIVATED_PRESCRIPTION,
  RULE2_ORCHESTRATION_STATUS,
  RULE2_OUTCOMES,
  RULE2_OUTPUT_CONTRACT_VERSION,
  RULE2_OUTPUT_KEY_ORDER,
  RULE2_PRESCRIPTION_EFFECT,
  RULE2_PRODUCTION_MAPPING_REGISTRY,
  RULE2_RULE_IDENTITY,
  RULE2_RULE_NUMBER,
  RULE2_RUNTIME_STATUS,
  RULE2_SYNTHETIC_TEST_CLASSIFICATION,
  RULE2_THERAPEUTIC_POLARITY_TOKENS,
  Rule2EvaluationError,
  evaluateRule2Shadow,
  type Rule2PolarityEvidenceEntry,
} from '../src/index.ts';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function baseEntry(
  over: Partial<Rule2PolarityEvidenceEntry> &
    Pick<Rule2PolarityEvidenceEntry, 'entryId' | 'formulaSlotId' | 'diseasePolarity'>,
): Rule2PolarityEvidenceEntry {
  return {
    formulaTargetId: 'TGT_SYN_1',
    contradictionMarkers: [],
    evidenceSourceId: 'EVID_SYN_R2_1',
    evidenceValidationStatus: 'validated',
    ownerClinicalApprovalStatus: 'approved',
    version: 'entry-v1',
    effectiveStatus: 'APPROVED_AND_ACTIVE',
    supersessionMetadata: null,
    testClassification: RULE2_SYNTHETIC_TEST_CLASSIFICATION,
    ...over,
  };
}

function baseInput(over: Record<string, unknown> = {}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    contractVersion: RULE2_INPUT_CONTRACT_VERSION,
    requestId: 'CASE_SYN_R2_001',
    formulaSlotPolarityEvidenceRegistry: {
      registryVersion: 'reg-r2-v1',
      entries: [
        baseEntry({
          entryId: 'POL_SYN_1',
          formulaSlotId: 'SLOT_SYN_A',
          diseasePolarity: 'POSITIVE',
        }),
      ],
    },
    orderedFormulaSlotRefs: [{ formulaSlotId: 'SLOT_SYN_A', formulaTargetId: 'TGT_SYN_1' }],
    doctorSuppliedSlotBoundEvidenceItems: [
      { itemId: 'EVID_SYN_ITEM_1', formulaSlotId: 'SLOT_SYN_A', evidenceClass: 'DOCTOR_SLOT_NOTE' },
    ],
    casePolaritySummary: { status: 'NOT_SUPPLIED' },
    slotBoundSupportingSignalRefs: { status: 'NOT_SUPPLIED' },
    evidenceDataVersions: {
      evidenceDataVersion: 'ev-v1',
      polarityRegistryVersion: 'reg-r2-v1',
      contractVersion: RULE2_INPUT_CONTRACT_VERSION,
      governanceVersion: 'gov-v1',
    },
    upstreamApplicability: { status: 'APPLICABLE', notes: [] },
  };
  return { ...base, ...over };
}

function expectFail(fn: () => void, code: (typeof RULE2_FAILURE_CODES)[number]): void {
  try {
    fn();
    expect.fail('expected Rule2EvaluationError');
  } catch (e) {
    expect(e).toBeInstanceOf(Rule2EvaluationError);
    const err = e as Rule2EvaluationError;
    expect(err.failureCode).toBe(code);
    expect(err.message).toBe(code);
  }
}

describe('Rule 2 Polarity Engine shadow proofs P01–P18', () => {
  it('P01 strict input schema and unknown keys', () => {
    expectFail(() => evaluateRule2Shadow({ ...baseInput(), extra: 1 }), 'INVALID_INPUT');
    expectFail(() => evaluateRule2Shadow('x'), 'INVALID_INPUT');
    expect(RULE2_INPUT_KEY_ORDER).toHaveLength(9);
    expect(RULE2_OUTPUT_KEY_ORDER).toHaveLength(18);
    expect(RULE2_ANNOTATION_KEY_ORDER).toHaveLength(12);
    expect(RULE2_DISEASE_POLARITY_TOKENS).toHaveLength(6);
    expect(RULE2_THERAPEUTIC_POLARITY_TOKENS).toHaveLength(3);
    expect(RULE2_OUTCOMES).toHaveLength(7);
    expect(RULE2_FAILURE_CODES).toHaveLength(5);
  });

  it('P02 empty production registry / mappings 0 / catalog not created', () => {
    expect(RULE2_PRODUCTION_MAPPING_REGISTRY.entries).toEqual([]);
    expect(RULE2_PRODUCTION_MAPPING_REGISTRY.activeRealMappingCount).toBe(0);
    expect(Object.isFrozen(RULE2_PRODUCTION_MAPPING_REGISTRY)).toBe(true);
    expect(RULE2_EVIDENCE_CATALOG_STATUS).toBe('NOT_CREATED');
    const nonSynthetic = evaluateRule2Shadow(
      baseInput({
        formulaSlotPolarityEvidenceRegistry: {
          registryVersion: 'reg-r2-v1',
          entries: [
            baseEntry({
              entryId: 'POL_REAL_1',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'POSITIVE',
              testClassification: 'OWNER_APPROVED',
            }),
          ],
        },
      }),
    );
    expect(nonSynthetic.status).toBe('NOT_EVALUABLE');
    expect(nonSynthetic.shadowOnly).toBe(true);
  });

  it('P03 no / insufficient evidence → UNRESOLVED + NEUTRAL + doctor review', () => {
    const out = evaluateRule2Shadow(
      baseInput({
        formulaSlotPolarityEvidenceRegistry: { registryVersion: 'reg-r2-v1', entries: [] },
        doctorSuppliedSlotBoundEvidenceItems: [],
      }),
    );
    expect(out.status).toBe('ADDITIONAL_INFORMATION_REQUIRED');
    expect(out.formulaSlotAnnotations).toHaveLength(1);
    expect(out.formulaSlotAnnotations[0]?.diseasePolarity).toBe('UNRESOLVED');
    expect(out.formulaSlotAnnotations[0]?.requiredTherapeuticPolarity).toBe('NEUTRAL');
    expect(out.formulaSlotAnnotations[0]?.doctorReviewRequired).toBe(true);
    expect(out.doctorReviewRequired).toBe(true);
    expect(out.evidenceGaps.length).toBeGreaterThan(0);
  });

  it('P04 formula/slot-specific isolation; case summary does not drive all slots', () => {
    const out = evaluateRule2Shadow(
      baseInput({
        orderedFormulaSlotRefs: [
          { formulaSlotId: 'SLOT_SYN_A', formulaTargetId: 'TGT_SYN_1' },
          { formulaSlotId: 'SLOT_SYN_B', formulaTargetId: 'TGT_SYN_2' },
        ],
        formulaSlotPolarityEvidenceRegistry: {
          registryVersion: 'reg-r2-v1',
          entries: [
            baseEntry({
              entryId: 'POL_SYN_1',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'POSITIVE',
            }),
          ],
        },
        casePolaritySummary: {
          status: 'SUPPLIED',
          displayOnly: true,
          mustNotDriveSelection: true,
          headline: 'display-only',
        },
      }),
    );
    expect(out.formulaSlotAnnotations[0]?.diseasePolarity).toBe('POSITIVE');
    expect(out.formulaSlotAnnotations[1]?.diseasePolarity).toBe('UNRESOLVED');
    expect(out.casePolaritySummary?.mustNotDriveSelection).toBe(true);
    expect(out.medicineSelectionInfluence).toBe('NONE');
  });

  it('P05 slot order preserved; no add/remove/reorder/substitute; mutatesMixtures false', () => {
    const out = evaluateRule2Shadow(
      baseInput({
        orderedFormulaSlotRefs: [
          { formulaSlotId: 'SLOT_SYN_Z', formulaTargetId: 'TGT_SYN_Z' },
          { formulaSlotId: 'SLOT_SYN_A', formulaTargetId: 'TGT_SYN_A' },
          { formulaSlotId: 'SLOT_SYN_M', formulaTargetId: 'TGT_SYN_M' },
        ],
        formulaSlotPolarityEvidenceRegistry: {
          registryVersion: 'reg-r2-v1',
          entries: [
            baseEntry({
              entryId: 'POL_SYN_Z',
              formulaSlotId: 'SLOT_SYN_Z',
              formulaTargetId: 'TGT_SYN_Z',
              diseasePolarity: 'NEGATIVE',
            }),
            baseEntry({
              entryId: 'POL_SYN_A',
              formulaSlotId: 'SLOT_SYN_A',
              formulaTargetId: 'TGT_SYN_A',
              diseasePolarity: 'POSITIVE',
              evidenceSourceId: 'EVID_SYN_R2_2',
            }),
            baseEntry({
              entryId: 'POL_SYN_M',
              formulaSlotId: 'SLOT_SYN_M',
              formulaTargetId: 'TGT_SYN_M',
              diseasePolarity: 'NEUTRAL',
              evidenceSourceId: 'EVID_SYN_R2_3',
            }),
          ],
        },
      }),
    );
    expect(out.formulaSlotAnnotations.map((a) => a.formulaSlotId)).toEqual([
      'SLOT_SYN_Z',
      'SLOT_SYN_A',
      'SLOT_SYN_M',
    ]);
    expect(out.formulaSlotAnnotations).toHaveLength(3);
    for (const a of out.formulaSlotAnnotations) {
      expect(a.mutatesMixtures).toBe(false);
    }
    expect(out.formulaMutation).toBe('NONE');
  });

  it('P06 law of opposites POSITIVE→NEGATIVE and NEGATIVE→POSITIVE', () => {
    const pos = evaluateRule2Shadow(
      baseInput({
        formulaSlotPolarityEvidenceRegistry: {
          registryVersion: 'reg-r2-v1',
          entries: [
            baseEntry({
              entryId: 'POL_SYN_POS',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'POSITIVE',
            }),
          ],
        },
      }),
    );
    expect(pos.formulaSlotAnnotations[0]?.diseasePolarity).toBe('POSITIVE');
    expect(pos.formulaSlotAnnotations[0]?.requiredTherapeuticPolarity).toBe('NEGATIVE');
    expect(pos.status).toBe('SHADOW_POLARITY_ANNOTATIONS_PROPOSED');

    const neg = evaluateRule2Shadow(
      baseInput({
        formulaSlotPolarityEvidenceRegistry: {
          registryVersion: 'reg-r2-v1',
          entries: [
            baseEntry({
              entryId: 'POL_SYN_NEG',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'NEGATIVE',
            }),
          ],
        },
      }),
    );
    expect(neg.formulaSlotAnnotations[0]?.diseasePolarity).toBe('NEGATIVE');
    expect(neg.formulaSlotAnnotations[0]?.requiredTherapeuticPolarity).toBe('POSITIVE');
  });

  it('P07 NEUTRAL / SUPPORT_ONLY resolved support role without selection', () => {
    const neu = evaluateRule2Shadow(
      baseInput({
        formulaSlotPolarityEvidenceRegistry: {
          registryVersion: 'reg-r2-v1',
          entries: [
            baseEntry({
              entryId: 'POL_SYN_NEU',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'NEUTRAL',
            }),
          ],
        },
      }),
    );
    expect(neu.formulaSlotAnnotations[0]?.requiredTherapeuticPolarity).toBe('NEUTRAL');
    expect(neu.formulaSlotAnnotations[0]?.resolutionStatus).toBe('RESOLVED');
    expect(neu.medicineSelectionInfluence).toBe('NONE');

    const support = evaluateRule2Shadow(
      baseInput({
        formulaSlotPolarityEvidenceRegistry: {
          registryVersion: 'reg-r2-v1',
          entries: [
            baseEntry({
              entryId: 'POL_SYN_SUP',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'SUPPORT_ONLY',
            }),
          ],
        },
      }),
    );
    expect(support.formulaSlotAnnotations[0]?.diseasePolarity).toBe('SUPPORT_ONLY');
    expect(support.formulaSlotAnnotations[0]?.resolutionStatus).toBe('RESOLVED_SUPPORT_ROLE');
    expect(support.formulaSlotAnnotations[0]?.requiredTherapeuticPolarity).toBe('NEUTRAL');
    expect(support.status).toBe('SHADOW_POLARITY_ANNOTATIONS_PROPOSED');
  });

  it('P08 MIXED → UNRESOLVED + NEUTRAL therapeutic + doctorReviewRequired', () => {
    const out = evaluateRule2Shadow(
      baseInput({
        formulaSlotPolarityEvidenceRegistry: {
          registryVersion: 'reg-r2-v1',
          entries: [
            baseEntry({
              entryId: 'POL_SYN_MIX',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'MIXED',
            }),
          ],
        },
      }),
    );
    expect(out.formulaSlotAnnotations[0]?.diseasePolarity).toBe('MIXED');
    expect(out.formulaSlotAnnotations[0]?.resolutionStatus).toBe('UNRESOLVED');
    expect(out.formulaSlotAnnotations[0]?.requiredTherapeuticPolarity).toBe('NEUTRAL');
    expect(out.formulaSlotAnnotations[0]?.doctorReviewRequired).toBe(true);
    expect(out.doctorReviewRequired).toBe(true);
    expect(out.status).toBe('DOCTOR_REVIEW_REQUIRED');
    expect(out.medicineSelectionInfluence).toBe('NONE');
    expect(out.formulaMutation).toBe('NONE');
  });

  it('P09 forbidden medicine-registry polarity key rejected', () => {
    expectFail(
      () =>
        evaluateRule2Shadow({
          ...baseInput(),
          polarity: 'POSITIVE',
        }),
      'INVALID_INPUT',
    );
    expectFail(
      () =>
        evaluateRule2Shadow(
          baseInput({
            formulaSlotPolarityEvidenceRegistry: {
              registryVersion: 'reg-r2-v1',
              entries: [
                {
                  ...baseEntry({
                    entryId: 'POL_SYN_BAD',
                    formulaSlotId: 'SLOT_SYN_A',
                    diseasePolarity: 'POSITIVE',
                  }),
                  polarity: 'POSITIVE',
                },
              ],
            },
          }),
        ),
      'INVALID_INPUT',
    );
  });

  it('P10 forbidden lifecycle / non-synthetic / unprotected promotion fail-closed', () => {
    const inventory = evaluateRule2Shadow(
      baseInput({
        formulaSlotPolarityEvidenceRegistry: {
          registryVersion: 'reg-r2-v1',
          entries: [
            baseEntry({
              entryId: 'POL_SYN_INV',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'POSITIVE',
              effectiveStatus: 'INVENTORY',
            }),
          ],
        },
      }),
    );
    expect(inventory.formulaSlotAnnotations[0]?.diseasePolarity).toBe('UNRESOLVED');
    expect(inventory.doctorReviewRequired).toBe(true);

    const nonSyn = evaluateRule2Shadow(
      baseInput({
        formulaSlotPolarityEvidenceRegistry: {
          registryVersion: 'reg-r2-v1',
          entries: [
            baseEntry({
              entryId: 'POL_SYN_NS',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'POSITIVE',
              testClassification: 'OWNER_APPROVED',
            }),
          ],
        },
      }),
    );
    expect(nonSyn.status).toBe('NOT_EVALUABLE');

    const stale = evaluateRule2Shadow(
      baseInput({
        formulaSlotPolarityEvidenceRegistry: {
          registryVersion: 'reg-r2-v1',
          entries: [
            baseEntry({
              entryId: 'POL_SYN_STALE',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'NEGATIVE',
              effectiveStatus: 'STALE',
            }),
          ],
        },
      }),
    );
    expect(stale.status).toBe('UNRESOLVED_EVIDENCE');
  });

  it('P11 no medicine selection / ranking; formula mutation NONE', () => {
    const out = evaluateRule2Shadow(baseInput());
    expect(out.medicineSelectionInfluence).toBe('NONE');
    expect(out.formulaMutation).toBe('NONE');
    expect(Object.keys(out)).not.toContain('medicines');
    expect(Object.keys(out)).not.toContain('rankedCandidates');
  });

  it('P12 no potency / electricity / dosage / Tablet / external / Rx fields', () => {
    const out = evaluateRule2Shadow(baseInput());
    const keys = Object.keys(out);
    for (const forbidden of [
      'potency',
      'electricity',
      'dosage',
      'tabletA',
      'tabletB',
      'externalApplication',
      'finalRx',
    ]) {
      expect(keys).not.toContain(forbidden);
    }
    expect(out.prescriptionEffect).toBe('NONE');
    expect(out.clinicalActivation).toBe('NONE');
  });

  it('P13 input non-mutation', () => {
    const input = baseInput();
    const snapshot = JSON.stringify(input);
    evaluateRule2Shadow(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it('P14 deep-freeze output; post-evaluation mutation fails', () => {
    const out = evaluateRule2Shadow(baseInput());
    expect(Object.isFrozen(out)).toBe(true);
    expect(Object.isFrozen(out.formulaSlotAnnotations)).toBe(true);
    expect(() => {
      (out as { status: string }).status = 'HACK';
    }).toThrow();
  });

  it('P15 deterministic key order / fingerprint stability under evidence reorder', () => {
    const a = evaluateRule2Shadow(
      baseInput({
        formulaSlotPolarityEvidenceRegistry: {
          registryVersion: 'reg-r2-v1',
          entries: [
            baseEntry({
              entryId: 'POL_SYN_B',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'POSITIVE',
              evidenceSourceId: 'EVID_SYN_R2_B',
            }),
            baseEntry({
              entryId: 'POL_SYN_A',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'POSITIVE',
              evidenceSourceId: 'EVID_SYN_R2_A',
            }),
          ],
        },
      }),
    );
    const b = evaluateRule2Shadow(
      baseInput({
        formulaSlotPolarityEvidenceRegistry: {
          registryVersion: 'reg-r2-v1',
          entries: [
            baseEntry({
              entryId: 'POL_SYN_A',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'POSITIVE',
              evidenceSourceId: 'EVID_SYN_R2_A',
            }),
            baseEntry({
              entryId: 'POL_SYN_B',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'POSITIVE',
              evidenceSourceId: 'EVID_SYN_R2_B',
            }),
          ],
        },
      }),
    );
    expect(Object.keys(a)).toEqual([...RULE2_OUTPUT_KEY_ORDER]);
    expect(Object.keys(a.formulaSlotAnnotations[0]!)).toEqual([...RULE2_ANNOTATION_KEY_ORDER]);
    expect(a.deterministicFingerprint).toBe(b.deterministicFingerprint);
  });

  it('P16 fixed errors message===failureCode; closed outcome/error sets', () => {
    expectFail(() => evaluateRule2Shadow({}), 'INVALID_INPUT');
    expectFail(
      () => evaluateRule2Shadow(baseInput({ contractVersion: 'ehas2-rule2-input-v999' })),
      'UNSUPPORTED_CONTRACT_VERSION',
    );
    expect(RULE2_OUTCOMES).toEqual([
      'NOT_APPLICABLE',
      'NOT_EVALUABLE',
      'ADDITIONAL_INFORMATION_REQUIRED',
      'UNRESOLVED_EVIDENCE',
      'DOCTOR_REVIEW_REQUIRED',
      'SHADOW_POLARITY_ANNOTATIONS_PROPOSED',
      'BLOCKED_BY_SLOT_CONTRADICTION',
    ]);
    expect(RULE2_FAILURE_CODES).toEqual([
      'INVALID_INPUT',
      'UNSUPPORTED_CONTRACT_VERSION',
      'INVALID_EVIDENCE_REGISTRY',
      'CONTRADICTORY_INPUT_STATE',
      'INTERNAL_FAILURE',
    ]);
  });

  it('P17 no PHI / protected-path / raw report-photo leakage', () => {
    expectFail(() => evaluateRule2Shadow({ ...baseInput(), patientName: 'X' }), 'INVALID_INPUT');
    expectFail(
      () => evaluateRule2Shadow({ ...baseInput(), filePath: 'C:\\secret' }),
      'INVALID_INPUT',
    );
    expectFail(
      () =>
        evaluateRule2Shadow(
          baseInput({
            slotBoundSupportingSignalRefs: {
              status: 'SUPPLIED',
              signals: [
                {
                  formulaSlotId: 'SLOT_SYN_A',
                  signalClass: 'PHOTO',
                  signalRefId: 'C:\\photos\\x.jpg',
                },
              ],
            },
          }),
        ),
      'INVALID_INPUT',
    );
    const out = evaluateRule2Shadow(baseInput());
    const blob = JSON.stringify(out);
    expect(blob).not.toMatch(/patientName|mrn|\\\\|C:\\\\/i);
  });

  it('P18 no Rule 4 / orchestration / runtime / production wiring in package', () => {
    expect(RULE2_ORCHESTRATION_STATUS).toBe('NOT_CONNECTED');
    expect(RULE2_RUNTIME_STATUS).toBe('NOT_CONNECTED');
    expect(RULE2_PRESCRIPTION_EFFECT).toBe('NONE');
    expect(RULE2_NOT_CLINICALLY_ACTIVATED_PRESCRIPTION).toBe(true);
    expect(RULE2_RULE_IDENTITY).toBe('POLARITY_ENGINE');
    expect(RULE2_RULE_NUMBER).toBe(2);
    expect(RULE2_OUTPUT_CONTRACT_VERSION).toBe('ehas2-rule2-output-v1');

    const pkg = JSON.parse(readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
      name: string;
      version: string;
    };
    expect(pkg.name).toBe('@ehas2/rule2');
    expect(pkg.version).toBe('0.1.0-shadow');
    expect(pkg.dependencies).toEqual({});

    const srcFiles = readdirSync(path.join(PKG_ROOT, 'src'));
    for (const f of srcFiles) {
      const text = readFileSync(path.join(PKG_ROOT, 'src', f), 'utf8');
      expect(text).not.toMatch(/@ehas2\/rule1|@ehas2\/rule3|@ehas2\/rule4/);
      expect(text).not.toMatch(/console\./);
      expect(text).not.toMatch(/from ['"]node:fs['"]|from ['"]node:net['"]|from ['"]node:http/);
    }
  });
});

describe('Rule 2 adversarial regressions', () => {
  it('rejects top-level and nested Proxy with zero trap execution', () => {
    let traps = 0;
    const proxied = new Proxy(
      { ...baseInput() },
      {
        get(t, p, r) {
          traps += 1;
          return Reflect.get(t, p, r);
        },
      },
    );
    expectFail(() => evaluateRule2Shadow(proxied), 'INVALID_INPUT');
    expect(traps).toBe(0);

    let nestedTraps = 0;
    const nested = baseInput({
      formulaSlotPolarityEvidenceRegistry: new Proxy(
        { registryVersion: 'reg-r2-v1', entries: [] },
        {
          get(t, p, r) {
            nestedTraps += 1;
            return Reflect.get(t, p, r);
          },
        },
      ),
    });
    expectFail(() => evaluateRule2Shadow(nested), 'INVALID_INPUT');
    expect(nestedTraps).toBe(0);
  });

  it('rejects throwing getters with zero invocations', () => {
    let calls = 0;
    const obj: Record<string, unknown> = {};
    for (const k of RULE2_INPUT_KEY_ORDER) {
      Object.defineProperty(obj, k, {
        enumerable: true,
        configurable: true,
        get() {
          calls += 1;
          throw new Error('getter');
        },
      });
    }
    expectFail(() => evaluateRule2Shadow(obj), 'INVALID_INPUT');
    expect(calls).toBe(0);
  });

  it('rejects cycles, sparse arrays, and symbol keys', () => {
    const cycleRoot: Record<string, unknown> = { a: 1 };
    cycleRoot.b = cycleRoot;
    expectFail(() => evaluateRule2Shadow(cycleRoot), 'INVALID_INPUT');

    const holey: unknown[] = [{ formulaSlotId: 'SLOT_SYN_A', formulaTargetId: 'TGT_SYN_1' }];
    delete holey[0];
    holey.length = 1;
    expectFail(
      () => evaluateRule2Shadow(baseInput({ orderedFormulaSlotRefs: holey })),
      'INVALID_INPUT',
    );

    const withSym = baseInput();
    Object.defineProperty(withSym, Symbol('x'), { value: 1, enumerable: true });
    expectFail(() => evaluateRule2Shadow(withSym), 'INVALID_INPUT');
  });

  it('rejects duplicate slot/evidence IDs and unsupported versions', () => {
    expectFail(
      () =>
        evaluateRule2Shadow(
          baseInput({
            orderedFormulaSlotRefs: [
              { formulaSlotId: 'SLOT_SYN_A', formulaTargetId: 'TGT_SYN_1' },
              { formulaSlotId: 'SLOT_SYN_A', formulaTargetId: 'TGT_SYN_2' },
            ],
          }),
        ),
      'INVALID_INPUT',
    );
    expectFail(
      () =>
        evaluateRule2Shadow(
          baseInput({
            formulaSlotPolarityEvidenceRegistry: {
              registryVersion: 'reg-r2-v1',
              entries: [
                baseEntry({
                  entryId: 'POL_SYN_DUP',
                  formulaSlotId: 'SLOT_SYN_A',
                  diseasePolarity: 'POSITIVE',
                }),
                baseEntry({
                  entryId: 'POL_SYN_DUP',
                  formulaSlotId: 'SLOT_SYN_A',
                  diseasePolarity: 'NEGATIVE',
                }),
              ],
            },
          }),
        ),
      'INVALID_EVIDENCE_REGISTRY',
    );
    expectFail(
      () => evaluateRule2Shadow(baseInput({ contractVersion: 'nope' })),
      'UNSUPPORTED_CONTRACT_VERSION',
    );
  });

  it('full lifecycle fail-closed matrix (non-activating classes)', () => {
    const blocking = [
      'INVENTORY',
      'SUBMITTED',
      'UNDER_REVIEW',
      'TECHNICALLY_SCHEMA_VALID',
      'EVIDENCE_VALIDATED',
      'OWNER_APPROVED',
      'STALE',
      'DISPUTED',
      'SUPERSEDED',
    ] as const;
    for (const status of blocking) {
      const out = evaluateRule2Shadow(
        baseInput({
          formulaSlotPolarityEvidenceRegistry: {
            registryVersion: 'reg-r2-v1',
            entries: [
              baseEntry({
                entryId: `POL_SYN_${status}`,
                formulaSlotId: 'SLOT_SYN_A',
                diseasePolarity: 'POSITIVE',
                effectiveStatus: status,
              }),
            ],
          },
        }),
      );
      expect(out.formulaSlotAnnotations[0]?.diseasePolarity).not.toBe('POSITIVE');
      expect(out.status).not.toBe('SHADOW_POLARITY_ANNOTATIONS_PROPOSED');
    }
  });

  it('empty production registry; non-synthetic bypass attempts fail closed', () => {
    expect(RULE2_PRODUCTION_MAPPING_REGISTRY.entries).toHaveLength(0);
    const out = evaluateRule2Shadow(
      baseInput({
        formulaSlotPolarityEvidenceRegistry: {
          registryVersion: 'production-empty-v0',
          entries: [
            baseEntry({
              entryId: 'POL_APPROVED_REAL',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'POSITIVE',
              testClassification: 'APPROVED_AND_ACTIVE',
            }),
          ],
        },
      }),
    );
    expect(out.status).toBe('NOT_EVALUABLE');
    expect(out.shadowOnly).toBe(true);
  });

  it('slot contradiction precedence BLOCKED_BY_SLOT_CONTRADICTION', () => {
    const out = evaluateRule2Shadow(
      baseInput({
        formulaSlotPolarityEvidenceRegistry: {
          registryVersion: 'reg-r2-v1',
          entries: [
            baseEntry({
              entryId: 'POL_SYN_P',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'POSITIVE',
            }),
            baseEntry({
              entryId: 'POL_SYN_N',
              formulaSlotId: 'SLOT_SYN_A',
              diseasePolarity: 'NEGATIVE',
              evidenceSourceId: 'EVID_SYN_R2_2',
            }),
          ],
        },
      }),
    );
    expect(out.status).toBe('BLOCKED_BY_SLOT_CONTRADICTION');
    expect(out.formulaSlotAnnotations[0]?.resolutionStatus).toBe('CONTRADICTORY');
  });

  it('public export surface identity and empty dependencies', () => {
    const out = evaluateRule2Shadow(
      baseInput({
        upstreamApplicability: { status: 'NOT_APPLICABLE', notes: [] },
        orderedFormulaSlotRefs: [],
      }),
    );
    expect(out.status).toBe('NOT_APPLICABLE');
    expect(out.ruleIdentity).toBe('POLARITY_ENGINE');
    expect(out.shadowOnly).toBe(true);
  });
});
