import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { finished } from 'node:stream/promises';
import {
  APPROVED_AGGREGATE_COUNTS,
  AUTHORITY_CLASSIFICATION,
  BUNDLE_SCHEMA_VERSION,
  DATASET_VERSION,
} from './constants.js';
import {
  generateDiseaseCanonicalId,
  generateMappedIndexId,
  generateRelationshipId,
} from './canonicalId.js';
import { canonicalJsonString, sha256HexLower } from './canonicalJson.js';
import { buildDiseaseRecord, buildMappedRecord } from './buildFullCorpus.js';
import type { RelationshipEdgeRecord, UnresolvedQueueRecord } from './buildFullCorpus.js';
import { deriveBridgeQuarantineFlags } from './quarantine.js';
import { normalizeMappedIdentity } from './normalize.js';
import { resolveDbRowNamespace } from './namespaceResolution.js';
import { DiseaseIdentityError } from './errors.js';
import type { OutputRecordKind, ProductionBuildIndex } from './productionBuildIndex.js';
import {
  BUNDLE_KIND_PRODUCTION,
  BUNDLE_KIND_SYNTHETIC,
  ESTIMATED_PEAK_MEMORY_BUDGET_BYTES,
  EXPECTED_RELATIONSHIP_EDGE_COUNT,
  EXPECTED_UNRESOLVED_QUEUE_COUNT,
  CONTROLLED_INDEX_OUTPUT_BATCH_ROWS,
  FULL_CORPUS_GENERATOR_VERSION,
  MAX_STAGING_MEMBER_BYTES,
  PRIVATE_ENGINEERING_LICENSING_CLASSIFICATION,
  RELATIONSHIP_TYPE_EXACT_UNIQUE,
  SOURCE_COMMIT_UNSET,
} from './fullCorpusConstants.js';
import type { MappedBridgeJoinRow } from './productionBuildIndex.js';
import { reconcileManifestCounts } from './manifest.js';

const OUTPUT_DISEASE: OutputRecordKind = 'disease';
const OUTPUT_MAPPED: OutputRecordKind = 'mapped';
const OUTPUT_RELATIONSHIP: OutputRecordKind = 'relationship';
const OUTPUT_UNRESOLVED: OutputRecordKind = 'unresolved';

export type BoundedBuildInstrumentation = {
  readonly dbRowsArrayCreated: false;
  readonly mappedArrayCreated: false;
  readonly bridgeArrayCreated: false;
  readonly diseaseArrayCreated: false;
  readonly relationshipArrayCreated: false;
  readonly unresolvedArrayCreated: false;
  dbRowsStreamed: number;
  mappedRowsStreamed: number;
  bridgeRowsStreamed: number;
  relationshipRowsStreamed: number;
  unresolvedRowsStreamed: number;
};

type ArtifactMeta = {
  name: string;
  rowCount: number;
  sha256: string;
  bytes: number;
};

type BoundedBuildInput = {
  readonly index: ProductionBuildIndex;
  readonly stagingDir: string;
  readonly inputEvidenceHashes: {
    readonly legacyDbSha256: string;
    readonly mappedJsonSha256: string;
    readonly bridgeSha256: string;
    readonly note?: string;
    readonly dbIdentityInputClass?: string;
  };
  readonly inventoryVerified: boolean;
  readonly inventorySha256?: string | null;
  readonly generatorSourceCommit: string;
  readonly expectedGeneratorCommit: string;
  readonly instrumentation?: BoundedBuildInstrumentation;
};

export type BoundedBuildResult = {
  readonly stagingDir: string;
  readonly manifest: Record<string, unknown>;
  readonly buildEvidence: Record<string, unknown>;
  readonly serialized: Record<string, string>;
  readonly instrumentation: BoundedBuildInstrumentation;
};

