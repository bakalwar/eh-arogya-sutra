/**
 * Phase 5B — approved disease-knowledge schema (from Phase 5A audit).
 * Approval is explicit; column names alone do not grant inclusion.
 */

export const EXPECTED_SOURCE_DB_SHA256 =
  'C3FF59F862EAD2559E116CF6A4F629B7259BBD12D73385F299B780F25C4D1154';

export const EXPECTED_DISEASE_COUNT = 116_284;

/** Only the diseases table is approved for knowledge extraction. */
export const APPROVED_TABLES = Object.freeze(['diseases']);

/**
 * Approved disease columns (Phase 5A diseases schema).
 * base_medicines / base_formula are disease-knowledge hints on the disease row —
 * not patient prescriptions or consultation formula_json.
 */
export const APPROVED_DISEASE_FIELDS = Object.freeze([
  'id',
  'icd10_code',
  'name_english',
  'name_hindi',
  'category',
  'system_key',
  'symptoms_en',
  'symptoms_hi',
  'prakruti',
  'base_medicines',
  'base_formula',
]);

/** Tables that must never appear in a sanitized disease package. */
export const DENYLIST_TABLES = Object.freeze([
  'consultations',
  'patients',
  'api_keys',
  'medicines',
  'potency_rules',
  'users',
  'sessions',
  'reports',
  'uploads',
  'prescriptions',
]);

/** Column/name signatures forbidden in output artifacts. */
export const DENYLIST_FIELD_PATTERNS = Object.freeze([
  /patient_name/i,
  /phone/i,
  /mobile/i,
  /address/i,
  /formula_json/i,
  /uploaded_?file/i,
  /report_bytes/i,
  /base64/i,
  /consultation/i,
  /doctor_id/i,
  /password/i,
  /api_key/i,
  /otp/i,
]);

export const DISEASE_PACKAGE_SCHEMA_VERSION = 'ehas2-disease-schema-v1';
export const DISEASE_DATASET_VERSION = 'ehas2-disease-v1';

export const MEDICINE_REGISTRY_VERSION = 'ehas2-medicine-registry-v1';
export const EXPECTED_MEDICINE_COUNT = 39;
export const REQUIRED_MEDICINE_CODE = 'C11';
