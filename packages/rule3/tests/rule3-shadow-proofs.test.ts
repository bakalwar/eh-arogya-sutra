import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  RULE3_ANNOTATION_KEY_ORDER,
  RULE3_DETECTION_METHOD_CLASSES,
  RULE3_EVIDENCE_CATALOG_STATUS,
  RULE3_EVIDENCE_ENTRY_KEY_ORDER,
  RULE3_FAILURE_CODES,
  RULE3_INDICATION_STATUSES,
  RULE3_INPUT_CONTRACT_VERSION,
  RULE3_INPUT_KEY_ORDER,
  RULE3_NOT_CLINICALLY_ACTIVATED_PRESCRIPTION,
  RULE3_ORCHESTRATION_STATUS,
  RULE3_OUTCOMES,
  RULE3_OUTPUT_CONTRACT_VERSION,
  RULE3_OUTPUT_KEY_ORDER,
  RULE3_PRESCRIPTION_EFFECT,
  RULE3_PRODUCTION_MAPPING_REGISTRY,
  RULE3_REAL_CLOSED_ORGAN_SYSTEM_CATALOG_STATUS,
  RULE3_REGISTRY_KEY_ORDER,
  RULE3_RULE_IDENTITY,
  RULE3_RULE_NUMBER,
  RULE3_RUNTIME_STATUS,
  RULE3_SYNTHETIC_TEST_CLASSIFICATION,
  RULE3_SYSTEM_ROLES,
  RULE3_UNRESOLVED_REASON,
  RULE3_VERIFICATION_STATUSES,
  Rule3EvaluationError,
  evaluateRule3Shadow,
  type Rule3OrganSystemEvidenceEntry,
} from '../src/index.ts';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function baseEntry(
  over: Partial<Rule3OrganSystemEvidenceEntry> &
    Pick<Rule3OrganSystemEvidenceEntry, 'entryId' | 'bindingRefId'>,
): Rule3OrganSystemEvidenceEntry {
  return {
    organSystemToken: 'SYS_SYN_ALPHA',
    systemRole: 'PRIMARY',
    verificationStatus: 'VERIFIED',
    detectionMethodClass: 'SYNTHETIC_TEST_ONLY',
    evidenceSourceId: 'EVID_SYN_R3_1',
    evidenceValidationStatus: 'validated',
    ownerClinicalApprovalStatus: 'approved',
    version: 'entry-v1',
    effectiveStatus: 'APPROVED_AND_ACTIVE',
    testClassification: RULE3_SYNTHETIC_TEST_CLASSIFICATION,
    ...over,
  };
}

function baseInput(over: Record<string, unknown> = {}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    contractVersion: RULE3_INPUT_CONTRACT_VERSION,
    requestId: 'CASE_SYN_R3_001',
    organSystemAffinityEvidenceRegistry: {
      registryVersion: 'reg-r3-v1',
      entries: [
        baseEntry({
          entryId: 'OSA_SYN_1',
          bindingRefId: 'BIND_SYN_A',
        }),
      ],
      activeRealMappingCount: 0,
    },
    orderedEvidenceBindingRefs: [{ bindingRefId: 'BIND_SYN_A' }],
    doctorSuppliedStructuredEvidenceItems: [
      { itemId: 'EVID_SYN_ITEM_1', bindingRefId: 'BIND_SYN_A', evidenceClass: 'DOCTOR_NOTE' },
    ],
    caseOrganSystemSummary: { status: 'NOT_SUPPLIED' },
    structuredFindingRefs: { status: 'NOT_SUPPLIED' },
    evidenceDataVersions: {
      evidenceDataVersion: 'ev-v1',
      organSystemRegistryVersion: 'reg-r3-v1',
      contractVersion: RULE3_INPUT_CONTRACT_VERSION,
      governanceVersion: 'gov-v1',
    },
    upstreamApplicability: { status: 'APPLICABLE', notes: [] },
  };
  return { ...base, ...over };
}