export function createBoundedBuildInstrumentation(): BoundedBuildInstrumentation {
  return {
    dbRowsArrayCreated: false,
    mappedArrayCreated: false,
    bridgeArrayCreated: false,
    diseaseArrayCreated: false,
    relationshipArrayCreated: false,
    unresolvedArrayCreated: false,
    dbRowsStreamed: 0,
    mappedRowsStreamed: 0,
    bridgeRowsStreamed: 0,
    relationshipRowsStreamed: 0,
    unresolvedRowsStreamed: 0,
  };
}

async function writeIndexedJsonl(
  index: ProductionBuildIndex,
  kind: OutputRecordKind,
  filePath: string,
): Promise<ArtifactMeta> {
  const hash = createHash('sha256');
  const out = createWriteStream(filePath, { encoding: 'utf8' });
  let bytes = 0;
  let rowCount = 0;
  try {
    for (const record of index.iterateOutputRecords(kind)) {
      const line = `${record.json}\n`;
      const lineBytes = Buffer.byteLength(line);
      bytes += lineBytes;
      if (bytes > MAX_STAGING_MEMBER_BYTES) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          `Bundle member exceeds MAX_STAGING_MEMBER_BYTES (${MAX_STAGING_MEMBER_BYTES})`,
        );
      }
      hash.update(line);
      rowCount += 1;
      if (!out.write(line)) {
        await new Promise<void>((resolve, reject) => {
          out.once('drain', resolve);
          out.once('error', reject);
        });
      }
    }
    out.end();
    await finished(out);
  } catch (error) {
    out.destroy();
    throw error;
  }
  return { name: path.basename(filePath), rowCount, sha256: hash.digest('hex'), bytes };
}

function mappedBridgeJoinToIngestRows(join: MappedBridgeJoinRow): {
  mapped: MappedBridgeJoinRow;
  bridge: {
    dedupeKey: string;
    mappedSourceLabel: string;
    mappedCodeRaw: string;
    normalizedIdentityKey: string | null;
    disposition: MappedBridgeJoinRow['disposition'];
    candidateLegacyDbIds: number[];
  };
} {
  return {
    mapped: join,
    bridge: {
      dedupeKey: join.dedupeKey,
      mappedSourceLabel: join.mappedSourceLabel,
      mappedCodeRaw: join.mappedCodeRaw,
      normalizedIdentityKey: join.normalizedIdentityKey,
      disposition: join.disposition,
      candidateLegacyDbIds: join.candidateLegacyDbIds,
    },
  };
}

function writeMappedBridgeJoinOutput(
  input: BoundedBuildInput,
  join: MappedBridgeJoinRow,
  instrumentation: BoundedBuildInstrumentation,
): void {
  const { mapped, bridge } = mappedBridgeJoinToIngestRows(join);
  const mappedRecord = buildMappedRecord(mapped, bridge);
  const mappedSortKey = mappedRecord.ehas2MappedIndexId ?? mappedRecord.rawMappedReferenceId ?? '';
  input.index.addOutputRecord(OUTPUT_MAPPED, mappedSortKey, canonicalJsonString(mappedRecord));
  instrumentation.mappedRowsStreamed += 1;
  instrumentation.bridgeRowsStreamed += 1;

  if (
    bridge.disposition === 'EXACT_UNIQUE_MATCH' &&
    bridge.candidateLegacyDbIds.length === 1 &&
    mappedRecord.ehas2MappedIndexId
  ) {
    const diseaseId = generateDiseaseCanonicalId(bridge.candidateLegacyDbIds[0]!);
    const edge: RelationshipEdgeRecord = {
      relationshipId: generateRelationshipId(
        mappedRecord.ehas2MappedIndexId,
        diseaseId,
        RELATIONSHIP_TYPE_EXACT_UNIQUE,
      ),
      ehas2MappedIndexId: mappedRecord.ehas2MappedIndexId,
      ehas2DiseaseId: diseaseId,
      relationshipType: RELATIONSHIP_TYPE_EXACT_UNIQUE,
      bridgeDisposition: 'EXACT_UNIQUE_MATCH',
    };
    input.index.addOutputRecord(
      OUTPUT_RELATIONSHIP,
      edge.relationshipId,
      canonicalJsonString(edge),
    );
    instrumentation.relationshipRowsStreamed += 1;
  } else {
    const unresolved: UnresolvedQueueRecord = {
      queueKey: bridge.dedupeKey,
      mappedSourceLabel: bridge.mappedSourceLabel,
      mappedCodeRaw: bridge.mappedCodeRaw,
      bridgeDisposition: bridge.disposition,
      candidateLegacyDbIds: bridge.candidateLegacyDbIds,
      quarantineFlags: [...deriveBridgeQuarantineFlags(bridge.disposition)],
      engineeringReason: `FAIL_CLOSED_${bridge.disposition}`,
    };
    input.index.addOutputRecord(
      OUTPUT_UNRESOLVED,
      unresolved.queueKey,
      canonicalJsonString(unresolved),
    );
    instrumentation.unresolvedRowsStreamed += 1;
  }
}

