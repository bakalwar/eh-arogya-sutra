import { existsSync, lstatSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import Database from 'better-sqlite3';
import { DiseaseIdentityError } from './errors.js';
import {
  ALLOWED_DISEASE_IDENTITY_SQL,
  assertSqlMatchesDiseaseIdentityAllowlist,
  PROHIBITED_SQLITE_TABLES,
  REQUIRED_DISEASES_COLUMNS,
} from './sqlitePrivacy.js';
import {
  buildSanitizedDiseaseIdentityRecord,
  normalizeLegacyCodeRawFromDb,
  serializeSanitizedRecordLine,
  type SanitizedDiseaseIdentityRecord,
} from './sanitizedIdentityRecord.js';
import { OrderedSanitizedIdentityFingerprintBuilder } from './orderedSanitizedIdentityFingerprint.js';

export type SidecarFileMetadata = {
  readonly present: boolean;
  readonly size: number | null;
  readonly mtimeMs: number | null;
};

export type SourceDbSidecarSnapshot = {
  readonly main: SidecarFileMetadata;
  readonly wal: SidecarFileMetadata;
  readonly shm: SidecarFileMetadata;
};

function metaFor(filePath: string): SidecarFileMetadata {
  if (!existsSync(filePath)) {
    return { present: false, size: null, mtimeMs: null };
  }
  const st = statSync(filePath);
  return { present: true, size: st.size, mtimeMs: st.mtimeMs };
}

/** Redacted filesystem metadata for main/WAL/SHM — never includes paths. */
export function captureSourceDbSidecarSnapshot(dbPath: string): SourceDbSidecarSnapshot {
  const absolute = path.resolve(dbPath);
  return {
    main: metaFor(absolute),
    wal: metaFor(`${absolute}-wal`),
    shm: metaFor(`${absolute}-shm`),
  };
}

/**
 * Live readonly URI: mode=ro, NOT immutable=1.
 * WAL-visible committed state is readable. Windows may touch SHM/wal-index.
 * Preserves percent-encoding (e.g. spaces as %20) required by SQLite URI open.
 */
export function buildLiveReadonlySqliteUri(dbPath: string): string {
  const absolute = path.resolve(dbPath);
  const href = pathToFileURL(absolute).href; // file:///C:/Users/zero%20error/...
  let normalized = href.replace(/^file:\/\//i, '');
  if (normalized.startsWith('/') && /^\/[A-Za-z]:/.test(normalized)) {
    normalized = normalized.slice(1);
  }
  const uri = `file:${normalized}?mode=ro`;
  if (uri.includes('immutable=1')) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Live readonly URI must not use immutable=1');
  }
  return uri;
}

function assertDiseasesIdentityColumnsPresent(db: Database.Database): void {
  const rows = db.prepare('PRAGMA table_info(diseases)').all() as Array<{ name: string }>;
  const names = new Set(rows.map((r) => r.name));
  const presence = {
    hasId: names.has('id'),
    hasIcd10Code: names.has('icd10_code'),
    hasPolarity: names.has('polarity'),
  };
  if (!presence.hasId || !presence.hasIcd10Code) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Required diseases identity columns missing');
  }
  if (presence.hasPolarity) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'polarity column must be absent');
  }
  for (const col of REQUIRED_DISEASES_COLUMNS) {
    if (!names.has(col)) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Required diseases identity columns missing',
      );
    }
  }
}

function assertNoWritablePragma(db: Database.Database): void {
  db.pragma('query_only = ON');
  try {
    db.pragma('trusted_schema = OFF');
  } catch {
    // optional
  }
}

export type LiveReadonlyIdentityConnection = {
  readonly db: Database.Database;
  readonly absolutePath: string;
  readonly usedLiveReadonlyUri: boolean;
  readonly openMode: 'uri-mode-ro' | 'path-readonly-fallback';
  readonly shmCaveat: 'WINDOWS_WAL_READONLY_MAY_TOUCH_SHM_WAL_INDEX_COORDINATION_STATE';
};

export function openLiveReadonlyDiseaseIdentityDb(dbPath: string): LiveReadonlyIdentityConnection {
  assertSqlMatchesDiseaseIdentityAllowlist(ALLOWED_DISEASE_IDENTITY_SQL);
  const absolute = path.resolve(dbPath);
  if (!existsSync(absolute)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Source DB missing');
  }
  const lst = lstatSync(absolute);
  if (lst.isSymbolicLink()) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Source DB must not be a symlink');
  }
  const uri = buildLiveReadonlySqliteUri(absolute);
  const openOpts = { readonly: true as const, fileMustExist: true as const, uri: true as const };
  let db: Database.Database;
  let usedUri = true;
  try {
    db = new Database(uri, openOpts);
  } catch {
    // Windows paths with spaces often fail SQLite file: URI open; path readonly is still
    // SQLITE_OPEN_READONLY (mode=ro semantics) and must NOT use immutable=1.
    usedUri = false;
    db = new Database(absolute, { readonly: true, fileMustExist: true });
  }
  try {
    assertNoWritablePragma(db);
    assertDiseasesIdentityColumnsPresent(db);
    return {
      db,
      absolutePath: absolute,
      usedLiveReadonlyUri: usedUri,
      openMode: usedUri ? 'uri-mode-ro' : 'path-readonly-fallback',
      shmCaveat: 'WINDOWS_WAL_READONLY_MAY_TOUCH_SHM_WAL_INDEX_COORDINATION_STATE',
    };
  } catch (error) {
    try {
      db.close();
    } catch {
      // preserve
    }
    throw error;
  }
}

