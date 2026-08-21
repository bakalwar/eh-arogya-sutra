import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TerminologyPackError,
  bindOwnerApprovalToken,
  bindSyntheticTestToken,
  computeContentChecksum,
  historicalEmptyPackPath,
  loadHistoricalEmptyPack,
  loadTerminologyPackFromFile,
  loadTerminologyPackFromObject,
  parseAndValidatePack,
  syntheticFixturePackPath,
} from '../../packages/evidence-extract/src/index.ts';
import { getOrderedMigrationIds } from '../../packages/database/src/migrate.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

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

function syntheticEntry(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'syn-extra-001',
    entryType: 'LANGUAGE_EQUIVALENCE',
    aliasText: 'zxq-alias-beta',
    canonicalLabel: 'zxq-label-beta',
    language: 'en',
    script: 'Latn',
    ambiguityClassification: 'UNAMBIGUOUS',
    provenanceReference: 'SYNTHETIC_TEST_FIXTURE',
    licenseClassification: 'SYNTHETIC_TEST_ONLY',
    negationInteraction: 'NOT_APPLICABLE',
    contextRequirements: 'NONE',
    decisionStatus: 'ACTIVE',
    selectorProhibition: 'SELECTOR_FORBIDDEN',
    ...over,
  };
}

describe('F3D-2A terminology pack schema', () => {
  it('accepts the empty default production pack', () => {
    const raw = readJson(historicalEmptyPackPath());
    const pack = parseAndValidatePack(raw, bytesOf(raw));
    expect(pack.status).toBe('EMPTY_AWAITING_OWNER_FREEZE');
    expect(pack.entries).toEqual([]);
    expect(pack.ownerApprovalToken).toBe('NO_ENTRIES_OWNER_FREEZE_PENDING');
    expect(pack.contentChecksum).toBe(computeContentChecksum(raw));
  });

  it('accepts the synthetic test-only pack in test mode', () => {
    const loaded = loadTerminologyPackFromFile(syntheticFixturePackPath(), {
      allowSyntheticTestPacks: true,
    });
    expect(loaded.syntheticTestOnly).toBe(true);
    expect(loaded.executable).toBe(false);
    expect(loaded.entryCount).toBe(3);
    expect(loaded.lookupAlias('zxq-alias-alpha')).toEqual({
      matched: false,
      reason: 'TERMINOLOGY_LOOKUP_NOT_CONNECTED',
    });
  });

  it('rejects unsupported versions, missing fields, unknown fields, and invalid enums', () => {
    const raw = readJson(historicalEmptyPackPath());
    expectCode(() => {
      parseAndValidatePack({ ...raw, schemaVersion: 'v0' }, bytesOf(raw));
    }, 'TERMINOLOGY_PACK_UNSUPPORTED_VERSION');
    const missing = { ...raw };
    delete missing.packId;
    expectCode(() => parseAndValidatePack(missing, bytesOf(missing)), 'TERMINOLOGY_PACK_INVALID');
    expectCode(
      () => parseAndValidatePack({ ...raw, extra: true }, bytesOf(raw)),
      'TERMINOLOGY_PACK_INVALID',
    );
    expectCode(
      () => parseAndValidatePack({ ...raw, status: 'NOPE' }, bytesOf(raw)),
      'TERMINOLOGY_PACK_INVALID',
    );
  });

  it('rejects duplicate ids, duplicate active aliases, non-NFC text, controls, and oversized packs', () => {
    const raw = readJson(syntheticFixturePackPath());
    const entries = raw.entries as Record<string, unknown>[];
    const dupId = {
      ...raw,
      entries: [entries[0], { ...syntheticEntry(), id: entries[0].id }],
    };
    dupId.contentChecksum = computeContentChecksum(dupId);
    expectCode(() => parseAndValidatePack(dupId, bytesOf(dupId)), 'TERMINOLOGY_PACK_DUPLICATE_ID');
    const dupAlias = {
      ...raw,
      entries: [
        entries[0],
        syntheticEntry({ aliasText: entries[0].aliasText, id: 'syn-dup-alias' }),
      ],
    };
    dupAlias.contentChecksum = computeContentChecksum(dupAlias);
    expectCode(
      () => parseAndValidatePack(dupAlias, bytesOf(dupAlias)),
      'TERMINOLOGY_PACK_DUPLICATE_ALIAS',
    );
    const decomposed = 'e\u0301';
    expect(decomposed !== decomposed.normalize('NFC')).toBe(true);
    expectCode(() => {
      parseAndValidatePack(
        { ...raw, provenance: { source: 'SYN', note: decomposed } },
        bytesOf(raw),
      );
    }, 'TERMINOLOGY_PACK_INVALID');
    expectCode(() => {
      parseAndValidatePack(
        { ...raw, provenance: { source: 'SYN', note: 'bad\nline' } },
        bytesOf(raw),
      );
    }, 'TERMINOLOGY_PACK_INVALID');
    expectCode(() => parseAndValidatePack(raw, 70_000), 'TERMINOLOGY_PACK_TOO_LARGE');
    expectCode(() => {
      parseAndValidatePack(
        {
          ...raw,
          entries: [syntheticEntry({ aliasText: 'x'.repeat(81) })],
        },
        bytesOf(raw),
      );
    }, 'TERMINOLOGY_PACK_INVALID');
  });
});

