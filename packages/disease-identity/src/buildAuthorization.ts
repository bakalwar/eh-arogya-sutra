import { DiseaseIdentityError } from './errors.js';
import {
  FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN,
  PINNED_BRIDGE_V3_SHA256,
  PINNED_LEGACY_DB_SHA256,
  PINNED_MAPPED_JSON_SHA256,
} from './fullCorpusConstants.js';
import {
  DB_IDENTITY_INPUT_CLASS_FULL_LEGACY_DB,
  DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL,
  type DbIdentityInputClass,
} from './sanitizedIdentityConstants.js';

export type FullCorpusBuildAuthorization = {
  readonly authorizeFullCorpusFlag: boolean;
  readonly ownerToken: string;
  readonly legacyDbSha256: string;
  readonly mappedJsonSha256: string;
  readonly bridgeSha256: string;
  readonly legacyDbPath: string;
  readonly mappedJsonPath: string;
  readonly bridgePath: string;
  readonly outputPath: string;
};

export type SanitizedFullCorpusBuildAuthorization = {
  readonly authorizeFullCorpusFlag: boolean;
  readonly ownerToken: string;
  readonly dbIdentityInputClass: typeof DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL;
  readonly mappedJsonSha256: string;
  readonly bridgeSha256: string;
  readonly sanitizedArtifactPath: string;
  readonly sanitizedManifestPath: string;
  readonly adoptionId: string;
  readonly expectedArtifactSHA256: string;
  readonly expectedArtifactBytes: number;
  readonly expectedRecordCount: number;
  readonly expectedOrderedIdentityFingerprint: string;
  readonly expectedSanitizedManifestSHA256: string;
  readonly mappedJsonPath: string;
  readonly bridgePath: string;
  readonly outputPath: string;
  readonly expectedGeneratorCommit: string;
};

export function assertFullCorpusBuildAuthorized(input: FullCorpusBuildAuthorization): void {
  if (!input.authorizeFullCorpusFlag) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Full corpus build requires --authorize-full-corpus',
    );
  }
  if (input.ownerToken !== FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Owner authorization token mismatch');
  }
  if (input.legacyDbSha256 !== PINNED_LEGACY_DB_SHA256) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Legacy DB SHA-256 mismatch');
  }
  if (input.mappedJsonSha256 !== PINNED_MAPPED_JSON_SHA256) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'mapped.json SHA-256 mismatch');
  }
  if (input.bridgeSha256 !== PINNED_BRIDGE_V3_SHA256) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge SHA-256 mismatch');
  }
  if (!input.legacyDbPath || !input.mappedJsonPath || !input.bridgePath || !input.outputPath) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Explicit input and output paths are required',
    );
  }
}

export function parseDbIdentityInputClass(raw: string | undefined): DbIdentityInputClass {
  if (!raw || raw === DB_IDENTITY_INPUT_CLASS_FULL_LEGACY_DB) {
    return DB_IDENTITY_INPUT_CLASS_FULL_LEGACY_DB;
  }
  if (raw === DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL) {
    return DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL;
  }
  throw new DiseaseIdentityError('MALFORMED_INPUT', 'Unknown db-identity-input-class');
}

/**
 * XOR gate: full legacy DB mode and sanitized JSONL mode are mutually exclusive.
 */
export function assertDbIdentityInputClassXor(input: {
  readonly dbIdentityInputClass: DbIdentityInputClass;
  readonly legacyDbPath?: string;
  readonly sanitizedArtifactPath?: string;
}): void {
  if (input.dbIdentityInputClass === DB_IDENTITY_INPUT_CLASS_FULL_LEGACY_DB) {
    if (input.sanitizedArtifactPath) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Full legacy DB mode must not supply sanitized artifact path',
      );
    }
    if (!input.legacyDbPath) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Full legacy DB mode requires --legacy-db');
    }
    return;
  }
  if (input.legacyDbPath) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Sanitized mode must not supply --legacy-db (no fallback to live/full DB)',
    );
  }
  if (!input.sanitizedArtifactPath) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Sanitized mode requires artifact path');
  }
}

export function assertSanitizedFullCorpusBuildAuthorized(
  input: SanitizedFullCorpusBuildAuthorization,
): void {
  if (!input.authorizeFullCorpusFlag) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Full corpus build requires --authorize-full-corpus',
    );
  }
  if (input.ownerToken !== FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Owner authorization token mismatch');
  }
  if (input.dbIdentityInputClass !== DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Sanitized authorization requires sanitized class',
    );
  }
  if (input.mappedJsonSha256 !== PINNED_MAPPED_JSON_SHA256) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'mapped.json SHA-256 mismatch');
  }
  if (input.bridgeSha256 !== PINNED_BRIDGE_V3_SHA256) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Bridge SHA-256 mismatch');
  }
  if (
    !input.sanitizedArtifactPath ||
    !input.sanitizedManifestPath ||
    !input.adoptionId ||
    !input.mappedJsonPath ||
    !input.bridgePath ||
    !input.outputPath ||
    !input.expectedGeneratorCommit ||
    !input.expectedArtifactSHA256 ||
    !input.expectedOrderedIdentityFingerprint ||
    !input.expectedSanitizedManifestSHA256
  ) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Sanitized build requires explicit pins and paths',
    );
  }
  if (input.expectedRecordCount !== 116_284) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Sanitized production record count must be 116284',
    );
  }
  if (!Number.isSafeInteger(input.expectedArtifactBytes) || input.expectedArtifactBytes <= 0) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'expectedArtifactBytes invalid');
  }
}
