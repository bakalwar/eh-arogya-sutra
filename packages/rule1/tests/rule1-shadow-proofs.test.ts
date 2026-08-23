import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  RULE1_FORBIDDEN_OUTPUT_TOKENS,
  RULE1_OWNER_APPROVED_FEATURE_CATALOG,
  RULE1_PRIMARY_TEMPERAMENTS,
  RULE1_PRODUCTION_MAPPING_REGISTRY,
  RULE1_REPRESENTATION_ORDER,
  computeCatalogFingerprint,
  computeHamiltonPercentages,
  countCatalogByTemperament,
  evaluateRule1Shadow,
  sumPercentages,
  type Rule1Input,
  type Rule1ScoreMap,
  Rule1EvaluationError,
} from '../src/index.js';
import { RULE1_INPUT_SCHEMA_VERSION, RULE1_RULE_CONTRACT_VERSION } from '../src/version.js';

function baseInput(over: Partial<Rule1Input> & { evidence: Rule1Input['evidence'] }): Rule1Input {
  return {
    inputSchemaVersion: RULE1_INPUT_SCHEMA_VERSION,
    ruleContractVersion: RULE1_RULE_CONTRACT_VERSION,
    consultationId: 'consult-1',
    episodeId: 'episode-1',
    ...over,
  };
}

function ev(
  conceptId: string,
  fp: string,
  extra?: Partial<{
    temporalPosture: 'CURRENT' | 'HISTORICAL';
    negationPosture: 'ASSERTED' | 'NEGATED';
    acceptancePosture: 'ACCEPTED' | 'UNACCEPTED';
  }>,
) {
  return {
    conceptId,
    sourceFactFingerprint: fp,
    temporalPosture: extra?.temporalPosture ?? 'CURRENT',
    negationPosture: extra?.negationPosture ?? 'ASSERTED',
    acceptancePosture: extra?.acceptancePosture ?? 'ACCEPTED',
  };
}

describe('Rule1 v1 identity and catalog', () => {
  it('canonical four tokens and representation order', () => {
    expect([...RULE1_PRIMARY_TEMPERAMENTS]).toEqual([
      'BILIOUS',
      'SANGUINE',
      'LYMPHATIC',
      'NERVOUS',
    ]);
    expect([...RULE1_REPRESENTATION_ORDER]).toEqual([
      'BILIOUS',
      'SANGUINE',
      'LYMPHATIC',
      'NERVOUS',
    ]);
    expect(RULE1_FORBIDDEN_OUTPUT_TOKENS).toContain('BILIOUS_HEPATIC');
    expect(RULE1_FORBIDDEN_OUTPUT_TOKENS).toContain('UNRESOLVED_TIE');
  });

  it('catalog counts and pinned fingerprint', () => {
    const counts = countCatalogByTemperament();
    expect(counts).toEqual({ BILIOUS: 4, SANGUINE: 8, LYMPHATIC: 9, NERVOUS: 5 });
    expect(RULE1_OWNER_APPROVED_FEATURE_CATALOG).toHaveLength(26);
    expect(RULE1_PRODUCTION_MAPPING_REGISTRY.activeRealMappingCount).toBe(0);
    const fp = computeCatalogFingerprint();
    expect(fp).toBe('b1eacac787cf533a5260259a98a0fd2472bc557d49e014e96aa95ea936d05879');
    expect(computeCatalogFingerprint()).toBe(fp);
  });

  it('Nervous features are exactly five weight-2', () => {
    const n = RULE1_OWNER_APPROVED_FEATURE_CATALOG.filter((c) => c.temperament === 'NERVOUS');
    expect(n).toHaveLength(5);
    expect(n.every((c) => c.weight === 2)).toBe(true);
  });
});

