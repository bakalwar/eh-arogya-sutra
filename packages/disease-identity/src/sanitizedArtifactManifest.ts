import { DiseaseIdentityError, UNKNOWN_FIELD } from './errors.js';
import { AUTHORITY_CLASSIFICATION } from './constants.js';
import { assertDigestHex64 } from './canonicalJson.js';
import {
  DISEASE_IDENTITY_SQL_QUERY_ID,
  PINNED_DISEASE_IDENTITY_SQL_SHA256,
  SANITIZED_ARTIFACT_KIND,
  SANITIZED_CLINICAL_AUTHORITY,
  SANITIZED_DATASET_VERSION,
  SANITIZED_EXCLUSIONS,
  SANITIZED_LICENSING_CLASSIFICATION,
  SANITIZED_LIFECYCLE_DERIVED_PENDING_ADOPTION,
  SANITIZED_MANIFEST_SCHEMA_VERSION,
  SANITIZED_PRIVACY_CLASSIFICATION,
  SANITIZED_RECORD_SCHEMA_VERSION,
  SANITIZED_SOURCE_CLASS,
  ORDERED_SANITIZED_IDENTITY_FP_ALGORITHM,
} from './sanitizedIdentityConstants.js';

export const SANITIZED_ARTIFACT_MANIFEST_KEYS = [
  'manifestSchemaVersion',
  'artifactSchemaVersion',
  'datasetVersion',
  'artifactKind',
  'authorityClassification',
  'clinicalAuthority',
  'sourceClass',
  'derivationQueryIdentifier',
  'derivationQuerySHA256',
  'recordCount',
  'artifactBytes',
  'artifactSHA256',
  'orderedIdentityFingerprint',
  'orderedIdentityFingerprintAlgorithm',
  'generatorVersion',
  'generatorSourceCommit',
  'expectedCanonicalRepository',
  'sourceLegacyEvidenceReference',
  'lifecycleStatus',
  'supersedes',
  'supersededBy',
  'licensingClassification',
  'privacyClassification',
  'exclusions',
] as const;

export type SanitizedArtifactManifest = {
  readonly manifestSchemaVersion: typeof SANITIZED_MANIFEST_SCHEMA_VERSION;
  readonly artifactSchemaVersion: typeof SANITIZED_RECORD_SCHEMA_VERSION;
  readonly datasetVersion: typeof SANITIZED_DATASET_VERSION;
  readonly artifactKind: typeof SANITIZED_ARTIFACT_KIND;
  readonly authorityClassification: typeof AUTHORITY_CLASSIFICATION;
  readonly clinicalAuthority: typeof SANITIZED_CLINICAL_AUTHORITY;
  readonly sourceClass: typeof SANITIZED_SOURCE_CLASS;
  readonly derivationQueryIdentifier: typeof DISEASE_IDENTITY_SQL_QUERY_ID;
  readonly derivationQuerySHA256: typeof PINNED_DISEASE_IDENTITY_SQL_SHA256;
  readonly recordCount: number;
  readonly artifactBytes: number;
  readonly artifactSHA256: string;
  readonly orderedIdentityFingerprint: string;
  readonly orderedIdentityFingerprintAlgorithm: typeof ORDERED_SANITIZED_IDENTITY_FP_ALGORITHM;
  readonly generatorVersion: string;
  readonly generatorSourceCommit: string;
  readonly expectedCanonicalRepository: 'bakalwar/EH_AROGYA_SUTRA_2';
  readonly sourceLegacyEvidenceReference: {
    readonly label: string;
    readonly historicalMainFileSha256: string;
  };
  readonly lifecycleStatus: typeof SANITIZED_LIFECYCLE_DERIVED_PENDING_ADOPTION;
  readonly supersedes: string | null;
  readonly supersededBy: string | null;
  readonly licensingClassification: typeof SANITIZED_LICENSING_CLASSIFICATION;
  readonly privacyClassification: typeof SANITIZED_PRIVACY_CLASSIFICATION;
  readonly exclusions: readonly string[];
};

