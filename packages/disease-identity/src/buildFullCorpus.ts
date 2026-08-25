import {
  AUTHORITY_CLASSIFICATION,
  DATASET_VERSION,
  LEDGER_SCHEMA_VERSION,
  LEGACY_AUTHORITY,
} from './constants.js';
import {
  generateDiseaseCanonicalId,
  generateMappedIndexId,
  generateRawMappedReferenceId,
  generateRelationshipId,
} from './canonicalId.js';
import {
  computeRecordFingerprint,
  buildDiseaseRecordFingerprintInput,
  buildMappedRecordFingerprintInput,
} from './fingerprint.js';
import { normalizeMappedIdentity } from './normalize.js';
import {
  deriveBridgeQuarantineFlags,
  deriveDbOnlyFlags,
  mergeStructuralFlags,
  reviewRequiredUnclassifiedDefault,
} from './quarantine.js';
import { reconcileBridgeMappedKeys, type ParsedBridgeRow } from './bridgeIngest.js';
import type { MappedDedupeEntry } from './mappedIngest.js';
import { mappedRawKey, resolveDbRowNamespace } from './namespaceResolution.js';
import type { LegacyDbRow } from './sqlitePrivacy.js';
import { APPROVED_AGGREGATE_COUNTS, BUNDLE_SCHEMA_VERSION } from './constants.js';
import {
  FULL_CORPUS_GENERATOR_VERSION,
  PRIVATE_ENGINEERING_LICENSING_CLASSIFICATION,
  RELATIONSHIP_TYPE_EXACT_UNIQUE,
  EXPECTED_RELATIONSHIP_EDGE_COUNT,
  DOCUMENTED_PEAK_MEMORY_BUDGET_BYTES,
} from './fullCorpusConstants.js';
import { serializeJsonl, sortRecordsById, reconcileManifestCounts } from './manifest.js';
import { validateAndIndexRecordBatch } from './batchValidate.js';
import { canonicalJsonString, sha256HexLower } from './canonicalJson.js';
import type { DiseaseIdentityRecord, MappedIdentityIndexRecord } from './types.js';
import { DiseaseIdentityError } from './errors.js';

export type RelationshipEdgeRecord = {
  readonly relationshipId: string;
  readonly ehas2MappedIndexId: string;
  readonly ehas2DiseaseId: string;
  readonly relationshipType: typeof RELATIONSHIP_TYPE_EXACT_UNIQUE;
  readonly bridgeDisposition: 'EXACT_UNIQUE_MATCH';
};

export type UnresolvedQueueRecord = {
  readonly queueKey: string;
  readonly mappedSourceLabel: string;
  readonly mappedCodeRaw: string;
  readonly bridgeDisposition: ParsedBridgeRow['disposition'];
  readonly candidateLegacyDbIds: readonly number[];
  readonly quarantineFlags: readonly string[];
  readonly engineeringReason: string;
};

export type FullCorpusBuildArtifacts = {
  readonly diseaseRecords: readonly DiseaseIdentityRecord[];
  readonly mappedRecords: readonly MappedIdentityIndexRecord[];
  readonly relationshipEdges: readonly RelationshipEdgeRecord[];
  readonly unresolvedQueue: readonly UnresolvedQueueRecord[];
  readonly manifest: Record<string, unknown>;
  readonly buildEvidence: Record<string, unknown>;
  readonly serialized: Record<string, string>;
};