describe('Rule1 v1 closed input', () => {
  it('rejects unknown keys and raw text', () => {
    expect(() =>
      evaluateRule1Shadow({
        ...baseInput({ evidence: [] }),
        rawText: 'x',
      }),
    ).toThrow(Rule1EvaluationError);
    expect(() =>
      evaluateRule1Shadow({
        ...baseInput({ evidence: [] }),
        weight: 2,
      }),
    ).toThrow(Rule1EvaluationError);
  });

  it('rejects unknown concept and malformed fingerprint', () => {
    expect(() =>
      evaluateRule1Shadow(
        baseInput({
          evidence: [ev('NOT_A_REAL_CONCEPT', 'fp1')],
        }),
      ),
    ).toThrow(/unknown conceptId|UNKNOWN_CONCEPT/);
    expect(() =>
      evaluateRule1Shadow(
        baseInput({
          evidence: [ev('R1_FEAT_NERVOUS_CURRENT_ANXIETY', 'bad fp with spaces')],
        }),
      ),
    ).toThrow(Rule1EvaluationError);
  });

  it('rejects zero BP as explicitly supplied invalid vital (not omission)', () => {
    expect(() =>
      evaluateRule1Shadow(
        baseInput({
          evidence: [
            ev('R1_FEAT_LYMPHATIC_CURRENT_CONSTIPATION', 'c1'),
            ev('R1_FEAT_LYMPHATIC_SUBJECTIVE_COLD_TENDENCY', 'c2'),
          ],
          structuredVitals: {
            systolicBpMmHg: { value: 0, unit: 'mmHg', validationPosture: 'VALIDATED' },
          },
        }),
      ),
    ).toThrow(Rule1EvaluationError);
  });
});

describe('Rule1 v1 pre-merge hardening — structured BP validation', () => {
  const lymphSupport = [
    ev('R1_FEAT_LYMPHATIC_CURRENT_CONSTIPATION', 'c1'),
    ev('R1_FEAT_LYMPHATIC_SITE_BOUND_EDEMA', 'c2'),
  ];
  const sanguineSupport = [
    ev('R1_FEAT_SANGUINE_PALPITATION', 'p1'),
    ev('R1_FEAT_SANGUINE_FACIAL_FLUSHING', 'f1'),
  ];

  function bpInput(
    value: unknown,
    unit: string = 'mmHg',
    validationPosture: 'VALIDATED' | 'INVALID' = 'VALIDATED',
    evidence = lymphSupport,
  ) {
    return baseInput({
      evidence,
      structuredVitals: {
        systolicBpMmHg: { value, unit, validationPosture } as {
          value: number;
          unit: 'mmHg';
          validationPosture: 'VALIDATED' | 'INVALID';
        },
      },
    });
  }

  it('omitted BP remains absent and does not score BP features', () => {
    const out = evaluateRule1Shadow(baseInput({ evidence: lymphSupport }));
    expect(out.reasonCodes.filter((r) => r.includes('BP'))).toHaveLength(0);
    expect(out.scores.LYMPHATIC).toBe(4);
  });

  it('rejects zero, negative, NaN, and non-finite BP without partial output', () => {
    for (const value of [0, -5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() => evaluateRule1Shadow(bpInput(value))).toThrow(Rule1EvaluationError);
    }
  });

  it('rejects numeric string BP and wrong unit', () => {
    expect(() =>
      evaluateRule1Shadow(
        baseInput({
          evidence: lymphSupport,
          structuredVitals: {
            systolicBpMmHg: {
              value: '140' as unknown as number,
              unit: 'mmHg',
              validationPosture: 'VALIDATED',
            },
          },
        }),
      ),
    ).toThrow(Rule1EvaluationError);
    expect(() => evaluateRule1Shadow(bpInput(120, 'kPa'))).toThrow(Rule1EvaluationError);
  });

  it('accepts positive boundary values without inventing upper clinical threshold', () => {
    const at99 = evaluateRule1Shadow(bpInput(99));
    expect(at99.scores.LYMPHATIC).toBe(6);
    expect(at99.reasonCodes).toContain('R1_BP_LYMPHATIC_APPLIED');

    const at100 = evaluateRule1Shadow(bpInput(100));
    expect(at100.scores.LYMPHATIC).toBe(4);
    expect(at100.reasonCodes).not.toContain('R1_BP_LYMPHATIC_APPLIED');

    const at139 = evaluateRule1Shadow(bpInput(139, 'mmHg', 'VALIDATED', sanguineSupport));
    expect(at139.scores.SANGUINE).toBe(4);
    expect(at139.reasonCodes).not.toContain('R1_BP_SANGUINE_APPLIED');

    const at140 = evaluateRule1Shadow(bpInput(140, 'mmHg', 'VALIDATED', sanguineSupport));
    expect(at140.scores.SANGUINE).toBe(7);
    expect(at140.reasonCodes).toContain('R1_BP_SANGUINE_APPLIED');
  });
});

