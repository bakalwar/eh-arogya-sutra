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
  deriveDisplayQuarantineFlags,
  mergeStructuralFlags,
  reviewRequiredUnclassifiedDefault,
} from './quarantine.js';
import type {
  DiseaseIdentityRecord,
  MappedIdentityIndexRecord,
  ProvenanceVariant,
} from './types.js';

function sortProvenanceVariants(variants: readonly ProvenanceVariant[]): ProvenanceVariant[] {
  return [...variants].sort((a, b) => {
    const labelCmp = a.mappedSourceLabel.localeCompare(b.mappedSourceLabel);
    return labelCmp !== 0 ? labelCmp : a.mappedCodeRaw.localeCompare(b.mappedCodeRaw);
  });
}

export type SyntheticDiseaseInput = {
  readonly legacyDbDiseaseId: number;
  readonly sourceLabel: string;
  readonly sourceCodeRaw: string;
  readonly nameEnglish?: string;
  readonly nameHindi?: string;
  readonly bridgeDisposition?: string | null;
  readonly mappedIndexRefs?: readonly string[];
  readonly candidateLegacyDbIds?: readonly number[];
  readonly isDbOnly?: boolean;
  readonly codeWithoutMappedParent?: boolean;
};

export type SyntheticMappedInput = {
  readonly mappedCodeRaw: string;
  readonly mappedSourceLabel: string;
  readonly bridgeDisposition?: string | null;
  readonly candidateLegacyDbIds?: readonly number[];
  readonly linkedEhas2DiseaseIds?: readonly string[];
  readonly provenanceVariants?: readonly ProvenanceVariant[];
};

export function buildSyntheticDiseaseRecord(input: SyntheticDiseaseInput): DiseaseIdentityRecord {
  const normalized = normalizeMappedIdentity(input.sourceLabel, input.sourceCodeRaw);
  const ehas2DiseaseId = generateDiseaseCanonicalId(input.legacyDbDiseaseId);
  const invalidFlags: string[] = [];
  if (!normalized.ok) {
    if (normalized.reason === 'INVALID_NAMESPACE') {
      invalidFlags.push('Q_IDENTITY_INVALID_NAMESPACE');
    }
    if (normalized.reason === 'INVALID_CODE') {
      invalidFlags.push('Q_IDENTITY_INVALID_CODE');
    }
  }
  const quarantineFlags = mergeStructuralFlags(
    invalidFlags,
    deriveBridgeQuarantineFlags(input.bridgeDisposition),
    deriveDisplayQuarantineFlags(input.nameEnglish ?? '', input.nameHindi ?? ''),
    deriveDbOnlyFlags(Boolean(input.isDbOnly), Boolean(input.codeWithoutMappedParent)),
  );

  const candidateLegacyDbIds = [...(input.candidateLegacyDbIds ?? [input.legacyDbDiseaseId])].sort(
    (a, b) => a - b,
  );

  const base: DiseaseIdentityRecord = {
    ehas2DiseaseId,
    ledgerSchemaVersion: LEDGER_SCHEMA_VERSION,
    recordKind: 'LEGACY_DB_ROW',
    legacyAuthority: LEGACY_AUTHORITY,
    legacyDbDiseaseId: input.legacyDbDiseaseId,
    sourceNamespace: normalized.ok ? normalized.sourceNamespace : null,
    sourceCode: normalized.ok ? normalized.sourceCode : null,
    normalizedIdentityKey: normalized.ok ? normalized.normalizedIdentityKey : null,
    relationshipState: input.isDbOnly ? 'LEGACY_DB_UNLINKED' : 'LEGACY_DB_LINKED',
    bridgeDisposition: input.bridgeDisposition ?? null,
    mappedIndexRefs: [...(input.mappedIndexRefs ?? [])],
    candidateLegacyDbIds,
    quarantineFlags,
    reviewRequiredUnclassified: reviewRequiredUnclassifiedDefault(),
    provenance: {
      authorityClassification: AUTHORITY_CLASSIFICATION,
      datasetVersion: DATASET_VERSION,
    },
    recordFingerprint: '',
    lifecycleStatus: 'INVENTORY_ENGINEERING',
  };

  const recordFingerprint = computeRecordFingerprint(
    buildDiseaseRecordFingerprintInput(base as unknown as Record<string, unknown>),
  );
  return { ...base, recordFingerprint };
}

export function buildSyntheticMappedRecord(input: SyntheticMappedInput): MappedIdentityIndexRecord {
  const normalized = normalizeMappedIdentity(input.mappedSourceLabel, input.mappedCodeRaw);
  const candidateLegacyDbIds = [...(input.candidateLegacyDbIds ?? [])].sort((a, b) => a - b);

  let ehas2MappedIndexId: string | null = null;
  let rawMappedReferenceId: string | null = null;
  const invalidFlags: string[] = [];
  if (normalized.ok) {
    ehas2MappedIndexId = generateMappedIndexId(normalized.sourceNamespace, normalized.sourceCode);
  } else {
    rawMappedReferenceId = generateRawMappedReferenceId(
      input.mappedCodeRaw,
      input.mappedSourceLabel,
    );
    invalidFlags.push('Q_MAPPED_UNNORMALIZABLE_RAW');
    if (normalized.reason === 'INVALID_NAMESPACE') {
      invalidFlags.push('Q_IDENTITY_INVALID_NAMESPACE');
    }
    if (normalized.reason === 'INVALID_CODE') {
      invalidFlags.push('Q_IDENTITY_INVALID_CODE');
    }
  }

  const quarantineFlags = mergeStructuralFlags(
    invalidFlags,
    deriveBridgeQuarantineFlags(input.bridgeDisposition),
  );

  const base: MappedIdentityIndexRecord = {
    ehas2MappedIndexId,
    rawMappedReferenceId,
    mappedCodeRaw: input.mappedCodeRaw,
    mappedSourceLabel: input.mappedSourceLabel,
    sourceNamespace: normalized.ok ? normalized.sourceNamespace : null,
    sourceCode: normalized.ok ? normalized.sourceCode : null,
    normalizedIdentityKey: normalized.ok ? normalized.normalizedIdentityKey : null,
    bridgeDisposition: input.bridgeDisposition ?? null,
    relationshipState:
      input.bridgeDisposition === 'NO_MATCH' ? 'UNLINKED_MAPPED_CODE' : 'MAPPED_INDEX',
    linkedEhas2DiseaseIds: [...(input.linkedEhas2DiseaseIds ?? [])],
    candidateLegacyDbIds,
    provenanceVariants: sortProvenanceVariants(
      input.provenanceVariants ?? [
        { mappedCodeRaw: input.mappedCodeRaw, mappedSourceLabel: input.mappedSourceLabel },
      ],
    ),
    quarantineFlags,
    reviewRequiredUnclassified: reviewRequiredUnclassifiedDefault(),
    provenance: {
      authorityClassification: AUTHORITY_CLASSIFICATION,
      datasetVersion: DATASET_VERSION,
    },
    recordFingerprint: '',
  };

  const recordFingerprint = computeRecordFingerprint(
    buildMappedRecordFingerprintInput(base as unknown as Record<string, unknown>),
  );
  return { ...base, recordFingerprint };
}