export type IdentityStreamAggregate = {
  readonly recordCount: number;
  readonly orderedIdentityFingerprint: string;
  readonly recordByteStreamSha256: string;
};

/**
 * One DEFERRED read transaction: stream allowlisted identity rows only.
 * Does not retain rows. Never prints row values.
 */
export function streamDiseaseIdentityFingerprintInReadTransaction(
  db: Database.Database,
  options: { readonly expectedCount?: number } = {},
): IdentityStreamAggregate {
  assertSqlMatchesDiseaseIdentityAllowlist(ALLOWED_DISEASE_IDENTITY_SQL);
  for (const table of PROHIBITED_SQLITE_TABLES) {
    // Static denylist presence check only — do not query those tables.
    void table;
  }

  const builder = new OrderedSanitizedIdentityFingerprintBuilder();
  const seen = new Set<number>();
  db.exec('BEGIN DEFERRED');
  try {
    const stmt = db.prepare(ALLOWED_DISEASE_IDENTITY_SQL);
    for (const row of stmt.iterate() as Iterable<{ id: number; icd10_code: unknown }>) {
      const legacyCodeRaw = normalizeLegacyCodeRawFromDb(
        row.icd10_code === undefined ? null : row.icd10_code,
      );
      if (typeof row.id !== 'number' || !Number.isSafeInteger(row.id) || row.id <= 0) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          'Disease id must be positive safe integer',
        );
      }
      if (seen.has(row.id)) {
        throw new DiseaseIdentityError('MALFORMED_INPUT', 'Duplicate disease id in stream');
      }
      seen.add(row.id);
      const record: SanitizedDiseaseIdentityRecord = buildSanitizedDiseaseIdentityRecord({
        legacyDbDiseaseId: row.id,
        legacyCodeRaw,
      });
      builder.appendRecord(record);
    }
    db.exec('COMMIT');
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // preserve
    }
    throw error;
  }

  const finalized = builder.finalize(options.expectedCount);
  return {
    recordCount: finalized.recordCount,
    orderedIdentityFingerprint: finalized.orderedIdentityFingerprint,
    recordByteStreamSha256: finalized.recordByteStreamSha256,
  };
}

/**
 * Derive pass: write canonical JSONL while hashing in one DEFERRED transaction.
 * Caller supplies a write callback that receives canonical line bytes (no row logging).
 */
export function streamDiseaseIdentityArtifactInReadTransaction(
  db: Database.Database,
  writeLine: (canonicalLineWithLf: string) => void,
  options: { readonly expectedCount?: number } = {},
): IdentityStreamAggregate {
  assertSqlMatchesDiseaseIdentityAllowlist(ALLOWED_DISEASE_IDENTITY_SQL);
  const builder = new OrderedSanitizedIdentityFingerprintBuilder();
  const seen = new Set<number>();
  db.exec('BEGIN DEFERRED');
  try {
    const stmt = db.prepare(ALLOWED_DISEASE_IDENTITY_SQL);
    for (const row of stmt.iterate() as Iterable<{ id: number; icd10_code: unknown }>) {
      const legacyCodeRaw = normalizeLegacyCodeRawFromDb(
        row.icd10_code === undefined ? null : row.icd10_code,
      );
      if (typeof row.id !== 'number' || !Number.isSafeInteger(row.id) || row.id <= 0) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          'Disease id must be positive safe integer',
        );
      }
      if (seen.has(row.id)) {
        throw new DiseaseIdentityError('MALFORMED_INPUT', 'Duplicate disease id in stream');
      }
      seen.add(row.id);
      const record = buildSanitizedDiseaseIdentityRecord({
        legacyDbDiseaseId: row.id,
        legacyCodeRaw,
      });
      const line = serializeSanitizedRecordLine(record);
      writeLine(`${line}\n`);
      builder.appendCanonicalLine(line, record.legacyDbDiseaseId);
    }
    db.exec('COMMIT');
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // preserve
    }
    throw error;
  }
  const finalized = builder.finalize(options.expectedCount);
  return {
    recordCount: finalized.recordCount,
    orderedIdentityFingerprint: finalized.orderedIdentityFingerprint,
    recordByteStreamSha256: finalized.recordByteStreamSha256,
  };
}
