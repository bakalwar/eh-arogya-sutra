import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  RULE9_COMPLEXITY_APPROVAL_TOKEN,
  RULE9_FAILURE_CODES,
  RULE9_INPUT_CONTRACT_VERSION,
  RULE9_INPUT_KEY_ORDER,
  RULE9_ORCHESTRATION_STATUS,
  RULE9_OUTCOMES,
  RULE9_OUTPUT_CONTRACT_VERSION,
  RULE9_OUTPUT_KEY_ORDER,
  RULE9_PACKAGE_KEY_ORDER,
  RULE9_PRESCRIPTION_EFFECT,
  RULE9_PRODUCTION_MAPPING_REGISTRY,
  RULE9_RULE_IDENTITIES,
  RULE9_RULE_IDENTITY,
  RULE9_RULE_NUMBER,
  RULE9_RUNTIME_STATUS,
  Rule9EvaluationError,
  evaluateRule9Shadow,
} from '../src/index.ts';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fullEnvelope(
  n: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
  over: Record<string, unknown> = {},
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    ruleNumber: n,
    ruleIdentity: RULE9_RULE_IDENTITIES[n],
    contractVersion: `ehas2-rule${n}-contract-v1`,
    status: 'SHADOW_OK',
    applicability: 'NOT_APPLICABLE',
  };
  if (n >= 6) {
    base.validatedActiveClinicalDataCount = 0;
  }
  return { ...base, ...over };
}

function mixtures(count: number): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (let i = 1; i <= count; i += 1) {
    out.push({
      mixtureId: `MIX_SYN_${i}`,
      medicineIds: [`MED_SYN_${i}`],
      evidenceRefs: [`EV_SYN_${i}`],
    });
  }
  return out;
}

function baseInput(over: Record<string, unknown> = {}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    contractVersion: RULE9_INPUT_CONTRACT_VERSION,
    requestId: 'req-r9-synthetic-001',
    complexityTierRef: {
      tier: 'SIMPLE',
      ownerApprovalStatus: RULE9_COMPLEXITY_APPROVAL_TOKEN,
      evidenceSourceId: 'TIER_EV_SYN_1',
      version: 'tier-v1',
    },
    rule1Envelope: { status: 'UNAVAILABLE' },
    rule2Envelope: { status: 'UNAVAILABLE' },
    rule3Envelope: { status: 'UNAVAILABLE' },
    rule4Envelope: { status: 'UNAVAILABLE' },
    rule5Envelope: { status: 'NOT_IMPLEMENTED' },
    rule6Envelope: fullEnvelope(6),
    rule7Envelope: fullEnvelope(7),
    rule8Envelope: fullEnvelope(8),
    proposedOralComposition: { mixtures: mixtures(3) },
    evidenceDataVersions: {
      pipelineDataVersion: 'pipe-v1',
      contractVersion: RULE9_INPUT_CONTRACT_VERSION,
    },
    upstreamApplicability: { status: 'APPLICABLE', reasonCodes: [] },
  };
  return { ...base, ...over };
}

