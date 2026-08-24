import path from 'node:path';
import {
  assertFullCorpusBuildAuthorized,
  buildFullCorpusArtifacts,
  compareFullBuilds,
  dedupeMappedRows,
  preflightFullCorpus,
  validateBridgeBatch,
  verifyFullBundle,
  writeAtomicBundle,
  DiseaseIdentityError,
  FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN,
  PINNED_BRIDGE_V3_SHA256,
  PINNED_INVENTORY_SHA256,
  PINNED_LEGACY_DB_SHA256,
  PINNED_MAPPED_JSON_SHA256,
} from '../../../packages/disease-identity/dist/index.js';
import { collectBridgeRows } from './streamBridgeJsonl.mjs';
import { collectMappedJsonRows } from './streamMappedJson.mjs';
import { readLegacyDiseaseRows } from './readLegacyDb.mjs';

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
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
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

  await preflightFullCorpus({
    repoRoot,
    legacyDbPath: args['legacy-db'],
    mappedJsonPath: args['mapped-json'],
    bridgePath: args.bridge,
    outputPath: args.output,
    inventoryPath: args.inventory ?? null,
  });

  const dbRows = readLegacyDiseaseRows(args['legacy-db']);
  const mappedRows = await collectMappedJsonRows(args['mapped-json']);
  const mappedEntries = dedupeMappedRows(mappedRows);
  const bridgeRows = await collectBridgeRows(args.bridge);
  validateBridgeBatch(bridgeRows);

  const artifacts = buildFullCorpusArtifacts({
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
  });

  const result = await writeAtomicBundle({
    destinationDir: path.resolve(args.output),
    serialized: artifacts.serialized,
    manifest: artifacts.manifest,
  });
  console.log(JSON.stringify({ ok: true, bundleDir: result.destinationDir }, null, 2));
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
  let lineCount = 0;
  const mappedRows = await collectMappedJsonRows(args['mapped-json']);
  const fs = await import('node:fs/promises');
  const inventoryLines = (await fs.readFile(args.inventory, 'utf8'))
    .split('\n')
    .filter((line) => line.trim().length > 0);
  lineCount = inventoryLines.length;
  if (lineCount !== mappedRows.length) {
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
        inventoryRows: lineCount,
        mappedJsonRows: mappedRows.length,
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
