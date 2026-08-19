import { createHash } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../apps/api/src/createApp.ts';
import {
  CUE_PARSER_CONNECTED,
  CUE_PARSER_FOUNDATION,
  CUE_PARSER_PRODUCTION_ENABLED,
  loadHistoricalEmptyPack,
  loadPinnedProductionPack,
  parseOwnerFrozenCues,
  type EligibleCueParserInput,
} from '../../packages/evidence-extract/src/index.ts';
import { parseOwnerFrozenCuesInternalForTests } from '../../packages/evidence-extract/src/terminology/parser/internalForTests.ts';
import { scanFrozenAliases } from '../../packages/evidence-extract/src/terminology/parser/match.ts';
import { CueParserError } from '../../packages/evidence-extract/src/terminology/parser/types.ts';
import type { TerminologyPackEntry } from '../../packages/evidence-extract/src/terminology/types.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const FP = createHash('sha256').update('synthetic-source-identity', 'utf8').digest('hex');
const ORG = '00000000-0000-4000-8000-000000000001';
const CLINIC = '00000000-0000-4000-8000-000000000002';
const PATIENT = '00000000-0000-4000-8000-000000000003';
const CONSULT = '00000000-0000-4000-8000-000000000004';

const LEAK = new RegExp(
  [
    'b3abc204139186c7c666a6bcd1c529117bda1bc2da9f2eac6a377d57914083a5',
    'EHAS2_F3D2_PACK_APPROVAL',
    'ehas2-owner-cue-pack\\.v1\\.0\\.0\\.json',
    String.raw`C:\\`,
    '/home/',
  ].join('|'),
);

function input(text: string, extra: Partial<EligibleCueParserInput> = {}): EligibleCueParserInput {
  return {
    sourceIdentityFingerprint: FP,
    sourceChannel: 'DOCTOR_DECLARED',
    sourceField: 'CHIEF_COMPLAINT',
    eligibleText: text,
    organizationId: ORG,
    clinicId: CLINIC,
    patientId: PATIENT,
    consultationId: CONSULT,
    ...extra,
  };
}

function dummyEntry(id: string, alias: string): TerminologyPackEntry {
  return {
    id,
    entryType: 'NEGATION_CUE',
    aliasText: alias,
    canonicalLabel: 'x',
    language: 'en',
    script: 'Latn',
    ambiguityClassification: 'UNAMBIGUOUS',
    provenanceReference: 'OWNER_CLINIC_LANGUAGE_DECLARATION',
    licenseClassification: 'OWNER_CLINIC_FROZEN',
    negationInteraction: 'PRE_CUE',
    contextRequirements: 'SAME_CLAUSE',
    decisionStatus: 'ACTIVE',
    selectorProhibition: 'SELECTOR_FORBIDDEN',
  };
}

