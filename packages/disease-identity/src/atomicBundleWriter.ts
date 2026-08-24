import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DiseaseIdentityError } from './errors.js';
import { BUNDLE_ARTIFACT_NAMES } from './fullCorpusConstants.js';
import { validateBundleManifest } from './manifest.js';

export type AtomicBundleWriteInput = {
  readonly destinationDir: string;
  readonly serialized: Record<string, string>;
  readonly manifest: Record<string, unknown>;
};

export type AtomicBundleWriteResult = {
  readonly destinationDir: string;
  readonly stagingDir: string | null;
};

export async function writeAtomicBundle(
  input: AtomicBundleWriteInput,
): Promise<AtomicBundleWriteResult> {
  const resolvedDestination = path.resolve(input.destinationDir);
  if (existsSync(resolvedDestination)) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Destination bundle directory already exists; refusing overwrite',
    );
  }

  const parentDir = path.dirname(resolvedDestination);
  await mkdir(parentDir, { recursive: true });
  const stagingDir = await mkdtemp(`${resolvedDestination}.staging-`);

  try {
    for (const name of BUNDLE_ARTIFACT_NAMES) {
      const content = input.serialized[name];
      if (content === undefined) {
        throw new DiseaseIdentityError('MALFORMED_INPUT', `Missing bundle member ${name}`);
      }
      await writeFile(path.join(stagingDir, name), content, 'utf8');
    }

    validateBundleManifest(input.manifest);

    await rename(stagingDir, resolvedDestination);
    return { destinationDir: resolvedDestination, stagingDir: null };
  } catch (error) {
    await rm(stagingDir, { recursive: true, force: true });
    throw error;
  }
}