describe('Rule1 v1 pre-merge hardening — synthetic input caps', () => {
  it('exports bounded cap constants', async () => {
    const mod = await import('../src/constants.js');
    expect(mod.MAX_EVIDENCE_COUNT).toBe(128);
    expect(mod.MAX_SYNTHETIC_ID_LENGTH).toBe(128);
  });

  it('rejects empty consultationId or episodeId', () => {
    expect(() => evaluateRule1Shadow(baseInput({ evidence: [], consultationId: '' }))).toThrow(
      Rule1EvaluationError,
    );
    expect(() => evaluateRule1Shadow(baseInput({ evidence: [], episodeId: '' }))).toThrow(
      Rule1EvaluationError,
    );
  });

  it('accepts ID length 1 and 128; rejects length 129', () => {
    const one = 'a';
    const max = 'b'.repeat(128);
    const over = 'c'.repeat(129);
    expect(() =>
      evaluateRule1Shadow(
        baseInput({
          evidence: [
            ev('R1_FEAT_NERVOUS_CURRENT_ANXIETY', 'a1'),
            ev('R1_FEAT_NERVOUS_CURRENT_RESTLESSNESS', 'a2'),
          ],
          consultationId: one,
          episodeId: one,
        }),
      ),
    ).not.toThrow();
    expect(() =>
      evaluateRule1Shadow(
        baseInput({
          evidence: [
            ev('R1_FEAT_NERVOUS_CURRENT_ANXIETY', 'a1'),
            ev('R1_FEAT_NERVOUS_CURRENT_RESTLESSNESS', 'a2'),
          ],
          consultationId: max,
          episodeId: max,
        }),
      ),
    ).not.toThrow();
    expect(() => evaluateRule1Shadow(baseInput({ evidence: [], consultationId: over }))).toThrow(
      Rule1EvaluationError,
    );
    expect(() => evaluateRule1Shadow(baseInput({ evidence: [], episodeId: over }))).toThrow(
      Rule1EvaluationError,
    );
  });

  it('preserves NFC fail-closed behavior', () => {
    const nonNfc = 'e\u0301pisode';
    expect(() =>
      evaluateRule1Shadow(
        baseInput({
          evidence: [
            ev('R1_FEAT_NERVOUS_CURRENT_ANXIETY', 'a1'),
            ev('R1_FEAT_NERVOUS_CURRENT_RESTLESSNESS', 'a2'),
          ],
          episodeId: nonNfc,
        }),
      ),
    ).toThrow(Rule1EvaluationError);
  });

  it('empty evidence retains insufficient outcome; 128 accepted; 129 fails before scoring', () => {
    expect(evaluateRule1Shadow(baseInput({ evidence: [] })).status).toBe(
      'TEMPERAMENT_INSUFFICIENT_EVIDENCE',
    );

    const evidence128 = Array.from({ length: 128 }, (_, i) =>
      ev('R1_FEAT_NERVOUS_CURRENT_ANXIETY', `fp${i}`),
    );
    const out128 = evaluateRule1Shadow(baseInput({ evidence: evidence128 }));
    expect(out128.status).toBeDefined();
    expect(out128.scores.NERVOUS).toBeGreaterThanOrEqual(0);

    const evidence129 = Array.from({ length: 129 }, (_, i) =>
      ev('R1_FEAT_NERVOUS_CURRENT_ANXIETY', `fp${i}`),
    );
    expect(() => evaluateRule1Shadow(baseInput({ evidence: evidence129 }))).toThrow(
      Rule1EvaluationError,
    );
  });

  it('sparse/malformed evidence arrays fail closed', () => {
    const sparse = Array.from({ length: 3 });
    sparse[0] = ev('R1_FEAT_NERVOUS_CURRENT_ANXIETY', 'a1');
    expect(() =>
      evaluateRule1Shadow({
        inputSchemaVersion: RULE1_INPUT_SCHEMA_VERSION,
        ruleContractVersion: RULE1_RULE_CONTRACT_VERSION,
        consultationId: 'c1',
        episodeId: 'e1',
        evidence: sparse,
      }),
    ).toThrow(Rule1EvaluationError);
  });

  it('evidence cap enforced before catalog/dedupe regardless of caller order', () => {
    const evidence129 = Array.from({ length: 129 }, (_, i) =>
      ev('R1_FEAT_NERVOUS_CURRENT_RESTLESSNESS', `z${i}`),
    );
    evidence129.reverse();
    expect(() => evaluateRule1Shadow(baseInput({ evidence: evidence129 }))).toThrow(
      Rule1EvaluationError,
    );
  });
});

