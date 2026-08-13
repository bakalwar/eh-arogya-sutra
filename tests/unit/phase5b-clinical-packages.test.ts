import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  assertCanonicalMedicineRegistry,
  assertHistoricalMedicineRegistryV1,
  CQ001A_CANONICAL_MEDICINE_CODES,
  EXPECTED_MEDICINE_COUNT,
  getMedicineById,
  getMedicineByIdV1,
  HISTORICAL_V1_REQUIRED_CODE_C11,
  medicineRegistryManifest,
  medicineRegistryManifestV1,
  medicines,
  medicinesV1,
  MEDICINE_REGISTRY_VERSION,
  MEDICINE_REGISTRY_V1_VERSION,
  rejectNonCanonicalMedicineSeed,
} from '../../packages/medicine-registry/src/index.ts';
import {
  allNineRuleInterfaceResults,
  createNotConnectedAnalyzeResult,
  assertNoDefaultMedicines,
  NINE_RULE_DEFINITIONS,
  ORCHESTRATION_STATUS,
  TABLET_ENGINE_STATUS,
} from '../../packages/clinical-contracts/src/index.ts';
import {
  DISEASE_PACKAGE_DIR,
  EXPECTED_DISEASE_COUNT,
  EXPECTED_SOURCE_DB_SHA256,
} from '../../packages/clinical-data-manifest/src/index.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const node = process.execPath;
const extractDiseases = path.join(root, 'tools/clinical-extract/extract-diseases.mjs');
const synthDb = path.join(root, 'fixtures/synthetic/clinical/synthetic-source.sqlite');

function sha256File(p: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(p));
  return hash.digest('hex').toUpperCase();
}

describe('Phase 5B medicine registry (CQ-001A v2)', () => {
  it('canonical registry v2 is exactly 38 with CQ-001A set and no C11', () => {
    expect(MEDICINE_REGISTRY_VERSION).toBe('ehas2-medicine-registry-v2');
    expect(medicines).toHaveLength(EXPECTED_MEDICINE_COUNT);
    assertCanonicalMedicineRegistry(medicines);
    expect(medicines.some((m) => m.id === 'C11')).toBe(false);
    expect(getMedicineById('C11')).toBeUndefined();
    expect(getMedicineByIdV1('C11')).toBeDefined();
    const codes = medicines.map((m) => m.id).sort();
    expect(codes).toEqual([...CQ001A_CANONICAL_MEDICINE_CODES].sort());
  });

  it('manifest v2 count and fingerprints match package artifacts', () => {
    expect(medicineRegistryManifest.registryVersion).toBe('ehas2-medicine-registry-v2');
    expect(medicineRegistryManifest.medicineCount).toBe(38);
    expect(medicineRegistryManifest.excludedCodes).toContain('C11');
    const artifactPath = path.join(root, 'packages/medicine-registry/src/medicines.v2.json');
    const hash = sha256File(artifactPath);
    expect(medicineRegistryManifest.artifactSha256).toBe(hash);
  });

  it('historical v1 snapshot remains 39 with C11 distinguishable from v2', () => {
    expect(MEDICINE_REGISTRY_V1_VERSION).toBe('ehas2-medicine-registry-v1');
    assertHistoricalMedicineRegistryV1(medicinesV1);
    expect(medicinesV1.some((m) => m.id === HISTORICAL_V1_REQUIRED_CODE_C11)).toBe(true);
    expect(medicineRegistryManifestV1.requiredCodePresent).toBe('C11');
    expect(medicineRegistryManifestV1.medicineCount).toBe(39);
  });

  it('rejects missing codes and duplicate codes', () => {
    expect(() => assertCanonicalMedicineRegistry(medicines.slice(0, 37))).toThrow(/38/);
    const dup = [...medicines];
    dup[0] = { ...dup[1] };
    expect(() => assertCanonicalMedicineRegistry(dup)).toThrow(/Duplicate/);
  });

  it('rejects non-CQ-001A seed sets including legacy sqlite row-count-only seeds', () => {
    const codes = medicines.map((m) => m.id);
    expect(() =>
      rejectNonCanonicalMedicineSeed(
        38,
        codes.filter((c) => c !== 'A1'),
      ),
    ).toThrow(/rejected/);
    expect(() =>
      rejectNonCanonicalMedicineSeed(
        38,
        [...codes, 'C11'].filter((c) => c !== 'A1'),
      ),
    ).toThrow(/C11/);
  });
});

describe('Phase 5B clinical contracts / nine-rule interfaces', () => {
  it('analyze not-connected result has no default medicines or WE', () => {
    const r = createNotConnectedAnalyzeResult('t-1');
    expect(r.status).toBe('CLINICAL_ENGINE_NOT_CONNECTED');
    assertNoDefaultMedicines(r);
    expect(r.defaultWeUsed).toBe(false);
    expect(r.tabletSectionB.status).toBe('NOT_IMPLEMENTED');
  });

  it('every rule supports unresolved-capable status field; Rule 8 shadow is READY_FOR_VALIDATION only', () => {
    const results = allNineRuleInterfaceResults();
    expect(results).toHaveLength(9);
    for (const r of results) {
      expect(r).toHaveProperty('status');
      expect(r).toHaveProperty('unknownUnresolvedReason');
      expect(r).toHaveProperty('deterministicFingerprint');
    }
    const r8 = results.find((x) => x.ruleNumber === 8);
    // Shadow package present for technical validation — not clinical readiness / production.
    expect(r8?.status).toBe('READY_FOR_VALIDATION');
    expect(NINE_RULE_DEFINITIONS[7]?.phase5bStatus).toBe('READY_FOR_VALIDATION');
    expect(NINE_RULE_DEFINITIONS[7]?.affectsClinicalSelection).toBe(false);
    expect(r8?.affectsClinicalSelection).toBe(false);
    expect(ORCHESTRATION_STATUS).toBe('NOT_CONNECTED');
    expect(TABLET_ENGINE_STATUS).toBe('NOT_IMPLEMENTED');
  });
});

