import type { CanonicalNamespace } from './constants.js';

export type DiseaseCanonicalIdentityInput = {
  readonly algorithm: 'EHAS2_CANONICAL_DISEASE_ID_v1_SHA256';
  readonly legacyAuthority: 'EHAS2_PINNED_LEGACY_DISEASE_DB_V1';
  readonly legacyDbDiseaseId: number;
  readonly recordKind: 'LEGACY_DB_ROW';
};

export type MappedCanonicalIdentityInput = {
  readonly algorithm: 'EHAS2_MAPPED_IDENTITY_KEY_v1_SHA256';
  readonly recordKind: 'MAPPED_CODE_INDEX';
  readonly sourceNamespace: CanonicalNamespace;
  readonly sourceCode: string;
};

export type RelationshipCanonicalIdentityInput = {
  readonly algorithm: 'EHAS2_IDENTITY_RELATIONSHIP_v1_SHA256';
  readonly ehas2MappedIndexId: string;
  readonly ehas2DiseaseId: string;
  readonly relationshipType: string;
};

export type RawMappedReferenceInput = {
  readonly algorithm: 'EHAS2_UNNORMALIZABLE_MAPPED_RAW_v1_SHA256';
  readonly recordKind: 'UNNORMALIZABLE_MAPPED_RAW';
  readonly mappedCodeRaw: string;
  readonly mappedSourceLabel: string;
};

export type NormalizationResult =
  | {
      readonly ok: true;
      readonly sourceNamespace: CanonicalNamespace;
      readonly sourceCode: string;
      readonly normalizedIdentityKey: string;
    }
  | {
      readonly ok: false;
      readonly reason: 'INVALID_NAMESPACE' | 'INVALID_CODE';
    };

export type ProvenanceVariant = {
  readonly mappedCodeRaw: string;
  readonly mappedSourceLabel: string;
};

export type DiseaseIdentityRecord = {
  readonly ehas2DiseaseId: string;
  readonly ledgerSchemaVersion: string;
  readonly recordKind: 'LEGACY_DB_ROW';
  readonly legacyAuthority: string;
  readonly legacyDbDiseaseId: number;
  readonly sourceNamespace: CanonicalNamespace | null;
  readonly sourceCode: string | null;
  readonly normalizedIdentityKey: string | null;
  readonly relationshipState: string;
  readonly bridgeDisposition: string | null;
  readonly mappedIndexRefs: readonly string[];
  readonly candidateLegacyDbIds: readonly number[];
  readonly quarantineFlags: readonly string[];
  readonly reviewRequiredUnclassified: boolean;
  readonly provenance: Record<string, string>;
  readonly recordFingerprint: string;
  readonly lifecycleStatus: string;
};

export type MappedIdentityIndexRecord = {
  readonly ehas2MappedIndexId: string | null;
  readonly rawMappedReferenceId: string | null;
  readonly mappedCodeRaw: string;
  readonly mappedSourceLabel: string;
  readonly sourceNamespace: CanonicalNamespace | null;
  readonly sourceCode: string | null;
  readonly normalizedIdentityKey: string | null;
  readonly bridgeDisposition: string | null;
  readonly relationshipState: string;
  readonly linkedEhas2DiseaseIds: readonly string[];
  readonly candidateLegacyDbIds: readonly number[];
  readonly provenanceVariants: readonly ProvenanceVariant[];
  readonly quarantineFlags: readonly string[];
  readonly reviewRequiredUnclassified: boolean;
  readonly provenance: Record<string, string>;
  readonly recordFingerprint: string;
};

export type BundleManifestArtifact = {
  readonly name: string;
  readonly rowCount: number;
  readonly sha256: string;
  readonly bytes: number;
};

export type BundleManifestTemplate = {
  readonly bundleSchemaVersion: string;
  readonly datasetVersion: string;
  readonly authorityClassification: string;
  readonly licensingClassification: string;
  readonly canonicalIdAlgorithms: readonly string[];
  readonly inputEvidenceHashes: Record<string, string>;
  readonly generatorVersion: string;
  readonly artifacts: readonly BundleManifestArtifact[];
  readonly aggregateFingerprint: string;
  readonly reconciliation: Record<string, number>;
};
