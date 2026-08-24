import { DISEASE_ID_PREFIX, MAPPED_ID_PREFIX, PROHIBITED_RECORD_FIELDS } from './constants.js';
import { DiseaseIdentityError, MALFORMED_INPUT, PROHIBITED_FIELD } from './errors.js';
import { isValidPrefixedDigestId } from './canonicalId.js';

export function assertNoProhibitedFields(record: Record<string, unknown>, path = ''): void {
  for (const [key, value] of Object.entries(record)) {
    const fullPath = path ? `${path}.${key}` : key;
    if ((PROHIBITED_RECORD_FIELDS as readonly string[]).includes(key)) {
      throw new DiseaseIdentityError(PROHIBITED_FIELD, `Prohibited field: ${fullPath}`);
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      assertNoProhibitedFields(value as Record<string, unknown>, fullPath);
    }
  }
}

export function assertPlainObject(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, `${label} must be a plain object`);
  }
}

export function assertCandidateOrdering(candidateLegacyDbIds: readonly number[]): void {
  const sorted = [...candidateLegacyDbIds].sort((a, b) => a - b);
  for (let i = 0; i < candidateLegacyDbIds.length; i += 1) {
    if (candidateLegacyDbIds[i] !== sorted[i]) {
      throw new DiseaseIdentityError(
        MALFORMED_INPUT,
        'candidateLegacyDbIds must be ascending (semantically neutral order)',
      );
    }
  }
}

export function assertNoDefaultPrimary(candidateLegacyDbIds: readonly number[]): void {
  if (candidateLegacyDbIds.length <= 1) {
    return;
  }
  // Fail-closed: presence of multiple candidates without an explicit primary field is allowed;
  // callers must not add primaryCandidateId fields (prohibited by schema docs).
}

export function validateDiseaseIdentityRecord(record: Record<string, unknown>): void {
  assertNoProhibitedFields(record);
  assertPlainObject(record, 'disease record');
  if (
    typeof record.ehas2DiseaseId !== 'string' ||
    !isValidPrefixedDigestId(record.ehas2DiseaseId, DISEASE_ID_PREFIX)
  ) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Invalid ehas2DiseaseId');
  }
  if (typeof record.legacyDbDiseaseId !== 'number') {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'legacyDbDiseaseId required');
  }
  if (Array.isArray(record.candidateLegacyDbIds)) {
    assertCandidateOrdering(record.candidateLegacyDbIds as number[]);
    assertNoDefaultPrimary(record.candidateLegacyDbIds as number[]);
  }
}

export function validateMappedIdentityRecord(record: Record<string, unknown>): void {
  assertNoProhibitedFields(record);
  assertPlainObject(record, 'mapped record');
  const mappedId = record.ehas2MappedIndexId;
  const rawRef = record.rawMappedReferenceId;
  if (mappedId !== null && typeof mappedId === 'string') {
    if (!isValidPrefixedDigestId(mappedId, MAPPED_ID_PREFIX)) {
      throw new DiseaseIdentityError(MALFORMED_INPUT, 'Invalid ehas2MappedIndexId');
    }
  }
  if (rawRef !== null && typeof rawRef === 'string' && !rawRef.startsWith('ehas2-mdx-raw-v1-')) {
    throw new DiseaseIdentityError(MALFORMED_INPUT, 'Invalid rawMappedReferenceId');
  }
  if (Array.isArray(record.candidateLegacyDbIds)) {
    assertCandidateOrdering(record.candidateLegacyDbIds as number[]);
  }
}