function populateMappedBridgeOutputRecords(
  input: BoundedBuildInput,
  instrumentation: BoundedBuildInstrumentation,
): void {
  let offset = 0;
  while (true) {
    const batch = input.index.fetchMappedBridgeJoinBatch(
      CONTROLLED_INDEX_OUTPUT_BATCH_ROWS,
      offset,
    );
    if (batch.length === 0) {
      break;
    }
    for (const join of batch) {
      writeMappedBridgeJoinOutput(input, join, instrumentation);
    }
    offset += batch.length;
    input.index.checkpointControlledIndexAtSafeBoundary('mapped-bridge-output-batch');
    if (batch.length < CONTROLLED_INDEX_OUTPUT_BATCH_ROWS) {
      break;
    }
  }
  input.index.assertMappedBridgeJoinInvariant('mapped-bridge-output-batch-final');
  if (instrumentation.mappedRowsStreamed !== input.index.mappedBridgeJoinRowCount()) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'mapped/bridge output streaming count does not match inner-join cardinality',
    );
  }
}

function populateDiseaseOutputRecords(
  input: BoundedBuildInput,
  instrumentation: BoundedBuildInstrumentation,
): void {
  let offset = 0;
  while (true) {
    const batch = input.index.fetchDbDiseaseBatch(CONTROLLED_INDEX_OUTPUT_BATCH_ROWS, offset);
    if (batch.length === 0) {
      break;
    }
    for (const row of batch) {
      const bridgeRowsForId = input.index.bridgeRowsForDbId(row.id);
      const mappedIndexRefs: string[] = [];
      let bridgeDisposition: string | null = null;
      for (const bridge of bridgeRowsForId) {
        if (bridge.disposition === 'EXACT_UNIQUE_MATCH') {
          bridgeDisposition = bridge.disposition;
          const normalized = normalizeMappedIdentity(
            bridge.mappedSourceLabel,
            bridge.mappedCodeRaw,
          );
          if (!normalized.ok) {
            throw new DiseaseIdentityError(
              'MALFORMED_INPUT',
              'EXACT_UNIQUE bridge row has unnormalizable mapped identity',
            );
          }
          mappedIndexRefs.push(
            generateMappedIndexId(normalized.sourceNamespace, normalized.sourceCode),
          );
        } else if (bridgeDisposition === null) {
          bridgeDisposition = bridge.disposition;
        }
      }
      mappedIndexRefs.sort((a, b) => a.localeCompare(b));
      const bridgeNamespaces = bridgeRowsForId
        .map((bridge) => normalizeMappedIdentity(bridge.mappedSourceLabel, bridge.mappedCodeRaw))
        .filter((result): result is Extract<typeof result, { ok: true }> => result.ok)
        .map((result) => result.sourceNamespace);
      const disease = buildDiseaseRecord({
        row,
        bridgeRowsForId,
        referencedInBridge: bridgeRowsForId.length > 0,
        mappedIndexRefs,
        bridgeDisposition,
        namespaceResolution: resolveDbRowNamespace({
          icd10_code: row.icd10_code,
          bridgeEvidenceRows: bridgeRowsForId.map((bridge) => ({
            sourceLabel: bridge.mappedSourceLabel,
            mappedCodeRaw: bridge.mappedCodeRaw,
          })),
          bridgeNamespaces,
        }),
      });
      input.index.addOutputRecord(
        OUTPUT_DISEASE,
        disease.ehas2DiseaseId,
        canonicalJsonString(disease),
      );
      instrumentation.dbRowsStreamed += 1;
    }
    offset += batch.length;
    input.index.checkpointControlledIndexAtSafeBoundary('disease-output-batch');
    if (batch.length < CONTROLLED_INDEX_OUTPUT_BATCH_ROWS) {
      break;
    }
  }
}