describe('Rule1 v1 dedupe', () => {
  it('same concept / fingerprint does not multiply', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_NERVOUS_CURRENT_ANXIETY', 'fpA'),
          ev('R1_FEAT_NERVOUS_CURRENT_ANXIETY', 'fpA'),
          ev('R1_FEAT_NERVOUS_CURRENT_RESTLESSNESS', 'fpB'),
        ],
      }),
    );
    expect(out.scores.NERVOUS).toBe(4);
    expect(out.acceptedContributions).toHaveLength(2);
  });

  it('same fingerprint across distinct concepts fails closed', () => {
    expect(() =>
      evaluateRule1Shadow(
        baseInput({
          evidence: [
            ev('R1_FEAT_NERVOUS_CURRENT_ANXIETY', 'same'),
            ev('R1_FEAT_NERVOUS_CURRENT_RESTLESSNESS', 'same'),
          ],
        }),
      ),
    ).toThrow(Rule1EvaluationError);
  });

  it('input ordering does not change output', () => {
    const a = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_BILIOUS_GASTRIC_HYPERACIDITY', 'b1'),
          ev('R1_FEAT_SANGUINE_PALPITATION', 's1'),
        ],
      }),
    );
    const b = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_SANGUINE_PALPITATION', 's1'),
          ev('R1_FEAT_BILIOUS_GASTRIC_HYPERACIDITY', 'b1'),
        ],
      }),
    );
    expect(a).toEqual(b);
  });
});

describe('Rule1 v1 insufficient and BP', () => {
  it('zero / one concept → insufficient', () => {
    expect(evaluateRule1Shadow(baseInput({ evidence: [] })).status).toBe(
      'TEMPERAMENT_INSUFFICIENT_EVIDENCE',
    );
    expect(
      evaluateRule1Shadow(baseInput({ evidence: [ev('R1_FEAT_NERVOUS_CURRENT_ANXIETY', 'a')] }))
        .status,
    ).toBe('TEMPERAMENT_INSUFFICIENT_EVIDENCE');
  });

  it('Sanguine BP >=140 alone is insufficient (one concept)', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        evidence: [],
        structuredVitals: {
          systolicBpMmHg: { value: 140, unit: 'mmHg', validationPosture: 'VALIDATED' },
        },
      }),
    );
    expect(out.status).toBe('TEMPERAMENT_INSUFFICIENT_EVIDENCE');
  });

  it('Sanguine BP with independent feature resolves', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        evidence: [ev('R1_FEAT_SANGUINE_PALPITATION', 'p1')],
        structuredVitals: {
          systolicBpMmHg: { value: 150, unit: 'mmHg', validationPosture: 'VALIDATED' },
        },
      }),
    );
    expect(out.status).toBe('TEMPERAMENT_PROFILE_RESOLVED');
    expect(out.primaryTemperament).toBe('SANGUINE');
    expect(out.scores.SANGUINE).toBe(5);
  });

  it('Lymphatic BP <100 without non-BP support does not apply', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_SANGUINE_PALPITATION', 'p1'),
          ev('R1_FEAT_SANGUINE_FACIAL_FLUSHING', 'f1'),
        ],
        structuredVitals: {
          systolicBpMmHg: { value: 90, unit: 'mmHg', validationPosture: 'VALIDATED' },
        },
      }),
    );
    expect(out.scores.LYMPHATIC).toBe(0);
    expect(out.reasonCodes).toContain('R1_BP_LYMPHATIC_LACKS_NON_BP_SUPPORT');
  });

  it('Lymphatic BP <100 with non-BP Lymphatic support applies once', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        evidence: [ev('R1_FEAT_LYMPHATIC_CURRENT_CONSTIPATION', 'c1')],
        structuredVitals: {
          systolicBpMmHg: { value: 99, unit: 'mmHg', validationPosture: 'VALIDATED' },
        },
      }),
    );
    expect(out.scores.LYMPHATIC).toBe(4);
    expect(out.primaryTemperament).toBe('LYMPHATIC');
  });

  it('wrong BP unit fails closed', () => {
    expect(() =>
      evaluateRule1Shadow(
        baseInput({
          evidence: [ev('R1_FEAT_SANGUINE_PALPITATION', 'p1')],
          structuredVitals: {
            // @ts-expect-error intentional bad unit
            systolicBpMmHg: { value: 150, unit: 'kPa', validationPosture: 'VALIDATED' },
          },
        }),
      ),
    ).toThrow(Rule1EvaluationError);
  });
});

