import { existsSync } from 'node:fs';
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
} from '../../../packages/disease-identity/dist/sqlitePrivacy.js';

function assertNoWalShmSidecars(dbPath) {
  const wal = `${dbPath}-wal`;
  const shm = `${dbPath}-shm`;
  if (existsSync(wal) || existsSync(shm)) {
    throw new Error(
      'WAL/SHM sidecars present and immutable URI open failed — cannot guarantee pinned-byte semantics',
    );
  }
}

/**
 * Read disease identity rows from the exact pinned main DB bytes.
 * Prefers SQLite URI mode=ro&immutable=1 (ignores WAL/SHM).
 * Falls back only when sidecars are absent (readonly file open + query_only).
 * Iterates with .iterate(). Does not read consultation or other tables.
 */
export function readLegacyDiseaseRows(dbPath, options = {}) {
  const expectedCount = options.expectedCount;
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
      // Documented fallback: sidecars absent ⇒ main file bytes only.
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

    const stmt = db.prepare(ALLOWED_DISEASE_IDENTITY_SQL);
    const seen = new Set();
    const out = [];
    for (const row of stmt.iterate()) {
      const normalized = { id: row.id, icd10_code: row.icd10_code ?? null };
      validateLegacyDbRow(normalized, seen);
      out.push(normalized);
    }
    if (expectedCount !== undefined) {
      assertLegacyDbRowCount(out.length, expectedCount);
    } else {
      assertLegacyDbRowCount(out.length);
    }
    return out;
  } finally {
    db.close();
  }
}
