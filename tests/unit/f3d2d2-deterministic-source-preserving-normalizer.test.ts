import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  F3D2D2_DETERMINISTIC_NORMALIZER_FOUNDATION,
  F3D2D2_PERSISTENCE_CONNECTED,
  F3D2D2_PRODUCTION_WRITER_CONNECTED,
  FACT_NORMALIZER_METHOD,
  FACT_NORMALIZER_VERSION,
  NORMALIZER_FAILURE_CODES,
  computeNormalizerFingerprint,
  loadPinnedProductionPack,
  normalizeSourceLinkedFact,
  parseOwnerFrozenCues,
  PRODUCTION_TERMINOLOGY_PACK_PIN,
  type CueParserResult,
  type EligibleCueParserInput,
  type NormalizeSourceLinkedFactInput,
} from '../../packages/evidence-extract/src/index.ts';
import { ownerFrozenEntriesForCueParser } from '../../packages/evidence-extract/src/terminology/loader.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FP = 'a'.repeat(64);
const TENANT = {
  organizationId: '00000000-0000-4000-8000-0000000000a1',
  clinicId: '00000000-0000-4000-8000-0000000000a2',
  patientId: '00000000-0000-4000-8000-0000000000a3',
  consultationId: '00000000-0000-4000-8000-0000000000a4',
};

function cueInput(
  text: string,
  over: Partial<EligibleCueParserInput> = {},
): EligibleCueParserInput {
  return {
    sourceIdentityFingerprint: FP,
    sourceChannel: 'DOCTOR_DECLARED',
    sourceField: 'CHIEF_COMPLAINT',
    eligibleText: text.normalize('NFC'),
    ...TENANT,
    ...over,
  };
}

function normalizeFromText(text: string, sourceRef = 'src-1') {
  const pack = loadPinnedProductionPack();
  const parserResult = parseOwnerFrozenCues(cueInput(text), pack);
  const input: NormalizeSourceLinkedFactInput = {
    mode: 'CUE_RESULT',
    sourceRef,
    sourceChannel: 'DOCTOR_DECLARED',
    sourceField: 'CHIEF_COMPLAINT',
    sourceIdentityFingerprint: FP,
    parserResult,
  };
  return { pack, parserResult, result: normalizeSourceLinkedFact(input, pack) };
}

