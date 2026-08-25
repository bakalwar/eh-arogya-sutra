import {
  assertAdoptionMatchesArtifact,
  assertDbIdentityInputClassXor,
  assertFullCorpusBuildAuthorized,
  assertProductionGeneratorReady,
  assertSanitizedFullCorpusBuildAuthorized,
  buildFullCorpusArtifactsBoundedProduction,
  compareFullBuilds,
  createProductionBuildIndex,
  deriveSanitizedDiseaseIdentity,
  loadSanitizedAdoptionManifestFromControlPlane,
  parseDbIdentityInputClass,
  preflightFullCorpus,
  streamSanitizedIdentityJsonlFile,
  validateBridgeBatchProductionFromIndex,
  verifyFullBundle,
  verifyInventorySameStream,
  verifySanitizedArtifactPackage,
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
  assertFileIdentityUnchanged,
  BUNDLE_KIND_PRODUCTION,
  EXPECTED_MAPPED_UNIQUE_CODE_COUNT,
  DB_IDENTITY_INPUT_CLASS_FULL_LEGACY_DB,
  DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL,
  SANITIZED_DERIVE_AUTHORIZATION_TOKEN,
  EXPECTED_LEGACY_DB_DISEASE_COUNT,
} from '../../../packages/disease-identity/dist/index.js';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { ingestBridgeToBuildIndex } from './streamBridgeJsonl.mjs';
import { streamDedupeMappedJsonFileWithConsumedDigest } from './streamMappedJson.mjs';
import { streamLegacyDiseaseRowsToBuildIndex } from './readLegacyDb.mjs';

export async function cmdPreflightFullCorpus(args, repoRoot) {
  const inputClass = parseDbIdentityInputClass(args['db-identity-input-class']);
  assertDbIdentityInputClassXor({
    dbIdentityInputClass: inputClass,
    legacyDbPath: args['legacy-db'],
    sanitizedArtifactPath: args['sanitized-artifact'],
  });
  if (inputClass === DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          dbIdentityInputClass: inputClass,
          note: 'Sanitized preflight requires adopted artifact pins at build time',
        },
        null,
        2,
      ),
    );
    return;
  }
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
        dbIdentityInputClass: inputClass,
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

async function ingestSanitizedArtifactToBuildIndex(args, repoRoot, index) {
  assertSanitizedFullCorpusBuildAuthorized({
    authorizeFullCorpusFlag: args.flags?.has('authorize-full-corpus') ?? false,
    ownerToken: args['owner-token'] ?? '',
    dbIdentityInputClass: DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL,
    mappedJsonSha256: args['mapped-json-sha256'] ?? '',
    bridgeSha256: args['bridge-sha256'] ?? '',
    sanitizedArtifactPath: args['sanitized-artifact'] ?? '',
    sanitizedManifestPath: args['sanitized-manifest'] ?? '',
    adoptionId: args['adoption-id'] ?? '',
    expectedArtifactSHA256: args['expected-artifact-sha256'] ?? '',
    expectedArtifactBytes: Number(args['expected-artifact-bytes'] ?? 0),
    expectedRecordCount: Number(args['expected-record-count'] ?? 0),
    expectedOrderedIdentityFingerprint: args['expected-ordered-fingerprint'] ?? '',
    expectedSanitizedManifestSHA256: args['expected-sanitized-manifest-sha256'] ?? '',
    mappedJsonPath: args['mapped-json'] ?? '',
    bridgePath: args.bridge ?? '',
    outputPath: args.output ?? '',
    expectedGeneratorCommit: args['expected-generator-commit'] ?? '',
  });

  const verified = await verifySanitizedArtifactPackage({
    artifactPath: args['sanitized-artifact'],
    manifestPath: args['sanitized-manifest'],
    expectedRecordCount: EXPECTED_LEGACY_DB_DISEASE_COUNT,
    expectedArtifactSHA256: args['expected-artifact-sha256'],
    expectedArtifactBytes: Number(args['expected-artifact-bytes']),
    expectedOrderedIdentityFingerprint: args['expected-ordered-fingerprint'],
    expectedManifestSHA256: args['expected-sanitized-manifest-sha256'],
  });

  const adoption = await loadSanitizedAdoptionManifestFromControlPlane({
    repoRoot,
    adoptionId: args['adoption-id'],
  });
  assertAdoptionMatchesArtifact({
    adoption: adoption.manifest,
    artifactSHA256: verified.artifact.artifactSHA256,
    artifactBytes: verified.artifact.artifactBytes,
    recordCount: verified.artifact.recordCount,
    orderedIdentityFingerprint: verified.artifact.orderedIdentityFingerprint,
    sanitizedManifestSHA256: verified.manifestSHA256,
  });

  await streamSanitizedIdentityJsonlFile(args['sanitized-artifact'], {
    expectedRecordCount: EXPECTED_LEGACY_DB_DISEASE_COUNT,
    expectedArtifactSHA256: verified.artifact.artifactSHA256,
    expectedArtifactBytes: verified.artifact.artifactBytes,
    expectedOrderedIdentityFingerprint: verified.artifact.orderedIdentityFingerprint,
    onRecord: (record) => {
      index.insertDbRow({ id: record.legacyDbDiseaseId, icd10_code: record.legacyCodeRaw });
    },
  });
}

