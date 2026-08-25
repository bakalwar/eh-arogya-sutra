import { createReadStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import readline from 'node:readline';
import path from 'node:path';
import { tmpdir } from 'node:os';
import {
  assertFileIdentityUnchanged,
  assertFullCorpusBuildAuthorized,
  buildFullCorpusArtifactsProduction,
  compareFullBuilds,
  preflightFullCorpus,
  validateBridgeBatchProduction,
  verifyFullBundle,
  writeAtomicBundle,
  DiseaseIdentityError,
  FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN,
  PINNED_BRIDGE_V3_SHA256,
  PINNED_INVENTORY_SHA256,
  PINNED_LEGACY_DB_SHA256,
  PINNED_MAPPED_JSON_SHA256,
  EXPECTED_INVENTORY_ROW_COUNT,
  EXPECTED_MAPPED_JSON_ROW_COUNT,
  assertConsumedByteDigest,
  hashingReadStream,
  SOURCE_COMMIT_UNSET,
} from '../../../packages/disease-identity/dist/index.js';
import { streamBridgeToIndex } from './streamBridgeJsonl.mjs';
import { streamDedupeMappedJsonFile } from './streamMappedJson.mjs';
import { streamLegacyDiseaseRowsToJsonl } from './readLegacyDb.mjs';

function resolveGeneratorSourceCommit(repoRoot) {
  try {
    const sha = execSync('git rev-parse HEAD', {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim();
    if (!/^[0-9a-f]{40}$/i.test(sha)) {
      throw new Error('unexpected git sha');
    }
    return sha;
  } catch {
    return SOURCE_COMMIT_UNSET;
  }
}

export async function cmdPreflightFullCorpus(args, repoRoot) {
  const result = await preflightFullCorpus({
    repoRoot,
    legacyDbPath: args['legacy-db'],
    mappedJsonPath: args['mapped-json'],
    bridgePath: args.bridge,
    outputPath: args.output,
    inventoryPath: args.inventory ?? null,
    minimumFreeBytes: args['min-free-bytes'] ? Number(args['min-free-bytes']) : undefined,
  });
  console.log(
    JSON.stringify(
      {
        ok: true,
        legacyDbSha256: result.legacyDbSha256,
        mappedJsonSha256: result.mappedJsonSha256,
        bridgeSha256: result.bridgeSha256,
        inventorySha256: result.inventorySha256,
        outputPathLogical: path.basename(result.outputPath),
      },
      null,
      2,
    ),
  );
}

export async function cmdBuildFullCorpus(args, repoRoot) {
  assertFullCorpusBuildAuthorized({
    authorizeFullCorpusFlag: args.flags?.has('authorize-full-corpus') ?? false,
    ownerToken: args['owner-token'] ?? '',
    legacyDbSha256: args['legacy-db-sha256'] ?? '',
    mappedJsonSha256: args['mapped-json-sha256'] ?? '',
    bridgeSha256: args['bridge-sha256'] ?? '',
    legacyDbPath: args['legacy-db'] ?? '',
    mappedJsonPath: args['mapped-json'] ?? '',
    bridgePath: args.bridge ?? '',
    outputPath: args.output ?? '',
  });

  const preflight = await preflightFullCorpus({
    repoRoot,
    legacyDbPath: args['legacy-db'],
    mappedJsonPath: args['mapped-json'],
    bridgePath: args.bridge,
    outputPath: args.output,
    inventoryPath: args.inventory ?? null,
  });

  const generatorSourceCommit = resolveGeneratorSourceCommit(repoRoot);
  if (generatorSourceCommit === SOURCE_COMMIT_UNSET) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Unable to resolve generatorSourceCommit via git rev-parse HEAD',
    );
  }

  const spoolRoot = await mkdtemp(path.join(tmpdir(), 'ehas2-p2c-spool-'));
  try {
    // Hash DB before open + after close via spool helper with pinned digest.
    const { dbIdSet, spoolPath: dbSpool } = await streamLegacyDiseaseRowsToJsonl(
      args['legacy-db'],
      path.join(spoolRoot, 'db-rows.jsonl'),
      { verifyPinnedHash: true, pinnedHash: PINNED_LEGACY_DB_SHA256 },
    );

    // Production path still needs row objects for build — iterate spool (identity fields only).
    const dbRows = [];
    {
      const rl = readline.createInterface({
        input: createReadStream(dbSpool, { encoding: 'utf8' }),
        crlfDelay: Infinity,
      });
      for await (const line of rl) {
        if (line.trim().length === 0) continue;
        dbRows.push(JSON.parse(line));
      }
    }

    // Mapped: stream dedupe, then consumed-byte digest of exact file bytes.
    const mappedEntries = await streamDedupeMappedJsonFile(args['mapped-json']);
    const mappedHashing = hashingReadStream(args['mapped-json']);
    await new Promise((resolve, reject) => {
      mappedHashing.stream.on('error', reject);
      mappedHashing.stream.on('end', resolve);
      mappedHashing.stream.resume();
    });
    await assertConsumedByteDigest(
      mappedHashing.digestHex(),
      PINNED_MAPPED_JSON_SHA256,
      'mapped.json',
    );

    const bridgeIndex = await streamBridgeToIndex(
      args.bridge,
      path.join(spoolRoot, 'bridge-spool.jsonl'),
      { expectedSha256: PINNED_BRIDGE_V3_SHA256 },
    );
    const bridgeRows = bridgeIndex.rows();
    validateBridgeBatchProduction(bridgeRows, dbIdSet);

    const stagingDir = await mkdtemp(`${path.resolve(args.output)}.staging-`);
    const artifacts = await buildFullCorpusArtifactsProduction({
      dbRows,
      mappedEntries,
      bridgeRows,
      inputEvidenceHashes: {
        legacyDbSha256: PINNED_LEGACY_DB_SHA256,
        mappedJsonSha256: PINNED_MAPPED_JSON_SHA256,
        bridgeSha256: PINNED_BRIDGE_V3_SHA256,
        note: 'Pinned P2A engineering evidence hashes',
      },
      inventoryVerified: Boolean(args.inventory),
      inventorySha256: args.inventory ? PINNED_INVENTORY_SHA256 : null,
      stagingDir,
      generatorSourceCommit,
    });

    await assertFileIdentityUnchanged(args['legacy-db'], preflight.inputIdentities.legacyDb);
    await assertFileIdentityUnchanged(args['mapped-json'], preflight.inputIdentities.mappedJson);
    await assertFileIdentityUnchanged(args.bridge, preflight.inputIdentities.bridge);
    if (args.inventory && preflight.inputIdentities.inventory) {
      await assertFileIdentityUnchanged(args.inventory, preflight.inputIdentities.inventory);
    }

    const result = await writeAtomicBundle({
      destinationDir: path.resolve(args.output),
      stagingDir: artifacts.stagingDir,
      serialized: artifacts.serialized,
      manifest: artifacts.manifest,
    });
    console.log(JSON.stringify({ ok: true, bundleDir: result.destinationDir }, null, 2));
  } finally {
    await rm(spoolRoot, { recursive: true, force: true });
  }
}

export async function cmdVerifyFullBundle(args) {
  await verifyFullBundle(args.input);
  console.log(JSON.stringify({ ok: true, bundleDir: path.resolve(args.input) }, null, 2));
}

export async function cmdCompareFullBuilds(args) {
  await compareFullBuilds(args.a, args.b);
  console.log(JSON.stringify({ ok: true, byteIdentical: true }, null, 2));
}

export async function cmdVerifyInventory(args) {
  const { assertFileSha256 } = await import('../../../packages/disease-identity/dist/fileHash.js');
  await assertFileSha256(args.inventory, PINNED_INVENTORY_SHA256);

  const invHashing = hashingReadStream(args.inventory);
  let inventoryRows = 0;
  const rl = readline.createInterface({
    input: invHashing.stream,
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (line.trim().length === 0) {
      continue;
    }
    inventoryRows += 1;
    if (inventoryRows > EXPECTED_INVENTORY_ROW_COUNT) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Inventory exceeds expected ${EXPECTED_INVENTORY_ROW_COUNT} rows`,
      );
    }
  }
  await assertConsumedByteDigest(invHashing.digestHex(), PINNED_INVENTORY_SHA256, 'inventory');
  if (inventoryRows !== EXPECTED_INVENTORY_ROW_COUNT) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Inventory row count mismatch: ${inventoryRows}`,
    );
  }

  let mappedRows = 0;
  const { streamMappedJsonArrayObjects } = await import('./streamMappedJson.mjs');
  for await (const unused of streamMappedJsonArrayObjects(args['mapped-json'])) {
    void unused;
    mappedRows += 1;
  }
  if (mappedRows !== EXPECTED_MAPPED_JSON_ROW_COUNT || mappedRows !== inventoryRows) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Inventory row count does not reconcile with mapped.json',
    );
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        inventorySha256: PINNED_INVENTORY_SHA256,
        inventoryRows,
        mappedJsonRows: mappedRows,
      },
      null,
      2,
    ),
  );
}

export function printFullCorpusUsage() {
  console.error(`Full corpus commands (future authorized build only):
  preflight-full-corpus --legacy-db <path> --mapped-json <path> --bridge <path> --output <external-path> [--inventory <path>]
  build-full-corpus --authorize-full-corpus --owner-token "${FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN}" \\
    --legacy-db <path> --legacy-db-sha256 ${PINNED_LEGACY_DB_SHA256} \\
    --mapped-json <path> --mapped-json-sha256 ${PINNED_MAPPED_JSON_SHA256} \\
    --bridge <path> --bridge-sha256 ${PINNED_BRIDGE_V3_SHA256} \\
    --output <external-path> [--inventory <path>]
  verify-full-bundle --input <external-bundle-dir>
  compare-full-builds --a <dir> --b <dir>
  verify-inventory --inventory <path> --mapped-json <path>`);
}
