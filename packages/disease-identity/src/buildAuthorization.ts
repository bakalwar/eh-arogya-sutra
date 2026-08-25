import { DiseaseIdentityError } from './errors.js';
import {
  FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN,
  PINNED_BRIDGE_V3_SHA256,
  PINNED_LEGACY_DB_SHA256,
  PINNED_MAPPED_JSON_SHA256,
} from './fullCorpusConstants.js';

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