function expectFail(fn: () => void, code: (typeof RULE3_FAILURE_CODES)[number]): void {
  try {
    fn();
    expect.fail('expected Rule3EvaluationError');
  } catch (e) {
    expect(e).toBeInstanceOf(Rule3EvaluationError);
    const err = e as Rule3EvaluationError;
    expect(err.failureCode).toBe(code);
    expect(err.message).toBe(code);
  }
}

describe('Rule 3 Organ-System Affinity shadow proofs P01–P18', () => {
  it('P01 exact input schema / version / unknown-key rejection', () => {
    expectFail(() => evaluateRule3Shadow({ ...baseInput(), extra: 1 }), 'INVALID_INPUT');
    expectFail(() => evaluateRule3Shadow('x'), 'INVALID_INPUT');
    expectFail(
      () => evaluateRule3Shadow(baseInput({ contractVersion: 'wrong-v0' })),
      'UNSUPPORTED_CONTRACT_VERSION',
    );
    expect(RULE3_INPUT_KEY_ORDER).toHaveLength(9);
    expect(RULE3_REGISTRY_KEY_ORDER).toHaveLength(3);
    expect(RULE3_EVIDENCE_ENTRY_KEY_ORDER).toHaveLength(12);
    expect(RULE3_OUTPUT_KEY_ORDER).toHaveLength(18);
    expect(RULE3_ANNOTATION_KEY_ORDER).toHaveLength(11);
    expect(RULE3_OUTCOMES).toHaveLength(7);
    expect(RULE3_FAILURE_CODES).toHaveLength(5);
    expect(RULE3_SYSTEM_ROLES).toHaveLength(4);
    expect(RULE3_VERIFICATION_STATUSES).toHaveLength(3);
    expect(RULE3_INDICATION_STATUSES).toHaveLength(5);
    expect(RULE3_DETECTION_METHOD_CLASSES).toHaveLength(8);
  });

  it('P02 empty registry and real mappings 0 / catalog NOT_CREATED', () => {
    expect(RULE3_PRODUCTION_MAPPING_REGISTRY.entries).toEqual([]);
    expect(RULE3_PRODUCTION_MAPPING_REGISTRY.activeRealMappingCount).toBe(0);
    expect(Object.isFrozen(RULE3_PRODUCTION_MAPPING_REGISTRY)).toBe(true);
    expect(RULE3_EVIDENCE_CATALOG_STATUS).toBe('NOT_CREATED');
    expect(RULE3_REAL_CLOSED_ORGAN_SYSTEM_CATALOG_STATUS).toBe('NOT_CREATED');
    expectFail(
      () =>
        evaluateRule3Shadow(
          baseInput({
            organSystemAffinityEvidenceRegistry: {
              registryVersion: 'reg-r3-v1',
              entries: [],
              activeRealMappingCount: 1,
            },
          }),
        ),
      'INVALID_EVIDENCE_REGISTRY',
    );
    const nonSynthetic = evaluateRule3Shadow(
      baseInput({
        organSystemAffinityEvidenceRegistry: {
          registryVersion: 'reg-r3-v1',
          entries: [
            baseEntry({
              entryId: 'OSA_REAL_1',
              bindingRefId: 'BIND_SYN_A',
              testClassification: 'OWNER_APPROVED',
            }),
          ],
          activeRealMappingCount: 0,
        },
      }),
    );
    expect(nonSynthetic.status).toBe('NOT_EVALUABLE');
    expect(nonSynthetic.shadowOnly).toBe(true);
    expect(nonSynthetic.medicineSelectionInfluence).toBe('NONE');
  });

  it('P03 no evidence → unresolved / information required + INSUFFICIENT_ORGAN_SYSTEM_EVIDENCE', () => {
    const out = evaluateRule3Shadow(
      baseInput({
        organSystemAffinityEvidenceRegistry: {
          registryVersion: 'reg-r3-v1',
          entries: [],
          activeRealMappingCount: 0,
        },
      }),
    );
    expect([
      'ADDITIONAL_INFORMATION_REQUIRED',
      'UNRESOLVED_EVIDENCE',
      'DOCTOR_REVIEW_REQUIRED',
    ]).toContain(out.status);
    expect(out.organSystemAnnotations[0]?.indicationStatus).toBe('UNRESOLVED');
    expect(out.organSystemAnnotations[0]?.unresolvedReason).toBe(RULE3_UNRESOLVED_REASON);
    expect(out.organSystemAnnotations[0]?.organSystemToken).toBeNull();
    expect(out.doctorReviewRequired).toBe(true);
    expect(out.prescriptionEffect).toBe('NONE');
  });

  it('P04 inventory / schema / owner-review lifecycle cannot activate', () => {
    for (const lifecycle of [
      'INVENTORY',
      'SUBMITTED',
      'UNDER_REVIEW',
      'TECHNICALLY_SCHEMA_VALID',
      'EVIDENCE_VALIDATED',
      'OWNER_APPROVED',
    ] as const) {
      const out = evaluateRule3Shadow(
        baseInput({
          organSystemAffinityEvidenceRegistry: {
            registryVersion: 'reg-r3-v1',
            entries: [
              baseEntry({
                entryId: `OSA_SYN_${lifecycle}`,
                bindingRefId: 'BIND_SYN_A',
                effectiveStatus: lifecycle,
              }),
            ],
            activeRealMappingCount: 0,
          },
        }),
      );
      expect(out.status).not.toBe('SHADOW_ORGAN_SYSTEM_ANNOTATIONS_PROPOSED');
      expect(out.organSystemAnnotations[0]?.indicationStatus).not.toBe('SHADOW_ACTIVE_TECHNICAL');
    }
  });

  it('P05 stale / disputed / superseded fail closed', () => {
    for (const lifecycle of ['STALE', 'DISPUTED', 'SUPERSEDED'] as const) {
      const out = evaluateRule3Shadow(
        baseInput({
          organSystemAffinityEvidenceRegistry: {
            registryVersion: 'reg-r3-v1',
            entries: [
              baseEntry({
                entryId: `OSA_SYN_${lifecycle}`,
                bindingRefId: 'BIND_SYN_A',
                effectiveStatus: lifecycle,
              }),
            ],
            activeRealMappingCount: 0,
          },
        }),
      );
      expect(out.status).toBe('UNRESOLVED_EVIDENCE');
      expect(out.doctorReviewRequired).toBe(true);
    }
  });

  it('P06 keyword-only remains LOW_CONFIDENCE_CANDIDATE / candidate-only', () => {
    const out = evaluateRule3Shadow(
      baseInput({
        organSystemAffinityEvidenceRegistry: {
          registryVersion: 'reg-r3-v1',
          entries: [
            baseEntry({
              entryId: 'OSA_SYN_KW',
              bindingRefId: 'BIND_SYN_A',
              systemRole: 'CANDIDATE',
              verificationStatus: 'LOW_CONFIDENCE_CANDIDATE',
              detectionMethodClass: 'KEYWORD_LOW_CONFIDENCE',
              testClassification: RULE3_SYNTHETIC_TEST_CLASSIFICATION,
              effectiveStatus: 'APPROVED_AND_ACTIVE',
            }),
          ],
          activeRealMappingCount: 0,
        },
      }),
    );
    expect(out.status).toBe('DOCTOR_REVIEW_REQUIRED');
    expect(out.organSystemAnnotations[0]?.indicationStatus).toBe('CANDIDATE_ONLY');
    expect(out.organSystemAnnotations[0]?.verificationStatus).toBe('LOW_CONFIDENCE_CANDIDATE');
  });

  it('P07 co-involvement cannot auto-confirm to active', () => {
    const out = evaluateRule3Shadow(
      baseInput({
        organSystemAffinityEvidenceRegistry: {
          registryVersion: 'reg-r3-v1',
          entries: [
            baseEntry({
              entryId: 'OSA_SYN_CO',
              bindingRefId: 'BIND_SYN_A',
              systemRole: 'CO_INVOLVEMENT_CANDIDATE',
              detectionMethodClass: 'CO_INVOLVEMENT_CANDIDATE',
            }),
          ],
          activeRealMappingCount: 0,
        },
      }),
    );
    expect(out.organSystemAnnotations[0]?.indicationStatus).toBe('CANDIDATE_ONLY');
    expect(out.status).not.toBe('SHADOW_ORGAN_SYSTEM_ANNOTATIONS_PROPOSED');
  });

  it('P08 no fallback / default system (including METABOLIC)', () => {
    const out = evaluateRule3Shadow(
      baseInput({
        organSystemAffinityEvidenceRegistry: {
          registryVersion: 'reg-r3-v1',
          entries: [],
          activeRealMappingCount: 0,
        },
      }),
    );
    expect(out.organSystemAnnotations.every((a) => a.organSystemToken === null)).toBe(true);
    expect(JSON.stringify(out)).not.toMatch(/METABOLIC/);
  });

  it('P09 synthetic conjunctive positive path only (SYS_SYN_* / SYNTHETIC_TEST_ONLY)', () => {
    const out = evaluateRule3Shadow(baseInput());
    expect(out.status).toBe('SHADOW_ORGAN_SYSTEM_ANNOTATIONS_PROPOSED');
    expect(out.organSystemAnnotations[0]?.indicationStatus).toBe('SHADOW_ACTIVE_TECHNICAL');
    expect(out.organSystemAnnotations[0]?.organSystemToken).toBe('SYS_SYN_ALPHA');
    expect(out.shadowOnly).toBe(true);
    expect(out.clinicalActivation).toBe('NONE');
    expect(out.prescriptionEffect).toBe('NONE');
    expect(out.medicineSelectionInfluence).toBe('NONE');
    expect(out.formulaMutation).toBe('NONE');
  });

  it('P10 unknown real organ-system token fail-closed', () => {
    expectFail(
      () =>
        evaluateRule3Shadow(
          baseInput({
            organSystemAffinityEvidenceRegistry: {
              registryVersion: 'reg-r3-v1',
              entries: [
                baseEntry({
                  entryId: 'OSA_BAD_1',
                  bindingRefId: 'BIND_SYN_A',
                  organSystemToken: 'RESPIRATORY',
                }),
              ],
              activeRealMappingCount: 0,
            },
          }),
        ),
      'INVALID_EVIDENCE_REGISTRY',
    );
    expectFail(
      () =>
        evaluateRule3Shadow(
          baseInput({
            organSystemAffinityEvidenceRegistry: {
              registryVersion: 'reg-r3-v1',
              entries: [
                baseEntry({
                  entryId: 'OSA_BAD_2',
                  bindingRefId: 'BIND_SYN_A',
                  organSystemToken: 'METABOLIC',
                }),
              ],
              activeRealMappingCount: 0,
            },
          }),
        ),
      'INVALID_EVIDENCE_REGISTRY',
    );
  });

  it('P11 no medicine / formula / potency / electricity / Rx influence', () => {
    const out = evaluateRule3Shadow(baseInput());
    expect(out.medicineSelectionInfluence).toBe('NONE');
    expect(out.formulaMutation).toBe('NONE');
    expect(out.prescriptionEffect).toBe('NONE');
    expect(RULE3_PRESCRIPTION_EFFECT).toBe('NONE');
    expect(Object.keys(out)).not.toContain('medicineId');
    expect(Object.keys(out)).not.toContain('potency');
    expect(Object.keys(out)).not.toContain('electricity');
    expectFail(() => evaluateRule3Shadow(baseInput({ medicineId: 'A1' })), 'INVALID_INPUT');
  });

  it('P12 Rule 1 / Rule 2 / Triad separation', () => {
    expectFail(
      () => evaluateRule3Shadow(baseInput({ rule1Temperament: 'Lymphatic' })),
      'INVALID_INPUT',
    );
    expectFail(
      () => evaluateRule3Shadow(baseInput({ rule2Polarity: 'POSITIVE' })),
      'INVALID_INPUT',
    );
    expect(RULE3_RULE_IDENTITY).toBe('ORGAN_SYSTEM_AFFINITY');
    expect(RULE3_RULE_NUMBER).toBe(3);
  });

  it('P13 Rule 4 not connected / not activated', () => {
    expect(RULE3_ORCHESTRATION_STATUS).toBe('NOT_CONNECTED');
    expect(RULE3_RUNTIME_STATUS).toBe('NOT_CONNECTED');
    expectFail(() => evaluateRule3Shadow(baseInput({ rule4Pathway: 'active' })), 'INVALID_INPUT');
    const out = evaluateRule3Shadow(baseInput());
    expect(out.clinicalActivation).toBe('NONE');
  });

  it('P14 determinism, order, and fingerprint stability', () => {
    const a = evaluateRule3Shadow(baseInput());
    const b = evaluateRule3Shadow(baseInput());
    expect(a.deterministicFingerprint).toBe(b.deterministicFingerprint);
    expect(Object.keys(a)).toEqual([...RULE3_OUTPUT_KEY_ORDER]);
    expect(Object.keys(a.organSystemAnnotations[0]!)).toEqual([...RULE3_ANNOTATION_KEY_ORDER]);
    const reordered = evaluateRule3Shadow(
      baseInput({
        organSystemAffinityEvidenceRegistry: {
          registryVersion: 'reg-r3-v1',
          entries: [
            baseEntry({
              entryId: 'OSA_SYN_2',
              bindingRefId: 'BIND_SYN_A',
              organSystemToken: 'SYS_SYN_BETA',
              systemRole: 'SECONDARY',
            }),
            baseEntry({
              entryId: 'OSA_SYN_1',
              bindingRefId: 'BIND_SYN_A',
              organSystemToken: 'SYS_SYN_ALPHA',
              systemRole: 'PRIMARY',
            }),
          ],
          activeRealMappingCount: 0,
        },
      }),
    );
    // Contradiction: two different activating tokens on same binding
    expect(reordered.status).toBe('BLOCKED_BY_CONTRADICTION');
  });

  it('P15 input non-mutation and output deep freeze', () => {
    const input = baseInput();
    const snap = JSON.stringify(input);
    const out = evaluateRule3Shadow(input);
    expect(JSON.stringify(input)).toBe(snap);
    expect(Object.isFrozen(out)).toBe(true);
    expect(Object.isFrozen(out.organSystemAnnotations)).toBe(true);
    expect(Object.isFrozen(out.organSystemAnnotations[0])).toBe(true);
    expect(() => {
      (out as { status: string }).status = 'HACK';
    }).toThrow();
  });

  it('P16 proxy / getter / cycle / sparse / symbol rejection (zero trap/getter hits)', () => {
    let proxyGets = 0;
    const proxied = new Proxy(baseInput(), {
      get(t, p, r) {
        proxyGets += 1;
        return Reflect.get(t, p, r);
      },
    });
    expectFail(() => evaluateRule3Shadow(proxied), 'INVALID_INPUT');
    expect(proxyGets).toBe(0);

    let getterHits = 0;
    const withGetter = baseInput();
    Object.defineProperty(withGetter, 'sneaky', {
      get() {
        getterHits += 1;
        return 1;
      },
      enumerable: true,
    });
    expectFail(() => evaluateRule3Shadow(withGetter), 'INVALID_INPUT');
    expect(getterHits).toBe(0);

    const cyclic: Record<string, unknown> = baseInput();
    (cyclic as { self?: unknown }).self = cyclic;
    // assertPlainData sees unknown key "self" OR cycle — either INVALID_INPUT
    expectFail(() => evaluateRule3Shadow(cyclic), 'INVALID_INPUT');

    const sparse = baseInput({
      orderedEvidenceBindingRefs: { 0: { bindingRefId: 'BIND_SYN_A' }, length: 2 },
    });
    expectFail(() => evaluateRule3Shadow(sparse), 'INVALID_INPUT');

    const withSymbol = baseInput();
    Object.defineProperty(withSymbol, Symbol('x'), { value: 1, enumerable: true });
    expectFail(() => evaluateRule3Shadow(withSymbol), 'INVALID_INPUT');
  });

  it('P17 fixed errors; PHI / path leakage prevention', () => {
    expectFail(() => evaluateRule3Shadow(baseInput({ patientName: 'x' })), 'INVALID_INPUT');
    expectFail(() => evaluateRule3Shadow(baseInput({ filePath: 'C:\\a' })), 'INVALID_INPUT');
    expectFail(() => evaluateRule3Shadow(baseInput({ imageBytes: 'abc' })), 'INVALID_INPUT');
    try {
      evaluateRule3Shadow(null);
    } catch (e) {
      const err = e as Rule3EvaluationError;
      expect(err.message).toBe(err.failureCode);
      expect(err.message).not.toMatch(/\\|patient|stack/i);
    }
  });

  it('P18 package / orchestration / activation / Rx boundaries', () => {
    expect(RULE3_ORCHESTRATION_STATUS).toBe('NOT_CONNECTED');
    expect(RULE3_RUNTIME_STATUS).toBe('NOT_CONNECTED');
    expect(RULE3_NOT_CLINICALLY_ACTIVATED_PRESCRIPTION).toBe(true);
    const pkg = JSON.parse(readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8')) as {
      name: string;
      version: string;
      dependencies: Record<string, string>;
    };
    expect(pkg.name).toBe('@ehas2/rule3');
    expect(pkg.version).toBe('0.1.0-shadow');
    expect(pkg.dependencies).toEqual({});
    const srcFiles = readdirSync(path.join(PKG_ROOT, 'src'));
    for (const f of srcFiles) {
      const text = readFileSync(path.join(PKG_ROOT, 'src', f), 'utf8');
      expect(text).not.toMatch(/console\./);
      expect(text).not.toMatch(/from '@ehas2\/rule[124679]'/);
      expect(text).not.toMatch(/node:fs|node:net|fetch\(/);
    }
    const out = evaluateRule3Shadow(baseInput());
    expect(out.contractVersion).toBe(RULE3_OUTPUT_CONTRACT_VERSION);
    expect(out.ruleIdentity).toBe('ORGAN_SYSTEM_AFFINITY');
  });
});

describe('Rule 3 adversarial regressions', () => {
  it('R01 top-level / nested / entries Proxy rejected with zero traps', () => {
    let topHits = 0;
    const top = new Proxy(baseInput(), {
      get(t, p, r) {
        topHits += 1;
        return Reflect.get(t, p, r);
      },
    });
    expectFail(() => evaluateRule3Shadow(top), 'INVALID_INPUT');
    expect(topHits).toBe(0);

    let registryHits = 0;
    expectFail(
      () =>
        evaluateRule3Shadow(
          baseInput({
            organSystemAffinityEvidenceRegistry: new Proxy(
              {
                registryVersion: 'reg-r3-v1',
                entries: [],
                activeRealMappingCount: 0,
              },
              {
                get(t, p, r) {
                  registryHits += 1;
                  return Reflect.get(t, p, r);
                },
              },
            ),
          }),
        ),
      'INVALID_INPUT',
    );
    expect(registryHits).toBe(0);

    let entryHits = 0;
    const entries = new Proxy(
      [
        baseEntry({
          entryId: 'OSA_SYN_1',
          bindingRefId: 'BIND_SYN_A',
        }),
      ],
      {
        get(t, p, r) {
          entryHits += 1;
          return Reflect.get(t, p, r);
        },
      },
    );
    // Nested Proxy is rejected by assertPlainData before registry parse (same posture as Rule 2).
    expectFail(
      () =>
        evaluateRule3Shadow(
          baseInput({
            organSystemAffinityEvidenceRegistry: {
              registryVersion: 'reg-r3-v1',
              entries,
              activeRealMappingCount: 0,
            },
          }),
        ),
      'INVALID_INPUT',
    );
    expect(entryHits).toBe(0);
  });

  it('R02 duplicate entry IDs rejected', () => {
    expectFail(
      () =>
        evaluateRule3Shadow(
          baseInput({
            organSystemAffinityEvidenceRegistry: {
              registryVersion: 'reg-r3-v1',
              entries: [
                baseEntry({ entryId: 'OSA_SYN_1', bindingRefId: 'BIND_SYN_A' }),
                baseEntry({ entryId: 'OSA_SYN_1', bindingRefId: 'BIND_SYN_A' }),
              ],
              activeRealMappingCount: 0,
            },
          }),
        ),
      'INVALID_EVIDENCE_REGISTRY',
    );
  });

  it('R03 contradiction precedence blocks synthetic positive', () => {
    const out = evaluateRule3Shadow(
      baseInput({
        organSystemAffinityEvidenceRegistry: {
          registryVersion: 'reg-r3-v1',
          entries: [
            baseEntry({
              entryId: 'OSA_SYN_1',
              bindingRefId: 'BIND_SYN_A',
              organSystemToken: 'SYS_SYN_ALPHA',
            }),
            baseEntry({
              entryId: 'OSA_SYN_2',
              bindingRefId: 'BIND_SYN_A',
              organSystemToken: 'SYS_SYN_BETA',
            }),
          ],
          activeRealMappingCount: 0,
        },
      }),
    );
    expect(out.status).toBe('BLOCKED_BY_CONTRADICTION');
    expect(out.organSystemAnnotations[0]?.indicationStatus).toBe('BLOCKED_CONTRADICTION');
  });

  it('R04 binding order preserved across multiple bindings', () => {
    const out = evaluateRule3Shadow(
      baseInput({
        orderedEvidenceBindingRefs: [
          { bindingRefId: 'BIND_SYN_B' },
          { bindingRefId: 'BIND_SYN_A' },
        ],
        organSystemAffinityEvidenceRegistry: {
          registryVersion: 'reg-r3-v1',
          entries: [
            baseEntry({
              entryId: 'OSA_SYN_A',
              bindingRefId: 'BIND_SYN_A',
              organSystemToken: 'SYS_SYN_ALPHA',
            }),
            baseEntry({
              entryId: 'OSA_SYN_B',
              bindingRefId: 'BIND_SYN_B',
              organSystemToken: 'SYS_SYN_BETA',
            }),
          ],
          activeRealMappingCount: 0,
        },
      }),
    );
    expect(out.status).toBe('SHADOW_ORGAN_SYSTEM_ANNOTATIONS_PROPOSED');
    expect(out.organSystemAnnotations.map((a) => a.bindingRefId)).toEqual([
      'BIND_SYN_B',
      'BIND_SYN_A',
    ]);
  });

  it('R05 NOT_APPLICABLE / NOT_EVALUABLE upstream short-circuit', () => {
    const na = evaluateRule3Shadow(
      baseInput({ upstreamApplicability: { status: 'NOT_APPLICABLE', notes: [] } }),
    );
    expect(na.status).toBe('NOT_APPLICABLE');
    expect(na.organSystemAnnotations).toEqual([]);
    const ne = evaluateRule3Shadow(
      baseInput({ upstreamApplicability: { status: 'NOT_EVALUABLE', notes: [] } }),
    );
    expect(ne.status).toBe('NOT_EVALUABLE');
  });

  it('R06 EVID_SYN_* required for activating evidence source', () => {
    const out = evaluateRule3Shadow(
      baseInput({
        organSystemAffinityEvidenceRegistry: {
          registryVersion: 'reg-r3-v1',
          entries: [
            baseEntry({
              entryId: 'OSA_SYN_1',
              bindingRefId: 'BIND_SYN_A',
              evidenceSourceId: 'SRC_NOT_SYN',
            }),
          ],
          activeRealMappingCount: 0,
        },
      }),
    );
    expect(out.status).not.toBe('SHADOW_ORGAN_SYSTEM_ANNOTATIONS_PROPOSED');
  });

  it('R07 case summary must not drive selection', () => {
    const out = evaluateRule3Shadow(
      baseInput({
        caseOrganSystemSummary: {
          status: 'SUPPLIED',
          displayOnly: true,
          mustNotDriveSelection: true,
          headline: 'display only',
        },
      }),
    );
    expect(out.caseOrganSystemSummary?.mustNotDriveSelection).toBe(true);
    expect(out.reasonCodes).toContain('R3_CASE_SUMMARY_MUST_NOT_DRIVE_SELECTION');
  });

  it('R08 export surface identity constants', () => {
    expect(RULE3_RULE_IDENTITY).toBe('ORGAN_SYSTEM_AFFINITY');
    expect(RULE3_INPUT_CONTRACT_VERSION).toBe('ehas2-rule3-input-v1');
    expect(RULE3_OUTPUT_CONTRACT_VERSION).toBe('ehas2-rule3-output-v1');
  });
});