describe('F3D-2A canonicalization and checksum', () => {
  it('is stable across key/entry order and NFC-equivalent checksum inputs', () => {
    const raw = readJson(syntheticFixturePackPath());
    const entries = [...(raw.entries as Record<string, unknown>[])].reverse();
    const reordered = { checksumAlgorithm: raw.checksumAlgorithm, ...raw, entries };
    expect(computeContentChecksum(reordered)).toBe(computeContentChecksum(raw));
    const composed = { cafe: 'é' };
    const decomp = { cafe: 'e\u0301' };
    expect(computeContentChecksum(composed)).toBe(computeContentChecksum(decomp));
  });

  it('matches the committed checksum and rejects one-byte and version mutations', () => {
    const raw = readJson(historicalEmptyPackPath());
    const loaded = loadHistoricalEmptyPack();
    expect(loaded.contentChecksum).toBe(raw.contentChecksum);
    const mutated = {
      ...raw,
      provenance: {
        ...(raw.provenance as object),
        note: 'No clinical terminology entries. Owner freeze pending!',
      },
    };
    mutated.contentChecksum = raw.contentChecksum as string;
    expectCode(
      () => loadTerminologyPackFromObject(mutated, bytesOf(mutated)),
      'TERMINOLOGY_PACK_CHECKSUM_MISMATCH',
    );
    const syn = readJson(syntheticFixturePackPath());
    const versioned = { ...syn, packVersion: '0.0.1-test' };
    versioned.contentChecksum = computeContentChecksum(versioned);
    expectCode(
      () =>
        loadTerminologyPackFromObject(versioned, bytesOf(versioned), {
          allowSyntheticTestPacks: true,
        }),
      'TERMINOLOGY_PACK_APPROVAL_INVALID',
    );
  });
});

