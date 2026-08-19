import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../../apps/api/src/createApp.ts';
import {
  PRODUCTION_TERMINOLOGY_PACK_PIN,
  TerminologyPackError,
  canonicalChecksumJson,
  computeContentChecksum,
  defaultProductionPackPath,
  getTerminologyReadinessPosture,
  historicalEmptyPackPath,
  loadDefaultProductionPack,
  loadHistoricalEmptyPack,
  loadPinnedProductionPack,
  loadTerminologyPackFromFile,
  loadTerminologyPackFromObject,
  parseAndValidatePack,
  pinnedProductionPackPath,
} from '../../packages/evidence-extract/src/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const APPROVED_CHECKSUM = '68f65b133dbf91077fe3a962d6f6755e2714e10c0ec317ec35605348b48d5b20';
const APPROVED_TOKEN =
  'EHAS2_F3D2_PACK_APPROVAL:ehas2-owner-cue-pack:1.0.0:68f65b133dbf91077fe3a962d6f6755e2714e10c0ec317ec35605348b48d5b20';
const EMPTY_CHECKSUM = '3bd6d37db4a65952b9386106138ebd67ac4d78d34da21446dbb910761541771e';
const LEAK = new RegExp(
  [
    APPROVED_CHECKSUM,
    APPROVED_TOKEN,
    EMPTY_CHECKSUM,
    'ehas2-owner-cue-pack\\.v1\\.0\\.0\\.json',
    'empty-awaiting-owner-freeze\\.v1\\.json',
    'नहीं है',
    'dheere dheere',
    'mmHg',
    'zxq-alias-alpha',
  ].join('|'),
);

function readJson(abs: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as Record<string, unknown>;
}

function bytesOf(raw: unknown): number {
  return Buffer.byteLength(JSON.stringify(raw), 'utf8');
}

function expectCode(fn: () => unknown, code: string): void {
  try {
    fn();
    expect.fail(`expected ${code}`);
  } catch (err) {
    expect(err).toBeInstanceOf(TerminologyPackError);
    expect((err as TerminologyPackError).code).toBe(code);
  }
}

function assertNoLeak(text: string): void {
  expect(text).not.toMatch(LEAK);
}

