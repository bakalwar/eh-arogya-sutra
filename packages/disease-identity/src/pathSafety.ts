import { lstat, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { DiseaseIdentityError } from './errors.js';

function normalizeForCompare(p: string): string {
  return path.resolve(p).replace(/\\/g, '/').toLowerCase();
}

async function resolveExistingRealPath(target: string): Promise<string> {
  try {
    return await realpath(target);
  } catch {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Path could not be resolved');
  }
}

/**
 * Resolve the nearest existing ancestor for an output path and return its real path.
 */
export async function resolveNearestExistingParent(outputPath: string): Promise<string> {
  let current = path.resolve(outputPath);
  for (;;) {
    try {
      const st = await stat(current);
      if (st.isDirectory()) {
        return await realpath(current);
      }
    } catch {
      // walk up
    }
    const parent = path.dirname(current);
    if (parent === current) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'No existing parent directory for output');
    }
    current = parent;
  }
}

function assertOutsideRepo(repoRootReal: string, candidateReal: string, label: string): void {
  const rootNorm = normalizeForCompare(repoRootReal);
  const outNorm = normalizeForCompare(candidateReal);
  if (outNorm === rootNorm || outNorm.startsWith(`${rootNorm}/`)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `${label} must be outside the repository worktree`,
    );
  }
}

/** Lexical-only helper retained for simple unit tests; prefer assertExternalOutputPathAsync. */
export function assertExternalOutputPath(repoRoot: string, outputPath: string): string {
  const resolvedRoot = path.resolve(repoRoot);
  const resolvedOutput = path.resolve(outputPath);
  const rootNorm = normalizeForCompare(resolvedRoot);
  const outNorm = normalizeForCompare(resolvedOutput);
  if (outNorm === rootNorm || outNorm.startsWith(`${rootNorm}/`)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Output path must be outside the repository worktree',
    );
  }
  return resolvedOutput;
}

export function assertExternalInputPath(repoRoot: string, inputPath: string): string {
  return assertExternalOutputPath(repoRoot, inputPath);
}

export async function assertExternalOutputPathAsync(
  repoRoot: string,
  outputPath: string,
): Promise<string> {
  const repoReal = await resolveExistingRealPath(repoRoot);
  const resolvedOutput = path.resolve(outputPath);
  const parentReal = await resolveNearestExistingParent(resolvedOutput);
  assertOutsideRepo(repoReal, parentReal, 'Output parent');

  // If destination already exists, its real path must also stay outside the repo.
  try {
    const existing = await realpath(resolvedOutput);
    assertOutsideRepo(repoReal, existing, 'Output path');
    return existing;
  } catch {
    // destination does not exist yet — parent check is sufficient
  }

  // Reject symlink/reparse escape: if any path component under parent is a symlink into repo
  const parentLstat = await lstat(parentReal);
  if (parentLstat.isSymbolicLink()) {
    const target = await realpath(parentReal);
    assertOutsideRepo(repoReal, target, 'Output parent symlink target');
  }

  return resolvedOutput;
}

export async function assertExternalRegularFileInput(
  repoRoot: string,
  inputPath: string,
): Promise<string> {
  const repoReal = await resolveExistingRealPath(repoRoot);
  let lst;
  try {
    lst = await lstat(inputPath);
  } catch {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Input path is missing');
  }
  if (lst.isSymbolicLink()) {
    const target = await realpath(inputPath);
    assertOutsideRepo(repoReal, target, 'Input symlink target');
  } else {
    const real = await realpath(inputPath);
    assertOutsideRepo(repoReal, real, 'Input path');
  }
  const st = await stat(inputPath);
  if (!st.isFile()) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Input path must be a regular file');
  }
  return await realpath(inputPath);
}

export function rejectTempAsFinalBundlePath(outputPath: string): void {
  const resolved = path.resolve(outputPath);
  const base = path.basename(resolved).toLowerCase();
  const normalized = resolved.replace(/\\/g, '/').toLowerCase();
  if (
    base === 'temp' ||
    normalized.includes('/temp/') ||
    normalized.includes('/tmp/') ||
    /\/temp$/i.test(normalized) ||
    /\/tmp$/i.test(normalized)
  ) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'TEMP must not be used as the final immutable bundle location',
    );
  }
}
