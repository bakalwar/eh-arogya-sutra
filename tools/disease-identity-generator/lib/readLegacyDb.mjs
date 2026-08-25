import { createWriteStream, existsSync } from 'node:fs';
import { finished } from 'node:stream/promises';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import {
  ALLOWED_DISEASE_IDENTITY_SQL,
  assertDiseasesSchema,
  assertLegacyDbRowCount,
  assertPinnedByteConnectionGuarantees,
  assertSqlMatchesDiseaseIdentityAllowlist,
  buildPinnedByteSqliteUri,
  pinnedByteSqliteOpenOptions,
  validateLegacyDbRow,
  sha256FileHex,
  assertConsumedByteDigest,
  PINNED_LEGACY_DB_SHA256,
} from '../../../packages/disease-identity/dist/index.js';

function assertNoWalShmSidecars(dbPath) {
  const wal = `${dbPath}-wal`;
  const shm = `${dbPath}-shm`;
  if (existsSync(wal) || existsSync(shm)) {
    throw new Error(
      'WAL/SHM sidecars present and immutable URI open failed — cannot guarantee pinned-byte semantics',
    );
  }
}

export function openPinnedDb(dbPath, options = {}) {
  assertSqlMatchesDiseaseIdentityAllowlist(ALLOWED_DISEASE_IDENTITY_SQL);
  const absolute = path.resolve(dbPath);
  const uri = buildPinnedByteSqliteUri(absolute);
  assertPinnedByteConnectionGuarantees({
    readonly: true,
    uri: true,
    immutableQueryParam: uri.includes('immutable=1'),
  });

  let db;
  let usedImmutableUri = true;
  try {
    if (options.testOnlyForceUriFailure === true) {
      throw new Error('test-only forced immutable URI failure');
    }
    db = new Database(uri, pinnedByteSqliteOpenOptions());
  } catch {
    assertNoWalShmSidecars(absolute);
    usedImmutableUri = false;
    db = new Database(absolute, { readonly: true, fileMustExist: true });
  }

  try {
    db.pragma('query_only = ON');
    try {
      db.pragma('trusted_schema = OFF');
    } catch {
      // optional
    }

    if (!usedImmutableUri) {
      assertNoWalShmSidecars(absolute);
    }

    const integrity = db.pragma('integrity_check', { simple: true });
    if (integrity !== 'ok') {
      throw new Error(`SQLite integrity check failed: ${integrity}`);
    }
    const columns = db
      .prepare('PRAGMA table_info(diseases)')
      .all()
      .map((row) => row.name);
    assertDiseasesSchema(columns);
    return { db, absolute, usedImmutableUri };
  } catch (error) {
    try {
      db.close();
    } catch {
      // Preserve the validation error.
    }
    throw error;
  }
}

/**
 * Read disease identity rows from the exact pinned main DB bytes.
 * Prefers SQLite URI mode=ro&immutable=1 (ignores WAL/SHM).
 * Fail-closed: refuses when -wal/-shm sidecars are present (cannot guarantee pinned-byte semantics
 * under fallback, and production builds reject sidecar adjacency).
 * Iterates with .iterate(). Does not read consultation or other tables.
 */
export function* iterateLegacyDiseaseRows(dbPath, _options = {}) {
  const absolute = path.resolve(dbPath);
  assertNoWalShmSidecars(absolute);
  const { db } = openPinnedDb(absolute);
  try {
    const stmt = db.prepare(ALLOWED_DISEASE_IDENTITY_SQL);
    const seen = new Set();
    for (const row of stmt.iterate()) {
      const normalized = { id: row.id, icd10_code: row.icd10_code ?? null };
      validateLegacyDbRow(normalized, seen);
      yield normalized;
    }
  } finally {
    db.close();
  }
}

/**
 * Stream disease rows to JSONL spool `{id,icd10_code}` and build dbIdSet without retaining
 * full row objects after write. Returns `{ dbIdSet, rowCount, spoolPath }`.
 */