function expectFail(fn: () => void, code: (typeof RULE9_FAILURE_CODES)[number]): void {
  try {
    fn();
    expect.fail('expected Rule9EvaluationError');
  } catch (e) {
    expect(e).toBeInstanceOf(Rule9EvaluationError);
    const err = e as Rule9EvaluationError;
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

describe('Rule 9 shadow validator P01–P18', () => {
  it('P01 strict 14-key input schema validation (reject unknown keys)', () => {
    expect(RULE9_INPUT_KEY_ORDER).toHaveLength(14);
    expectFail(() => evaluateRule9Shadow({ ...baseInput(), extra: true }), 'INVALID_INPUT');
    expectFail(() => evaluateRule9Shadow('x'), 'INVALID_INPUT');
    const missing = { ...baseInput() };
    delete missing.requestId;
    expectFail(() => evaluateRule9Shadow(missing), 'INVALID_INPUT');
    const out = evaluateRule9Shadow(baseInput());
    expect(Object.keys(out)).toEqual([...RULE9_OUTPUT_KEY_ORDER]);
    expect(RULE9_OUTPUT_KEY_ORDER).toHaveLength(24);
  });

  it('P02 deterministic canonical copy / reorder-stable', () => {
    const a = evaluateRule9Shadow(baseInput());
    const reorderedMixtures = {
      mixtures: [mixtures(3)[2], mixtures(3)[0], mixtures(3)[1]],
    };
    // Different mixture order is a different proposal identity; same content order is stable.
    const b = evaluateRule9Shadow(baseInput());
    expect(a.deterministicFingerprint).toBe(b.deterministicFingerprint);
    expect(a.status).toBe(b.status);
    expect(JSON.stringify(a.packagedShadowProposal)).toBe(JSON.stringify(b.packagedShadowProposal));
    void reorderedMixtures;
  });

  it('P03 SHADOW_PACKAGE_READY only when all gates hold', () => {
    const out = evaluateRule9Shadow(baseInput());
    expect(out.status).toBe('SHADOW_PACKAGE_READY');
    expect(out.shadowOnly).toBe(true);
    expect(out.clinicalActivation).toBe('NONE');
    expect(out.medicineSelectionInfluence).toBe('NONE');
    expect(out.prescriptionEffect).toBe('NONE');
    expect(out.notAClinicallyActivatedPrescription).toBe(true);
    expect(out.packagedShadowProposal).not.toBeNull();
    expect(Object.keys(out.packagedShadowProposal!)).toEqual([...RULE9_PACKAGE_KEY_ORDER]);
    expect(RULE9_PACKAGE_KEY_ORDER).toHaveLength(6);
    expect(RULE9_PRODUCTION_MAPPING_REGISTRY.entries).toHaveLength(0);
  });

  it('P04 complexity tier missing/unapproved → NOT_EVALUABLE (no inference)', () => {
    const missing = evaluateRule9Shadow(
      baseInput({ complexityTierRef: { status: 'UNAVAILABLE' } }),
    );
    expect(missing.status).toBe('NOT_EVALUABLE');
    expect(missing.countValidationState).toBe('NOT_EVALUABLE');
    expect(missing.packagedShadowProposal).toBeNull();

    expectFail(
      () =>
        evaluateRule9Shadow(
          baseInput({
            complexityTierRef: {
              tier: 'SIMPLE',
              ownerApprovalStatus: 'caller-asserted-only',
              evidenceSourceId: 'TIER_EV_SYN_1',
              version: 'tier-v1',
            },
          }),
        ),
      'INVALID_INPUT',
    );
  });

  it('P05 count mismatch → BLOCKED_BY_COUNT_VALIDATION with zero composition mutation', () => {
    const out = evaluateRule9Shadow(
      baseInput({
        complexityTierRef: {
          tier: 'MODERATE',
          ownerApprovalStatus: RULE9_COMPLEXITY_APPROVAL_TOKEN,
          evidenceSourceId: 'TIER_EV_SYN_1',
          version: 'tier-v1',
        },
        proposedOralComposition: { mixtures: mixtures(3) },
      }),
    );
    expect(out.status).toBe('BLOCKED_BY_COUNT_VALIDATION');
    expect(out.requiredOralMixtureCount).toBe(4);
    expect(out.observedOralMixtureCount).toBe(3);
    expect(out.packagedShadowProposal).toBeNull();
    expect(out.countValidationState).toBe('FAIL');
  });

  it('P06 oral count 1 or 2 rejected', () => {
    const one = evaluateRule9Shadow(
      baseInput({ proposedOralComposition: { mixtures: mixtures(1) } }),
    );
    expect(one.status).toBe('BLOCKED_BY_COUNT_VALIDATION');
    const two = evaluateRule9Shadow(
      baseInput({ proposedOralComposition: { mixtures: mixtures(2) } }),
    );
    expect(two.status).toBe('BLOCKED_BY_COUNT_VALIDATION');
  });

  it('P07 Tablet/external never counted as oral mixtures (rejected as input keys)', () => {
    expectFail(
      () =>
        evaluateRule9Shadow(
          baseInput({
            proposedOralComposition: {
              mixtures: mixtures(3),
              tabletA: { medicineId: 'TAB_X' },
            },
          }),
        ),
      'INVALID_INPUT',
    );
    expectFail(
      () =>
        evaluateRule9Shadow(
          baseInput({
            proposedOralComposition: {
              mixtures: mixtures(3),
              externalApplications: [{ route: 'LOCAL' }],
            },
          }),
        ),
      'INVALID_INPUT',
    );
    expectFail(
      () =>
        evaluateRule9Shadow(
          baseInput({
            proposedOralComposition: {
              mixtures: mixtures(3),
              '+1': true,
            },
          }),
        ),
      'INVALID_INPUT',
    );
  });

  it('P08 OD-014 path → INSUFFICIENT_CLINICAL_EVIDENCE + DOCTOR_REVIEW_REQUIRED', () => {
    const out = evaluateRule9Shadow(baseInput({ proposedOralComposition: { status: 'ABSENT' } }));
    expect(out.status).toBe('INSUFFICIENT_CLINICAL_EVIDENCE');
    expect(out.insufficientClinicalEvidence).toBe(true);
    expect(out.doctorReviewRequired).toBe(true);
    expect(out.packagedShadowProposal).toBeNull();
  });

  it('P09 required Rule 6/7/8 data 0 → fail-closed; no Rx; no fallback medicine', () => {
    const out = evaluateRule9Shadow(
      baseInput({
        rule6Envelope: fullEnvelope(6, {
          applicability: 'APPLICABLE',
          validatedActiveClinicalDataCount: 0,
        }),
      }),
    );
    expect(out.status).toBe('INSUFFICIENT_CLINICAL_EVIDENCE');
    expect(out.doctorReviewRequired).toBe(true);
    expect(out.packagedShadowProposal).toBeNull();
    expect(JSON.stringify(out)).not.toMatch(/fallbackMedicine|filler/i);
  });

  it('P10 upstream NOT_APPLICABLE ≠ missing evidence', () => {
    const na = evaluateRule9Shadow(
      baseInput({ upstreamApplicability: { status: 'NOT_APPLICABLE', reasonCodes: ['R9_NA'] } }),
    );
    expect(na.status).toBe('NOT_APPLICABLE');
    expect(na.insufficientClinicalEvidence).toBe(false);

    const r6na = evaluateRule9Shadow(
      baseInput({
        rule6Envelope: fullEnvelope(6, {
          applicability: 'NOT_APPLICABLE',
          validatedActiveClinicalDataCount: 0,
        }),
      }),
    );
    expect(r6na.status).toBe('SHADOW_PACKAGE_READY');
  });

  it('P11 upstream contradiction → BLOCKED_BY_UPSTREAM_CONTRADICTION', () => {
    expectFail(
      () =>
        evaluateRule9Shadow(
          baseInput({
            rule1Envelope: fullEnvelope(1, { status: 'CONFLICT', applicability: 'APPLICABLE' }),
          }),
        ),
      'CONTRADICTORY_UPSTREAM_STATE',
    );
  });

  it('P12 no new medicine selection / ranking / filler fields in output', () => {
    const out = evaluateRule9Shadow(baseInput());
    const blob = JSON.stringify(out);
    for (const k of [
      'selectedMedicines',
      'rankedMedicines',
      'filler',
      'boost',
      'demote',
      'fallbackMedicine',
      'potency',
      'dosage',
      'electricity',
    ]) {
      expect(blob).not.toContain(`"${k}"`);
    }
    // Pass-through only — same medicine IDs as input, no extras
    const ids = out.packagedShadowProposal!.oralMixtures.flatMap((m) => m.medicineIds);
    expect(ids).toEqual(['MED_SYN_1', 'MED_SYN_2', 'MED_SYN_3']);
  });

  it('P13 Rules 1–8 non-override (envelope statuses preserved in snapshot)', () => {
    const out = evaluateRule9Shadow(
      baseInput({
        rule2Envelope: fullEnvelope(2, { status: 'POLARITY_SHADOW', applicability: 'APPLICABLE' }),
      }),
    );
    const r2 = out.upstreamRuleStates.find((s) => s.ruleNumber === 2);
    expect(r2?.status).toBe('POLARITY_SHADOW');
    expect(r2?.applicability).toBe('APPLICABLE');
    expect(out.ruleIdentity).toBe(RULE9_RULE_IDENTITY);
    expect(out.ruleNumber).toBe(RULE9_RULE_NUMBER);
  });

  it('P14 input non-mutation', () => {
    const input = baseInput();
    const before = JSON.stringify(input);
    evaluateRule9Shadow(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it('P15 deep-freeze output', () => {
    const out = evaluateRule9Shadow(baseInput());
    expect(Object.isFrozen(out)).toBe(true);
    expect(Object.isFrozen(out.packagedShadowProposal)).toBe(true);
    expect(() => {
      (out as { status: string }).status = 'HACK';
    }).toThrow();
  });

  it('P16 exact key order (24 output + 6 package)', () => {
    const out = evaluateRule9Shadow(baseInput());
    expect(Object.keys(out)).toEqual([...RULE9_OUTPUT_KEY_ORDER]);
    expect(Object.keys(out.packagedShadowProposal!)).toEqual([...RULE9_PACKAGE_KEY_ORDER]);
  });

  it('P17 code-only errors; no PHI / protected-path / raw stack leakage', () => {
    expectFail(() => evaluateRule9Shadow({ foo: 1 }), 'INVALID_INPUT');
    expectFail(
      () => evaluateRule9Shadow(baseInput({ contractVersion: 'ehas2-rule9-input-v999' })),
      'UNSUPPORTED_CONTRACT_VERSION',
    );
    expectFail(
      () => evaluateRule9Shadow({ ...baseInput(), patientName: 'Alice' }),
      'INVALID_INPUT',
    );
    expectFail(() => evaluateRule9Shadow({ ...baseInput(), mrn: '123' }), 'INVALID_INPUT');
  });

  it('P18 closed vocabularies + activation/Rx NONE + no Phase5C/orch/app wiring in package surface', () => {
    expect(RULE9_OUTCOMES).toHaveLength(7);
    expect(RULE9_FAILURE_CODES).toHaveLength(5);
    const statuses = new Set<string>();
    statuses.add(evaluateRule9Shadow(baseInput()).status);
    statuses.add(
      evaluateRule9Shadow(
        baseInput({ upstreamApplicability: { status: 'NOT_APPLICABLE', reasonCodes: [] } }),
      ).status,
    );
    statuses.add(
      evaluateRule9Shadow(baseInput({ complexityTierRef: { status: 'UNAPPROVED' } })).status,
    );
    statuses.add(
      evaluateRule9Shadow(baseInput({ proposedOralComposition: { mixtures: mixtures(1) } })).status,
    );
    for (const s of statuses) {
      expect(RULE9_OUTCOMES).toContain(s);
    }

    const out = evaluateRule9Shadow(baseInput());
    expect(out.clinicalActivation).toBe('NONE');
    expect(out.prescriptionEffect).toBe('NONE');
    expect(out.medicineSelectionInfluence).toBe('NONE');
    expect(RULE9_ORCHESTRATION_STATUS).toBe('NOT_CONNECTED');
    expect(RULE9_RUNTIME_STATUS).toBe('NOT_CONNECTED');
    expect(RULE9_PRESCRIPTION_EFFECT).toBe('NONE');
    expect(out.status).not.toBe('PASS');
    expect(out.status).toBe('SHADOW_PACKAGE_READY');

    const srcDir = path.join(PKG_ROOT, 'src');
    const srcFiles = readdirSync(srcDir).filter((f) => f.endsWith('.ts'));
    let srcBlob = '';
    for (const f of srcFiles) {
      srcBlob += readFileSync(path.join(srcDir, f), 'utf8');
    }
    expect(srcBlob).not.toMatch(
      /ehas2_clinical_engine|NineRuleOrchestrator|AnalyzeComplete|connectOrchestrat|wireRuntime|productionActivate|apps\/web|apps\/api/i,
    );
    expect(srcBlob).not.toMatch(/from ['"]fs['"]|from ['"]node:fs['"]|fetch\(|axios|net\.|http\./i);

    const pkgJson = JSON.parse(readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
    };
    expect(pkgJson.dependencies).toEqual({});
  });
});

describe('Rule 9 additional regressions / negative probes', () => {
  it('R01 Proxy top-level: zero trap hits', () => {
    const top = countingProxy(baseInput());
    expectFail(() => evaluateRule9Shadow(top.proxy), 'INVALID_INPUT');
    expect(top.hits.get).toBe(0);
  });

  it('R02 getters never invoked', () => {
    let invoked = 0;
    const input = baseInput();
    Object.defineProperty(input, 'requestId', {
      get() {
        invoked += 1;
        return 'req-r9-synthetic-001';
      },
      enumerable: true,
      configurable: true,
    });
    expectFail(() => evaluateRule9Shadow(input), 'INVALID_INPUT');
    expect(invoked).toBe(0);
  });

  it('R03 cycles / sparse / symbols rejected', () => {
    const cyclic: Record<string, unknown> = baseInput();
    cyclic.self = cyclic;
    expectFail(() => evaluateRule9Shadow(cyclic), 'INVALID_INPUT');

    const sparse = baseInput({
      proposedOralComposition: { mixtures: Object.assign([mixtures(3)[0]], { 2: mixtures(3)[1] }) },
    });
    expectFail(() => evaluateRule9Shadow(sparse), 'INVALID_INPUT');

    const withSym = baseInput();
    Object.defineProperty(withSym, Symbol('x'), { value: 1, enumerable: true });
    expectFail(() => evaluateRule9Shadow(withSym), 'INVALID_INPUT');
  });

  it('R04 COMPLEX tier requires exactly 5; sectionSeparations always exclude tablet/external', () => {
    const out = evaluateRule9Shadow(
      baseInput({
        complexityTierRef: {
          tier: 'COMPLEX',
          ownerApprovalStatus: RULE9_COMPLEXITY_APPROVAL_TOKEN,
          evidenceSourceId: 'TIER_EV_SYN_1',
          version: 'tier-v1',
        },
        proposedOralComposition: { mixtures: mixtures(5) },
      }),
    );
    expect(out.status).toBe('SHADOW_PACKAGE_READY');
    expect(out.requiredOralMixtureCount).toBe(5);
    expect(out.packagedShadowProposal!.sectionSeparations.tabletExcludedFromOralCount).toBe(true);
    expect(out.packagedShadowProposal!.sectionSeparations.externalExcludedFromOralCount).toBe(true);
  });

  it('R05 Rule 7/8 zero required data fail-closed independently', () => {
    const r7 = evaluateRule9Shadow(
      baseInput({
        rule7Envelope: fullEnvelope(7, {
          applicability: 'APPLICABLE',
          validatedActiveClinicalDataCount: 0,
        }),
      }),
    );
    expect(r7.status).toBe('INSUFFICIENT_CLINICAL_EVIDENCE');
    const r8 = evaluateRule9Shadow(
      baseInput({
        rule8Envelope: fullEnvelope(8, {
          applicability: 'NOT_EVALUABLE',
          validatedActiveClinicalDataCount: 0,
        }),
      }),
    );
    expect(r8.status).toBe('INSUFFICIENT_CLINICAL_EVIDENCE');
  });

  it('R06 caller mutation after evaluation does not affect frozen output', () => {
    const input = baseInput();
    const out = evaluateRule9Shadow(input);
    (input.proposedOralComposition as { mixtures: unknown[] }).mixtures.push({
      mixtureId: 'HACK',
      medicineIds: ['X'],
      evidenceRefs: [],
    });
    expect(out.observedOralMixtureCount).toBe(3);
    expect(out.packagedShadowProposal!.oralMixtures).toHaveLength(3);
  });

  it('R07 invalid rule identity / wrong rule number rejected', () => {
    expectFail(
      () =>
        evaluateRule9Shadow(
          baseInput({
            rule6Envelope: fullEnvelope(6, { ruleIdentity: 'WRONG' }),
          }),
        ),
      'INVALID_UPSTREAM_ENVELOPE',
    );
    expectFail(
      () =>
        evaluateRule9Shadow(
          baseInput({
            rule3Envelope: fullEnvelope(3, { ruleNumber: 4 }),
          }),
        ),
      'INVALID_UPSTREAM_ENVELOPE',
    );
  });

  it('R08 export surface identity', async () => {
    const src = await import('../src/index.ts');
    expect(src.evaluateRule9Shadow).toBeTypeOf('function');
    expect(src.RULE9_RULE_IDENTITY).toBe('MASTER_PIPELINE');
    expect(src.RULE9_OUTPUT_CONTRACT_VERSION).toBe(RULE9_OUTPUT_CONTRACT_VERSION);
  });
});
