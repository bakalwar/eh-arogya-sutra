import { lstatSync, statSync } from 'node:fs';
import { DiseaseIdentityError } from './errors.js';
import { captureFileIdentity, type FileIdentitySnapshot } from './fileHash.js';

export type SourceMainIdentityEvidence = FileIdentitySnapshot & {
  readonly deviceIdentity: string | null;
};

export async function captureSourceMainIdentityEvidence(
  filePath: string,
): Promise<SourceMainIdentityEvidence> {
  const lst = lstatSync(filePath);
  if (lst.isSymbolicLink()) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Source DB must not be a symlink');
  }
  const st = statSync(filePath);
  if (!st.isFile()) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Source DB must be a regular file');
  }
  const identity = await captureFileIdentity(filePath);
  const deviceIdentity =
    typeof st.ino === 'number' && typeof st.dev === 'number' ? `${st.dev}:${st.ino}` : null;
  return { ...identity, deviceIdentity };
}

export function assertSourceMainIdentityUnchanged(
  before: SourceMainIdentityEvidence,
  after: SourceMainIdentityEvidence,
): void {
  if (before.sha256 !== after.sha256) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Source main DB content identity changed during derivation',
    );
  }
  if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Source main DB file metadata changed during derivation',
    );
  }
  if (
    before.deviceIdentity !== null &&
    after.deviceIdentity !== null &&
    before.deviceIdentity !== after.deviceIdentity
  ) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Source main DB file identity replaced during derivation',
    );
  }
}