const FORBIDDEN_MANIFEST_STRING_PATTERNS = [
  /[A-Za-z]:\\/,
  /\\\\/,
  /\/Users\//i,
  /\/home\//i,
  /password/i,
  /secret/i,
  /credential/i,
  /token=[^"]+/i,
  /https?:\/\/[^\s]+@(?:)/i,
];

function rejectForbiddenStrings(value: unknown, label: string): void {
  if (typeof value === 'string') {
    // Exclusion tokens may literally name forbidden categories (e.g. "credentials").
    if (label.startsWith('manifest.exclusions[')) {
      return;
    }
    for (const re of FORBIDDEN_MANIFEST_STRING_PATTERNS) {
      if (re.test(value)) {
        throw new DiseaseIdentityError('MALFORMED_INPUT', `Forbidden string content in ${label}`);
      }
    }
    return;
  }
  if (value && typeof value === 'object') {
    if (Array.isArray(value)) {
      value.forEach((item, i) => rejectForbiddenStrings(item, `${label}[${i}]`));
    } else {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (k === 'derivedAt' || k === 'createdAt' || k === 'timestamp' || k.endsWith('At')) {
          throw new DiseaseIdentityError(
            'MALFORMED_INPUT',
            'Timestamps are forbidden in canonical sanitized manifest',
          );
        }
        rejectForbiddenStrings(v, `${label}.${k}`);
      }
    }
  }
}

export function validateSanitizedArtifactManifest(raw: unknown): SanitizedArtifactManifest {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Sanitized manifest must be a plain object');
  }
  const obj = raw as Record<string, unknown>;
  rejectForbiddenStrings(obj, 'manifest');
  const keys = Object.keys(obj);
  if (keys.length !== SANITIZED_ARTIFACT_MANIFEST_KEYS.length) {
    throw new DiseaseIdentityError(UNKNOWN_FIELD, 'Sanitized manifest key count mismatch');
  }
  for (const key of keys) {
    if (!(SANITIZED_ARTIFACT_MANIFEST_KEYS as readonly string[]).includes(key)) {
      throw new DiseaseIdentityError(UNKNOWN_FIELD, `Unknown sanitized manifest field ${key}`);
    }
  }
  if (obj.manifestSchemaVersion !== SANITIZED_MANIFEST_SCHEMA_VERSION) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'manifestSchemaVersion mismatch');
  }
  if (obj.artifactSchemaVersion !== SANITIZED_RECORD_SCHEMA_VERSION) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'artifactSchemaVersion mismatch');
  }
  if (obj.datasetVersion !== SANITIZED_DATASET_VERSION) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'datasetVersion mismatch');
  }
  if (obj.artifactKind !== SANITIZED_ARTIFACT_KIND) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'artifactKind mismatch');
  }
  if (obj.authorityClassification !== AUTHORITY_CLASSIFICATION) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'authorityClassification mismatch');
  }
  if (obj.clinicalAuthority !== SANITIZED_CLINICAL_AUTHORITY) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'clinicalAuthority mismatch');
  }
  if (obj.sourceClass !== SANITIZED_SOURCE_CLASS) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'sourceClass mismatch');
  }
  if (obj.derivationQueryIdentifier !== DISEASE_IDENTITY_SQL_QUERY_ID) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'derivationQueryIdentifier mismatch');
  }
  if (obj.derivationQuerySHA256 !== PINNED_DISEASE_IDENTITY_SQL_SHA256) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'derivationQuerySHA256 mismatch');
  }
  if (
    typeof obj.recordCount !== 'number' ||
    !Number.isSafeInteger(obj.recordCount) ||
    obj.recordCount < 0
  ) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'recordCount invalid');
  }
  if (
    typeof obj.artifactBytes !== 'number' ||
    !Number.isSafeInteger(obj.artifactBytes) ||
    obj.artifactBytes < 0
  ) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'artifactBytes invalid');
  }
  assertDigestHex64(String(obj.artifactSHA256), 'artifactSHA256');
  assertDigestHex64(String(obj.orderedIdentityFingerprint), 'orderedIdentityFingerprint');
  if (obj.orderedIdentityFingerprintAlgorithm !== ORDERED_SANITIZED_IDENTITY_FP_ALGORITHM) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'orderedIdentityFingerprintAlgorithm mismatch',
    );
  }
  if (typeof obj.generatorVersion !== 'string' || obj.generatorVersion.length === 0) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'generatorVersion required');
  }
  if (
    typeof obj.generatorSourceCommit !== 'string' ||
    (!/^[0-9a-f]{40}$/.test(obj.generatorSourceCommit) &&
      obj.generatorSourceCommit !== 'SYNTHETIC_TEST_COMMIT')
  ) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'generatorSourceCommit invalid');
  }
  if (obj.expectedCanonicalRepository !== 'bakalwar/EH_AROGYA_SUTRA_2') {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'expectedCanonicalRepository mismatch');
  }
  const evidence = obj.sourceLegacyEvidenceReference;
  if (evidence === null || typeof evidence !== 'object' || Array.isArray(evidence)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'sourceLegacyEvidenceReference invalid');
  }
  const ev = evidence as Record<string, unknown>;
  if (typeof ev.label !== 'string' || typeof ev.historicalMainFileSha256 !== 'string') {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'sourceLegacyEvidenceReference shape invalid',
    );
  }
  assertDigestHex64(ev.historicalMainFileSha256, 'historicalMainFileSha256');
  if (obj.lifecycleStatus !== SANITIZED_LIFECYCLE_DERIVED_PENDING_ADOPTION) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Derived sanitized manifest lifecycle must be DERIVED_PENDING_ADOPTION',
    );
  }
  if (obj.supersedes !== null && typeof obj.supersedes !== 'string') {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'supersedes invalid');
  }
  if (obj.supersededBy !== null && typeof obj.supersededBy !== 'string') {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'supersededBy invalid');
  }
  if (obj.licensingClassification !== SANITIZED_LICENSING_CLASSIFICATION) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'licensingClassification mismatch');
  }
  if (obj.privacyClassification !== SANITIZED_PRIVACY_CLASSIFICATION) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'privacyClassification mismatch');
  }
  if (!Array.isArray(obj.exclusions)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'exclusions must be an array');
  }
  for (const item of SANITIZED_EXCLUSIONS) {
    if (!obj.exclusions.includes(item)) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', `Missing exclusion ${item}`);
    }
  }
  if ('manifestSHA256' in obj || 'selfHash' in obj) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Manifest must not contain its own hash');
  }

  return obj as unknown as SanitizedArtifactManifest;
}

