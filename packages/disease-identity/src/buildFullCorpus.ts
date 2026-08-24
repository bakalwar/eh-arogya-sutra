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
import type { ParsedBridgeRow } from './bridgeIngest.js';
import type { MappedDedupeEntry } from './mappedIngest.js';
import { mappedRawKey, resolveDbRowNamespace } from './namespaceResolution.js';
import type { LegacyDbRow } from './sqlitePrivacy.js';
import { APPROVED_AGGREGATE_COUNTS, BUNDLE_SCHEMA_VERSION } from './constants.js';
import {
  FULL_CORPUS_GENERATOR_VERSION,
  PRIVATE_ENGINEERING_LICENSING_CLASSIFICATION,
  RELATIONSHIP_TYPE_EXACT_UNIQUE,
} from './fullCorpusConstants.js';
import { serializeJsonl, sortRecordsById, reconcileManifestCounts } from './manifest.js';
import { validateAndIndexRecordBatch } from './batchValidate.js';
import { sha256HexLower } from './canonicalJson.js';
import type { DiseaseIdentityRecord, MappedIdentityIndexRecord } from './types.js';

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
}): FullCorpusBuildArtifacts {
  const bridgeByKey = new Map(input.bridgeRows.map((row) => [row.dedupeKey, row]));
  const bridgeByDbId = new Map<number, ParsedBridgeRow[]>();
  const referencedDbIds = new Set<number>();

  for (const row of input.bridgeRows) {
    for (const id of row.candidateLegacyDbIds) {
      referencedDbIds.add(id);
      const bucket = bridgeByDbId.get(id) ?? [];
      bucket.push(row);
      bridgeByDbId.set(id, bucket);
    }
  }

  const mappedRecords = input.mappedEntries.map((entry) =>
    buildMappedRecord(entry, bridgeByKey.get(entry.dedupeKey)),
  );

  const mappedIdByKey = new Map<string, string>();
  for (const record of mappedRecords) {
    if (record.ehas2MappedIndexId) {
      mappedIdByKey.set(
        mappedRawKey(record.mappedSourceLabel, record.mappedCodeRaw),
        record.ehas2MappedIndexId,
      );
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
        if (mappedId) {
          mappedIndexRefs.push(mappedId);
        }
      } else if (bridgeDisposition === null) {
        bridgeDisposition = bridge.disposition;
      }
    }

    mappedIndexRefs.sort((a, b) => a.localeCompare(b));

    const bridgeNamespaces = bridgeRowsForId
      .map((b) => normalizeMappedIdentity(b.mappedSourceLabel, b.mappedCodeRaw))
      .filter((r): r is Extract<typeof r, { ok: true }> => r.ok)
      .map((r) => r.sourceNamespace);

    const primaryBridge = bridgeRowsForId.find((b) => b.disposition === 'EXACT_UNIQUE_MATCH');

    diseaseRecords.push(
      buildDiseaseRecord({
        row,
        bridgeRowsForId,
        referencedInBridge: referencedDbIds.has(row.id),
        mappedIndexRefs,
        bridgeDisposition,
        namespaceResolution: resolveDbRowNamespace({
          icd10_code: row.icd10_code,
          bridgeSourceLabel: primaryBridge?.mappedSourceLabel ?? null,
          bridgeMappedCodeRaw: primaryBridge?.mappedCodeRaw ?? null,
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
      continue;
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
  const relationshipJsonl = `${relationshipEdges.map((edge) => JSON.stringify(edge)).join('\n')}\n`;
  const unresolvedJsonl = `${unresolvedQueue.map((entry) => JSON.stringify(entry)).join('\n')}\n`;

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
  ];

  const artifacts = artifactSpecs.map((spec) => ({
    name: spec.name,
    rowCount: spec.rowCount,
    sha256: sha256HexLower(spec.content),
    bytes: Buffer.byteLength(spec.content, 'utf8'),
  }));

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

  const buildEvidence = {
    authorityClassification: AUTHORITY_CLASSIFICATION,
    inventoryVerified: input.inventoryVerified,
    inventorySha256: input.inventorySha256 ?? null,
    artifactLogicalNames: artifactSpecs.map((spec) => spec.name),
    aggregateFingerprint,
  };

  const serialized: Record<string, string> = {
    'disease-identity-ledger.jsonl': diseaseJsonl,
    'mapped-index.jsonl': mappedJsonl,
    'relationship-edges.jsonl': relationshipJsonl,
    'unresolved-queue.jsonl': unresolvedJsonl,
    'bundle-manifest.json': `${JSON.stringify(manifest, null, 2)}\n`,
    'p2c-build-evidence.json': `${JSON.stringify(buildEvidence, null, 2)}\n`,
  };

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
