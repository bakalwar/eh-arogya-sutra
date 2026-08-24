import Database from 'better-sqlite3';
import {
  ALLOWED_DISEASE_IDENTITY_SQL,
  assertDiseasesSchema,
  assertLegacyDbRowCount,
  assertSqlMatchesDiseaseIdentityAllowlist,
  validateLegacyDbRow,
} from '../../../packages/disease-identity/dist/sqlitePrivacy.js';

export function readLegacyDiseaseRows(dbPath) {
  assertSqlMatchesDiseaseIdentityAllowlist(ALLOWED_DISEASE_IDENTITY_SQL);
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    const integrity = db.pragma('integrity_check', { simple: true });
    if (integrity !== 'ok') {
      throw new Error(`SQLite integrity check failed: ${integrity}`);
    }
    const columns = db
      .prepare('PRAGMA table_info(diseases)')
      .all()
      .map((row) => row.name);
    assertDiseasesSchema(columns);
    const rows = db.prepare(ALLOWED_DISEASE_IDENTITY_SQL).all();
    const seen = new Set();
    for (const row of rows) {
      validateLegacyDbRow({ id: row.id, icd10_code: row.icd10_code ?? null }, seen);
    }
    assertLegacyDbRowCount(rows.length);
    return rows.map((row) => ({ id: row.id, icd10_code: row.icd10_code ?? null }));
  } finally {
    db.close();
  }
}