describe('F3D-2A owner approval binding', () => {
  it('rejects missing, placeholder, unbound, and executable-claiming empty packs', () => {
    const raw = readJson(syntheticFixturePackPath());
    expectCode(() => {
      loadTerminologyPackFromObject(
        { ...raw, ownerApprovalToken: 'PENDING', contentChecksum: computeContentChecksum(raw) },
        bytesOf(raw),
        { allowSyntheticTestPacks: true },
      );
    }, 'TERMINOLOGY_PACK_APPROVAL_INVALID');
    expectCode(() => {
      loadTerminologyPackFromObject(
        {
          ...raw,
          ownerApprovalToken: bindOwnerApprovalToken(
            raw.packId as string,
            raw.packVersion as string,
            raw.contentChecksum as string,
          ),
        },
        bytesOf(raw),
        { allowSyntheticTestPacks: true },
      );
    }, 'TERMINOLOGY_PACK_APPROVAL_INVALID');
    const empty = readJson(historicalEmptyPackPath());
    expectCode(() => {
      parseAndValidatePack({ ...empty, ownerApprovalToken: 'OWNER_APPROVED' }, bytesOf(empty));
    }, 'TERMINOLOGY_PACK_APPROVAL_INVALID');
    expectCode(() => {
      parseAndValidatePack(
        { ...empty, status: 'OWNER_FROZEN', licenseClassification: 'OWNER_CLINIC_FROZEN' },
        bytesOf(empty),
      );
    }, 'TERMINOLOGY_PACK_APPROVAL_INVALID');
  });

  it('accepts the checksum-bound synthetic token only in test mode', () => {
    const raw = readJson(syntheticFixturePackPath());
    const expected = bindSyntheticTestToken(
      raw.packId as string,
      raw.packVersion as string,
      raw.contentChecksum as string,
    );
    expect(raw.ownerApprovalToken).toBe(expected);
    loadTerminologyPackFromObject(raw, bytesOf(raw), { allowSyntheticTestPacks: true });
    expectCode(
      () => loadTerminologyPackFromObject(raw, bytesOf(raw), { env: { NODE_ENV: 'production' } }),
      'TERMINOLOGY_PACK_PRODUCTION_SYNTHETIC_FORBIDDEN',
    );
    expectCode(
      () =>
        loadTerminologyPackFromFile(syntheticFixturePackPath(), {
          allowSyntheticTestPacks: true,
          env: { NODE_ENV: 'production' },
        }),
      'TERMINOLOGY_PACK_PATH_FORBIDDEN',
    );
  });

  it('requires a new approval when content changes', () => {
    const raw = readJson(syntheticFixturePackPath());
    const entries = [...(raw.entries as Record<string, unknown>[]), syntheticEntry()];
    const changed = { ...raw, entries };
    changed.contentChecksum = computeContentChecksum(changed);
    expectCode(
      () =>
        loadTerminologyPackFromObject(changed, bytesOf(changed), { allowSyntheticTestPacks: true }),
      'TERMINOLOGY_PACK_APPROVAL_INVALID',
    );
    changed.ownerApprovalToken = bindSyntheticTestToken(
      changed.packId as string,
      changed.packVersion as string,
      changed.contentChecksum as string,
    );
    const loaded = loadTerminologyPackFromObject(changed, bytesOf(changed), {
      allowSyntheticTestPacks: true,
    });
    expect(loaded.entryCount).toBe(4);
    expect(loaded.executable).toBe(false);
  });
});