describe('Rule1 v1 Hamilton percentages', () => {
  /** Score tuple order explicitly: SANGUINE, LYMPHATIC, NERVOUS, BILIOUS */
  function scoresSLNB(s: number, l: number, n: number, b: number): Rule1ScoreMap {
    return { SANGUINE: s, LYMPHATIC: l, NERVOUS: n, BILIOUS: b };
  }

  const cases: Array<{
    slnb: [number, number, number, number];
    pct: [number, number, number, number];
  }> = [
    { slnb: [2, 2, 0, 0], pct: [50.0, 50.0, 0.0, 0.0] },
    { slnb: [3, 2, 1, 0], pct: [50.0, 33.3, 16.7, 0.0] },
    { slnb: [2, 1, 1, 0], pct: [50.0, 25.0, 25.0, 0.0] },
    { slnb: [1, 1, 1, 0], pct: [33.4, 33.3, 33.3, 0.0] },
    { slnb: [3, 3, 2, 1], pct: [33.4, 33.3, 22.2, 11.1] },
    { slnb: [3, 2, 1, 1], pct: [42.8, 28.6, 14.3, 14.3] },
    { slnb: [1, 1, 1, 1], pct: [25.0, 25.0, 25.0, 25.0] },
  ];

  for (const c of cases) {
    it(`Hamilton SLNB ${c.slnb.join(',')}`, () => {
      const scores = scoresSLNB(...c.slnb);
      const pct = computeHamiltonPercentages(scores);
      expect(sumPercentages(pct)).toBe(100);
      expect([pct.SANGUINE, pct.LYMPHATIC, pct.NERVOUS, pct.BILIOUS]).toEqual(c.pct);
      expect(pct.BILIOUS === 0 || pct.BILIOUS > 0).toBe(true);
    });
  }
});