describe('F3D-2 Freeze A+B+C pinned cue pack', () => {
  it('matches the approved canonical checksum and byte length', () => {
    const raw = readJson(pinnedProductionPackPath());
    const canon = canonicalChecksumJson(raw);
    expect(Buffer.byteLength(canon, 'utf8')).toBe(18928);
    expect(computeContentChecksum(raw)).toBe(APPROVED_CHECKSUM);
    expect(raw.contentChecksum).toBe(APPROVED_CHECKSUM);
    expect(raw.ownerApprovalToken).toBe(APPROVED_TOKEN);
    const pack = parseAndValidatePack(raw, bytesOf(raw));
    expect(pack.schemaVersion).toBe('ehas2-terminology-pack-v1');
    expect(pack.canonicalizationVersion).toBe('ehas2-terminology-canonical-v1');
    expect(pack.checksumAlgorithm).toBe('sha256');
    expect(pack.createdAt).toBe('2026-08-19T00:00:00.000Z');
    expect(pack.provenance.source).toBe('OWNER_CLINIC_LANGUAGE_DECLARATION');
    expect(pack.licenseClassification).toBe('OWNER_CLINIC_FROZEN');
    expect(pack.status).toBe('OWNER_FROZEN');
  });

  it('has exactly 45 unique ACTIVE entries with group counts 11/16/18', () => {
    const raw = readJson(pinnedProductionPackPath());
    const entries = raw.entries as Array<{
      id: string;
      entryType: string;
      decisionStatus: string;
      aliasText: string;
    }>;
    expect(entries).toHaveLength(45);
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(45);
    expect(entries.every((e) => e.decisionStatus === 'ACTIVE')).toBe(true);
    const counts = Object.fromEntries(
      ['NEGATION_CUE', 'DURATION_PHRASE', 'UNIT_ALIAS'].map((t) => [
        t,
        entries.filter((e) => e.entryType === t).length,
      ]),
    );
    expect(counts).toEqual({ NEGATION_CUE: 11, DURATION_PHRASE: 16, UNIT_ALIAS: 18 });
    for (let i = 1; i <= 11; i += 1) expect(ids).toContain(`neg-${String(i).padStart(2, '0')}`);
    for (let i = 1; i <= 16; i += 1) expect(ids).toContain(`dur-${String(i).padStart(2, '0')}`);
    for (let i = 1; i <= 18; i += 1) expect(ids).toContain(`unit-${String(i).padStart(2, '0')}`);
    expect(entries.some((e) => e.entryType === 'CLINICAL_SYNONYM')).toBe(false);
    expect(
      entries.some((e) =>
        /complaint|disease|medicine|formula|potency|dose|organ|temperament|severity/i.test(
          e.aliasText,
        ),
      ),
    ).toBe(false);
  });

  it('keeps Freeze D empty and NFC unique ACTIVE aliases', () => {
    const raw = readJson(pinnedProductionPackPath());
    const entries = raw.entries as Array<{
      aliasText: string;
      canonicalLabel: string;
      entryType: string;
    }>;
    const aliases = entries.map((e) => e.aliasText);
    expect(new Set(aliases).size).toBe(45);
    expect(aliases.every((a) => a === a.normalize('NFC'))).toBe(true);
    expect(entries.every((e) => e.canonicalLabel === e.canonicalLabel.normalize('NFC'))).toBe(true);
    const blob = JSON.stringify(entries);
    expect(blob).not.toMatch(/CLINICAL_SYNONYM/);
    expect(blob.toLowerCase()).not.toMatch(/bukhar|hemoglob|fever|cough|vomiting/);
  });

  it('rejects duplicate ACTIVE aliases on the frozen pack', () => {
    const raw = readJson(pinnedProductionPackPath());
    const entries = [...(raw.entries as Record<string, unknown>[])];
    entries.push({ ...entries[0], id: 'neg-dup' });
    const dup = { ...raw, entries };
    dup.contentChecksum = computeContentChecksum(dup);
    expectCode(() => parseAndValidatePack(dup, bytesOf(dup)), 'TERMINOLOGY_PACK_DUPLICATE_ALIAS');
  });

  it('invalidates checksum/token approval on content, version, provenance, or createdAt mutation', () => {
    const raw = readJson(pinnedProductionPackPath());
    const oneByte = {
      ...raw,
      provenance: { ...(raw.provenance as object), note: 'x' },
    };
    oneByte.contentChecksum = raw.contentChecksum;
    expectCode(
      () => loadTerminologyPackFromObject(oneByte, bytesOf(oneByte)),
      'TERMINOLOGY_PACK_CHECKSUM_MISMATCH',
    );
    const versioned = { ...raw, packVersion: '1.0.1' };
    versioned.contentChecksum = computeContentChecksum(versioned);
    versioned.ownerApprovalToken = APPROVED_TOKEN;
    expectCode(
      () => loadTerminologyPackFromObject(versioned, bytesOf(versioned)),
      'TERMINOLOGY_PACK_APPROVAL_INVALID',
    );
    const provenance = {
      ...raw,
      provenance: { source: 'OTHER', note: (raw.provenance as { note: string }).note },
    };
    provenance.contentChecksum = raw.contentChecksum;
    expectCode(
      () => loadTerminologyPackFromObject(provenance, bytesOf(provenance)),
      'TERMINOLOGY_PACK_CHECKSUM_MISMATCH',
    );
    const created = { ...raw, createdAt: '2026-08-19T00:00:00.001Z' };
    created.contentChecksum = raw.contentChecksum;
    expectCode(
      () => loadTerminologyPackFromObject(created, bytesOf(created)),
      'TERMINOLOGY_PACK_CHECKSUM_MISMATCH',
    );
  });

  it('preserves the empty pack unchanged as a historical fail-closed asset', () => {
    const empty = loadHistoricalEmptyPack();
    expect(empty.packId).toBe('ehas2-default-terminology');
    expect(empty.entryCount).toBe(0);
    expect(empty.status).toBe('EMPTY_AWAITING_OWNER_FREEZE');
    expect(empty.contentChecksum).toBe(EMPTY_CHECKSUM);
    expect(empty.lookupAlias('denies')).toEqual({
      matched: false,
      reason: 'NO_EXECUTABLE_ALIASES',
    });
    const committed = fs.readFileSync(historicalEmptyPackPath(), 'utf8');
    expect(committed).toMatch(/"entries": \[\]/);
    expect(fs.existsSync(historicalEmptyPackPath())).toBe(true);
    expect(historicalEmptyPackPath()).not.toBe(pinnedProductionPackPath());
  });

  it('pins production selection to the exact pack path without directory discovery', () => {
    expect(PRODUCTION_TERMINOLOGY_PACK_PIN.relativePath).toBe(
      'packs/ehas2-owner-cue-pack.v1.0.0.json',
    );
    expect(PRODUCTION_TERMINOLOGY_PACK_PIN.packId).toBe('ehas2-owner-cue-pack');
    expect(PRODUCTION_TERMINOLOGY_PACK_PIN.packVersion).toBe('1.0.0');
    expect(PRODUCTION_TERMINOLOGY_PACK_PIN.expectedEntryCount).toBe(45);
    expect(defaultProductionPackPath()).toBe(pinnedProductionPackPath());
    expect(path.basename(pinnedProductionPackPath())).toBe('ehas2-owner-cue-pack.v1.0.0.json');
    const loader = fs.readFileSync(
      path.join(root, 'packages/evidence-extract/src/terminology/loader.ts'),
      'utf8',
    );
    expect(loader).not.toMatch(/readdirSync|readdir\(/);
    expect(loader).toMatch(/PRODUCTION_TERMINOLOGY_PACK_PIN\.relativePath/);
    const loaded = loadDefaultProductionPack();
    expect(loaded.packId).toBe('ehas2-owner-cue-pack');
    expect(loaded.packVersion).toBe('1.0.0');
    expect(loaded.entryCount).toBe(45);
    expect(loaded.executable).toBe(false);
    expect(loaded.lookupAlias('denies')).toEqual({
      matched: false,
      reason: 'TERMINOLOGY_LOOKUP_NOT_CONNECTED',
    });
  });

  it('fails closed on missing, altered, invalid, token-mismatched, or symlink pin without empty fallback', () => {
    const pinPath = pinnedProductionPackPath();
    const original = fs.readFileSync(pinPath);
    const backup = path.join(os.tmpdir(), 'ehas2-cue-pin-backup.json');
    fs.writeFileSync(backup, original);
    try {
      fs.unlinkSync(pinPath);
      expectCode(() => loadPinnedProductionPack(), 'TERMINOLOGY_PACK_PATH_FORBIDDEN');
      const postureMissing = getTerminologyReadinessPosture();
      expect(postureMissing.terminologyPackValid).toBe(false);
      expect(postureMissing.terminologyProductionEntryCount).toBe(0);
      expect(postureMissing.terminologyPackFrozen).toBe(false);
      fs.writeFileSync(pinPath, original);
      const mutated = `${original.toString('utf8').slice(0, -2)}x\n`;
      fs.writeFileSync(pinPath, mutated);
      expectCode(() => loadPinnedProductionPack(), 'TERMINOLOGY_PACK_INVALID');
      fs.writeFileSync(pinPath, original);
      const parsed = JSON.parse(original.toString('utf8')) as Record<string, unknown>;
      parsed.ownerApprovalToken = 'EHAS2_F3D2_PACK_APPROVAL:ehas2-owner-cue-pack:1.0.0:deadbeef';
      fs.writeFileSync(pinPath, `${JSON.stringify(parsed, null, 2)}\n`);
      expectCode(() => loadPinnedProductionPack(), 'TERMINOLOGY_PACK_APPROVAL_INVALID');
      const afterMismatch = getTerminologyReadinessPosture();
      expect(afterMismatch.terminologyPackValid).toBe(false);
      expect(afterMismatch.terminologyProductionEntryCount).toBe(0);
      fs.writeFileSync(pinPath, original);
      const emptyRaw = readJson(historicalEmptyPackPath());
      fs.writeFileSync(pinPath, `${JSON.stringify(emptyRaw, null, 2)}\n`);
      expectCode(() => loadPinnedProductionPack(), 'TERMINOLOGY_PACK_PIN_MISMATCH');
      expect(getTerminologyReadinessPosture().terminologyPackValid).toBe(false);
      fs.writeFileSync(pinPath, original);
      const link = path.join(path.dirname(pinPath), 'symlink-pin.v1.json');
      try {
        fs.symlinkSync(pinPath, link);
        expectCode(() => loadTerminologyPackFromFile(link), 'TERMINOLOGY_PACK_PATH_FORBIDDEN');
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code !== 'EPERM' && code !== 'EACCES' && !(err instanceof TerminologyPackError)) {
          throw err;
        }
      } finally {
        if (fs.existsSync(link)) fs.unlinkSync(link);
      }
    } finally {
      fs.writeFileSync(pinPath, fs.readFileSync(backup));
      fs.unlinkSync(backup);
      expect(computeContentChecksum(readJson(pinPath))).toBe(APPROVED_CHECKSUM);
    }
  });

  it('reports honest /ready posture without leaking pack secrets', async () => {
    const posture = getTerminologyReadinessPosture();
    expect(posture).toEqual({
      terminologyProductionEntryCount: 45,
      ownerTerminologyFreezePending: false,
      terminologyPackFrozen: true,
      terminologyPackValid: true,
      normalizationParserAvailable: false,
    });
    const app = createApp();
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as AddressInfo).port;
    try {
      const res = await fetch(`http://127.0.0.1:${port}/ready`);
      const json = (await res.json()) as Record<string, unknown>;
      expect(res.status).toBe(503);
      expect(json.ready).toBe(false);
      expect(json.terminologyProductionEntryCount).toBe(45);
      expect(json.ownerTerminologyFreezePending).toBe(false);
      expect(json.terminologyPackFrozen).toBe(true);
      expect(json.terminologyPackValid).toBe(true);
      expect(json.normalizationParserAvailable).toBe(false);
      expect(json.ocr).toBe(false);
      expect(json.ocrAdapter).toBe(false);
      expect(json.extractProduction).toBe(false);
      expect(json.clinicalEngine).toBe(false);
      assertNoLeak(JSON.stringify(json));
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it('does not leak pack bytes through bounded errors', () => {
    try {
      loadTerminologyPackFromObject({ schemaVersion: 'nope' }, 12);
      expect.fail('expected throw');
    } catch (err) {
      const json = JSON.stringify((err as TerminologyPackError).toJSON());
      assertNoLeak(json);
      expect(json).not.toMatch(/contentChecksum|ownerApprovalToken|packs[\\/]/);
    }
  });

  it('cannot normalize text, write facts, invoke Rules, select disease/medicine, or emit a summary by loading', () => {
    const loaded = loadPinnedProductionPack();
    expect(loaded.executable).toBe(false);
    expect(loaded.normalizationParserAvailable).toBe(false);
    expect(loaded.lookupAlias('नहीं है')).toEqual({
      matched: false,
      reason: 'TERMINOLOGY_LOOKUP_NOT_CONNECTED',
    });
    expect(loaded.lookupAlias('2 din se')).toEqual({
      matched: false,
      reason: 'TERMINOLOGY_LOOKUP_NOT_CONNECTED',
    });
    expect('normalizeText' in loaded).toBe(false);
    expect('writeFacts' in loaded).toBe(false);
    expect('analyzeComplete' in loaded).toBe(false);
    const src = fs.readFileSync(
      path.join(root, 'packages/evidence-extract/src/terminology/loader.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/evaluateRule[1-9]|analyzeComplete\(|ConfirmPrescription|summaryDraft/);
    expect(src).not.toMatch(/structured_report_findings|selectedDisease|medicineCode/);
  });

  it('keeps synthetic test packs forbidden in production selection', () => {
    expect(PRODUCTION_TERMINOLOGY_PACK_PIN.relativePath).toBe(
      'packs/ehas2-owner-cue-pack.v1.0.0.json',
    );
    expect(PRODUCTION_TERMINOLOGY_PACK_PIN.relativePath).not.toMatch(/synthetic/);
    expect(pinnedProductionPackPath()).not.toMatch(/synthetic-test-only/);
    const loaded = loadPinnedProductionPack({ env: { NODE_ENV: 'production' } });
    expect(loaded.syntheticTestOnly).toBe(false);
    expect(loaded.packId).toBe('ehas2-owner-cue-pack');
  });
});

afterEach(() => {
  expect(computeContentChecksum(readJson(pinnedProductionPackPath()))).toBe(APPROVED_CHECKSUM);
});