export async function cmdBuildFullCorpus(args, repoRoot) {
  const inputClass = parseDbIdentityInputClass(args['db-identity-input-class']);
  assertDbIdentityInputClassXor({
    dbIdentityInputClass: inputClass,
    legacyDbPath: args['legacy-db'],
    sanitizedArtifactPath: args['sanitized-artifact'],
  });

  if (inputClass === DB_IDENTITY_INPUT_CLASS_FULL_LEGACY_DB) {
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
  }

  const generator = assertProductionGeneratorReady({
    repoRoot,
    expectedGeneratorCommit: args['expected-generator-commit'] ?? '',
  });

  const indexRoot = await mkdtemp(path.join(tmpdir(), 'ehas2-p2c-index-'));
  const index = createProductionBuildIndex(indexRoot);
  let stagingDir = null;
  try {
    index.checkControlledIndexSize();

    if (inputClass === DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL) {
      await ingestSanitizedArtifactToBuildIndex(args, repoRoot, index);
    } else {
      const preflight = await preflightFullCorpus({
        repoRoot,
        legacyDbPath: args['legacy-db'],
        mappedJsonPath: args['mapped-json'],
        bridgePath: args.bridge,
        outputPath: args.output,
        inventoryPath: args.inventory ?? null,
      });
      await streamLegacyDiseaseRowsToBuildIndex(args['legacy-db'], index, {
        pinnedHash: PINNED_LEGACY_DB_SHA256,
      });
      index.flushTransactionBatch();
      // keep preflight identities for post-checks
      args.__preflight = preflight;
    }
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
    const legacyEvidenceHash =
      inputClass === DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL
        ? args['expected-artifact-sha256']
        : PINNED_LEGACY_DB_SHA256;
    const artifacts = await buildFullCorpusArtifactsBoundedProduction({
      index,
      inputEvidenceHashes: {
        legacyDbSha256: legacyEvidenceHash,
        mappedJsonSha256: PINNED_MAPPED_JSON_SHA256,
        bridgeSha256: PINNED_BRIDGE_V3_SHA256,
        note:
          inputClass === DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL
            ? 'Sanitized identity artifact digest (not historical main-file completeness claim)'
            : 'Pinned P2A engineering evidence hashes',
        dbIdentityInputClass: inputClass,
      },
      inventoryVerified: inventoryEvidence.inventoryVerified,
      inventorySha256: inventoryEvidence.inventorySha256,
      stagingDir,
      generatorSourceCommit: generator.generatorSourceCommit,
      expectedGeneratorCommit: generator.expectedGeneratorCommit,
    });

    if (inputClass === DB_IDENTITY_INPUT_CLASS_FULL_LEGACY_DB && args.__preflight) {
      const preflight = args.__preflight;
      await assertFileIdentityUnchanged(args['legacy-db'], preflight.inputIdentities.legacyDb);
      await assertFileIdentityUnchanged(args['mapped-json'], preflight.inputIdentities.mappedJson);
      await assertFileIdentityUnchanged(args.bridge, preflight.inputIdentities.bridge);
      if (args.inventory && preflight.inputIdentities.inventory) {
        await assertFileIdentityUnchanged(args.inventory, preflight.inputIdentities.inventory);
      }
    }

    const result = await writeAtomicBundle({
      destinationDir: path.resolve(args.output),
      stagingDir: artifacts.stagingDir,
      serialized: artifacts.serialized,
      manifest: artifacts.manifest,
    });
    stagingDir = null;
    console.log(
      JSON.stringify(
        { ok: true, bundleDir: result.destinationDir, dbIdentityInputClass: inputClass },
        null,
        2,
      ),
    );
  } finally {
    index.destroy();
    if (stagingDir) {
      await rm(stagingDir, { recursive: true, force: true });
    }
  }
}

