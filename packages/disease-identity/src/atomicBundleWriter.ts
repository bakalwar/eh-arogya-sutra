import { createReadStream, existsSync, statSync, lstatSync } from 'node:fs';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
  realpath,
} from 'node:fs/promises';
import readline from 'node:readline';
import path from 'node:path';
import { DiseaseIdentityError } from './errors.js';
import { sha256HexLower } from './canonicalJson.js';
import { sha256FileHex } from './fileHash.js';
import { BUNDLE_ARTIFACT_NAMES, MAX_STAGING_MEMBER_BYTES } from './fullCorpusConstants.js';
import { validateBundleManifest } from './manifest.js';
import { verifyFullBundle } from './verifyFullBundle.js';

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
};

export type AtomicBundleWriteResult = {
  readonly destinationDir: string;
  readonly stagingDir: string | null;
};

function assertSameFilesystem(stagingPath: string, destinationPath: string): void {
  const stagingParent = path.dirname(stagingPath);
  const destParent = path.dirname(destinationPath);
  // Ensure parents exist for stat.
  const stagingStat = statSync(existsSync(stagingParent) ? stagingParent : stagingPath);
  const destStat = statSync(existsSync(destParent) ? destParent : path.dirname(destParent));
  // On Windows, device id comparison via root drive letter / same volume.
  const stagingRoot = path.parse(path.resolve(stagingPath)).root.toLowerCase();
  const destRoot = path.parse(path.resolve(destinationPath)).root.toLowerCase();
  if (stagingRoot !== destRoot) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Staging and destination must be on the same filesystem/volume',
    );
  }
  // Prefer inode device ids when available (POSIX); on Windows both often 0 — root check above covers it.
  if (
    typeof stagingStat.dev === 'number' &&
    typeof destStat.dev === 'number' &&
    stagingStat.dev !== 0 &&
    destStat.dev !== 0 &&
    stagingStat.dev !== destStat.dev
  ) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Staging and destination must share the same filesystem device',
    );
  }
}

async function assertNoSymlinkMembers(stagingDir: string): Promise<void> {
  for (const name of BUNDLE_ARTIFACT_NAMES) {
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
  await assertNoSymlinkMembers(stagingDir);

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

  await verifyFullBundle(stagingDir);
}

/**
 * Write all members to a staging directory (or accept a pre-filled staging dir),
 * verify completely, then atomically rename. Failure leaves no authoritative destination.
 * Never overwrites an existing destination. Rejects symlinks; requires same filesystem.
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

  let stagingDir: string;
  let ownsStagingCleanup = true;

  if (input.stagingDir) {
    stagingDir = path.resolve(input.stagingDir);
    ownsStagingCleanup = true;
    // If serialized also provided for missing small members, fill them in.
    if (input.serialized) {
      for (const name of BUNDLE_ARTIFACT_NAMES) {
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
    for (const name of BUNDLE_ARTIFACT_NAMES) {
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

  try {
    assertSameFilesystem(stagingDir, resolvedDestination);
    await verifyStagedBundle(stagingDir, input.manifest);
    await rename(stagingDir, resolvedDestination);
    return { destinationDir: resolvedDestination, stagingDir: null };
  } catch (error) {
    if (ownsStagingCleanup) {
      await rm(stagingDir, { recursive: true, force: true });
    }
    if (existsSync(resolvedDestination)) {
      await rm(resolvedDestination, { recursive: true, force: true });
    }
    throw error;
  }
}
