import { DiseaseIdentityError, UNKNOWN_FIELD } from './errors.js';
import { AUTHORITY_CLASSIFICATION, LEGACY_AUTHORITY } from './constants.js';
import { assertDigestHex64 } from './canonicalJson.js';
import {
  SANITIZED_ADOPTION_MANIFEST_KIND,
  SANITIZED_ADOPTION_MANIFEST_SCHEMA_VERSION,
  SANITIZED_ARTIFACT_KIND,
  SANITIZED_CLINICAL_AUTHORITY,
  SANITIZED_DATASET_VERSION,
  SANITIZED_LICENSING_CLASSIFICATION,
  SANITIZED_MANIFEST_SCHEMA_VERSION,
  SANITIZED_RECORD_SCHEMA_VERSION,
  SANITIZED_SOURCE_CLASS,
  ORDERED_SANITIZED_IDENTITY_FP_ALGORITHM,
} from './sanitizedIdentityConstants.js';

export const SANITIZED_ADOPTION_LIFECYCLE_ADOPTED = 'ADOPTED_AS_GENERATOR_INPUT' as const;

export const SANITIZED_ADOPTION_MANIFEST_KEYS = [
  'manifestSchemaVersion',
  'adoptionKind',
  'artifactKind',
  'artifactSchemaVersion',
  'sanitizedManifestSchemaVersion',
  'datasetVersion',
  'legacyAuthority',
  'sourceClass',
  'authorityClassification',
  'clinicalAuthority',
  'licensingClassification',
  'artifactSHA256',
  'artifactBytes',
  'recordCount',
  'orderedIdentityFingerprint',
  'orderedIdentityFingerprintAlgorithm',
  'sanitizedManifestSHA256',
  'derivationToolingCommit',
  'expectedCanonicalRepository',
  'ownerAdoptionTokenIdentity',
  'lifecycleStatus',
  'supersedes',
  'supersededBy',
] as const;

export type SanitizedAdoptionManifest = {
  readonly manifestSchemaVersion: typeof SANITIZED_ADOPTION_MANIFEST_SCHEMA_VERSION;
  readonly adoptionKind: typeof SANITIZED_ADOPTION_MANIFEST_KIND;
  readonly artifactKind: typeof SANITIZED_ARTIFACT_KIND;
  readonly artifactSchemaVersion: typeof SANITIZED_RECORD_SCHEMA_VERSION;
  readonly sanitizedManifestSchemaVersion: typeof SANITIZED_MANIFEST_SCHEMA_VERSION;
  readonly datasetVersion: typeof SANITIZED_DATASET_VERSION;
  readonly legacyAuthority: typeof LEGACY_AUTHORITY;
  readonly sourceClass: typeof SANITIZED_SOURCE_CLASS;
  readonly authorityClassification: typeof AUTHORITY_CLASSIFICATION;
  readonly clinicalAuthority: typeof SANITIZED_CLINICAL_AUTHORITY;
  readonly licensingClassification: typeof SANITIZED_LICENSING_CLASSIFICATION;
  readonly artifactSHA256: string;
  readonly artifactBytes: number;
  readonly recordCount: number;
  readonly orderedIdentityFingerprint: string;
  readonly orderedIdentityFingerprintAlgorithm: typeof ORDERED_SANITIZED_IDENTITY_FP_ALGORITHM;
  readonly sanitizedManifestSHA256: string;
  readonly derivationToolingCommit: string;
  readonly expectedCanonicalRepository: 'bakalwar/EH_AROGYA_SUTRA_2';
  readonly ownerAdoptionTokenIdentity: string;
  readonly lifecycleStatus: typeof SANITIZED_ADOPTION_LIFECYCLE_ADOPTED;
  readonly supersedes: string | null;
  readonly supersededBy: string | null;
};

