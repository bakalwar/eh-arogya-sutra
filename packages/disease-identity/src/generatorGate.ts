import { execFileSync } from 'node:child_process';
import { DiseaseIdentityError } from './errors.js';

export type GeneratorGateResult = {
  readonly generatorSourceCommit: string;
  readonly expectedGeneratorCommit: string;
  readonly remoteUrl: string;
};

function git(repoRoot: string, args: readonly string[]): string {
  try {
    return execFileSync('git', [...args], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Generator repository gate failed while running git ${args.join(' ')}`,
    );
  }
}

export function assertProductionGeneratorReady(input: {
  readonly repoRoot: string;
  readonly expectedGeneratorCommit: string;
  readonly remoteUrlPattern?: RegExp;
  readonly remoteName?: string;
}): GeneratorGateResult {
  if (!/^[0-9a-f]{40}$/i.test(input.expectedGeneratorCommit)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      '--expected-generator-commit must be a 40-hex commit',
    );
  }
  const generatorSourceCommit = git(input.repoRoot, ['rev-parse', 'HEAD']);
  if (!/^[0-9a-f]{40}$/i.test(generatorSourceCommit)) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Generator HEAD is not a 40-hex commit');
  }
  if (generatorSourceCommit.toLowerCase() !== input.expectedGeneratorCommit.toLowerCase()) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Generator HEAD does not match --expected-generator-commit',
    );
  }
  if (git(input.repoRoot, ['status', '--porcelain']).length !== 0) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Generator repository must be clean before production build',
    );
  }
  const remoteName = input.remoteName ?? 'ehas2';
  const remoteUrl = git(input.repoRoot, ['remote', 'get-url', remoteName]);
  const remotePattern =
    input.remoteUrlPattern ?? /(?:github\.com[/:])bakalwar\/EH_AROGYA_SUTRA_2(?:\.git)?$/i;
  if (!remotePattern.test(remoteUrl)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Generator remote ${remoteName} does not match bakalwar/EH_AROGYA_SUTRA_2`,
    );
  }
  git(input.repoRoot, ['cat-file', '-e', `${input.expectedGeneratorCommit}^{commit}`]);
  const canonicalMainTip = git(input.repoRoot, ['rev-parse', `${remoteName}/main`]);
  if (!/^[0-9a-f]{40}$/i.test(canonicalMainTip)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Canonical ${remoteName}/main tip is not a 40-hex commit`,
    );
  }
  if (canonicalMainTip.toLowerCase() !== input.expectedGeneratorCommit.toLowerCase()) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Expected generator commit must equal verified ${remoteName}/main tip`,
    );
  }
  // Exact tip equality implies reachability; still prove ancestry explicitly.
  try {
    execFileSync(
      'git',
      ['merge-base', '--is-ancestor', input.expectedGeneratorCommit, `${remoteName}/main`],
      {
        cwd: input.repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
  } catch {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Expected generator commit is not reachable from ${remoteName}/main`,
    );
  }
  return {
    generatorSourceCommit: generatorSourceCommit.toLowerCase(),
    expectedGeneratorCommit: input.expectedGeneratorCommit.toLowerCase(),
    remoteUrl,
  };
}
