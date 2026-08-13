import { describe, expect, it } from 'vitest';
import {
  RULE7_ELIGIBILITY_STATES,
  RULE7_FAILURE_CODES,
  RULE7_INDICATION_KEY_ORDER,
  RULE7_INPUT_CONTRACT_VERSION,
  RULE7_INPUT_KEY_ORDER,
  RULE7_OUTCOMES,
  RULE7_OUTPUT_CONTRACT_VERSION,
  RULE7_OUTPUT_KEY_ORDER,
  RULE7_RULE_IDENTITY,
  RULE7_RULE_NUMBER,
  Rule7EvaluationError,
  evaluateRule7Shadow,
  type Rule7RouteEvidenceEntry,
} from '../src/index.ts';

/**
 * Outcomes reference contract §6.3 (closed clinical outcomes).
 * §7 is evidence gates — residual §6.3 cross-ref corrected in comments/tests only.
 */

function baseEntry(
  over: Partial<Rule7RouteEvidenceEntry> &
    Pick<Rule7RouteEvidenceEntry, 'entryId' | 'routeCode' | 'bodySiteRef'>,
): Rule7RouteEvidenceEntry {
  return {
    applicabilityConditions: ['TGT_SYN_A'],
    prohibitionConditions: [],
    evidenceSourceId: 'EV_SYN_ROUTE_1',
    evidenceValidationStatus: 'validated',
    ownerClinicalApprovalStatus: 'approved',
    version: 'entry-v1',
    effectiveStatus: 'approved-and-active',
    supersessionMetadata: null,
    ...over,
  };
}

function baseInput(over: Record<string, unknown> = {}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    contractVersion: RULE7_INPUT_CONTRACT_VERSION,
    requestId: 'req-r7-synthetic-001',
    clinicalTargetRefs: ['TGT_SYN_A'],
    bodySiteRefs: ['SITE_SYN_SKIN'],
    rule3OrganSystemRef: { status: 'UNAVAILABLE' },
    severityRef: { status: 'UNAVAILABLE' },
    phaseRef: { status: 'UNAVAILABLE' },
    routeEvidenceRegistry: {
      registryVersion: 'reg-r7-v1',
      entries: [
        baseEntry({
          entryId: 'ENTRY_SYN_1',
          routeCode: 'ROUTE_SYN_TOPICAL',
          bodySiteRef: 'SITE_SYN_SKIN',
        }),
      ],
    },
    evidenceDataVersions: {
      siteDataVersion: 'site-v1',
      evidenceDataVersion: 'ev-v1',
      routeRegistryVersion: 'reg-r7-v1',
      contractVersion: RULE7_INPUT_CONTRACT_VERSION,
    },
    upstreamApplicability: { status: 'APPLICABLE', notes: [] },
  };
  return { ...base, ...over };
}

