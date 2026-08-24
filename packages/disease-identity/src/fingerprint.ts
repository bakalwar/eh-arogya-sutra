import { canonicalJsonString, sha256HexLower } from './canonicalJson.js';

export function computeRecordFingerprint(stableFields: Record<string, unknown>): string {
  return sha256HexLower(canonicalJsonString(stableFields));
}

export function buildDiseaseRecordFingerprintInput(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...record };
  delete result.ehas2DiseaseId;
  delete result.recordFingerprint;
  return result;
}

export function buildMappedRecordFingerprintInput(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...record };
  delete result.ehas2MappedIndexId;
  delete result.rawMappedReferenceId;
  delete result.recordFingerprint;
  return result;
}
