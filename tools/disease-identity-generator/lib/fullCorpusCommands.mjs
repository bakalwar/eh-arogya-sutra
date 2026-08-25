import { mkdtemp, rm } from 'node:fs/promises';
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
  verifyInventorySameStream,
  writeAtomicBundle,
  DiseaseIdentityError,
  FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN,
  PINNED_BRIDGE_V3_SHA256,
  PINNED_INVENTORY_SHA256,
  PINNED_LEGACY_DB_SHA256,
  PINNED_MAPPED_JSON_SHA256,
  PINNED_MAPPED_JSON_BYTES,
  EXPECTED_MAPPED_JSON_ROW_COUNT,
  assertConsumedByteDigestAndBytes,
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
    index.checkControlledIndexSize();
    await streamLegacyDiseaseRowsToBuildIndex(args['legacy-db'], index, {
      pinnedHash: PINNED_LEGACY_DB_SHA256,
    });
    index.flushTransactionBatch();

    const mappedDigest = await streamDedupeMappedJsonFileWithConsumedDigest(args['mapped-json'], {
      expectedRawRows: EXPECTED_MAPPED_JSON_ROW_COUNT,
      expectedUniqueKeys: EXPECTED_MAPPED_UNIQUE_CODE_COUNT,
      onRow: (row) => index.insertMappedRow(row),
      getUniqueKeyCount: () => index.counts().mappedUniqueRows,
    });
    await assertConsumedByteDigestAndBytes(
      mappedDigest.consumedSha256,
      mappedDigest.consumedBytes,
      PINNED_MAPPED_JSON_SHA256,
      PINNED_MAPPED_JSON_BYTES,
      'mapped.json',
    );
    index.flushTransactionBatch();

    await ingestBridgeToBuildIndex(args.bridge, index, { expectedSha256: PINNED_BRIDGE_V3_SHA256 });
    index.flushTransactionBatch();
    index.enforceConfiguredCounts();
    validateBridgeBatchProductionFromIndex(index);
    index.checkControlledIndexSize();
    const inventoryEvidence = await verifyInventorySameStream({
      inventoryPath: args.inventory ?? null,
      mappedRawRowCount: mappedDigest.rawRowCount,
    });

    stagingDir = await mkdtemp(`${path.resolve(args.output)}.staging-`);
    const artifacts = await buildFullCorpusArtifactsBoundedProduction({
      index,
      inputEvidenceHashes: {
        legacyDbSha256: PINNED_LEGACY_DB_SHA256,
        mappedJsonSha256: PINNED_MAPPED_JSON_SHA256,
        bridgeSha256: PINNED_BRIDGE_V3_SHA256,
        note: 'Pinned P2A engineering evidence hashes',
      },
      inventoryVerified: inventoryEvidence.inventoryVerified,
      inventorySha256: inventoryEvidence.inventorySha256,
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
  await verifyFullBundle(args.a, { expectedBundleKind: BUNDLE_KIND_PRODUCTION });
  await verifyFullBundle(args.b, { expectedBundleKind: BUNDLE_KIND_PRODUCTION });
  await compareFullBuilds(args.a, args.b);
  console.log(JSON.stringify({ ok: true, byteIdentical: true }, null, 2));
}

export async function cmdVerifyInventory(args) {
  let mappedRows = 0;
  const { streamMappedJsonArrayObjects } = await import('./streamMappedJson.mjs');
  for await (const unused of streamMappedJsonArrayObjects(args['mapped-json'])) {
    void unused;
    mappedRows += 1;
  }
  if (mappedRows !== EXPECTED_MAPPED_JSON_ROW_COUNT) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `mapped.json row count mismatch: ${mappedRows}`,
    );
  }
  const inventoryEvidence = await verifyInventorySameStream({
    inventoryPath: args.inventory,
    mappedRawRowCount: mappedRows,
  });
  if (!inventoryEvidence.inventoryVerified) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Inventory verification failed');
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        inventorySha256: PINNED_INVENTORY_SHA256,
        inventoryRows: inventoryEvidence.rowCount,
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