describe('Rule1 v1 Mixed / resolved / contradiction', () => {
  it('unique max → resolved; never emits forbidden tokens/fields', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_SANGUINE_PALPITATION', 'p1'),
          ev('R1_FEAT_SANGUINE_FACIAL_FLUSHING', 'f1'),
          ev('R1_FEAT_NERVOUS_CURRENT_ANXIETY', 'a1'),
        ],
      }),
    );
    expect(out.status).toBe('TEMPERAMENT_PROFILE_RESOLVED');
    expect(out.primaryTemperament).toBe('SANGUINE');
    expect(out.mixedSubtype).toBeNull();
    expect(out.dominantTemperaments).toBeNull();
    expect(JSON.stringify(out)).not.toContain('BILIOUS_HEPATIC');
    expect(JSON.stringify(out)).not.toContain('UNRESOLVED_TIE');
    expect(JSON.stringify(out)).not.toContain('secondaryTemperament');
  });

  it('two-way equal top → MIXED/DUAL', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_SANGUINE_PALPITATION', 'p1'),
          ev('R1_FEAT_LYMPHATIC_CURRENT_CONSTIPATION', 'c1'),
        ],
      }),
    );
    // both weight 2 → equal
    expect(out.scores.SANGUINE).toBe(2);
    expect(out.scores.LYMPHATIC).toBe(2);
    expect(out.status).toBe('MIXED_TEMPERAMENT');
    expect(out.mixedSubtype).toBe('DUAL_TEMPERAMENT');
    expect(out.primaryTemperament).toBeNull();
    expect(out.dominantTemperaments).toEqual(['SANGUINE', 'LYMPHATIC']);
    expect(out.percentages && sumPercentages(out.percentages)).toBe(100);
  });

  it('four-way equal → MULTI', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_BILIOUS_GASTRIC_HYPERACIDITY', 'b1'),
          ev('R1_FEAT_SANGUINE_PALPITATION', 's1'),
          ev('R1_FEAT_LYMPHATIC_CURRENT_CONSTIPATION', 'l1'),
          ev('R1_FEAT_NERVOUS_CURRENT_ANXIETY', 'n1'),
        ],
      }),
    );
    expect(out.status).toBe('MIXED_TEMPERAMENT');
    expect(out.mixedSubtype).toBe('MULTI_TEMPERAMENT');
    expect(out.dominantTemperaments).toEqual(['BILIOUS', 'SANGUINE', 'LYMPHATIC', 'NERVOUS']);
  });

  it('three-way equal top → MIXED/MULTI; lower score stays out of dominant', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_BILIOUS_GASTRIC_HYPERACIDITY', 'b1'),
          ev('R1_FEAT_SANGUINE_PALPITATION', 's1'),
          ev('R1_FEAT_LYMPHATIC_CURRENT_CONSTIPATION', 'l1'),
          ev('R1_FEAT_NERVOUS_CURRENT_ANXIETY', 'n1'),
          ev('R1_FEAT_NERVOUS_CURRENT_RESTLESSNESS', 'n2'),
        ],
      }),
    );
    // B=2,S=2,L=2,N=4 → unique N resolved, not multi
    expect(out.status).toBe('TEMPERAMENT_PROFILE_RESOLVED');
    expect(out.primaryTemperament).toBe('NERVOUS');

    const three = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_BILIOUS_GASTRIC_HYPERACIDITY', 'b1'),
          ev('R1_FEAT_SANGUINE_PALPITATION', 's1'),
          ev('R1_FEAT_LYMPHATIC_CURRENT_CONSTIPATION', 'l1'),
        ],
      }),
    );
    expect(three.status).toBe('MIXED_TEMPERAMENT');
    expect(three.mixedSubtype).toBe('MULTI_TEMPERAMENT');
    expect(three.dominantTemperaments).toEqual(['BILIOUS', 'SANGUINE', 'LYMPHATIC']);
    expect(three.scores.NERVOUS).toBe(0);
  });

  it('BP boundaries: 140 applies Sanguine; 139 does not; 100 not Lymphatic; 99 does with support', () => {
    const at140 = evaluateRule1Shadow(
      baseInput({
        evidence: [ev('R1_FEAT_SANGUINE_PALPITATION', 'p1')],
        structuredVitals: {
          systolicBpMmHg: { value: 140, unit: 'mmHg', validationPosture: 'VALIDATED' },
        },
      }),
    );
    expect(at140.scores.SANGUINE).toBe(5); // 2+3

    const at139 = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_SANGUINE_PALPITATION', 'p1'),
          ev('R1_FEAT_SANGUINE_FACIAL_FLUSHING', 'f1'),
        ],
        structuredVitals: {
          systolicBpMmHg: { value: 139, unit: 'mmHg', validationPosture: 'VALIDATED' },
        },
      }),
    );
    expect(at139.scores.SANGUINE).toBe(4); // no BP weight

    const at100 = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_LYMPHATIC_CURRENT_CONSTIPATION', 'c1'),
          ev('R1_FEAT_LYMPHATIC_SITE_BOUND_EDEMA', 'e1'),
        ],
        structuredVitals: {
          systolicBpMmHg: { value: 100, unit: 'mmHg', validationPosture: 'VALIDATED' },
        },
      }),
    );
    expect(at100.scores.LYMPHATIC).toBe(4); // 2+2, no BP at exactly 100

    const at99 = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_LYMPHATIC_CURRENT_CONSTIPATION', 'c1'),
          ev('R1_FEAT_LYMPHATIC_SITE_BOUND_EDEMA', 'e1'),
        ],
        structuredVitals: {
          systolicBpMmHg: { value: 99, unit: 'mmHg', validationPosture: 'VALIDATED' },
        },
      }),
    );
    expect(at99.scores.LYMPHATIC).toBe(6); // 2+2+2
  });

  it('systemic heat + cold same episode → contradictory not Mixed', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_SANGUINE_SUBJECTIVE_HEAT_TENDENCY', 'h1'),
          ev('R1_FEAT_LYMPHATIC_SUBJECTIVE_COLD_TENDENCY', 'c1'),
        ],
      }),
    );
    expect(out.status).toBe('TEMPERAMENT_CONTRADICTORY');
    expect(out.mixedSubtype).toBeNull();
    expect(out.primaryTemperament).toBeNull();
    expect(out.percentages && sumPercentages(out.percentages)).toBe(100);
  });

  it('historical cold does not form contradiction with current heat', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_SANGUINE_SUBJECTIVE_HEAT_TENDENCY', 'h1'),
          ev('R1_FEAT_LYMPHATIC_SUBJECTIVE_COLD_TENDENCY', 'c1', {
            temporalPosture: 'HISTORICAL',
          }),
          ev('R1_FEAT_SANGUINE_PALPITATION', 'p1'),
        ],
      }),
    );
    expect(out.status).not.toBe('TEMPERAMENT_CONTRADICTORY');
    expect(out.primaryTemperament).toBe('SANGUINE');
  });

  it('non-thermal site concepts alone never contradict; heat+cold overrides equal Mixed', () => {
    const local = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_NERVOUS_SITE_BOUND_SHOOTING_PAIN', 'p1'),
          ev('R1_FEAT_LYMPHATIC_SITE_BOUND_EDEMA', 'e1'),
        ],
      }),
    );
    expect(local.status).not.toBe('TEMPERAMENT_CONTRADICTORY');

    const override = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_SANGUINE_SUBJECTIVE_HEAT_TENDENCY', 'h1'),
          ev('R1_FEAT_LYMPHATIC_SUBJECTIVE_COLD_TENDENCY', 'c1'),
        ],
      }),
    );
    expect(override.scores.SANGUINE).toBe(override.scores.LYMPHATIC);
    expect(override.status).toBe('TEMPERAMENT_CONTRADICTORY');
    expect(override.mixedSubtype).toBeNull();
  });

  it('negated evidence is excluded and does not score', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_SANGUINE_PALPITATION', 'p1', { negationPosture: 'NEGATED' }),
          ev('R1_FEAT_SANGUINE_FACIAL_FLUSHING', 'f1'),
          ev('R1_FEAT_NERVOUS_CURRENT_ANXIETY', 'a1'),
        ],
      }),
    );
    expect(out.scores.SANGUINE).toBe(2);
    expect(
      out.excludedEvidence.some(
        (e) => e.reasonCode.includes('NEGATED') || e.conceptId === 'R1_FEAT_SANGUINE_PALPITATION',
      ),
    ).toBe(true);
  });
});

