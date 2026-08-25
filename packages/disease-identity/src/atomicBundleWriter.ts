import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DiseaseIdentityError } from './errors.js';
import { sha256HexLower } from './canonicalJson.js';
import { BUNDLE_ARTIFACT_NAMES } from './fullCorpusConstants.js';
import { validateBundleManifest } from './manifest.js';
import { verifyFullBundle } from './verifyFullBundle.js';

export type AtomicBundleWriteInput = {
  readonly destinationDir: string;
  readonly serialized: Record<string, string>;
  readonly manifest: Record<string, unknown>;
};

export type AtomicBundleWriteResult = {
  readonly destinationDir: string;
  readonly stagingDir: string | null;
};

async function verifyStagedBundle(
  stagingDir: string,
  expectedManifest: Record<string, unknown>,
): Promise<void> {
  const entries = await readdir(stagingDir);
  const expected = new Set<string>(BUNDLE_ARTIFACT_NAMES);
  for (const entry of entries) {
    if (!expected.has(entry as (typeof BUNDLE_ARTIFACT_NAMES)[number])) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', `Unexpected staged file ${entry}`);
    }
  }
  for (const name of BUNDLE_ARTIFACT_NAMES) {
    if (!entries.includes(name)) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', `Missing staged member ${name}`);
    }
  }

  const manifestRaw = await readFile(path.join(stagingDir, 'bundle-manifest.json'), 'utf8');
  const manifest = JSON.parse(manifestRaw) as Record<string, unknown>;
  validateBundleManifest(manifest);

  // Recompute hashes/bytes/row counts and aggregate fingerprint against staged bytes.
  const artifacts = manifest.artifacts as Array<{
    name: string;
    sha256: string;
    bytes: number;
    rowCount: number;
  }>;
  const recomputedParts: string[] = [];
  for (const artifact of artifacts) {
    const content = await readFile(path.join(stagingDir, artifact.name), 'utf8');
    const bytes = Buffer.byteLength(content, 'utf8');
    const sha = sha256HexLower(content);
    if (bytes !== artifact.bytes || sha !== artifact.sha256) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Staged hash/bytes mismatch for ${artifact.name}`,
      );
    }
    if (artifact.name.endsWith('.jsonl')) {
      const lines = content.endsWith('\n') ? content.slice(0, -1).split('\n') : content.split('\n');
      const nonEmpty = lines.filter((line) => line.length > 0);
      if (nonEmpty.length !== artifact.rowCount) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          `Staged row count mismatch for ${artifact.name}`,
        );
      }
    }
    recomputedParts.push(`${artifact.name}:${sha}`);
  }

  const aggregate = sha256HexLower(recomputedParts.join('|'));
  if (aggregate !== manifest.aggregateFingerprint) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Staged aggregate fingerprint mismatch');
  }

  // In-memory vs staged: aggregate fingerprint already recomputed from staged member bytes.
  if (manifest.aggregateFingerprint !== expectedManifest.aggregateFingerprint) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Staged aggregate fingerprint diverges from build manifest',
    );
  }

  // Full semantic verification against staging directory before promotion.
  await verifyFullBundle(stagingDir);
}

/**
 * Write all members to a staging directory, verify completely, then atomically rename.
 * Failure leaves no authoritative destination. Never overwrites an existing destination.
 */
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

    // Close/write complete — verify staged members before promotion.
    await verifyStagedBundle(stagingDir, input.manifest);

    await rename(stagingDir, resolvedDestination);
    return { destinationDir: resolvedDestination, stagingDir: null };
  } catch (error) {
    await rm(stagingDir, { recursive: true, force: true });
    // Ensure destination was never created.
    if (existsSync(resolvedDestination)) {
      await rm(resolvedDestination, { recursive: true, force: true });
    }
    throw error;
  }
}
