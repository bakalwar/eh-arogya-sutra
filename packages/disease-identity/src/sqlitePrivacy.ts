import { DiseaseIdentityError } from './errors.js';
import { EXPECTED_LEGACY_DB_DISEASE_COUNT } from './fullCorpusConstants.js';

export const ALLOWED_DISEASE_IDENTITY_SQL =
  'SELECT id, icd10_code FROM diseases ORDER BY id ASC' as const;

export const PROHIBITED_SQLITE_TABLES = [
  'consultations',
  'api_keys',
  'medicines',
  'potency_rules',
  'fts_diseases',
  'fts_diseases_config',
  'fts_diseases_data',
  'fts_diseases_docsize',
  'fts_diseases_idx',
  'vec_diseases',
  'vec_diseases_chunks',
  'vec_diseases_info',
  'vec_diseases_rowids',
  'vec_diseases_vector_chunks00',
] as const;

export const REQUIRED_DISEASES_COLUMNS = ['id', 'icd10_code'] as const;
export const FORBIDDEN_DISEASES_COLUMNS = [
  'polarity',
  'name_english',
  'name_hindi',
  'symptoms_en',
  'symptoms_hi',
  'base_medicines',
  'base_formula',
  'prakruti',
  'category',
  'system_key',
] as const;

export function assertSqlMatchesDiseaseIdentityAllowlist(sql: string): void {
  const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase();
  const allowed = ALLOWED_DISEASE_IDENTITY_SQL.replace(/\s+/g, ' ').trim().toLowerCase();
  if (normalized !== allowed) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'SQL query is outside the approved disease identity allowlist',
    );
  }
}

export type LegacyDbRow = {
  readonly id: number;
  readonly icd10_code: string | null;
};

export function validateLegacyDbRow(row: LegacyDbRow, seenIds: Set<number>): void {
  if (!Number.isInteger(row.id) || row.id <= 0) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Disease id must be a positive safe integer');
  }
  if (seenIds.has(row.id)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', `Duplicate disease id ${row.id}`);
  }
  seenIds.add(row.id);
  if (row.icd10_code !== null && row.icd10_code.length > 512) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'icd10_code exceeds bounded length');
  }
}

export function assertLegacyDbRowCount(
  count: number,
  expected = EXPECTED_LEGACY_DB_DISEASE_COUNT,
): void {
  if (count !== expected) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Expected ${expected} disease rows, observed ${count}`,
    );
  }
}

export function assertDiseasesSchema(columns: readonly string[]): void {
  for (const col of REQUIRED_DISEASES_COLUMNS) {
    if (!columns.includes(col)) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', `Missing required diseases column ${col}`);
    }
  }
  if (columns.includes('polarity')) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'polarity column must be absent');
  }
}

/** Reject SELECT lists that expand beyond the approved identity query. */
export function assertSelectColumnsAllowlisted(selectColumns: readonly string[]): void {
  const allowed = new Set<string>(REQUIRED_DISEASES_COLUMNS);
  for (const col of selectColumns) {
    if (!allowed.has(col)) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `SELECT column outside disease-identity allowlist: ${col}`,
      );
    }
  }
}