describe('F3D-2A loader security and fail-closed lookup', () => {
  it('loads the empty pack as a non-executable immutable foundation', () => {
    const loaded = loadHistoricalEmptyPack();
    expect(loaded.entryCount).toBe(0);
    expect(loaded.executable).toBe(false);
    expect(loaded.ownerTerminologyFreezePending).toBe(true);
    expect(loaded.normalizationParserAvailable).toBe(false);
    expect(loaded.lookupAlias('bukhar')).toEqual({
      matched: false,
      reason: 'NO_EXECUTABLE_ALIASES',
    });
    expect(() => {
      (loaded as { packId: string }).packId = 'mutated';
    }).toThrow();
    expect(loaded.packId).toBe('ehas2-default-terminology');
  });

  it('rejects path traversal, external paths, and symlink escape where applicable', () => {
    const traversal = path.join(path.dirname(historicalEmptyPackPath()), '..', 'package.json');
    expectCode(() => loadTerminologyPackFromFile(traversal), 'TERMINOLOGY_PACK_PATH_FORBIDDEN');
    const external = path.join(os.tmpdir(), 'ehas2-term-external.json');
    fs.writeFileSync(external, fs.readFileSync(historicalEmptyPackPath()));
    try {
      expectCode(() => loadTerminologyPackFromFile(external), 'TERMINOLOGY_PACK_PATH_FORBIDDEN');
    } finally {
      fs.unlinkSync(external);
    }
    const packsDir = path.dirname(historicalEmptyPackPath());
    const link = path.join(packsDir, 'symlink-escape.v1.json');
    try {
      fs.symlinkSync(historicalEmptyPackPath(), link);
      expectCode(() => loadTerminologyPackFromFile(link), 'TERMINOLOGY_PACK_PATH_FORBIDDEN');
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'EPERM' && code !== 'EACCES' && !(err instanceof TerminologyPackError)) {
        throw err;
      }
    } finally {
      if (fs.existsSync(link)) fs.unlinkSync(link);
    }
  });

  it('does not fall back to legacy or clinical-engine maps', () => {
    const loader = fs.readFileSync(
      path.join(root, 'packages/evidence-extract/src/terminology/loader.ts'),
      'utf8',
    );
    expect(loader).not.toMatch(/HINGLISH_MAP|normalize_case|disease_package|medicines\.v2/);
    expect(loader).not.toMatch(/fetch\s*\(/);
  });
});

describe('F3D-2A PHI and selector pack-content firewall', () => {
  it('rejects recursive selector and PHI keys and PHI-like content', () => {
    const raw = readJson(historicalEmptyPackPath());
    expectCode(
      () => parseAndValidatePack({ ...raw, diseaseId: 'x' }, bytesOf(raw)),
      'TERMINOLOGY_PACK_SELECTOR_FORBIDDEN',
    );
    expectCode(
      () =>
        parseAndValidatePack(
          { ...raw, provenance: { source: 'SYN', note: 'ok', medicineCode: 'A1' } },
          bytesOf(raw),
        ),
      'TERMINOLOGY_PACK_SELECTOR_FORBIDDEN',
    );
    expectCode(
      () => parseAndValidatePack({ ...raw, patientName: 'x' }, bytesOf(raw)),
      'TERMINOLOGY_PACK_PHI_FORBIDDEN',
    );
    expectCode(
      () =>
        parseAndValidatePack(
          { ...raw, provenance: { source: 'SYN', note: 'user@example.com' } },
          bytesOf(raw),
        ),
      'TERMINOLOGY_PACK_PHI_FORBIDDEN',
    );
    for (const key of [
      'formula',
      'potency',
      'dose',
      'organSystem',
      'severityMapping',
      'affectsClinicalSelection',
      'clinically_used',
    ]) {
      expectCode(
        () => parseAndValidatePack({ ...raw, [key]: 'x' }, bytesOf(raw)),
        'TERMINOLOGY_PACK_SELECTOR_FORBIDDEN',
      );
    }
  });

  it('errors stay bounded without dumping pack content', () => {
    try {
      parseAndValidatePack({ schemaVersion: 'nope' }, 12);
      expect.fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(TerminologyPackError);
      const json = JSON.stringify((err as TerminologyPackError).toJSON());
      expect(json).not.toMatch(/zxq-alias-alpha|bukhar|Hemoglobin/);
      expect(json).not.toMatch(/entries/);
    }
  });
});

describe('F3D-2A / F3D-2D1 migration registry', () => {
  it('keeps 001–016 with fact-normalization foundation as tip', () => {
    const ids = getOrderedMigrationIds();
    expect(ids[0]).toBe('001_extensions_and_meta');
    expect(ids.at(-1)).toBe('017_f3d2d5_clinical_fact_verification');
    expect(ids).toHaveLength(17);
    expect(
      fs.existsSync(
        path.join(root, 'packages/database/migrations/016_f3d2_fact_normalizations.sql'),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(root, 'packages/database/migrations/016_f3d2_fact_normalizations.down.sql'),
      ),
    ).toBe(true);
  });
});