export async function cmdDeriveSanitizedDiseaseIdentity(args, repoRoot) {
  const result = await deriveSanitizedDiseaseIdentity({
    authorizeDeriveFlag: args.flags?.has('authorize-derive-sanitized-identity') ?? false,
    ownerToken: args['owner-token'] ?? '',
    repoRoot,
    sourceDbPath: args['source-db'] ?? '',
    sourceEvidenceRefHistoricalMainSha256: args['source-evidence-ref'] ?? '',
    outputDir: args.output ?? '',
    expectedGeneratorCommit: args['expected-generator-commit'] ?? '',
    expectedRecordCount: args['expected-record-count']
      ? Number(args['expected-record-count'])
      : undefined,
    syntheticTestMode: args.flags?.has('synthetic-test-mode') ?? false,
    generatorSourceCommit: args['generator-source-commit'],
    minimumFreeBytes: args['min-free-bytes'] ? Number(args['min-free-bytes']) : undefined,
  });
  console.log(
    JSON.stringify(
      {
        ok: true,
        recordCount: result.recordCount,
        artifactBytes: result.artifactBytes,
        artifactSHA256: result.artifactSHA256,
        orderedIdentityFingerprint: result.orderedIdentityFingerprint,
        manifestSHA256: result.manifestSHA256,
        shmCaveat: result.shmCaveat,
        lifecycleStatus: 'DERIVED_PENDING_ADOPTION',
      },
      null,
      2,
    ),
  );
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
  console.error(`Full corpus / sanitized commands (authorized use only):
  preflight-full-corpus --legacy-db <path> --mapped-json <path> --bridge <path> --output <external-path> [--inventory <path>]
  build-full-corpus --authorize-full-corpus --owner-token "${FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN}" \\
    --db-identity-input-class ${DB_IDENTITY_INPUT_CLASS_FULL_LEGACY_DB} \\
    --legacy-db <path> --legacy-db-sha256 ${PINNED_LEGACY_DB_SHA256} \\
    --mapped-json <path> --mapped-json-sha256 ${PINNED_MAPPED_JSON_SHA256} \\
    --bridge <path> --bridge-sha256 ${PINNED_BRIDGE_V3_SHA256} \\
    --output <external-path> --expected-generator-commit <40-hex-sha> [--inventory <path>]
  build-full-corpus --authorize-full-corpus --owner-token "${FULL_CORPUS_BUILD_AUTHORIZATION_TOKEN}" \\
    --db-identity-input-class ${DB_IDENTITY_INPUT_CLASS_SANITIZED_JSONL} \\
    --sanitized-artifact <path> --sanitized-manifest <path> --adoption-id <id> \\
    --expected-artifact-sha256 <hex> --expected-artifact-bytes <n> --expected-record-count 116284 \\
    --expected-ordered-fingerprint <hex> --expected-sanitized-manifest-sha256 <hex> \\
    --mapped-json <path> --mapped-json-sha256 ${PINNED_MAPPED_JSON_SHA256} \\
    --bridge <path> --bridge-sha256 ${PINNED_BRIDGE_V3_SHA256} \\
    --output <external-path> --expected-generator-commit <40-hex-sha>
  derive-sanitized-disease-identity --authorize-derive-sanitized-identity \\
    --owner-token "${SANITIZED_DERIVE_AUTHORIZATION_TOKEN}" \\
    --source-db <path> --source-evidence-ref ${PINNED_LEGACY_DB_SHA256} \\
    --output <external-dir> --expected-generator-commit <40-hex>
  verify-full-bundle --input <external-bundle-dir>
  compare-full-builds --a <dir> --b <dir>
  verify-inventory --inventory <path> --mapped-json <path>`);
}
