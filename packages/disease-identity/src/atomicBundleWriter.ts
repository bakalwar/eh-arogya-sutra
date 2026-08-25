import { constants as fsConstants, createReadStream, existsSync, lstatSync } from 'node:fs';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
  realpath,
} from 'node:fs/promises';
import readline from 'node:readline';
import path from 'node:path';
import { DiseaseIdentityError } from './errors.js';
import { canonicalJsonString, sha256HexLower } from './canonicalJson.js';
import { sha256FileHex } from './fileHash.js';
import {
  BUNDLE_ACTIVATION_MARKER_NAME,
  BUNDLE_ARTIFACT_NAMES,
  BUNDLE_KIND_PRODUCTION,
  BUNDLE_KIND_SYNTHETIC,
  MAX_STAGING_MEMBER_BYTES,
} from './fullCorpusConstants.js';
import { validateBundleManifest } from './manifest.js';
import { verifyFullBundle } from './verifyFullBundle.js';
import { BUNDLE_SCHEMA_VERSION } from './constants.js';

const PRE_ACTIVATION_ARTIFACT_NAMES = BUNDLE_ARTIFACT_NAMES.filter(
  (name) => name !== BUNDLE_ACTIVATION_MARKER_NAME,
);

/** Count non-empty JSONL lines without retaining member body content. */
async function countJsonlRowsStreaming(filePath: string): Promise<number> {
  const rl = readline.createInterface({
    input: createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  let count = 0;
  for await (const line of rl) {
    if (line.length > 0) {
      count += 1;
    }
  }
  return count;
}

export type AtomicBundleWriteInput = {
  readonly destinationDir: string;
  readonly manifest: Record<string, unknown>;
  /** Serialized member map — used when stagingDir is not pre-filled. */
  readonly serialized?: Record<string, string>;
  /** Pre-filled staging directory (production streaming path). Mutually exclusive with full serialized. */
  readonly stagingDir?: string;
  /** Test-only race seam. Production callers must not provide this. */
  readonly testOnlyBeforeOwnershipAcquisition?: () => void | Promise<void>;
  /** Test-only: runs after exclusive destination mkdir, before member copy. */
  readonly testOnlyAfterDestinationOwnership?: () => void | Promise<void>;
  /** Test-only: runs after member copy/re-verify, before activation marker. */
  readonly testOnlyBeforeActivationMarker?: () => void | Promise<void>;
};

export type AtomicBundleWriteResult = {
  readonly destinationDir: string;
  readonly stagingDir: string | null;
};

async function assertNoSymlinkMembers(
  stagingDir: string,
  names: readonly string[] = BUNDLE_ARTIFACT_NAMES,
): Promise<void> {
  for (const name of names) {
    const memberPath = path.join(stagingDir, name);
    const lst = lstatSync(memberPath);
    if (lst.isSymbolicLink()) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Staged member ${name} must not be a symlink`,
      );
    }
    // realpath must resolve inside staging dir
    const resolved = await realpath(memberPath);
    const stagingReal = await realpath(stagingDir);
    if (!resolved.startsWith(stagingReal + path.sep) && resolved !== stagingReal) {
      // On Windows path.sep may differ; normalize
      const normResolved = resolved.toLowerCase();
      const normStaging = stagingReal.toLowerCase();
      if (
        !normResolved.startsWith(normStaging + path.sep.toLowerCase()) &&
        normResolved !== normStaging
      ) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          `Staged member ${name} realpath escapes staging directory`,
        );
      }
    }
    if (lst.size > MAX_STAGING_MEMBER_BYTES) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Staged member ${name} exceeds MAX_STAGING_MEMBER_BYTES (${MAX_STAGING_MEMBER_BYTES})`,
      );
    }
  }
}

