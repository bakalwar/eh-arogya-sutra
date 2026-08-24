import path from 'node:path';
import { DiseaseIdentityError } from './errors.js';

function normalizeForCompare(p: string): string {
  return path.resolve(p).replace(/\\/g, '/').toLowerCase();
}

/** Reject output paths inside or equal to the repository root. */
export function assertExternalOutputPath(repoRoot: string, outputPath: string): string {
  const resolvedRoot = path.resolve(repoRoot);
  const resolvedOutput = path.resolve(outputPath);

  if (resolvedOutput.includes('..')) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Output path must not contain traversal segments',
    );
  }

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

export function rejectTempAsFinalBundlePath(outputPath: string): void {
  const base = path.basename(path.resolve(outputPath)).toLowerCase();
  if (base === 'temp' || outputPath.toLowerCase().includes(`${path.sep}temp${path.sep}`)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'TEMP must not be used as the final immutable bundle location',
    );
  }
}