describe('F3D-2D2 deterministic source-preserving normalizer', () => {
  it('pins foundation without persistence or production writer', () => {
    expect(F3D2D2_DETERMINISTIC_NORMALIZER_FOUNDATION).toBe(true);
    expect(F3D2D2_PERSISTENCE_CONNECTED).toBe(false);
    expect(F3D2D2_PRODUCTION_WRITER_CONNECTED).toBe(false);
    expect(FACT_NORMALIZER_METHOD).toBe('OWNER_FROZEN_SOURCE_PRESERVING_V1');
    expect(FACT_NORMALIZER_VERSION).toBe('f3d2d2-source-preserving-normalizer-v1');
    expect(computeNormalizerFingerprint()).toMatch(/^[a-f0-9]{64}$/);
    expect(NORMALIZER_FAILURE_CODES).toContain('AMBIGUOUS_OVERLAP');
  });

  it('classifies all 45 frozen pack entries into supported kinds', () => {
    const pack = loadPinnedProductionPack();
    expect(pack.entryCount).toBe(PRODUCTION_TERMINOLOGY_PACK_PIN.expectedEntryCount);
    const entries = ownerFrozenEntriesForCueParser(pack);
    expect(entries?.length).toBe(45);
    const counts = { UNIT_ALIAS: 0, DURATION_PHRASE: 0, NEGATION_CUE: 0 };
    for (const e of entries ?? []) {
      expect(['UNIT_ALIAS', 'DURATION_PHRASE', 'NEGATION_CUE']).toContain(e.entryType);
      counts[e.entryType as keyof typeof counts] += 1;
      expect(e.decisionStatus).toBe('ACTIVE');
    }
    expect(counts).toEqual({ UNIT_ALIAS: 18, DURATION_PHRASE: 16, NEGATION_CUE: 11 });
  });

  it('maps cue unit aliases without conversion or case-fold', () => {
    const cases: Array<[string, string | null]> = [
      ['120mmHg', 'mmHg'],
      ['120 mmHg', 'mmHg'],
      ['MMHG', null],
      ['37°C', '°C'],
      ['37 C', null],
      ['13.2 g/dL', 'g/dL'],
      ['cells/µL', 'cells/µL'],
      ['%', null],
      ['bpm', null],
      ['C', null],
      ['F', null],
    ];
    for (const [text, label] of cases) {
      const { result } = normalizeFromText(text);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      const units = result.drafts.filter((d) => d.normalizationKind === 'UNIT_ALIAS');
      if (label == null) {
        expect(units).toHaveLength(0);
      } else {
        expect(units.some((d) => d.canonicalLabel === label)).toBe(true);
        expect(units.every((d) => d.limitationCodes.includes('NO_UNIT_CONVERSION'))).toBe(true);
      }
    }
  });

  it('maps duration phrases Hindi/English/Roman-Hindi without calendar math', () => {
    const cases: Array<[string, string]> = [
      ['आज से', 'since_today'],
      ['एक दिन से', '1_day'],
      ['since yesterday', 'since_yesterday'],
      ['SINCE YESTERDAY', 'since_yesterday'],
      ['sudden onset', 'onset_sudden'],
      ['aaj se', 'since_today'],
      ['AAJ SE', ''],
    ];
    for (const [text, label] of cases) {
      const { result } = normalizeFromText(text);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      const durs = result.drafts.filter((d) => d.normalizationKind === 'DURATION_PHRASE');
      if (label === '') {
        expect(durs).toHaveLength(0);
      } else {
        expect(durs.some((d) => d.canonicalLabel === label)).toBe(true);
      }
    }
  });

  it('maps negation cues as SCOPE_UNRESOLVED without clinical inversion', () => {
    const texts = [
      'denies fever',
      'denies A and B',
      'बुखार नहीं है',
      'not not detected',
      'negative for',
      'nahi hai',
      'NAHI HAI',
    ];
    for (const text of texts) {
      const { result } = normalizeFromText(text);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      const negs = result.drafts.filter((d) => d.normalizationKind === 'NEGATION_CUE');
      if (text === 'NAHI HAI') {
        expect(negs).toHaveLength(0);
        continue;
      }
      expect(negs.length).toBeGreaterThan(0);
      for (const d of negs) {
        expect(d.negationScope).toBe('SCOPE_UNRESOLVED');
        expect(d.clinicallyUsed).toBe(false);
        expect(d.authorityScope).toBe('FACT_NORMALIZED_SOURCE_LINKED');
        expect(d.limitationCodes).toContain('SCOPE_UNRESOLVED');
        expect(d).not.toHaveProperty('negated');
        expect(JSON.stringify(d)).not.toMatch(/fever|बुखार/);
      }
    }
  });

  it('supports structured-unit exact pack lookup without parser', () => {
    const pack = loadPinnedProductionPack();
    const ok = normalizeSourceLinkedFact(
      {
        mode: 'STRUCTURED_UNIT',
        sourceRef: 'vital-1',
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_BP_SYSTOLIC',
        sourceIdentityFingerprint: FP,
        assertedValueText: '120',
        unitText: 'mmHg',
        unitPosture: 'EXACT_AS_SOURCE',
      },
      pack,
    );
    expect(ok).toEqual(
      expect.objectContaining({
        ok: true,
        reason: 'NORMALIZED',
      }),
    );
    if (!ok.ok) return;
    expect(ok.drafts).toHaveLength(1);
    expect(ok.drafts[0]?.canonicalLabel).toBe('mmHg');
    expect(ok.drafts[0]?.normalizationKind).toBe('UNIT_ALIAS');
    expect(ok.drafts[0]?.parserVersion).toBe('none');
    expect(ok.drafts[0]?.canonicalLabel).not.toContain('120');

    const unknown = normalizeSourceLinkedFact(
      {
        mode: 'STRUCTURED_UNIT',
        sourceRef: 'vital-2',
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_PULSE',
        sourceIdentityFingerprint: FP,
        unitText: 'bpm',
        unitPosture: 'EXACT_AS_SOURCE',
      },
      pack,
    );
    expect(unknown).toEqual({ ok: true, drafts: [], reason: 'NO_MATCHES' });

    const folded = normalizeSourceLinkedFact(
      {
        mode: 'STRUCTURED_UNIT',
        sourceRef: 'vital-3',
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_TEMPERATURE',
        sourceIdentityFingerprint: FP,
        unitText: 'MMHG',
        unitPosture: 'EXACT_AS_SOURCE',
      },
      pack,
    );
    expect(folded).toEqual({ ok: true, drafts: [], reason: 'NO_MATCHES' });

    const mcg = normalizeSourceLinkedFact(
      {
        mode: 'STRUCTURED_UNIT',
        sourceRef: 'vital-4',
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_WEIGHT',
        sourceIdentityFingerprint: FP,
        unitText: 'mcg/dL',
        unitPosture: 'EXACT_AS_SOURCE',
      },
      pack,
    );
    const ug = normalizeSourceLinkedFact(
      {
        mode: 'STRUCTURED_UNIT',
        sourceRef: 'vital-5',
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_WEIGHT',
        sourceIdentityFingerprint: FP,
        unitText: 'µg/dL',
        unitPosture: 'EXACT_AS_SOURCE',
      },
      pack,
    );
    expect(mcg.ok && mcg.drafts[0]?.canonicalLabel).toBe('mcg/dL');
    expect(ug.ok && ug.drafts[0]?.canonicalLabel).toBe('µg/dL');
    expect(mcg.ok && ug.ok && mcg.drafts[0]?.cueEntryIds[0]).not.toBe(ug.drafts[0]?.cueEntryIds[0]);
  });

  it('rejects unsupported combinations and forbidden/unknown input keys', () => {
    const pack = loadPinnedProductionPack();
    const unsupported = normalizeSourceLinkedFact(
      {
        mode: 'CUE_RESULT',
        sourceRef: 'x',
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_PULSE',
        sourceIdentityFingerprint: FP,
        parserResult: { ok: true, reason: 'NO_MATCHES', matches: [] },
      },
      pack,
    );
    expect(unsupported).toEqual({
      ok: false,
      drafts: [],
      reason: 'UNSUPPORTED_SOURCE_COMBINATION',
    });

    const forbidden = normalizeSourceLinkedFact(
      {
        mode: 'STRUCTURED_UNIT',
        sourceRef: 'x',
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_PULSE',
        sourceIdentityFingerprint: FP,
        unitText: 'mmHg',
        unitPosture: 'EXACT_AS_SOURCE',
        clinicallyUsed: true,
      } as never,
      pack,
    );
    expect(forbidden.reason).toBe('INVALID_INPUT');

    const unknownKey = normalizeSourceLinkedFact(
      {
        mode: 'STRUCTURED_UNIT',
        sourceRef: 'x',
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_PULSE',
        sourceIdentityFingerprint: FP,
        unitText: 'mmHg',
        unitPosture: 'EXACT_AS_SOURCE',
        extra: 1,
      } as never,
      pack,
    );
    expect(unknownKey.reason).toBe('INVALID_INPUT');
  });

  it('fail-closes malformed Unicode, non-NFC, and oversized text fields', () => {
    const pack = loadPinnedProductionPack();
    const bom = normalizeSourceLinkedFact(
      {
        mode: 'STRUCTURED_UNIT',
        sourceRef: 'x',
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_PULSE',
        sourceIdentityFingerprint: FP,
        unitText: '\uFEFFmmHg',
        unitPosture: 'EXACT_AS_SOURCE',
      },
      pack,
    );
    expect(bom.reason).toBe('MALFORMED_UNICODE');

    const nonNfc = normalizeSourceLinkedFact(
      {
        mode: 'STRUCTURED_UNIT',
        sourceRef: 'x',
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_PULSE',
        sourceIdentityFingerprint: FP,
        unitText: 'e\u0301',
        unitPosture: 'EXACT_AS_SOURCE',
      },
      pack,
    );
    expect(nonNfc.reason).toBe('MALFORMED_UNICODE');

    const big = normalizeSourceLinkedFact(
      {
        mode: 'STRUCTURED_UNIT',
        sourceRef: 'x',
        sourceChannel: 'STRUCTURED_INTAKE',
        sourceField: 'VITAL_PULSE',
        sourceIdentityFingerprint: FP,
        unitText: 'm'.repeat(33),
        unitPosture: 'EXACT_AS_SOURCE',
      },
      pack,
    );
    expect(big.reason).toBe('SOURCE_TOO_LARGE');
  });

  it('propagates parser failures without partial drafts', () => {
    const pack = loadPinnedProductionPack();
    for (const reason of [
      'PARSER_TIMEOUT',
      'TOO_MANY_MATCHES',
      'AMBIGUOUS_OVERLAP',
      'UNTRUSTED_INPUT',
    ] as const) {
      const r = normalizeSourceLinkedFact(
        {
          mode: 'CUE_RESULT',
          sourceRef: 'x',
          sourceChannel: 'DOCTOR_DECLARED',
          sourceField: 'CHIEF_COMPLAINT',
          sourceIdentityFingerprint: FP,
          parserResult: { ok: false, reason, matches: [] },
        },
        pack,
      );
      expect(r.ok).toBe(false);
      expect(r.drafts).toEqual([]);
      if (reason === 'UNTRUSTED_INPUT') expect(r.reason).toBe('PARSER_FAILED');
      else if (reason === 'PARSER_TIMEOUT') expect(r.reason).toBe('PARSER_TIMEOUT');
      else expect(r.reason).toBe(reason);
    }
  });

  it('keeps deterministic ordering, dedup, and stable fingerprints', () => {
    const { result } = normalizeFromText('denies fever since yesterday 120 mmHg');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.reason).toBe('NORMALIZED');
    const kinds = result.drafts.map((d) => d.normalizationKind);
    const rank = { UNIT_ALIAS: 0, DURATION_PHRASE: 1, NEGATION_CUE: 2 } as const;
    for (let i = 1; i < kinds.length; i += 1) {
      expect(rank[kinds[i]!] >= rank[kinds[i - 1]!]).toBe(true);
    }
    const fp = result.drafts[0]!.normalizationIdentityFingerprint;
    const again = normalizeFromText('denies fever since yesterday 120 mmHg').result;
    expect(again.ok && again.drafts[0]?.normalizationIdentityFingerprint).toBe(fp);

    const draft = result.drafts.find((d) => d.normalizationKind === 'NEGATION_CUE');
    expect(draft).toBeTruthy();
    if (!draft) return;
    const reordered = {
      ...draft,
      cueEntryIds: [...draft.cueEntryIds].reverse(),
    };
    // Recompute via API with same logical ids order independence is covered by
    // identity helper: sorting happens inside buildDraft.
    expect(draft.cueEntryIds).toEqual([...draft.cueEntryIds].sort());
    void reordered;
    expect(JSON.stringify(result)).not.toMatch(/originalSourceSpan|eligibleText/);
    expect(result.drafts.every((d) => !('organizationId' in d))).toBe(true);
    expect(result.drafts.every((d) => !('decisionStatus' in d))).toBe(true);
  });

  it('changes fingerprint when source identity changes', () => {
    const pack = loadPinnedProductionPack();
    const parserResult = parseOwnerFrozenCues(cueInput('120 mmHg'), pack);
    const a = normalizeSourceLinkedFact(
      {
        mode: 'CUE_RESULT',
        sourceRef: 'a',
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        sourceIdentityFingerprint: 'b'.repeat(64),
        parserResult: {
          ...parserResult,
          ...(parserResult.ok
            ? {
                matches: parserResult.matches.map((m) => ({
                  ...m,
                  sourceIdentityFingerprint: 'b'.repeat(64),
                })),
              }
            : {}),
        } as CueParserResult,
      },
      pack,
    );
    const c = normalizeSourceLinkedFact(
      {
        mode: 'CUE_RESULT',
        sourceRef: 'c',
        sourceChannel: 'DOCTOR_DECLARED',
        sourceField: 'CHIEF_COMPLAINT',
        sourceIdentityFingerprint: 'c'.repeat(64),
        parserResult: {
          ...parserResult,
          ...(parserResult.ok
            ? {
                matches: parserResult.matches.map((m) => ({
                  ...m,
                  sourceIdentityFingerprint: 'c'.repeat(64),
                })),
              }
            : {}),
        } as CueParserResult,
      },
      pack,
    );
    expect(a.ok && c.ok).toBe(true);
    if (!a.ok || !c.ok) return;
    expect(a.drafts[0]?.normalizationIdentityFingerprint).not.toBe(
      c.drafts[0]?.normalizationIdentityFingerprint,
    );
  });

  it('does not import database/writer packages from normalizer sources', () => {
    const dir = path.join(root, 'packages/evidence-extract/src/terminology/normalizer');
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.ts')) continue;
      const text = fs.readFileSync(path.join(dir, name), 'utf8');
      expect(text).not.toMatch(
        /@ehas2\/database|PgFactNormalizationRepository|parseOwnerFrozenCues/,
      );
      expect(text).not.toMatch(/Date\.now|fetch\(|clinicallyUsed:\s*true/);
    }
  });

  it('keeps readiness flags untouched in createApp', () => {
    const ready = fs.readFileSync(path.join(root, 'apps/api/src/createApp.ts'), 'utf8');
    expect(ready).toMatch(/ready:\s*false/);
    expect(ready).not.toMatch(/f3d2dFoundation/);
    expect(ready).toMatch(/normalizationParserAvailable:\s*NORMALIZATION_PARSER_AVAILABLE/);
  });
});