function populateOutputRecords(
  input: BoundedBuildInput,
  instrumentation: BoundedBuildInstrumentation,
): void {
  populateMappedBridgeOutputRecords(input, instrumentation);
  input.index.assertMappedBridgeJoinInvariant('after-mapped-bridge-output');
  input.index.checkpointControlledIndexAtSafeBoundary('after-mapped-bridge-output');
  populateDiseaseOutputRecords(input, instrumentation);
  input.index.checkpointControlledIndexAtSafeBoundary('after-output-population');
}

async function buildBounded(
  input: BoundedBuildInput,
  bundleKind: typeof BUNDLE_KIND_PRODUCTION | typeof BUNDLE_KIND_SYNTHETIC,
): Promise<BoundedBuildResult> {
  if (
    !/^[0-9a-f]{40}$/i.test(input.generatorSourceCommit) ||
    input.generatorSourceCommit === SOURCE_COMMIT_UNSET
  ) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Bounded build requires a 40-hex generatorSourceCommit',
    );
  }
  if (input.generatorSourceCommit !== input.expectedGeneratorCommit) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'generatorSourceCommit does not match expectedGeneratorCommit',
    );
  }
  if (bundleKind === BUNDLE_KIND_PRODUCTION) {
    input.index.enforceConfiguredCounts();
  }

  const instrumentation = input.instrumentation ?? createBoundedBuildInstrumentation();
  input.index.flushTransactionBatch();
  input.index.checkControlledIndexSize();
  input.index.checkpointControlledIndexAtSafeBoundary('after-input-ingest');
  await mkdir(input.stagingDir, { recursive: true });
  populateOutputRecords(input, instrumentation);

  if (bundleKind === BUNDLE_KIND_PRODUCTION) {
    if (instrumentation.relationshipRowsStreamed !== EXPECTED_RELATIONSHIP_EDGE_COUNT) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Production relationship count mismatch');
    }
    if (instrumentation.unresolvedRowsStreamed !== EXPECTED_UNRESOLVED_QUEUE_COUNT) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Production unresolved count mismatch');
    }
  }
  input.index.checkControlledIndexSize();
  input.index.assertIndexSizeLimit();
  input.index.setMeta(
    'peakControlledIndexBytes',
    input.index.peakControlledIndexBytes().toString(),
  );
  input.index.checkControlledIndexSize();
  input.index.setQueryOnlyAfterPopulate();

  // Sequential writes — avoid concurrent iteration on the same SQLite connection.
  const artifacts = [
    await writeIndexedJsonl(
      input.index,
      OUTPUT_DISEASE,
      path.join(input.stagingDir, 'disease-identity-ledger.jsonl'),
    ),
    await writeIndexedJsonl(
      input.index,
      OUTPUT_MAPPED,
      path.join(input.stagingDir, 'mapped-index.jsonl'),
    ),
    await writeIndexedJsonl(
      input.index,
      OUTPUT_RELATIONSHIP,
      path.join(input.stagingDir, 'relationship-edges.jsonl'),
    ),
    await writeIndexedJsonl(
      input.index,
      OUTPUT_UNRESOLVED,
      path.join(input.stagingDir, 'unresolved-queue.jsonl'),
    ),
  ];
  input.index.checkControlledIndexSize();

  const buildEvidence = {
    authorityClassification: AUTHORITY_CLASSIFICATION,
    inventoryVerified: input.inventoryVerified,
    inventorySha256: input.inventorySha256 ?? null,
    artifactLogicalNames: artifacts.map((artifact) => artifact.name),
    generatorVersion: FULL_CORPUS_GENERATOR_VERSION,
    estimatedPeakMemoryBudgetBytes: ESTIMATED_PEAK_MEMORY_BUDGET_BYTES,
    peakControlledIndexBytes: input.index.peakControlledIndexBytes().toString(),
    processingModel: 'DISK_BACKED_SQLITE_ORDERED_STREAMING_NO_FULL_COLLECTIONS',
    bundleKind,
    generatorSourceCommit: input.generatorSourceCommit,
    expectedGeneratorCommit: input.expectedGeneratorCommit,
  };
  const evidenceJson = `${canonicalJsonString(buildEvidence)}\n`;
  await writeFile(path.join(input.stagingDir, 'p2c-build-evidence.json'), evidenceJson, 'utf8');
  artifacts.push({
    name: 'p2c-build-evidence.json',
    rowCount: 0,
    sha256: sha256HexLower(evidenceJson),
    bytes: Buffer.byteLength(evidenceJson),
  });

  const aggregateFingerprint = sha256HexLower(
    artifacts.map((artifact) => `${artifact.name}:${artifact.sha256}`).join('|'),
  );
  const manifest = {
    bundleKind,
    bundleSchemaVersion: BUNDLE_SCHEMA_VERSION,
    datasetVersion: DATASET_VERSION,
    authorityClassification: AUTHORITY_CLASSIFICATION,
    licensingClassification: PRIVATE_ENGINEERING_LICENSING_CLASSIFICATION,
    canonicalIdAlgorithms: [
      'EHAS2_CANONICAL_DISEASE_ID_v1_SHA256',
      'EHAS2_MAPPED_IDENTITY_KEY_v1_SHA256',
      'EHAS2_IDENTITY_RELATIONSHIP_v1_SHA256',
      'EHAS2_UNNORMALIZABLE_MAPPED_RAW_v1_SHA256',
    ],
    inputEvidenceHashes: input.inputEvidenceHashes,
    generatorVersion: FULL_CORPUS_GENERATOR_VERSION,
    artifacts,
    aggregateFingerprint,
    reconciliation: { ...APPROVED_AGGREGATE_COUNTS },
  };
  if (bundleKind === BUNDLE_KIND_PRODUCTION) {
    reconcileManifestCounts(manifest);
  }
  const manifestJson = `${canonicalJsonString(manifest)}\n`;
  await writeFile(path.join(input.stagingDir, 'bundle-manifest.json'), manifestJson, 'utf8');
  return {
    stagingDir: input.stagingDir,
    manifest,
    buildEvidence,
    serialized: {
      'bundle-manifest.json': manifestJson,
      'p2c-build-evidence.json': evidenceJson,
    },
    instrumentation,
  };
}

export async function buildFullCorpusArtifactsBoundedProduction(
  input: BoundedBuildInput,
): Promise<BoundedBuildResult> {
  if (input.index.mode !== 'production') {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Production bounded build requires a production-mode index',
    );
  }
  return buildBounded(input, BUNDLE_KIND_PRODUCTION);
}

/** Test-only miniature path using the identical disk iteration/build machinery. */
export async function buildFullCorpusArtifactsBoundedSyntheticDisk(
  input: BoundedBuildInput,
): Promise<BoundedBuildResult> {
  if (input.index.mode !== 'synthetic-test') {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      'Synthetic disk build requires a synthetic-test index',
    );
  }
  return buildBounded(input, BUNDLE_KIND_SYNTHETIC);
}
