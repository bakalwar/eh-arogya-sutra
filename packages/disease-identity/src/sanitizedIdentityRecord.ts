import { DiseaseIdentityError, PROHIBITED_FIELD, UNKNOWN_FIELD } from './errors.js';
import { canonicalJsonString, nfcNormalize } from './canonicalJson.js';
import { LEGACY_AUTHORITY } from './constants.js';
import {
  SANITIZED_LEGACY_AUTHORITY,
  SANITIZED_MAX_CODE_CHARS,
  SANITIZED_MAX_LINE_BYTES,
  SANITIZED_RECORD_SCHEMA_VERSION,
} from './sanitizedIdentityConstants.js';

export const SANITIZED_RECORD_KEYS = [
  'artifactSchemaVersion',
  'legacyAuthority',
  'legacyDbDiseaseId',
  'legacyCodeRaw',
] as const;

export type SanitizedDiseaseIdentityRecord = {
  readonly artifactSchemaVersion: typeof SANITIZED_RECORD_SCHEMA_VERSION;
  readonly legacyAuthority: typeof LEGACY_AUTHORITY;
  readonly legacyDbDiseaseId: number;
  readonly legacyCodeRaw: string | null;
};

const PROHIBITED_NESTED_KEYS = new Set([
  'name',
  'nameEnglish',
  'nameHindi',
  'name_english',
  'name_hindi',
  'description',
  'symptoms',
  'symptoms_en',
  'symptoms_hi',
  'consultation',
  'consultations',
  'patient',
  'patientId',
  'polarity',
  'medicine',
  'medicines',
  'prescription',
  'prescriptions',
  'sourceNamespace',
  'icd10_code',
  'display',
  'prose',
]);

function rejectProhibitedDeep(value: unknown, pathLabel: string): void {
  if (value === null || typeof value !== 'object') {
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      rejectProhibitedDeep(value[i], `${pathLabel}[${i}]`);
    }
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (PROHIBITED_NESTED_KEYS.has(key)) {
      throw new DiseaseIdentityError(PROHIBITED_FIELD, `Prohibited field ${key} at ${pathLabel}`);
    }
    rejectProhibitedDeep(child, `${pathLabel}.${key}`);
  }
}

export function normalizeLegacyCodeRawFromDb(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'legacyCodeRaw must be string or null');
  }
  if (value.length === 0 || /^\s*$/.test(value)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'legacyCodeRaw empty/whitespace rejected');
  }
  const nfc = nfcNormalize(value);
  if (nfc.length > SANITIZED_MAX_CODE_CHARS) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'legacyCodeRaw exceeds max length');
  }
  return nfc;
}

export function buildSanitizedDiseaseIdentityRecord(input: {
  readonly legacyDbDiseaseId: number;
  readonly legacyCodeRaw: string | null;
}): SanitizedDiseaseIdentityRecord {
  return {
    artifactSchemaVersion: SANITIZED_RECORD_SCHEMA_VERSION,
    legacyAuthority: SANITIZED_LEGACY_AUTHORITY,
    legacyDbDiseaseId: input.legacyDbDiseaseId,
    legacyCodeRaw: input.legacyCodeRaw,
  };
}

export function validateSanitizedDiseaseIdentityRecord(
  raw: unknown,
  seenIds: Set<number>,
): SanitizedDiseaseIdentityRecord {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Sanitized record must be a plain object');
  }
  rejectProhibitedDeep(raw, 'record');
  const obj = raw as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length !== SANITIZED_RECORD_KEYS.length) {
    throw new DiseaseIdentityError(UNKNOWN_FIELD, 'Sanitized record key count mismatch');
  }
  for (const key of keys) {
    if (!(SANITIZED_RECORD_KEYS as readonly string[]).includes(key)) {
      throw new DiseaseIdentityError(UNKNOWN_FIELD, `Unknown sanitized record field ${key}`);
    }
  }
  for (const required of SANITIZED_RECORD_KEYS) {
    if (!(required in obj)) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', `Missing sanitized field ${required}`);
    }
  }
  if (obj.artifactSchemaVersion !== SANITIZED_RECORD_SCHEMA_VERSION) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'artifactSchemaVersion mismatch');
  }
  if (obj.legacyAuthority !== SANITIZED_LEGACY_AUTHORITY) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'legacyAuthority must remain pinned authority',
    );
  }
  if (
    typeof obj.legacyDbDiseaseId !== 'number' ||
    !Number.isSafeInteger(obj.legacyDbDiseaseId) ||
    obj.legacyDbDiseaseId <= 0
  ) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'legacyDbDiseaseId must be positive safe integer',
    );
  }
  if (seenIds.has(obj.legacyDbDiseaseId)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Duplicate legacyDbDiseaseId ${obj.legacyDbDiseaseId}`,
    );
  }
  seenIds.add(obj.legacyDbDiseaseId);

  let legacyCodeRaw: string | null;
  if (obj.legacyCodeRaw === null) {
    legacyCodeRaw = null;
  } else if (typeof obj.legacyCodeRaw === 'string') {
    legacyCodeRaw = normalizeLegacyCodeRawFromDb(obj.legacyCodeRaw);
  } else {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'legacyCodeRaw must be string or null');
  }

  return buildSanitizedDiseaseIdentityRecord({
    legacyDbDiseaseId: obj.legacyDbDiseaseId,
    legacyCodeRaw,
  });
}

export function serializeSanitizedRecordLine(record: SanitizedDiseaseIdentityRecord): string {
  const line = canonicalJsonString(record);
  const bytes = Buffer.byteLength(line, 'utf8');
  if (bytes > SANITIZED_MAX_LINE_BYTES) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Sanitized JSONL line exceeds max bytes');
  }
  return line;
}