describe('Phase 5B disease extraction (synthetic)', () => {
  it('opens source read-only, extracts only diseases, excludes consultations', () => {
    const out = path.join(
      process.env.TEMP || process.env.TMPDIR || '/tmp',
      'ehas2_phase5b_clinical_packages',
      'disease-package-tiny-test',
    );
    fs.rmSync(out, { recursive: true, force: true });
    const expectedSha = sha256File(synthDb);
    execFileSync(
      node,
      [
        extractDiseases,
        '--source',
        synthDb,
        '--out',
        out,
        '--expected-sha',
        expectedSha,
        '--expected-count',
        '3',
      ],
      { stdio: 'pipe' },
    );
    const jsonl = fs.readFileSync(path.join(out, 'diseases.v1.jsonl'), 'utf8');
    expect(jsonl).not.toMatch(/SHOULD_NOT_EXTRACT|patient_name|9999999999|formula_json/);
    const lines = jsonl.trim().split('\n');
    expect(lines).toHaveLength(3);
    const row = JSON.parse(lines[0]!);
    expect(row).toHaveProperty('name_english');
    expect(row).not.toHaveProperty('phone');
  });

  it('fails closed on source checksum mismatch', () => {
    const out = path.join(
      process.env.TEMP || process.env.TMPDIR || '/tmp',
      'ehas2_phase5b_clinical_packages',
      'disease-package-fail',
    );
    fs.rmSync(out, { recursive: true, force: true });
    expect(() =>
      execFileSync(
        node,
        [
          extractDiseases,
          '--source',
          synthDb,
          '--out',
          out,
          '--expected-sha',
          '0'.repeat(64),
          '--expected-count',
          '3',
        ],
        { stdio: 'pipe' },
      ),
    ).toThrow();
  });

  it('extraction is deterministic for identical input', () => {
    const base = path.join(
      process.env.TEMP || process.env.TMPDIR || '/tmp',
      'ehas2_phase5b_clinical_packages',
    );
    const out1 = path.join(base, 'det-a');
    const out2 = path.join(base, 'det-b');
    fs.rmSync(out1, { recursive: true, force: true });
    fs.rmSync(out2, { recursive: true, force: true });
    const expectedSha = sha256File(synthDb);
    const args = (out: string) => [
      extractDiseases,
      '--source',
      synthDb,
      '--out',
      out,
      '--expected-sha',
      expectedSha,
      '--expected-count',
      '3',
    ];
    execFileSync(node, args(out1), { stdio: 'pipe' });
    execFileSync(node, args(out2), { stdio: 'pipe' });
    const a = fs.readFileSync(path.join(out1, 'diseases.v1.jsonl'));
    const b = fs.readFileSync(path.join(out2, 'diseases.v1.jsonl'));
    expect(crypto.createHash('sha256').update(a).digest('hex')).toBe(
      crypto.createHash('sha256').update(b).digest('hex'),
    );
  });
});

describe('Phase 5B full local artifact policy', () => {
  it('expected disease count constant and artifact dir is gitignored', () => {
    expect(EXPECTED_DISEASE_COUNT).toBe(116_284);
    expect(EXPECTED_SOURCE_DB_SHA256).toHaveLength(64);
    const gi = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
    expect(gi).toMatch(/clinical-artifacts/);
    expect(DISEASE_PACKAGE_DIR).toContain('clinical-artifacts');
  });

  it('if full package was generated locally, count is 116284 and git does not track jsonl', () => {
    const manifestPath = path.join(
      root,
      'data/clinical-artifacts/disease-package-v1/manifest.json',
    );
    if (!fs.existsSync(manifestPath)) return;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { recordCount: number };
    expect(manifest.recordCount).toBe(116_284);
    const tracked = execFileSync(
      'git',
      ['check-ignore', '-v', 'data/clinical-artifacts/disease-package-v1/diseases.v1.jsonl'],
      {
        cwd: root,
        encoding: 'utf8',
      },
    );
    expect(tracked).toMatch(/clinical-artifacts/);
  });
});

describe('Phase 5B runtime boundary source checks', () => {
  it('runtime packages do not embed old-project absolute path or db filename', () => {
    const legacyFolder = ['EH', 'Arogya', 'Sutra', 'App'].join('_');
    const legacyDb = ['eh', 'arogya', 'db'].join('_').replace('_db', '.db');
    const scanRoots = [
      path.join(root, 'packages/medicine-registry/src'),
      path.join(root, 'packages/clinical-data-manifest/src'),
      path.join(root, 'packages/clinical-contracts/src'),
      path.join(root, 'apps/web/src'),
      path.join(root, 'apps/clinical-engine/src'),
    ];
    for (const dir of scanRoots) {
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir, { recursive: true })) {
        const fp = path.join(dir, String(f));
        if (!fs.statSync(fp).isFile()) continue;
        if (!/\.(ts|tsx|py|js|mjs|json)$/.test(fp)) continue;
        const text = fs.readFileSync(fp, 'utf8');
        expect(text.includes(legacyFolder)).toBe(false);
        expect(text.includes(legacyDb)).toBe(false);
      }
    }
  });
});
