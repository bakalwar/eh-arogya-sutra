import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { DiseaseIdentityError } from './errors.js';
import { canonicalJsonString, sha256HexLower } from './canonicalJson.js';
import {
  SANITIZED_ADOPTION_CONTROL_PLANE_RELDIR,
  SANITIZED_ADOPTION_FILENAME_PATTERN,
} from './sanitizedIdentityConstants.js';
import {
  validateSanitizedAdoptionManifest,
  type SanitizedAdoptionManifest,
} from './sanitizedAdoptionManifest.js';

/**
 * Resolve an adoption manifest from the canonical in-repo control plane.
 * Caller supplies adoption ID (filename stem), never an arbitrary filesystem path.
 */
export function resolveSanitizedAdoptionControlPlanePath(
  repoRoot: string,
  adoptionId: string,
): string {
  if (!/^[a-z0-9][a-z0-9_-]{0,62}$/.test(adoptionId)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Invalid adoption id');
  }
  const filename = `${adoptionId}.adoption.json`;
  if (!SANITIZED_ADOPTION_FILENAME_PATTERN.test(filename)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Adoption filename pattern rejected');
  }
  if (adoptionId.includes('..') || adoptionId.includes('/') || adoptionId.includes('\\')) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Path traversal rejected');
  }
  const root = path.resolve(repoRoot);
  const dir = path.resolve(root, SANITIZED_ADOPTION_CONTROL_PLANE_RELDIR);
  const full = path.resolve(dir, filename);
  const rel = path.relative(dir, full);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Adoption path escapes control plane');
  }
  if (!full.startsWith(dir + path.sep) && full !== dir) {
    const normFull = full.replace(/\\/g, '/').toLowerCase();
    const normDir = dir.replace(/\\/g, '/').toLowerCase();
    if (!normFull.startsWith(normDir + '/')) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Adoption path escapes control plane');
    }
  }
  return full;
}

export async function loadSanitizedAdoptionManifestFromControlPlane(input: {
  readonly repoRoot: string;
  readonly adoptionId: string;
}): Promise<{
  readonly manifest: SanitizedAdoptionManifest;
  readonly manifestSha256: string;
  readonly controlPlaneRelativePath: string;
}> {
  const full = resolveSanitizedAdoptionControlPlanePath(input.repoRoot, input.adoptionId);
  let text: string;
  try {
    text = await readFile(full, 'utf8');
  } catch {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Adoption manifest not present in canonical control plane',
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Adoption manifest is not valid JSON');
  }
  const manifest = validateSanitizedAdoptionManifest(parsed);
  const canonical = canonicalJsonString(parsed);
  return {
    manifest,
    manifestSha256: sha256HexLower(canonical),
    controlPlaneRelativePath: path
      .join(SANITIZED_ADOPTION_CONTROL_PLANE_RELDIR, `${input.adoptionId}.adoption.json`)
      .replace(/\\/g, '/'),
  };
}

/** Test helper: validate in-memory adoption without control-plane file. */
export function assertAdoptionMatchesArtifact(input: {
  readonly adoption: SanitizedAdoptionManifest;
  readonly artifactSHA256: string;
  readonly artifactBytes: number;
  readonly recordCount: number;
  readonly orderedIdentityFingerprint: string;
  readonly sanitizedManifestSHA256: string;
}): void {
  if (input.adoption.artifactSHA256 !== input.artifactSHA256) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Adoption artifactSHA256 mismatch');
  }
  if (input.adoption.artifactBytes !== input.artifactBytes) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Adoption artifactBytes mismatch');
  }
  if (input.adoption.recordCount !== input.recordCount) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Adoption recordCount mismatch');
  }
  if (input.adoption.orderedIdentityFingerprint !== input.orderedIdentityFingerprint) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Adoption fingerprint mismatch');
  }
  if (input.adoption.sanitizedManifestSHA256 !== input.sanitizedManifestSHA256) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Adoption sanitizedManifestSHA256 mismatch');
  }
}