async function verifyStagedBundle(
  stagingDir: string,
  expectedManifest: Record<string, unknown>,
): Promise<void> {
  const entries = await readdir(stagingDir);
  const expected = new Set<string>(PRE_ACTIVATION_ARTIFACT_NAMES);
  for (const entry of entries) {
    if (!expected.has(entry as (typeof BUNDLE_ARTIFACT_NAMES)[number])) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', `Unexpected staged file ${entry}`);
    }
  }
  for (const name of PRE_ACTIVATION_ARTIFACT_NAMES) {
    if (!entries.includes(name)) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', `Missing staged member ${name}`);
    }
  }

  const manifestRaw = await readFile(path.join(stagingDir, 'bundle-manifest.json'), 'utf8');
  const manifest = JSON.parse(manifestRaw) as Record<string, unknown>;
  validateBundleManifest(manifest);

  const artifacts = manifest.artifacts as Array<{
    name: string;
    sha256: string;
    bytes: number;
    rowCount: number;
  }>;
  const recomputedParts: string[] = [];
  for (const artifact of artifacts) {
    const filePath = path.join(stagingDir, artifact.name);
    const sha = await sha256FileHex(filePath);
    const st = lstatSync(filePath);
    if (st.size !== artifact.bytes || sha !== artifact.sha256) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Staged hash/bytes mismatch for ${artifact.name}`,
      );
    }
    if (artifact.name.endsWith('.jsonl')) {
      const nonEmpty = await countJsonlRowsStreaming(filePath);
      if (nonEmpty !== artifact.rowCount) {
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

  if (manifest.aggregateFingerprint !== expectedManifest.aggregateFingerprint) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Staged aggregate fingerprint diverges from build manifest',
    );
  }

  const expectedBundleKind = expectedManifest.bundleKind;
  if (
    expectedBundleKind !== BUNDLE_KIND_PRODUCTION &&
    expectedBundleKind !== BUNDLE_KIND_SYNTHETIC
  ) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Unknown expected bundleKind');
  }
  await verifyFullBundle(stagingDir, {
    expectedBundleKind,
    requireActivationMarker: false,
  });
}

/**
 * Write all members to a staging directory (or accept a pre-filled staging dir),
 * Verify staging completely, exclusively acquire an empty destination, copy and re-verify
 * members, then create the activation marker last. This is fail-closed activation publication,
 * not an atomic directory rename. An existing destination is never replaced or removed.
 */
export async function writeAtomicBundle(
  input: AtomicBundleWriteInput,
): Promise<AtomicBundleWriteResult> {
  const resolvedDestination = path.resolve(input.destinationDir);
  const parentDir = path.dirname(resolvedDestination);
  await mkdir(parentDir, { recursive: true });

  let stagingDir: string;
  if (input.stagingDir) {
    stagingDir = path.resolve(input.stagingDir);
    // If serialized also provided for missing small members, fill them in.
    if (input.serialized) {
      for (const name of PRE_ACTIVATION_ARTIFACT_NAMES) {
        const memberPath = path.join(stagingDir, name);
        if (!existsSync(memberPath) && input.serialized[name] !== undefined) {
          await writeFile(memberPath, input.serialized[name]!, 'utf8');
        }
      }
    }
  } else {
    if (!input.serialized) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'writeAtomicBundle requires serialized members or a pre-filled stagingDir',
      );
    }
    stagingDir = await mkdtemp(`${resolvedDestination}.staging-`);
    for (const name of PRE_ACTIVATION_ARTIFACT_NAMES) {
      const content = input.serialized[name];
      if (content === undefined) {
        throw new DiseaseIdentityError('MALFORMED_INPUT', `Missing bundle member ${name}`);
      }
      if (Buffer.byteLength(content, 'utf8') > MAX_STAGING_MEMBER_BYTES) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          `Bundle member ${name} exceeds MAX_STAGING_MEMBER_BYTES`,
        );
      }
      await writeFile(path.join(stagingDir, name), content, 'utf8');
    }
  }

  let ownedDestination = false;
  let activated = false;
  try {
    await assertNoSymlinkMembers(stagingDir, PRE_ACTIVATION_ARTIFACT_NAMES);
    await verifyStagedBundle(stagingDir, input.manifest);
    const bundleKind = input.manifest.bundleKind;
    if (bundleKind !== BUNDLE_KIND_PRODUCTION && bundleKind !== BUNDLE_KIND_SYNTHETIC) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Cannot activate unknown bundleKind');
    }
    await input.testOnlyBeforeOwnershipAcquisition?.();
    await mkdir(resolvedDestination, { recursive: false });
    ownedDestination = true;
    await input.testOnlyAfterDestinationOwnership?.();

    for (const name of PRE_ACTIVATION_ARTIFACT_NAMES) {
      await copyFile(
        path.join(stagingDir, name),
        path.join(resolvedDestination, name),
        fsConstants.COPYFILE_EXCL,
      );
    }
    await assertNoSymlinkMembers(resolvedDestination, PRE_ACTIVATION_ARTIFACT_NAMES);
    await verifyStagedBundle(resolvedDestination, input.manifest);
    await input.testOnlyBeforeActivationMarker?.();

    const marker = {
      aggregateFingerprint: input.manifest.aggregateFingerprint,
      bundleKind,
      schemaVersion: BUNDLE_SCHEMA_VERSION,
    };
    await writeFile(
      path.join(resolvedDestination, BUNDLE_ACTIVATION_MARKER_NAME),
      `${canonicalJsonString(marker)}\n`,
      { encoding: 'utf8', flag: 'wx' },
    );
    activated = true;
    await assertNoSymlinkMembers(resolvedDestination);
    await verifyFullBundle(resolvedDestination, { expectedBundleKind: bundleKind });
    await rm(stagingDir, { recursive: true, force: true });
    return { destinationDir: resolvedDestination, stagingDir: null };
  } catch (error) {
    if (ownedDestination && !activated && existsSync(resolvedDestination)) {
      const entries = await readdir(resolvedDestination).catch(() => []);
      const containsOnlyOwnedNames = entries.every((entry) =>
        BUNDLE_ARTIFACT_NAMES.includes(entry as (typeof BUNDLE_ARTIFACT_NAMES)[number]),
      );
      if (containsOnlyOwnedNames) {
        await rm(resolvedDestination, { recursive: true, force: true });
      }
    }
    await rm(stagingDir, { recursive: true, force: true });
    throw error;
  }
}