export async function streamLegacyDiseaseRowsToJsonl(dbPath, outPath, options = {}) {
  const expectedCount = options.expectedCount;
  const verifyPinnedHash = options.verifyPinnedHash === true;
  const pinnedHash = options.pinnedHash ?? PINNED_LEGACY_DB_SHA256;
  const absolute = path.resolve(dbPath);
  assertNoWalShmSidecars(absolute);

  let hashBefore = null;
  if (verifyPinnedHash) {
    hashBefore = await sha256FileHex(dbPath);
    await assertConsumedByteDigest(hashBefore, pinnedHash, 'legacy-db-before-open');
  }

  const dbIdSet = new Set();
  let rowCount = 0;
  let out;
  let db;
  try {
    out = createWriteStream(outPath, { encoding: 'utf8' });
    ({ db } = openPinnedDb(absolute));
    const stmt = db.prepare(ALLOWED_DISEASE_IDENTITY_SQL);
    const seen = new Set();
    for (const row of stmt.iterate()) {
      const normalized = { id: row.id, icd10_code: row.icd10_code ?? null };
      validateLegacyDbRow(normalized, seen);
      dbIdSet.add(normalized.id);
      const line = `${JSON.stringify({ id: normalized.id, icd10_code: normalized.icd10_code })}\n`;
      if (!out.write(line)) {
        await new Promise((resolve) => out.once('drain', resolve));
      }
      rowCount += 1;
      if (
        typeof options.testOnlyFailAfterRows === 'number' &&
        rowCount >= options.testOnlyFailAfterRows
      ) {
        throw new Error('test-only mid-iteration SQLite ingest failure');
      }
    }
    out.end();
    await finished(out);
  } catch (error) {
    try {
      out?.destroy();
    } catch {
      // Preserve original failure.
    }
    try {
      await rm(outPath, { force: true });
    } catch {
      // Preserve original failure.
    }
    throw error;
  } finally {
    try {
      db?.close();
    } catch {
      // Preserve original failure.
    }
  }

  if (expectedCount !== undefined) {
    assertLegacyDbRowCount(rowCount, expectedCount);
  } else {
    assertLegacyDbRowCount(rowCount);
  }

  if (verifyPinnedHash) {
    const hashAfter = await sha256FileHex(dbPath);
    await assertConsumedByteDigest(hashAfter, pinnedHash, 'legacy-db-after-close');
  }

  return { dbIdSet, rowCount, spoolPath: outPath };
}

/** Production-only direct DB-to-controlled-index ingestion; no spool or DB-ID Set. */
export async function streamLegacyDiseaseRowsToBuildIndex(dbPath, index, options = {}) {
  const pinnedHash = options.pinnedHash ?? PINNED_LEGACY_DB_SHA256;
  const absolute = path.resolve(dbPath);
  assertNoWalShmSidecars(absolute);
  const hashBefore = await sha256FileHex(absolute);
  await assertConsumedByteDigest(hashBefore, pinnedHash, 'legacy-db-before-open');

  let db;
  let rowCount = 0;
  try {
    ({ db } = openPinnedDb(absolute));
    const stmt = db.prepare(ALLOWED_DISEASE_IDENTITY_SQL);
    const seen = new Set();
    for (const row of stmt.iterate()) {
      const normalized = { id: row.id, icd10_code: row.icd10_code ?? null };
      validateLegacyDbRow(normalized, seen);
      index.insertDbRow(normalized);
      rowCount += 1;
    }
  } finally {
    try {
      db?.close();
    } catch {
      // Preserve ingestion failure.
    }
  }
  assertLegacyDbRowCount(rowCount);
  const hashAfter = await sha256FileHex(absolute);
  await assertConsumedByteDigest(hashAfter, pinnedHash, 'legacy-db-after-close');
  return { rowCount };
}

/**
 * Read disease identity rows from the exact pinned main DB bytes into an array.
 * Prefer iterateLegacyDiseaseRows / streamLegacyDiseaseRowsToJsonl for large corpora.
 */
export function readLegacyDiseaseRows(dbPath, options = {}) {
  const expectedCount = options.expectedCount;
  const out = [];
  for (const row of iterateLegacyDiseaseRows(dbPath, options)) {
    out.push(row);
  }
  if (expectedCount !== undefined) {
    assertLegacyDbRowCount(out.length, expectedCount);
  } else {
    assertLegacyDbRowCount(out.length);
  }
  return out;
}
