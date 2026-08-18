import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isProductionRuntime } from '@ehas2/evidence-ingest';
import { assertApprovalBinding } from './approval.js';
import { computeContentChecksum } from './canonical.js';
import { TerminologyPackError } from './errors.js';
import {
  DEFAULT_PRODUCTION_PACK_REL,
  EMPTY_PACK_STATUS,
  MAX_PACK_BYTES,
  type LoadedTerminologyPack,
  type TerminologyLookupResult,
  type TerminologyPack,
} from './types.js';
import { parseAndValidatePack } from './validate.js';

export type LoadTerminologyOptions = {
  allowSyntheticTestPacks?: boolean;
  env?: Record<string, string | undefined>;
};

function evidenceExtractRoot(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i += 1) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const name = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).name as string;
      if (name === '@ehas2/evidence-extract') return dir;
    }
    dir = path.dirname(dir);
  }
  throw new TerminologyPackError('TERMINOLOGY_PACK_PATH_FORBIDDEN');
}

function repoRootFromPackage(pkgRoot: string): string {
  const root = path.resolve(pkgRoot, '../..');
  const pkgPath = path.join(root, 'package.json');
  if (!fs.existsSync(pkgPath)) throw new TerminologyPackError('TERMINOLOGY_PACK_PATH_FORBIDDEN');
  const name = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).name as string;
  if (name !== 'eh-arogya-sutra-2')
    throw new TerminologyPackError('TERMINOLOGY_PACK_PATH_FORBIDDEN');
  return root;
}

function isInsideDir(candidate: string, parent: string): boolean {
  const rel = path.relative(parent, candidate);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

export function defaultProductionPackPath(): string {
  return path.join(evidenceExtractRoot(), DEFAULT_PRODUCTION_PACK_REL);
}

export function syntheticFixturePackPath(): string {
  return path.join(
    repoRootFromPackage(evidenceExtractRoot()),
    'tests/fixtures/terminology-packs/synthetic-test-only.v1.json',
  );
}

export function resolveAllowedPackPath(
  requested: string,
  options: LoadTerminologyOptions = {},
): string {
  if (typeof requested !== 'string' || requested.length < 1 || requested.length > 500) {
    throw new TerminologyPackError('TERMINOLOGY_PACK_PATH_FORBIDDEN');
  }
  if (requested.includes('\0')) throw new TerminologyPackError('TERMINOLOGY_PACK_PATH_FORBIDDEN');
  const production = isProductionRuntime(options.env);
  const allowSynthetic = Boolean(options.allowSyntheticTestPacks) && !production;
  const resolved = path.resolve(requested);
  if (resolved.includes('..' + path.sep) || requested.includes('..')) {
    const normalized = path.normalize(requested);
    if (normalized.split(path.sep).includes('..')) {
      throw new TerminologyPackError('TERMINOLOGY_PACK_PATH_FORBIDDEN');
    }
  }
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(resolved);
  } catch {
    throw new TerminologyPackError('TERMINOLOGY_PACK_PATH_FORBIDDEN');
  }
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new TerminologyPackError('TERMINOLOGY_PACK_PATH_FORBIDDEN');
  }
  const real = fs.realpathSync.native(resolved);
  const pkgRoot = evidenceExtractRoot();
  const allowed = [path.join(pkgRoot, 'packs')];
  if (allowSynthetic) {
    allowed.push(path.join(repoRootFromPackage(pkgRoot), 'tests', 'fixtures', 'terminology-packs'));
  }
  const ok = allowed.some((dir) => isInsideDir(real, fs.realpathSync.native(dir)));
  if (!ok) throw new TerminologyPackError('TERMINOLOGY_PACK_PATH_FORBIDDEN');
  if (path.extname(real) !== '.json')
    throw new TerminologyPackError('TERMINOLOGY_PACK_PATH_FORBIDDEN');
  return real;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}

function toLoaded(pack: TerminologyPack): LoadedTerminologyPack {
  const lookupAlias = (_text: string): TerminologyLookupResult => {
    if (pack.status === EMPTY_PACK_STATUS || pack.entries.length === 0) {
      return { matched: false, reason: 'NO_EXECUTABLE_ALIASES' };
    }
    return { matched: false, reason: 'TERMINOLOGY_LOOKUP_NOT_CONNECTED' };
  };
  const loaded: LoadedTerminologyPack = {
    packId: pack.packId,
    packVersion: pack.packVersion,
    status: pack.status,
    contentChecksum: pack.contentChecksum,
    entryCount: pack.entries.length,
    executable: false,
    ownerTerminologyFreezePending: pack.status === EMPTY_PACK_STATUS,
    normalizationParserAvailable: false,
    syntheticTestOnly: pack.status === 'SYNTHETIC_TEST_ONLY',
    lookupAlias,
  };
  return deepFreeze(loaded);
}

export function loadTerminologyPackFromObject(
  raw: unknown,
  byteLength: number,
  options: LoadTerminologyOptions = {},
): LoadedTerminologyPack {
  const production = isProductionRuntime(options.env);
  const allowSynthetic = Boolean(options.allowSyntheticTestPacks) && !production;
  const pack = parseAndValidatePack(raw, byteLength);
  const expected = computeContentChecksum(pack as unknown as Record<string, unknown>);
  if (expected !== pack.contentChecksum) {
    throw new TerminologyPackError('TERMINOLOGY_PACK_CHECKSUM_MISMATCH', {
      packId: pack.packId,
      packVersion: pack.packVersion,
      contentChecksum: pack.contentChecksum,
      entryCount: pack.entries.length,
    });
  }
  if (pack.status === 'SYNTHETIC_TEST_ONLY' && !allowSynthetic) {
    throw new TerminologyPackError('TERMINOLOGY_PACK_PRODUCTION_SYNTHETIC_FORBIDDEN', {
      packId: pack.packId,
      packVersion: pack.packVersion,
      contentChecksum: pack.contentChecksum,
      entryCount: pack.entries.length,
    });
  }
  assertApprovalBinding(pack, allowSynthetic);
  return toLoaded(pack);
}

export function loadTerminologyPackFromFile(
  requestedPath: string,
  options: LoadTerminologyOptions = {},
): LoadedTerminologyPack {
  const safePath = resolveAllowedPackPath(requestedPath, options);
  const buf = fs.readFileSync(safePath);
  if (buf.byteLength > MAX_PACK_BYTES) {
    throw new TerminologyPackError('TERMINOLOGY_PACK_TOO_LARGE');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(buf.toString('utf8'));
  } catch {
    throw new TerminologyPackError('TERMINOLOGY_PACK_INVALID');
  }
  return loadTerminologyPackFromObject(parsed, buf.byteLength, options);
}

export function loadDefaultProductionPack(
  options: LoadTerminologyOptions = {},
): LoadedTerminologyPack {
  return loadTerminologyPackFromFile(defaultProductionPackPath(), {
    ...options,
    allowSyntheticTestPacks: false,
  });
}