function buildMappedRecord(
  entry: MappedDedupeEntry,
  bridge: ParsedBridgeRow | undefined,
): MappedIdentityIndexRecord {
  const normalized = normalizeMappedIdentity(entry.mappedSourceLabel, entry.mappedCodeRaw);
  let ehas2MappedIndexId: string | null = null;
  let rawMappedReferenceId: string | null = null;
  const invalidFlags: string[] = [];

  if (normalized.ok) {
    ehas2MappedIndexId = generateMappedIndexId(normalized.sourceNamespace, normalized.sourceCode);
  } else {
    rawMappedReferenceId = generateRawMappedReferenceId(
      entry.mappedCodeRaw,
      entry.mappedSourceLabel,
    );
    invalidFlags.push('Q_MAPPED_UNNORMALIZABLE_RAW');
  }

  const disposition = bridge?.disposition ?? null;
  const linkedEhas2DiseaseIds =
    disposition === 'EXACT_UNIQUE_MATCH' && bridge && bridge.candidateLegacyDbIds.length === 1
      ? [generateDiseaseCanonicalId(bridge.candidateLegacyDbIds[0]!)]
      : [];

  const base: MappedIdentityIndexRecord = {
    ehas2MappedIndexId,
    rawMappedReferenceId,
    mappedCodeRaw: entry.mappedCodeRaw,
    mappedSourceLabel: entry.mappedSourceLabel,
    sourceNamespace: normalized.ok ? normalized.sourceNamespace : null,
    sourceCode: normalized.ok ? normalized.sourceCode : null,
    normalizedIdentityKey: normalized.ok ? normalized.normalizedIdentityKey : null,
    bridgeDisposition: disposition,
    relationshipState: disposition === 'NO_MATCH' ? 'UNLINKED_MAPPED_CODE' : 'MAPPED_INDEX',
    linkedEhas2DiseaseIds,
    candidateLegacyDbIds: [...(bridge?.candidateLegacyDbIds ?? [])],
    provenanceVariants: [...entry.provenanceVariants],
    quarantineFlags: mergeStructuralFlags(invalidFlags, deriveBridgeQuarantineFlags(disposition)),
    reviewRequiredUnclassified: reviewRequiredUnclassifiedDefault(),
    provenance: {
      authorityClassification: AUTHORITY_CLASSIFICATION,
      datasetVersion: DATASET_VERSION,
    },
    recordFingerprint: '',
  };

  return {
    ...base,
    recordFingerprint: computeRecordFingerprint(
      buildMappedRecordFingerprintInput(base as unknown as Record<string, unknown>),
    ),
  };
}

function buildDiseaseRecord(input: {
  row: LegacyDbRow;
  bridgeRowsForId: readonly ParsedBridgeRow[];
  referencedInBridge: boolean;
  mappedIndexRefs: readonly string[];
  bridgeDisposition: string | null;
  namespaceResolution: ReturnType<typeof resolveDbRowNamespace>;
}): DiseaseIdentityRecord {
  const ehas2DiseaseId = generateDiseaseCanonicalId(input.row.id);
  const resolution = input.namespaceResolution;

  const structuralFlags: string[] = [];
  let sourceNamespace: DiseaseIdentityRecord['sourceNamespace'] = null;
  let sourceCode: string | null = null;
  let normalizedIdentityKey: string | null = null;

  if (resolution.kind === 'RESOLVED') {
    sourceNamespace = resolution.normalization.sourceNamespace;
    sourceCode = resolution.normalization.sourceCode;
    normalizedIdentityKey = resolution.normalization.normalizedIdentityKey;
  } else if (resolution.reason === 'NAMESPACE_CONFLICT') {
    structuralFlags.push('Q_IDENTITY_INVALID_NAMESPACE');
  } else if (resolution.reason === 'INVALID_CODE') {
    structuralFlags.push('Q_IDENTITY_INVALID_CODE');
  }

  const isDbOnly = !input.referencedInBridge;
  const hasCode = Boolean(input.row.icd10_code && input.row.icd10_code.trim().length > 0);
  const codeWithoutMappedParent = hasCode && isDbOnly;

  const candidateSet = new Set<number>([input.row.id]);
  for (const bridge of input.bridgeRowsForId) {
    for (const id of bridge.candidateLegacyDbIds) {
      candidateSet.add(id);
    }
  }
  const candidateLegacyDbIds = [...candidateSet].sort((a, b) => a - b);

  const base: DiseaseIdentityRecord = {
    ehas2DiseaseId,
    ledgerSchemaVersion: LEDGER_SCHEMA_VERSION,
    recordKind: 'LEGACY_DB_ROW',
    legacyAuthority: LEGACY_AUTHORITY,
    legacyDbDiseaseId: input.row.id,
    sourceNamespace,
    sourceCode,
    normalizedIdentityKey,
    relationshipState: isDbOnly ? 'LEGACY_DB_UNLINKED' : 'LEGACY_DB_LINKED',
    bridgeDisposition: input.bridgeDisposition,
    mappedIndexRefs: [...input.mappedIndexRefs],
    candidateLegacyDbIds,
    quarantineFlags: mergeStructuralFlags(
      structuralFlags,
      deriveBridgeQuarantineFlags(input.bridgeDisposition),
      deriveDbOnlyFlags(isDbOnly, codeWithoutMappedParent),
    ),
    reviewRequiredUnclassified: reviewRequiredUnclassifiedDefault(),
    provenance: {
      authorityClassification: AUTHORITY_CLASSIFICATION,
      datasetVersion: DATASET_VERSION,
    },
    recordFingerprint: '',
    lifecycleStatus: 'INVENTORY_ENGINEERING',
  };

  return {
    ...base,
    recordFingerprint: computeRecordFingerprint(
      buildDiseaseRecordFingerprintInput(base as unknown as Record<string, unknown>),
    ),
  };
}