function rejectPathsAndSecrets(value: unknown, label: string): void {
  if (typeof value === 'string') {
    if (/[A-Za-z]:\\|\\\\|\/Users\/|\/home\//i.test(value)) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', `Absolute path forbidden in ${label}`);
    }
    if (/password|secret|credential|signed[_-]?url/i.test(value)) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Secret-like content forbidden in ${label}`,
      );
    }
    return;
  }
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      value.forEach((v, i) => rejectPathsAndSecrets(v, `${label}[${i}]`));
    } else {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (
          [
            'rows',
            'records',
            'legacyCodeRaw',
            'consultations',
            'hostname',
            'username',
            'machineId',
          ].includes(k)
        ) {
          throw new DiseaseIdentityError('MALFORMED_INPUT', `Forbidden adoption field ${k}`);
        }
        rejectPathsAndSecrets(v, `${label}.${k}`);
      }
    }
  }
}

export function validateSanitizedAdoptionManifest(
  raw: unknown,
  mode: 'production' | 'synthetic' = 'production',
): SanitizedAdoptionManifest {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Adoption manifest must be a plain object');
  }
  rejectPathsAndSecrets(raw, 'adoption');
  const obj = raw as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length !== SANITIZED_ADOPTION_MANIFEST_KEYS.length) {
    throw new DiseaseIdentityError(UNKNOWN_FIELD, 'Adoption manifest key count mismatch');
  }
  for (const key of keys) {
    if (!(SANITIZED_ADOPTION_MANIFEST_KEYS as readonly string[]).includes(key)) {
      throw new DiseaseIdentityError(UNKNOWN_FIELD, `Unknown adoption field ${key}`);
    }
  }
  if (obj.manifestSchemaVersion !== SANITIZED_ADOPTION_MANIFEST_SCHEMA_VERSION) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'adoption manifestSchemaVersion mismatch');
  }
  if (obj.adoptionKind !== SANITIZED_ADOPTION_MANIFEST_KIND) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'adoptionKind mismatch');
  }
  if (obj.artifactKind !== SANITIZED_ARTIFACT_KIND) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'artifactKind mismatch');
  }
  if (obj.artifactSchemaVersion !== SANITIZED_RECORD_SCHEMA_VERSION) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'artifactSchemaVersion mismatch');
  }
  if (obj.sanitizedManifestSchemaVersion !== SANITIZED_MANIFEST_SCHEMA_VERSION) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'sanitizedManifestSchemaVersion mismatch');
  }
  if (obj.datasetVersion !== SANITIZED_DATASET_VERSION) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'datasetVersion mismatch');
  }
  if (obj.legacyAuthority !== LEGACY_AUTHORITY) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'legacyAuthority mismatch');
  }
  if (obj.sourceClass !== SANITIZED_SOURCE_CLASS) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'sourceClass mismatch');
  }
  if (obj.authorityClassification !== AUTHORITY_CLASSIFICATION) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'authorityClassification mismatch');
  }
  if (obj.clinicalAuthority !== SANITIZED_CLINICAL_AUTHORITY) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'clinicalAuthority mismatch');
  }
  if (obj.licensingClassification !== SANITIZED_LICENSING_CLASSIFICATION) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'licensingClassification mismatch');
  }
  assertDigestHex64(String(obj.artifactSHA256), 'artifactSHA256');
  assertDigestHex64(String(obj.orderedIdentityFingerprint), 'orderedIdentityFingerprint');
  assertDigestHex64(String(obj.sanitizedManifestSHA256), 'sanitizedManifestSHA256');
  if (obj.orderedIdentityFingerprintAlgorithm !== ORDERED_SANITIZED_IDENTITY_FP_ALGORITHM) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'fingerprint algorithm mismatch');
  }
  if (typeof obj.artifactBytes !== 'number' || !Number.isSafeInteger(obj.artifactBytes)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'artifactBytes invalid');
  }
  if (typeof obj.recordCount !== 'number' || !Number.isSafeInteger(obj.recordCount)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'recordCount invalid');
  }
  if (typeof obj.derivationToolingCommit !== 'string') {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'derivationToolingCommit invalid');
  }
  if (mode === 'production') {
    if (!/^[0-9a-f]{40}$/.test(obj.derivationToolingCommit)) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'derivationToolingCommit invalid');
    }
  } else if (
    !/^[0-9a-f]{40}$/.test(obj.derivationToolingCommit) &&
    obj.derivationToolingCommit !== 'SYNTHETIC_TEST_COMMIT'
  ) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'derivationToolingCommit invalid');
  }
  if (obj.expectedCanonicalRepository !== 'bakalwar/EH_AROGYA_SUTRA_2') {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'expectedCanonicalRepository mismatch');
  }
  if (
    typeof obj.ownerAdoptionTokenIdentity !== 'string' ||
    obj.ownerAdoptionTokenIdentity.length < 8
  ) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'ownerAdoptionTokenIdentity required');
  }
  if (obj.lifecycleStatus !== SANITIZED_ADOPTION_LIFECYCLE_ADOPTED) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'adoption lifecycleStatus mismatch');
  }
  if (obj.supersedes !== null && typeof obj.supersedes !== 'string') {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'supersedes invalid');
  }
  if (obj.supersededBy !== null && typeof obj.supersededBy !== 'string') {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'supersededBy invalid');
  }
  return obj as unknown as SanitizedAdoptionManifest;
}

export function validateSanitizedAdoptionManifestSynthetic(
  raw: unknown,
): SanitizedAdoptionManifest {
  return validateSanitizedAdoptionManifest(raw, 'synthetic');
}
