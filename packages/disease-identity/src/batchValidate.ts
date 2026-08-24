import { canonicalJsonString } from './canonicalJson.js';
import {
  DISEASE_ID_ALGORITHM,
  DISEASE_ID_PREFIX,
  LEGACY_AUTHORITY,
  MAPPED_ID_ALGORITHM,
  MAPPED_ID_PREFIX,
  RECORD_KIND_LEGACY_DB_ROW,
  RECORD_KIND_MAPPED_CODE_INDEX,
} from './constants.js';
import { IdentityDigestRegistry } from './canonicalId.js';
import { DiseaseIdentityError, MALFORMED_INPUT } from './errors.js';
import { NormalizationCollisionRegistry } from './normalize.js';
import {
  registerMappedRecordNormalization,
  validateDiseaseIdentityRecord,
  validateMappedIdentityRecord,
} from './validateRecord.js';

export type ValidatedRecordBatch = {
  readonly diseaseRecords: readonly Record<string, unknown>[];
  readonly mappedRecords: readonly Record<string, unknown>[];
};

function isDiseaseRecord(record: Record<string, unknown>): boolean {
  return record.recordKind === 'LEGACY_DB_ROW';
}

function recordStableId(record: Record<string, unknown>): string {
  if (typeof record.ehas2DiseaseId === 'string') {
    return record.ehas2DiseaseId;
  }
  if (typeof record.ehas2MappedIndexId === 'string') {
    return record.ehas2MappedIndexId;
  }
  if (typeof record.rawMappedReferenceId === 'string') {
    return record.rawMappedReferenceId;
  }
  throw new DiseaseIdentityError(MALFORMED_INPUT, 'Record missing stable identity field');
}

export function validateAndIndexRecordBatch(
  records: readonly Record<string, unknown>[],
): ValidatedRecordBatch {
  const diseaseDigestRegistry = new IdentityDigestRegistry();
  const mappedDigestRegistry = new IdentityDigestRegistry();
  const normalizationRegistry = new NormalizationCollisionRegistry();
  const seenRecordIds = new Set<string>();

  const diseaseRecords: Record<string, unknown>[] = [];
  const mappedRecords: Record<string, unknown>[] = [];

  for (const record of records) {
    if (isDiseaseRecord(record)) {
      validateDiseaseIdentityRecord(record);
      diseaseRecords.push(record);
      const legacyId = record.legacyDbDiseaseId;
      if (typeof legacyId !== 'number') {
        throw new DiseaseIdentityError(MALFORMED_INPUT, 'legacyDbDiseaseId required');
      }
      const diseaseId = String(record.ehas2DiseaseId);
      const digest = diseaseId.slice(DISEASE_ID_PREFIX.length);
      const canonicalInput = canonicalJsonString({
        algorithm: DISEASE_ID_ALGORITHM,
        legacyAuthority: LEGACY_AUTHORITY,
        legacyDbDiseaseId: legacyId,
        recordKind: RECORD_KIND_LEGACY_DB_ROW,
      });
      diseaseDigestRegistry.register(digest, canonicalInput);
    } else {
      validateMappedIdentityRecord(record);
      mappedRecords.push(record);
      registerMappedRecordNormalization(record, normalizationRegistry);

      if (typeof record.ehas2MappedIndexId === 'string') {
        const mappedId = record.ehas2MappedIndexId;
        const digest = mappedId.slice(MAPPED_ID_PREFIX.length);
        const canonicalInput = canonicalJsonString({
          algorithm: MAPPED_ID_ALGORITHM,
          recordKind: RECORD_KIND_MAPPED_CODE_INDEX,
          sourceNamespace: record.sourceNamespace,
          sourceCode: record.sourceCode,
        });
        mappedDigestRegistry.register(digest, canonicalInput);
      }
    }

    const stableId = recordStableId(record);
    if (seenRecordIds.has(stableId)) {
      throw new DiseaseIdentityError(MALFORMED_INPUT, `Duplicate record identity ${stableId}`);
    }
    seenRecordIds.add(stableId);
  }

  return { diseaseRecords, mappedRecords };
}