describe('Rule1 v1 determinism and firewall posture', () => {
  it('deep-equal replay and stable fingerprints', () => {
    const input = baseInput({
      evidence: [
        ev('R1_FEAT_BILIOUS_SCLERAL_CUTANEOUS_ICTERUS', 'i1'),
        ev('R1_FEAT_BILIOUS_HEPATIC_RUQ_PAIN', 'r1'),
      ],
    });
    const a = evaluateRule1Shadow(input);
    const b = evaluateRule1Shadow(input);
    expect(a).toEqual(b);
    expect(a.inputFingerprint).toBe(b.inputFingerprint);
    expect(a.catalogFingerprint).toBe(computeCatalogFingerprint());
    expect(a.clinicallyUsed).toBe(false);
    expect(a.medicineSelectionInfluence).toBe('NONE');
    expect(a.orchestrationStatus).toBe('NOT_CONNECTED');
  });

  it('does not use Date.now in fingerprint material path', () => {
    const out = evaluateRule1Shadow(
      baseInput({
        evidence: [
          ev('R1_FEAT_NERVOUS_CURRENT_ANXIETY', 'a1'),
          ev('R1_FEAT_NERVOUS_CURRENT_RESTLESSNESS', 'r1'),
        ],
      }),
    );
    expect(out.inputFingerprint).toMatch(/^[a-f0-9]{64}$/);
    // Ensure fingerprint is pure hash of synthetic bindings
    const material = [
      RULE1_INPUT_SCHEMA_VERSION,
      RULE1_RULE_CONTRACT_VERSION,
      'consult-1',
      'episode-1',
      'R1_FEAT_NERVOUS_CURRENT_ANXIETY|a1|CURRENT|ASSERTED|ACCEPTED',
      'R1_FEAT_NERVOUS_CURRENT_RESTLESSNESS|r1|CURRENT|ASSERTED|ACCEPTED',
      'bp:none',
    ].join('\n');
    expect(out.inputFingerprint).toBe(createHash('sha256').update(material, 'utf8').digest('hex'));
  });
});