function expectFail(fn: () => void, code: (typeof RULE7_FAILURE_CODES)[number]): void {
  try {
    fn();
    expect.fail('expected Rule7EvaluationError');
  } catch (e) {
    expect(e).toBeInstanceOf(Rule7EvaluationError);
    const err = e as Rule7EvaluationError;
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

describe('Rule 7 shadow evaluator P01–P16', () => {
  it('P01 strict 10-key input schema validation', () => {
    expect(RULE7_INPUT_KEY_ORDER).toHaveLength(10);
    expectFail(() => evaluateRule7Shadow({ ...baseInput(), extra: true }), 'INVALID_INPUT');
    expectFail(() => evaluateRule7Shadow('x'), 'INVALID_INPUT');
    const missing = { ...baseInput() };
    delete missing.requestId;
    expectFail(() => evaluateRule7Shadow(missing), 'INVALID_INPUT');
    const out = evaluateRule7Shadow(baseInput());
    expect(out.contractVersion).toBe(RULE7_OUTPUT_CONTRACT_VERSION);
  });

  it('P02 deterministic canonical copy / reorder-stable', () => {
    const a = evaluateRule7Shadow(
      baseInput({
        bodySiteRefs: ['SITE_SYN_B', 'SITE_SYN_SKIN'],
        clinicalTargetRefs: ['TGT_SYN_B', 'TGT_SYN_A'],
      }),
    );
    const b = evaluateRule7Shadow(
      baseInput({
        bodySiteRefs: ['SITE_SYN_SKIN', 'SITE_SYN_B'],
        clinicalTargetRefs: ['TGT_SYN_A', 'TGT_SYN_B'],
      }),
    );
    expect(a.deterministicFingerprint).toBe(b.deterministicFingerprint);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.evaluatedBodySites).toEqual(['SITE_SYN_B', 'SITE_SYN_SKIN']);
  });

  it('P03 positive synthetic indication only with conjunctive approved active evidence', () => {
    const out = evaluateRule7Shadow(baseInput());
    // §6.3 outcome SHADOW_ROUTE_INDICATIONS_PROPOSED
    expect(out.status).toBe('SHADOW_ROUTE_INDICATIONS_PROPOSED');
    expect(out.routeIndications).toHaveLength(1);
    expect(out.routeIndications[0]?.eligibilityState).toBe('ELIGIBLE');
    expect(out.routeIndications[0]?.routeCode).toBe('ROUTE_SYN_TOPICAL');
    expect(out.shadowOnly).toBe(true);
    expect(out.clinicalActivation).toBe('NONE');
  });

  it('P04 unvalidated / inventory evidence non-activating', () => {
    for (const st of ['unvalidated', 'inventory-only', 'draft', 'queued-for-validation'] as const) {
      const out = evaluateRule7Shadow(
        baseInput({
          routeEvidenceRegistry: {
            registryVersion: 'reg-r7-v1',
            entries: [
              baseEntry({
                entryId: 'ENTRY_SYN_1',
                routeCode: 'ROUTE_SYN_TOPICAL',
                bodySiteRef: 'SITE_SYN_SKIN',
                evidenceValidationStatus: st,
              }),
            ],
          },
        }),
      );
      expect(out.status).toBe('NOT_CLINICALLY_INDICATED');
      expect(out.routeIndications).toEqual([]);
    }
  });

  it('P05 missing evidence → NOT_EVALUABLE or NOT_CLINICALLY_INDICATED', () => {
    const empty = evaluateRule7Shadow(
      baseInput({
        routeEvidenceRegistry: { registryVersion: 'reg-r7-v1', entries: [] },
      }),
    );
    expect(empty.status).toBe('NOT_CLINICALLY_INDICATED');
    const unevaluable = evaluateRule7Shadow(
      baseInput({
        upstreamApplicability: { status: 'NOT_EVALUABLE', notes: ['upstream-gap'] },
      }),
    );
    expect(unevaluable.status).toBe('NOT_EVALUABLE');
  });

  it('P06 contradictory evidence fail-closed', () => {
    const out = evaluateRule7Shadow(
      baseInput({
        routeEvidenceRegistry: {
          registryVersion: 'reg-r7-v1',
          entries: [
            baseEntry({
              entryId: 'ENTRY_SYN_A',
              routeCode: 'ROUTE_SYN_TOPICAL',
              bodySiteRef: 'SITE_SYN_SKIN',
            }),
            baseEntry({
              entryId: 'ENTRY_SYN_B',
              routeCode: 'ROUTE_SYN_OTHER',
              bodySiteRef: 'SITE_SYN_SKIN',
              evidenceSourceId: 'EV_SYN_ROUTE_2',
            }),
          ],
        },
      }),
    );
    // §6.3 UNRESOLVED_EVIDENCE
    expect(out.status).toBe('UNRESOLVED_EVIDENCE');
    expect(out.routeIndications).toEqual([]);
  });

  it('P07 oral formula / oral medicine copy forbidden', () => {
    expectFail(
      () =>
        evaluateRule7Shadow({
          ...baseInput(),
          oralMixture: { medicines: ['MED_ORAL_X'] },
        }),
      'INVALID_INPUT',
    );
    expectFail(
      () =>
        evaluateRule7Shadow({
          ...baseInput(),
          candidateMedicinePool: ['MED_ORAL_X'],
        }),
      'INVALID_INPUT',
    );
    const out = evaluateRule7Shadow(baseInput());
    const blob = JSON.stringify(out);
    expect(blob).not.toMatch(/oralMixture|candidateMedicinePool|formulaId|medicineId/i);
  });

  it('P08 Rule 6 relationship edges do not auto-activate routes', () => {
    expectFail(
      () =>
        evaluateRule7Shadow({
          ...baseInput(),
          relationshipEvidenceRegistry: {
            registryVersion: 'r6',
            edges: [{ edgeId: 'EDGE_SYN_1' }],
          },
        }),
      'INVALID_INPUT',
    );
    const noEvidence = evaluateRule7Shadow(
      baseInput({
        routeEvidenceRegistry: { registryVersion: 'reg-r7-v1', entries: [] },
      }),
    );
    expect(noEvidence.status).toBe('NOT_CLINICALLY_INDICATED');
    expect(noEvidence.routeIndications).toEqual([]);
  });

  it('P09 forbidden clinical output fields absent', () => {
    const out = evaluateRule7Shadow(baseInput());
    const blob = JSON.stringify(out);
    for (const k of [
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
    ]) {
      expect(blob).not.toContain(`"${k}"`);
    }
    expect(Object.keys(out.routeIndications[0]!)).toEqual([...RULE7_INDICATION_KEY_ORDER]);
  });

  it('P10 NOT_CLINICALLY_INDICATED valid empty success-path outcome (§6.3)', () => {
    const out = evaluateRule7Shadow(
      baseInput({
        routeEvidenceRegistry: { registryVersion: 'reg-r7-v1', entries: [] },
      }),
    );
    expect(out.status).toBe('NOT_CLINICALLY_INDICATED');
    expect(out.shadowOnly).toBe(true);
    expect(out.clinicalActivation).toBe('NONE');
    expect(out.routeIndications).toEqual([]);
    expect(
      typeof out.notClinicallyIndicated === 'object' && out.notClinicallyIndicated,
    ).toBeTruthy();
  });

  it('P11 input non-mutation', () => {
    const input = baseInput();
    const before = JSON.stringify(input);
    evaluateRule7Shadow(input);
    expect(JSON.stringify(input)).toBe(before);
    (input.clinicalTargetRefs as string[]).push('MUTATED');
    expect(JSON.stringify(input)).not.toBe(before);
    const again = evaluateRule7Shadow(JSON.parse(before) as Record<string, unknown>);
    expect(again.requestId).toBe('req-r7-synthetic-001');
  });

  it('P12 deep-freeze output', () => {
    const out = evaluateRule7Shadow(baseInput());
    expect(Object.isFrozen(out)).toBe(true);
    expect(Object.isFrozen(out.routeIndications)).toBe(true);
    expect(Object.isFrozen(out.routeIndications[0]!)).toBe(true);
    expect(() => {
      (out as { status: string }).status = 'HACK';
    }).toThrow();
  });

  it('P13 exact key order (15 output + 6 indication)', () => {
    expect(RULE7_OUTPUT_KEY_ORDER).toHaveLength(15);
    expect(RULE7_INDICATION_KEY_ORDER).toHaveLength(6);
    const out = evaluateRule7Shadow(baseInput());
    expect(Object.keys(out)).toEqual([...RULE7_OUTPUT_KEY_ORDER]);
    expect(Object.keys(out.routeIndications[0]!)).toEqual([...RULE7_INDICATION_KEY_ORDER]);
    expect(out.ruleNumber).toBe(RULE7_RULE_NUMBER);
    expect(out.ruleIdentity).toBe(RULE7_RULE_IDENTITY);
  });

  it('P14 code-only errors (message === failureCode)', () => {
    expectFail(() => evaluateRule7Shadow({ foo: 1 }), 'INVALID_INPUT');
    expectFail(
      () => evaluateRule7Shadow(baseInput({ contractVersion: 'ehas2-rule7-input-v999' })),
      'UNSUPPORTED_CONTRACT_VERSION',
    );
    expectFail(
      () =>
        evaluateRule7Shadow(
          baseInput({
            routeEvidenceRegistry: { registryVersion: 'x', entries: [{ bad: true }] },
          }),
        ),
      'INVALID_EVIDENCE_REGISTRY',
    );
    expectFail(
      () =>
        evaluateRule7Shadow(
          baseInput({
            upstreamApplicability: { status: 'WEIRD', notes: [] },
          }),
        ),
      'CONTRADICTORY_UPSTREAM_STATE',
    );
  });

  it('P15 no PHI / protected-path leakage', () => {
    expectFail(
      () => evaluateRule7Shadow({ ...baseInput(), patientName: 'Alice' }),
      'INVALID_INPUT',
    );
    expectFail(() => evaluateRule7Shadow({ ...baseInput(), mrn: '123' }), 'INVALID_INPUT');
    try {
      evaluateRule7Shadow({ ...baseInput(), patient_name: 'x' });
    } catch (e) {
      const err = e as Rule7EvaluationError;
      expect(err.message).toBe(err.failureCode);
      expect(err.message).not.toMatch(/patient|Alice|path|\\\\|C:\\/i);
    }
  });

  it('P16 outcome / error vocabulary closed-set (§6.3 outcomes + §6.4 errors)', () => {
    expect(RULE7_OUTCOMES).toHaveLength(6);
    expect(RULE7_FAILURE_CODES).toHaveLength(5);
    expect(RULE7_ELIGIBILITY_STATES).toHaveLength(4);
    const statuses = new Set<string>();
    statuses.add(evaluateRule7Shadow(baseInput()).status);
    statuses.add(
      evaluateRule7Shadow(
        baseInput({ upstreamApplicability: { status: 'NOT_APPLICABLE', notes: [] } }),
      ).status,
    );
    statuses.add(
      evaluateRule7Shadow(
        baseInput({ upstreamApplicability: { status: 'NOT_EVALUABLE', notes: [] } }),
      ).status,
    );
    statuses.add(
      evaluateRule7Shadow(
        baseInput({ routeEvidenceRegistry: { registryVersion: 'reg-r7-v1', entries: [] } }),
      ).status,
    );
    statuses.add(
      evaluateRule7Shadow(
        baseInput({
          clinicalTargetRefs: ['TGT_SYN_A', 'PROHIB_SYN'],
          routeEvidenceRegistry: {
            registryVersion: 'reg-r7-v1',
            entries: [
              baseEntry({
                entryId: 'ENTRY_SYN_1',
                routeCode: 'ROUTE_SYN_TOPICAL',
                bodySiteRef: 'SITE_SYN_SKIN',
                prohibitionConditions: ['PROHIB_SYN'],
              }),
            ],
          },
        }),
      ).status,
    );
    statuses.add(
      evaluateRule7Shadow(
        baseInput({
          routeEvidenceRegistry: {
            registryVersion: 'reg-r7-v1',
            entries: [
              baseEntry({
                entryId: 'ENTRY_SYN_A',
                routeCode: 'ROUTE_SYN_TOPICAL',
                bodySiteRef: 'SITE_SYN_SKIN',
              }),
              baseEntry({
                entryId: 'ENTRY_SYN_B',
                routeCode: 'ROUTE_SYN_OTHER',
                bodySiteRef: 'SITE_SYN_SKIN',
                evidenceSourceId: 'EV_2',
              }),
            ],
          },
        }),
      ).status,
    );
    for (const s of statuses) {
      expect(RULE7_OUTCOMES).toContain(s);
    }
    expect(statuses.has('BLOCKED_BY_SAFETY')).toBe(true);
    expect(statuses.has('UNRESOLVED_EVIDENCE')).toBe(true);
    expect(statuses.has('SHADOW_ROUTE_INDICATIONS_PROPOSED')).toBe(true);
  });
});

describe('Rule 7 additional regressions / negative probes', () => {
  it('R01 Proxy top-level and nested: zero trap hits', () => {
    const nested = countingProxy({ status: 'UNAVAILABLE' as const });
    const top = countingProxy(baseInput({ rule3OrganSystemRef: nested.proxy }));
    expectFail(() => evaluateRule7Shadow(top.proxy), 'INVALID_INPUT');
    expect(top.hits.get).toBe(0);
    expect(nested.hits.get).toBe(0);
  });

  it('R02 getters/accessors never invoked', () => {
    let invoked = 0;
    const input = baseInput();
    Object.defineProperty(input, 'requestId', {
      get() {
        invoked += 1;
        return 'req-r7-synthetic-001';
      },
      enumerable: true,
      configurable: true,
    });
    expectFail(() => evaluateRule7Shadow(input), 'INVALID_INPUT');
    expect(invoked).toBe(0);
  });

  it('R03 cycles rejected', () => {
    const input = baseInput();
    const notes = (input.upstreamApplicability as { notes: unknown[] }).notes;
    notes.push(notes);
    expectFail(() => evaluateRule7Shadow(input), 'INVALID_INPUT');
  });

  it('R04 validation without owner approval → non-activating', () => {
    const out = evaluateRule7Shadow(
      baseInput({
        routeEvidenceRegistry: {
          registryVersion: 'reg-r7-v1',
          entries: [
            baseEntry({
              entryId: 'ENTRY_SYN_1',
              routeCode: 'ROUTE_SYN_TOPICAL',
              bodySiteRef: 'SITE_SYN_SKIN',
              evidenceValidationStatus: 'validated',
              ownerClinicalApprovalStatus: 'owner-unapproved',
            }),
          ],
        },
      }),
    );
    expect(out.status).toBe('NOT_CLINICALLY_INDICATED');
    expect(out.routeIndications).toEqual([]);
  });

  it('R05 owner approval without validation → non-activating', () => {
    const out = evaluateRule7Shadow(
      baseInput({
        routeEvidenceRegistry: {
          registryVersion: 'reg-r7-v1',
          entries: [
            baseEntry({
              entryId: 'ENTRY_SYN_1',
              routeCode: 'ROUTE_SYN_TOPICAL',
              bodySiteRef: 'SITE_SYN_SKIN',
              evidenceValidationStatus: 'unvalidated',
              ownerClinicalApprovalStatus: 'approved',
            }),
          ],
        },
      }),
    );
    expect(out.status).toBe('NOT_CLINICALLY_INDICATED');
  });

  it('R06 stale / disputed / superseded evidence non-activating', () => {
    for (const st of ['stale', 'disputed', 'superseded'] as const) {
      const out = evaluateRule7Shadow(
        baseInput({
          routeEvidenceRegistry: {
            registryVersion: 'reg-r7-v1',
            entries: [
              baseEntry({
                entryId: 'ENTRY_SYN_1',
                routeCode: 'ROUTE_SYN_TOPICAL',
                bodySiteRef: 'SITE_SYN_SKIN',
                effectiveStatus: st,
              }),
            ],
          },
        }),
      );
      expect(out.status).toBe('NOT_CLINICALLY_INDICATED');
    }
  });

  it('R07 oral-output-shaped and Rule6-output-shaped inputs rejected', () => {
    expectFail(
      () => evaluateRule7Shadow({ ...baseInput(), selectedEligibleCandidates: ['MED_X'] }),
      'INVALID_INPUT',
    );
    expectFail(
      () => evaluateRule7Shadow({ ...baseInput(), proposedCompositionCandidates: [] }),
      'INVALID_INPUT',
    );
  });

  it('R08 unsupported version + supported version', () => {
    expectFail(
      () => evaluateRule7Shadow(baseInput({ contractVersion: 'nope' })),
      'UNSUPPORTED_CONTRACT_VERSION',
    );
    const ok = evaluateRule7Shadow(baseInput({ contractVersion: RULE7_INPUT_CONTRACT_VERSION }));
    expect(ok.contractVersion).toBe(RULE7_OUTPUT_CONTRACT_VERSION);
  });

  it('R09 caller mutation after evaluation does not affect frozen output', () => {
    const input = baseInput();
    const out = evaluateRule7Shadow(input);
    (input.bodySiteRefs as string[]).push('SITE_MUT');
    expect(out.evaluatedBodySites).not.toContain('SITE_MUT');
    expect(() => {
      (out.evaluatedBodySites as string[]).push('X');
    }).toThrow();
  });

  it('R10 no orchestration/runtime/network/legacy coupling markers in package surface', async () => {
    const src = await import('../src/index.ts');
    expect(src.evaluateRule7Shadow).toBeTypeOf('function');
    expect(JSON.stringify(Object.keys(src).sort())).not.toMatch(
      /mongoose|fetch|axios|fs\.|path\.|net\.|http|legacy|external_application/i,
    );
  });
});