export function buildSanitizedArtifactManifest(input: {
  readonly recordCount: number;
  readonly artifactBytes: number;
  readonly artifactSHA256: string;
  readonly orderedIdentityFingerprint: string;
  readonly generatorVersion: string;
  readonly generatorSourceCommit: string;
  readonly sourceLegacyEvidenceReference: SanitizedArtifactManifest['sourceLegacyEvidenceReference'];
  readonly supersedes: string | null;
  readonly supersededBy: string | null;
}): SanitizedArtifactManifest {
  const manifest = {
    ...FIXED_MANIFEST_FIELDS,
    recordCount: input.recordCount,
    artifactBytes: input.artifactBytes,
    artifactSHA256: input.artifactSHA256,
    orderedIdentityFingerprint: input.orderedIdentityFingerprint,
    generatorVersion: input.generatorVersion,
    generatorSourceCommit: input.generatorSourceCommit,
    sourceLegacyEvidenceReference: input.sourceLegacyEvidenceReference,
    supersedes: input.supersedes,
    supersededBy: input.supersededBy,
    exclusions: [...SANITIZED_EXCLUSIONS],
    lifecycleStatus: SANITIZED_LIFECYCLE_DERIVED_PENDING_ADOPTION,
  };
  return validateSanitizedArtifactManifest(manifest);
}

const FIXED_MANIFEST_FIELDS = {
  manifestSchemaVersion: SANITIZED_MANIFEST_SCHEMA_VERSION,
  artifactSchemaVersion: SANITIZED_RECORD_SCHEMA_VERSION,
  datasetVersion: SANITIZED_DATASET_VERSION,
  artifactKind: SANITIZED_ARTIFACT_KIND,
  authorityClassification: AUTHORITY_CLASSIFICATION,
  clinicalAuthority: SANITIZED_CLINICAL_AUTHORITY,
  sourceClass: SANITIZED_SOURCE_CLASS,
  derivationQueryIdentifier: DISEASE_IDENTITY_SQL_QUERY_ID,
  derivationQuerySHA256: PINNED_DISEASE_IDENTITY_SQL_SHA256,
  orderedIdentityFingerprintAlgorithm: ORDERED_SANITIZED_IDENTITY_FP_ALGORITHM,
  expectedCanonicalRepository: 'bakalwar/EH_AROGYA_SUTRA_2' as const,
  licensingClassification: SANITIZED_LICENSING_CLASSIFICATION,
  privacyClassification: SANITIZED_PRIVACY_CLASSIFICATION,
  lifecycleStatus: SANITIZED_LIFECYCLE_DERIVED_PENDING_ADOPTION,
} as const;
