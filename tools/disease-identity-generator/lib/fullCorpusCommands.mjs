import { mkdtemp, rm } from 'node:fs/promises';
import readline from 'node:readline';
import path from 'node:path';
import { tmpdir } from 'node:os';
import {
  assertFileIdentityUnchanged,
  assertFullCorpusBuildAuthorized,
  buildFullCorpusArtifactsBoundedProduction,
  compareFullBuilds,
  createProductionBuildIndex,
  preflightFullCorpus,
  validateBridgeBatchProductionFromIndex,
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
  assertProductionGeneratorReady,
  BUNDLE_KIND_PRODUCTION,
  EXPECTED_MAPPED_UNIQUE_CODE_COUNT,
} from '../../../packages/disease-identity/dist/index.js';
import { ingestBridgeToBuildIndex } from './streamBridgeJsonl.mjs';
import { streamDedupeMappedJsonFileWithConsumedDigest } from './streamMappedJson.mjs';
import { streamLegacyDiseaseRowsToBuildIndex } from './readLegacyDb.mjs';

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

  const generator = assertProductionGeneratorReady({
    repoRoot,
    expectedGeneratorCommit: args['expected-generator-commit'] ?? '',
  });

  const preflight = await preflightFullCorpus({
    repoRoot,
    legacyDbPath: args['legacy-db'],
    mappedJsonPath: args['mapped-json'],
    bridgePath: args.bridge,
    outputPath: args.output,
    inventoryPath: args.inventory ?? null,
  });

  const indexRoot = await mkdtemp(path.join(tmpdir(), 'ehas2-p2c-index-'));
  const index = createProductionBuildIndex(indexRoot);
  let stagingDir = null;
  try {
    await streamLegacyDiseaseRowsToBuildIndex(args['legacy-db'], index, {
      pinnedHash: PINNED_LEGACY_DB_SHA256,
    });

    const mappedDigest = await streamDedupeMappedJsonFileWithConsumedDigest(args['mapped-json'], {
      expectedRawRows: EXPECTED_MAPPED_JSON_ROW_COUNT,
      expectedUniqueKeys: EXPECTED_MAPPED_UNIQUE_CODE_COUNT,
      onRow: (row) => index.insertMappedRow(row),
      getUniqueKeyCount: () => index.counts().mappedUniqueRows,
    });
    await assertConsumedByteDigest(
      mappedDigest.consumedSha256,
      PINNED_MAPPED_JSON_SHA256,
      'mapped.json',
    );

    await ingestBridgeToBuildIndex(args.bridge, index, { expectedSha256: PINNED_BRIDGE_V3_SHA256 });
    index.enforceConfiguredCounts();
    validateBridgeBatchProductionFromIndex(index);
    index.assertIndexSizeLimit();

    stagingDir = await mkdtemp(`${path.resolve(args.output)}.staging-`);
    const artifacts = await buildFullCorpusArtifactsBoundedProduction({
      index,
      inputEvidenceHashes: {
        legacyDbSha256: PINNED_LEGACY_DB_SHA256,
        mappedJsonSha256: PINNED_MAPPED_JSON_SHA256,
        bridgeSha256: PINNED_BRIDGE_V3_SHA256,
        note: 'Pinned P2A engineering evidence hashes',
      },
      inventoryVerified: Boolean(args.inventory),
      inventorySha256: args.inventory ? PINNED_INVENTORY_SHA256 : null,
      stagingDir,
      generatorSourceCommit: generator.generatorSourceCommit,
      expectedGeneratorCommit: generator.expectedGeneratorCommit,
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
    stagingDir = null;
    console.log(JSON.stringify({ ok: true, bundleDir: result.destinationDir }, null, 2));
  } finally {
    index.destroy();
    if (stagingDir) {
      await rm(stagingDir, { recursive: true, force: true });
    }
  }
}

export async function cmdVerifyFullBundle(args) {
  await verifyFullBundle(args.input, { expectedBundleKind: BUNDLE_KIND_PRODUCTION });
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
    --output <external-path> --expected-generator-commit <40-hex-sha> [--inventory <path>]
  verify-full-bundle --input <external-bundle-dir>
  compare-full-builds --a <dir> --b <dir>
  verify-inventory --inventory <path> --mapped-json <path>`);
}