describe('F3D-2B in-memory cue parser foundation', () => {
  const pack = loadPinnedProductionPack();

  it('keeps lookupAlias disconnected and pack non-executable', () => {
    expect(pack.lookupAlias('denies')).toEqual({
      matched: false,
      reason: 'TERMINOLOGY_LOOKUP_NOT_CONNECTED',
    });
    expect(pack.executable).toBe(false);
    expect(pack.normalizationParserAvailable).toBe(false);
  });

  it('matches Hindi Devanagari POST cue with UTF-16 offsets on NFC text', () => {
    const text = 'बुखार नहीं है';
    const cue = 'नहीं है';
    const start = text.indexOf(cue);
    const res = parseOwnerFrozenCues(input(text), pack);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const hit = res.matches.find((m) => m.entryId === 'neg-01');
    expect(hit).toBeTruthy();
    expect(hit?.originalSourceSpan).toBe(cue);
    expect(hit?.startOffset).toBe(start);
    expect(hit?.endOffset).toBe(start + cue.length);
    expect(hit?.endOffset - hit!.startOffset).toBe(cue.length);
    expect(text.slice(hit!.startOffset, hit!.endOffset)).toBe(cue);
    expect(hit?.attachmentStatus).toBe('SCOPE_UNRESOLVED');
    expect(hit?.clinicallyUsed).toBe(false);
    expect(hit).not.toHaveProperty('negated');
  });

  it('ASCII case-folds English word aliases only', () => {
    const res = parseOwnerFrozenCues(input('SINCE YESTERDAY'), pack);
    expect(res.ok && res.matches.some((m) => m.entryId === 'dur-08')).toBe(true);
    const roman = parseOwnerFrozenCues(input('NAHI HAI'), pack);
    expect(roman.ok && roman.matches.length === 0).toBe(true);
    const unitCase = parseOwnerFrozenCues(input('MMHG'), pack);
    expect(unitCase.ok && unitCase.matches.length === 0).toBe(true);
    const mmhg = parseOwnerFrozenCues(input('mmhg'), pack);
    expect(mmhg.ok && mmhg.matches.length === 0).toBe(true);
  });

  it('matches Roman-Hindi exact nahi hai', () => {
    const text = 'bukhar nahi hai';
    const res = parseOwnerFrozenCues(input(text), pack);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const hit = res.matches.find((m) => m.entryId === 'neg-09');
    expect(hit?.originalSourceSpan).toBe('nahi hai');
    expect(hit?.startOffset).toBe(text.indexOf('nahi hai'));
    expect(hit?.attachmentStatus).toBe('SCOPE_UNRESOLVED');
  });

  it('matches mixed-language text without converting hyphens or spaces', () => {
    const text = 'denies fever धीरे-धीरे 120 mmHg';
    const res = parseOwnerFrozenCues(input(text), pack);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.matches.map((m) => m.entryId).sort()).toEqual(['dur-06', 'neg-04', 'unit-01']);
    expect(parseOwnerFrozenCues(input('धीरे धीरे'), pack).matches?.length ?? 1).toBe(0);
    expect(
      parseOwnerFrozenCues(input('dheere-dheere'), pack).ok &&
        parseOwnerFrozenCues(input('dheere-dheere'), pack).matches.length === 0,
    ).toBe(true);
    const roman = parseOwnerFrozenCues(input('dheere dheere'), pack);
    expect(roman.ok && roman.matches.some((m) => m.entryId === 'dur-16')).toBe(true);
  });

  it('treats punctuation as a boundary without stripping alias interiors', () => {
    const res = parseOwnerFrozenCues(input('(mmHg).'), pack);
    expect(res.ok && res.matches[0]?.entryId).toBe('unit-01');
    expect(res.ok && res.matches[0]?.originalSourceSpan).toBe('mmHg');
    const denied = parseOwnerFrozenCues(input('denies,'), pack);
    expect(denied.ok && denied.matches[0]?.entryId).toBe('neg-04');
  });

  it('rejects letter boundaries for units and words', () => {
    expect(
      parseOwnerFrozenCues(input('xmmHg'), pack).ok &&
        parseOwnerFrozenCues(input('xmmHg'), pack).matches.length === 0,
    ).toBe(true);
    expect(parseOwnerFrozenCues(input('mmHgx'), pack).matches?.length ?? 1).toBe(0);
    expect(parseOwnerFrozenCues(input('xdenies'), pack).matches?.length ?? 1).toBe(0);
  });

  it('emits repeated cues with stable ordering and deterministic ids', () => {
    const text = 'denies fever; denies cough';
    const a = parseOwnerFrozenCues(input(text), pack);
    const b = parseOwnerFrozenCues(input(text), pack);
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    const denies = a.matches.filter((m) => m.entryId === 'neg-04');
    expect(denies).toHaveLength(2);
    expect(denies[0].startOffset).toBeLessThan(denies[1].startOffset);
    expect(a.matches.map((m) => m.candidateId)).toEqual(b.matches.map((m) => m.candidateId));
    expect(new Set(a.matches.map((m) => `${m.entryId}:${m.startOffset}:${m.endOffset}`)).size).toBe(
      a.matches.length,
    );
  });

  it('prefers longest match at a position', () => {
    const res = parseOwnerFrozenCues(input('not detected'), pack);
    expect(res.ok && res.matches).toHaveLength(1);
    expect(res.ok && res.matches[0]?.entryId).toBe('neg-07');
  });

  it('fails closed on ambiguous equal-length overlap', () => {
    const scanned = scanFrozenAliases('aa', [dummyEntry('a-1', 'aa'), dummyEntry('a-2', 'aa')]);
    expect(scanned).toEqual({ ok: false, reason: 'AMBIGUOUS_OVERLAP' });
  });

  it('caps at 32 matches and returns no partial success beyond the cap', () => {
    const thirtyTwo = parseOwnerFrozenCues(input(`${'denies '.repeat(32).trimEnd()}`), pack);
    expect(thirtyTwo.ok).toBe(true);
    if (!thirtyTwo.ok) return;
    expect(thirtyTwo.matches.filter((m) => m.entryId === 'neg-04')).toHaveLength(32);
    const tooMany = parseOwnerFrozenCues(input(`${'denies '.repeat(33).trimEnd()}`), pack);
    expect(tooMany).toEqual({ ok: false, reason: 'TOO_MANY_MATCHES', matches: [] });
  });

  it('rejects malformed Unicode, zero-width, BOM, and oversize input', () => {
    expect(parseOwnerFrozenCues(input('\u0001'), pack).reason).toBe('MALFORMED_UNICODE');
    expect(parseOwnerFrozenCues(input('a\uD800'), pack).reason).toBe('MALFORMED_UNICODE');
    expect(parseOwnerFrozenCues(input('a\u200B'), pack).reason).toBe('MALFORMED_UNICODE');
    expect(parseOwnerFrozenCues(input('\uFEFFdenies'), pack).reason).toBe('MALFORMED_UNICODE');
    expect(parseOwnerFrozenCues(input('e\u0301'), pack).reason).toBe('MALFORMED_UNICODE');
    expect(parseOwnerFrozenCues(input('a'.repeat(2001)), pack).reason).toBe('INPUT_TOO_LARGE');
  });

  it('public parser accepts only two arguments and a fixed 50 ms budget', () => {
    expect(parseOwnerFrozenCues.length).toBe(2);
    type PublicParams = Parameters<typeof parseOwnerFrozenCues>;
    type ArityTwo = PublicParams['length'] extends 2
      ? 2 extends PublicParams['length']
        ? true
        : never
      : never;
    const arityTwo: ArityTwo = true;
    expect(arityTwo).toBe(true);
    const publicSrc = fs.readFileSync(
      path.join(root, 'packages/evidence-extract/src/terminology/parser/index.ts'),
      'utf8',
    );
    expect(publicSrc).not.toMatch(/budgetMs/);
    expect(publicSrc).not.toMatch(/\bnow\?:/);
    expect(publicSrc).toMatch(/CUE_PARSER_BUDGET_MS/);
    expect(publicSrc).toMatch(/trustedMonotonicNow/);
    const pkg = fs.readFileSync(path.join(root, 'packages/evidence-extract/src/index.ts'), 'utf8');
    const term = fs.readFileSync(
      path.join(root, 'packages/evidence-extract/src/terminology/index.ts'),
      'utf8',
    );
    expect(pkg).not.toMatch(/internalForTests|parseOwnerFrozenCuesInternalForTests|budgetMs/);
    expect(term).not.toMatch(/internalForTests|parseOwnerFrozenCuesInternalForTests|budgetMs/);
    expect(publicSrc).not.toMatch(/parseOwnerFrozenCuesInternalForTests|internalForTests/);
    const distIndex = path.join(root, 'packages/evidence-extract/dist/index.d.ts');
    const distParser = path.join(
      root,
      'packages/evidence-extract/dist/terminology/parser/index.d.ts',
    );
    const distTerm = path.join(root, 'packages/evidence-extract/dist/terminology/index.d.ts');
    for (const rel of [distIndex, distParser, distTerm]) {
      if (!fs.existsSync(rel)) continue;
      const dts = fs.readFileSync(rel, 'utf8');
      expect(dts, rel).not.toMatch(/budgetMs|now\?:/);
      expect(dts, rel).not.toMatch(/parseOwnerFrozenCuesInternalForTests|internalForTests/);
    }
    if (fs.existsSync(distParser)) {
      expect(fs.readFileSync(distParser, 'utf8')).toMatch(
        /parseOwnerFrozenCues\(eligibleInput: EligibleCueParserInput, loadedPack: LoadedTerminologyPack\)/,
      );
    }
  });

  it('does not expose the internal seam from production sources', () => {
    const skip = new Set([
      path.join(root, 'packages/evidence-extract/src/terminology/parser/internalForTests.ts'),
    ]);
    const stack = [path.join(root, 'apps'), path.join(root, 'packages')];
    const hits: string[] = [];
    while (stack.length > 0) {
      const dir = stack.pop();
      if (!dir) break;
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === 'dist' || ent.name === 'node_modules') continue;
          stack.push(abs);
          continue;
        }
        if (!ent.name.endsWith('.ts') && !ent.name.endsWith('.js')) continue;
        if (skip.has(abs)) continue;
        const src = fs.readFileSync(abs, 'utf8');
        if (
          src.includes('internalForTests') ||
          src.includes('parseOwnerFrozenCuesInternalForTests')
        ) {
          hits.push(path.relative(root, abs).replaceAll('\\', '/'));
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it('returns PARSER_TIMEOUT with no partial matches via the internal test seam', () => {
    const res = parseOwnerFrozenCuesInternalForTests(input('denies fever'), pack, {
      budgetMs: 50,
      now: (() => {
        let n = 0;
        return () => {
          n += 1;
          return n === 1 ? 0 : 51;
        };
      })(),
    });
    expect(res).toEqual({ ok: false, reason: 'PARSER_TIMEOUT', matches: [] });
    expect(JSON.stringify(res)).not.toMatch(LEAK);
    expect(JSON.stringify(res)).not.toMatch(/denies|fever|bukhar/);
  });

  it('internal test seam rejects invalid budgets and clocks without leaking source', () => {
    const cases: { name: string; budgetMs: number; now: () => number }[] = [
      { name: 'Infinity', budgetMs: Number.POSITIVE_INFINITY, now: () => 0 },
      { name: 'NaN', budgetMs: Number.NaN, now: () => 0 },
      { name: 'negative', budgetMs: -1, now: () => 0 },
      { name: 'zero', budgetMs: 0, now: () => 0 },
      { name: 'greater than 50', budgetMs: 51, now: () => 0 },
    ];
    for (const row of cases) {
      const res = parseOwnerFrozenCuesInternalForTests(input('denies fever'), pack, {
        budgetMs: row.budgetMs,
        now: row.now,
      });
      expect(res, row.name).toEqual({ ok: false, reason: 'UNTRUSTED_INPUT', matches: [] });
      expect(JSON.stringify(res), row.name).not.toMatch(LEAK);
      expect(JSON.stringify(res), row.name).not.toMatch(/denies fever/);
    }
    const throwing = parseOwnerFrozenCuesInternalForTests(input('denies fever'), pack, {
      budgetMs: 50,
      now: () => {
        throw new Error(
          'secret b3abc204139186c7c666a6bcd1c529117bda1bc2da9f2eac6a377d57914083a5 denies',
        );
      },
    });
    expect(throwing).toEqual({ ok: false, reason: 'PARSER_TIMEOUT', matches: [] });
    expect(JSON.stringify(throwing)).not.toMatch(LEAK);
    expect(JSON.stringify(throwing)).not.toMatch(/secret|denies/);
    const nonFinite = parseOwnerFrozenCuesInternalForTests(input('denies fever'), pack, {
      budgetMs: 50,
      now: () => Number.NaN,
    });
    expect(nonFinite).toEqual({ ok: false, reason: 'PARSER_TIMEOUT', matches: [] });
    const backwards = parseOwnerFrozenCuesInternalForTests(input('denies fever'), pack, {
      budgetMs: 50,
      now: (() => {
        let step = 0;
        return () => {
          step += 1;
          return step === 1 ? 10 : 1;
        };
      })(),
    });
    expect(backwards).toEqual({ ok: false, reason: 'PARSER_TIMEOUT', matches: [] });
  });

  it('refuses empty and mutated packs without partial output', () => {
    const empty = loadHistoricalEmptyPack();
    expect(parseOwnerFrozenCues(input('denies'), empty)).toEqual({
      ok: false,
      reason: 'PACK_UNAVAILABLE',
      matches: [],
    });
    const clone = { ...pack, contentChecksum: '0'.repeat(64) };
    expect(parseOwnerFrozenCues(input('denies'), clone).reason).toBe('PACK_UNAVAILABLE');
  });

  it('handles approved negation examples without clinical absence', () => {
    const cases: [string, string][] = [
      ['denies fever', 'neg-04'],
      ['negative for malaria', 'neg-08'],
      ['fever not detected', 'neg-07'],
      ['बुखार नहीं है', 'neg-01'],
      ['bukhar nahi hai', 'neg-09'],
    ];
    for (const [text, id] of cases) {
      const res = parseOwnerFrozenCues(input(text), pack);
      expect(res.ok, text).toBe(true);
      if (!res.ok) continue;
      const hit = res.matches.find((m) => m.entryId === id);
      expect(hit?.attachmentStatus, text).toBe('SCOPE_UNRESOLVED');
      expect(hit).not.toHaveProperty('negated');
      expect(hit?.authorityScope).toBe('TERMINOLOGY_CUE_MATCH_ONLY');
    }
  });

  it('marks coordination as UNRESOLVED_NEGATION and does not attach across sentences', () => {
    const andEn = parseOwnerFrozenCues(input('denies A and B'), pack);
    expect(andEn.ok && andEn.matches[0]?.attachmentStatus).toBe('UNRESOLVED_NEGATION');
    const orEn = parseOwnerFrozenCues(input('denies A or B'), pack);
    expect(orEn.ok && orEn.matches[0]?.attachmentStatus).toBe('UNRESOLVED_NEGATION');
    const hi = parseOwnerFrozenCues(input('बुखार नहीं है और खांसी'), pack);
    expect(hi.ok && hi.matches.find((m) => m.entryId === 'neg-01')?.attachmentStatus).toBe(
      'UNRESOLVED_NEGATION',
    );
    const ya = parseOwnerFrozenCues(input('बुखार नहीं है या खांसी'), pack);
    expect(ya.ok && ya.matches[0]?.attachmentStatus).toBe('UNRESOLVED_NEGATION');
    const cross = parseOwnerFrozenCues(input('denies.\nfever'), pack);
    expect(cross.ok && cross.matches[0]?.entryId).toBe('neg-04');
    expect(cross.ok && cross.matches[0]?.attachmentStatus).toBe('SCOPE_UNRESOLVED');
    expect(cross.ok && cross.matches.every((m) => m.entryType === 'NEGATION_CUE')).toBe(true);
  });

  it('preserves duration labels and rejects unfrozen calendar phrases', () => {
    const today = parseOwnerFrozenCues(input('आज से'), pack);
    expect(today.ok && today.matches[0]?.canonicalLabel).toBe('since_today');
    const sudden = parseOwnerFrozenCues(input('sudden onset'), pack);
    expect(sudden.ok && sudden.matches[0]?.canonicalLabel).toBe('onset_sudden');
    for (const rejected of ['कल', 'परसों', '4 दिन से']) {
      const res = parseOwnerFrozenCues(input(rejected), pack);
      expect(res.ok && res.matches.length === 0, rejected).toBe(true);
    }
  });

  it('matches units with optional leading digits and never returns a number field', () => {
    for (const text of ['mmHg', '120 mmHg', '120mmHg']) {
      const res = parseOwnerFrozenCues(input(text), pack);
      expect(res.ok && res.matches).toHaveLength(1);
      if (!res.ok) continue;
      expect(res.matches[0].entryId).toBe('unit-01');
      expect(res.matches[0].originalSourceSpan).toBe('mmHg');
      expect(res.matches[0]).not.toHaveProperty('numericValue');
      expect(res.matches[0]).not.toHaveProperty('value');
    }
    const cToF = parseOwnerFrozenCues(input('°C'), pack);
    expect(cToF.ok && cToF.matches[0]?.entryId).toBe('unit-02');
    expect(cToF.ok && cToF.matches[0]?.canonicalLabel).toBe('°C');
  });

  it('rejects unapproved standalone units', () => {
    for (const token of ['C', 'F', '%', 'µL', 'bpm', 'g', 'mm']) {
      const res = parseOwnerFrozenCues(input(token), pack);
      expect(res.ok && res.matches.length === 0, token).toBe(true);
    }
  });

  it('propagates storage-free locators and rejects storage keys', () => {
    const ok = parseOwnerFrozenCues(
      input('denies', { sourceLocator: { page: 2, blockIndex: 1 } }),
      pack,
    );
    expect(ok.ok && ok.matches[0]?.sourceLocator).toEqual({ page: 2, blockIndex: 1 });
    const bad = parseOwnerFrozenCues(
      input('denies', { sourceLocator: { page: 1, object_key: 'k' } as never }),
      pack,
    );
    expect(bad.reason).toBe('SOURCE_LOCATOR_STORAGE_FORBIDDEN');
    expect(bad.matches).toEqual([]);
  });

  it('does not leak PHI, checksums, tokens, or paths through errors or readiness', async () => {
    const err = new CueParserError('MALFORMED_UNICODE');
    expect(JSON.stringify(err.toJSON())).toBe('{"code":"MALFORMED_UNICODE"}');
    expect(JSON.stringify(err.toJSON())).not.toMatch(LEAK);
    const failed = parseOwnerFrozenCues(input('\u0001denies fever bukhar'), pack);
    expect(JSON.stringify(failed)).toEqual(
      JSON.stringify({ ok: false, reason: 'MALFORMED_UNICODE', matches: [] }),
    );
    const app = createApp();
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as AddressInfo).port;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/ready`);
      const json = (await res.json()) as Record<string, unknown>;
      expect(res.status).toBe(503);
      expect(json.ready).toBe(false);
      expect(json.clinicalEngine).toBe(false);
      expect(json.extractProduction).toBe(false);
      expect(json.normalizationParserAvailable).toBe(false);
      expect(json.cueParserFoundation).toBe(true);
      expect(json.cueParserConnected).toBe(false);
      expect(json.cueParserProductionEnabled).toBe(false);
      expect(json.cueParserFoundation).toBe(CUE_PARSER_FOUNDATION);
      expect(json.cueParserConnected).toBe(CUE_PARSER_CONNECTED);
      expect(json.cueParserProductionEnabled).toBe(CUE_PARSER_PRODUCTION_ENABLED);
      expect(json).not.toHaveProperty('cueParserVersion');
      expect(json).not.toHaveProperty('budgetMs');
      expect(JSON.stringify(json)).not.toMatch(/budgetMs|trustedMonotonicNow|performance\.now/);
      expect(JSON.stringify(json)).not.toMatch(LEAK);
      expect(JSON.stringify(json)).not.toMatch(/नहीं है|dheere dheere|mmHg|denies/);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((e) => (e ? reject(e) : resolve())),
      );
    }
  });

  it('does not import a production HTTP parser route or worker job type', () => {
    const flags = fs.readFileSync(
      path.join(root, 'packages/evidence-extract/src/flags.ts'),
      'utf8',
    );
    expect(flags).not.toMatch(/EHAS2_F3D2B_CUE_PARSER\s*=\s*'1'/);
    const api = fs.readFileSync(path.join(root, 'apps/api/src/createApp.ts'), 'utf8');
    expect(api).not.toMatch(/parseOwnerFrozenCues/);
    expect(api).not.toMatch(/internalForTests|parseOwnerFrozenCuesInternalForTests/);
  });
});
