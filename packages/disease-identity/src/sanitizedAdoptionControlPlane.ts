import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
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

function git(repoRoot: string, args: readonly string[]): string {
  try {
    return execFileSync('git', [...args], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trimEnd();
  } catch {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Adoption git verification failed during git ${args.join(' ')}`,
    );
  }
}

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

export function resolveSanitizedAdoptionControlPlaneRelativePath(adoptionId: string): string {
  return path
    .join(SANITIZED_ADOPTION_CONTROL_PLANE_RELDIR, `${adoptionId}.adoption.json`)
    .replace(/\\/g, '/');
}

function readAdoptionBlobFromCommit(
  repoRoot: string,
  expectedGeneratorCommit: string,
  controlPlaneRelativePath: string,
): string {
  if (!/^[0-9a-f]{40}$/i.test(expectedGeneratorCommit)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'expectedGeneratorCommit must be 40-hex');
  }
  const objectRef = `${expectedGeneratorCommit}:${controlPlaneRelativePath}`;
  try {
    execFileSync('git', ['cat-file', '-e', objectRef], {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Adoption manifest not present at authorized generator commit',
    );
  }
  return git(repoRoot, ['show', objectRef]);
}

async function assertWorktreeMatchesCommittedAdoption(
  worktreePath: string,
  committedText: string,
): Promise<void> {
  if (!existsSync(worktreePath)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Adoption manifest missing from canonical control plane worktree',
    );
  }
  const worktreeText = await readFile(worktreePath, 'utf8');
  let worktreeParsed: unknown;
  let committedParsed: unknown;
  try {
    worktreeParsed = JSON.parse(worktreeText.trimEnd());
    committedParsed = JSON.parse(committedText.trimEnd());
  } catch {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Adoption manifest is not valid JSON');
  }
  if (canonicalJsonString(worktreeParsed) !== canonicalJsonString(committedParsed)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Adoption manifest worktree content differs from authorized commit',
    );
  }
}

export async function loadSanitizedAdoptionManifestFromControlPlane(input: {
  readonly repoRoot: string;
  readonly adoptionId: string;
  readonly expectedGeneratorCommit: string;
}): Promise<{
  readonly manifest: SanitizedAdoptionManifest;
  readonly manifestSha256: string;
  readonly controlPlaneRelativePath: string;
}> {
  const full = resolveSanitizedAdoptionControlPlanePath(input.repoRoot, input.adoptionId);
  const controlPlaneRelativePath = resolveSanitizedAdoptionControlPlaneRelativePath(
    input.adoptionId,
  );
  const committedText = readAdoptionBlobFromCommit(
    input.repoRoot,
    input.expectedGeneratorCommit,
    controlPlaneRelativePath,
  );
  await assertWorktreeMatchesCommittedAdoption(full, committedText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(committedText);
  } catch {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Adoption manifest is not valid JSON');
  }
  const manifest = validateSanitizedAdoptionManifest(parsed, 'production');
  return {
    manifest,
    manifestSha256: sha256HexLower(canonicalJsonString(parsed)),
    controlPlaneRelativePath,
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