export function buildFullCorpusArtifacts(input: {
  readonly dbRows: readonly LegacyDbRow[];
  readonly mappedEntries: readonly MappedDedupeEntry[];
  readonly bridgeRows: readonly ParsedBridgeRow[];
  readonly inputEvidenceHashes: {
    readonly legacyDbSha256: string;
    readonly mappedJsonSha256: string;
    readonly bridgeSha256: string;
    readonly note?: string;
  };
  readonly inventoryVerified: boolean;
  readonly inventorySha256?: string | null;
  readonly skipManifestReconciliation?: boolean;
  readonly skipBridgeMappedKeyReconciliation?: boolean;
  readonly expectedRelationshipEdges?: number;
}): FullCorpusBuildArtifacts {
  if (!input.skipBridgeMappedKeyReconciliation) {
    reconcileBridgeMappedKeys({
      bridgeRows: input.bridgeRows,
      mappedDedupeKeys: input.mappedEntries.map((entry) => entry.dedupeKey),
    });
  }

  const bridgeByKey = new Map(input.bridgeRows.map((row) => [row.dedupeKey, row]));
  const bridgeByDbId = new Map<number, ParsedBridgeRow[]>();
  const referencedDbIds = new Set<number>();
  const dbIdSet = new Set(input.dbRows.map((row) => row.id));

  for (const row of input.bridgeRows) {
    for (const id of row.candidateLegacyDbIds) {
      if (!dbIdSet.has(id)) {
        throw new DiseaseIdentityError(
          'MALFORMED_INPUT',
          `Cannot generate disease identity for missing DB id ${id}`,
        );
      }
      referencedDbIds.add(id);
      const bucket = bridgeByDbId.get(id) ?? [];
      bucket.push(row);
      bridgeByDbId.set(id, bucket);
    }
  }

  const mappedRecords = input.mappedEntries.map((entry) => {
    const bridge = bridgeByKey.get(entry.dedupeKey);
    if (!bridge && !input.skipBridgeMappedKeyReconciliation) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Mapped entry missing bridge row after key reconciliation',
      );
    }
    return buildMappedRecord(entry, bridge);
  });

  const mappedIdByKey = new Map<string, string>();
  for (const record of mappedRecords) {
    const key = mappedRawKey(record.mappedSourceLabel, record.mappedCodeRaw);
    if (record.ehas2MappedIndexId) {
      mappedIdByKey.set(key, record.ehas2MappedIndexId);
    }
  }

  const diseaseRecords: DiseaseIdentityRecord[] = [];
  for (const row of input.dbRows) {
    const bridgeRowsForId = bridgeByDbId.get(row.id) ?? [];
    let bridgeDisposition: string | null = null;
    const mappedIndexRefs: string[] = [];

    for (const bridge of bridgeRowsForId) {
      if (bridge.disposition === 'EXACT_UNIQUE_MATCH') {
        bridgeDisposition = bridge.disposition;
        const mappedId = mappedIdByKey.get(bridge.dedupeKey);
        if (!mappedId) {
          throw new DiseaseIdentityError(
            'MALFORMED_INPUT',
            'Missing mapped index id for EXACT_UNIQUE bridge row',
          );
        }
        mappedIndexRefs.push(mappedId);
      } else if (bridgeDisposition === null) {
        bridgeDisposition = bridge.disposition;
      }
    }

    mappedIndexRefs.sort((a, b) => a.localeCompare(b));

    const bridgeNamespaces = bridgeRowsForId
      .map((b) => normalizeMappedIdentity(b.mappedSourceLabel, b.mappedCodeRaw))
      .filter((r): r is Extract<typeof r, { ok: true }> => r.ok)
      .map((r) => r.sourceNamespace);

    diseaseRecords.push(
      buildDiseaseRecord({
        row,
        bridgeRowsForId,
        referencedInBridge: referencedDbIds.has(row.id),
        mappedIndexRefs,
        bridgeDisposition,
        namespaceResolution: resolveDbRowNamespace({
          icd10_code: row.icd10_code,
          bridgeEvidenceRows: bridgeRowsForId.map((b) => ({
            sourceLabel: b.mappedSourceLabel,
            mappedCodeRaw: b.mappedCodeRaw,
          })),
          bridgeNamespaces,
        }),
      }),
    );
  }

  diseaseRecords.sort((a, b) => a.legacyDbDiseaseId - b.legacyDbDiseaseId);

  const relationshipEdges: RelationshipEdgeRecord[] = [];
  for (const bridge of input.bridgeRows) {
    if (bridge.disposition !== 'EXACT_UNIQUE_MATCH' || bridge.candidateLegacyDbIds.length !== 1) {
      continue;
    }
    const mappedId = mappedIdByKey.get(bridge.dedupeKey);
    if (!mappedId) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Missing mapped ID for EXACT_UNIQUE relationship edge',
      );
    }
    const diseaseId = generateDiseaseCanonicalId(bridge.candidateLegacyDbIds[0]!);
    relationshipEdges.push({
      relationshipId: generateRelationshipId(mappedId, diseaseId, RELATIONSHIP_TYPE_EXACT_UNIQUE),
      ehas2MappedIndexId: mappedId,
      ehas2DiseaseId: diseaseId,
      relationshipType: RELATIONSHIP_TYPE_EXACT_UNIQUE,
      bridgeDisposition: 'EXACT_UNIQUE_MATCH',
    });
  }
  relationshipEdges.sort((a, b) => a.relationshipId.localeCompare(b.relationshipId));

  const expectedEdges =
    input.expectedRelationshipEdges ??
    (input.skipManifestReconciliation
      ? relationshipEdges.length
      : EXPECTED_RELATIONSHIP_EDGE_COUNT);
  if (!input.skipManifestReconciliation && relationshipEdges.length !== expectedEdges) {
    throw new DiseaseIdentityError(
      'MALFORMED_INPUT',
      `Expected ${expectedEdges} relationship edges, observed ${relationshipEdges.length}`,
    );
  }
  if (input.skipManifestReconciliation) {
    const exactUnique = input.bridgeRows.filter(
      (r) => r.disposition === 'EXACT_UNIQUE_MATCH',
    ).length;
    if (relationshipEdges.length !== exactUnique) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Relationship edge count must equal EXACT_UNIQUE bridge rows',
      );
    }
  }

  const unresolvedQueue: UnresolvedQueueRecord[] = [];
  for (const bridge of input.bridgeRows) {
    if (bridge.disposition === 'EXACT_UNIQUE_MATCH') {
      continue;
    }
    unresolvedQueue.push({
      queueKey: bridge.dedupeKey,
      mappedSourceLabel: bridge.mappedSourceLabel,
      mappedCodeRaw: bridge.mappedCodeRaw,
      bridgeDisposition: bridge.disposition,
      candidateLegacyDbIds: bridge.candidateLegacyDbIds,
      quarantineFlags: [...deriveBridgeQuarantineFlags(bridge.disposition)],
      engineeringReason: `FAIL_CLOSED_${bridge.disposition}`,
    });
  }
  unresolvedQueue.sort((a, b) => a.queueKey.localeCompare(b.queueKey));

  validateAndIndexRecordBatch([...diseaseRecords, ...mappedRecords] as unknown as Record<
    string,
    unknown
  >[]);

  const diseaseJsonl = serializeJsonl(
    sortRecordsById(diseaseRecords as unknown as Record<string, unknown>[], 'ehas2DiseaseId'),
  );
  const mappedJsonl = serializeJsonl(
    [...mappedRecords]
      .sort((a, b) => {
        const idA = a.ehas2MappedIndexId ?? a.rawMappedReferenceId ?? '';
        const idB = b.ehas2MappedIndexId ?? b.rawMappedReferenceId ?? '';
        return idA.localeCompare(idB);
      })
      .map((record) => record as unknown as Record<string, unknown>),
  );
  const relationshipJsonl = serializeJsonl(
    relationshipEdges.map((edge) => edge as unknown as Record<string, unknown>),
  );
  const unresolvedJsonl = serializeJsonl(
    unresolvedQueue.map((entry) => entry as unknown as Record<string, unknown>),
  );

  const buildEvidence = {
    authorityClassification: AUTHORITY_CLASSIFICATION,
    inventoryVerified: input.inventoryVerified,
    inventorySha256: input.inventorySha256 ?? null,
    artifactLogicalNames: [
      'disease-identity-ledger.jsonl',
      'mapped-index.jsonl',
      'relationship-edges.jsonl',
      'unresolved-queue.jsonl',
    ],
    generatorVersion: FULL_CORPUS_GENERATOR_VERSION,
    documentedPeakMemoryBudgetBytes: DOCUMENTED_PEAK_MEMORY_BUDGET_BYTES,
    processingModel: 'BOUNDED_STREAM_DEDUPE_ITERATE_SQLITE_JSONL',
  };
  const buildEvidenceJson = `${canonicalJsonString(buildEvidence)}\n`;
  const buildEvidenceSha256 = sha256HexLower(buildEvidenceJson);
  const buildEvidenceBytes = Buffer.byteLength(buildEvidenceJson, 'utf8');

  const artifactSpecs = [
    {
      name: 'disease-identity-ledger.jsonl',
      content: diseaseJsonl,
      rowCount: diseaseRecords.length,
    },
    { name: 'mapped-index.jsonl', content: mappedJsonl, rowCount: mappedRecords.length },
    {
      name: 'relationship-edges.jsonl',
      content: relationshipJsonl,
      rowCount: relationshipEdges.length,
    },
    { name: 'unresolved-queue.jsonl', content: unresolvedJsonl, rowCount: unresolvedQueue.length },
    {
      name: 'p2c-build-evidence.json',
      content: buildEvidenceJson,
      rowCount: 0,
    },
  ];

  const artifacts = artifactSpecs.map((spec) => ({
    name: spec.name,
    rowCount: spec.rowCount,
    sha256: sha256HexLower(spec.content),
    bytes: Buffer.byteLength(spec.content, 'utf8'),
  }));

  // Manifest excludes itself from member hashing (no circular self-hash).
  const aggregateFingerprint = sha256HexLower(
    artifacts.map((artifact) => `${artifact.name}:${artifact.sha256}`).join('|'),
  );

  const manifest = {
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

  if (!input.skipManifestReconciliation) {
    reconcileManifestCounts(manifest as never);
  }

  const manifestJson = `${canonicalJsonString(manifest)}\n`;

  const serialized: Record<string, string> = {
    'disease-identity-ledger.jsonl': diseaseJsonl,
    'mapped-index.jsonl': mappedJsonl,
    'relationship-edges.jsonl': relationshipJsonl,
    'unresolved-queue.jsonl': unresolvedJsonl,
    'bundle-manifest.json': manifestJson,
    'p2c-build-evidence.json': buildEvidenceJson,
  };

  // Sanity: build evidence hash matches artifact entry
  const evidenceArtifact = artifacts.find((a) => a.name === 'p2c-build-evidence.json');
  if (
    !evidenceArtifact ||
    evidenceArtifact.sha256 !== buildEvidenceSha256 ||
    evidenceArtifact.bytes !== buildEvidenceBytes
  ) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Build evidence hash membership mismatch');
  }

  return {
    diseaseRecords,
    mappedRecords,
    relationshipEdges,
    unresolvedQueue,
    manifest,
    buildEvidence,
    serialized,
  };
}
