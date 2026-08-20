/**
 * F3D-2D0/2D1 fact-normalization child-event contracts.
 * Persistence foundation only — no normalizer execution, no clinical authority.
 */

export const F3D2D_FACT_NORMALIZATION_FOUNDATION = true as const;
export const F3D2D_NORMALIZER_CONNECTED = false as const;
export const F3D2D_PRODUCTION_ENABLED = false as const;

/** Child-event authority only. Never upgrades parent F3D-1 fact authority. */
export const FACT_NORMALIZATION_AUTHORITY_SCOPE = 'FACT_NORMALIZED_SOURCE_LINKED' as const;

export const FACT_NORMALIZATION_KINDS = ['UNIT_ALIAS', 'DURATION_PHRASE', 'NEGATION_CUE'] as const;
export type FactNormalizationKind = (typeof FACT_NORMALIZATION_KINDS)[number];

export const FACT_NORMALIZATION_NEGATION_SCOPE = 'SCOPE_UNRESOLVED' as const;

export const FACT_NORMALIZATION_METHODS = ['OWNER_FROZEN_SOURCE_PRESERVING_V1'] as const;
export type FactNormalizationMethod = (typeof FACT_NORMALIZATION_METHODS)[number];

export const FACT_NORMALIZATION_DECISION_STATUSES = ['ACTIVE', 'SUPERSEDED'] as const;
export type FactNormalizationDecisionStatus = (typeof FACT_NORMALIZATION_DECISION_STATUSES)[number];

export const FACT_NORMALIZATION_LIMITATION_CODES = [
  'NOT_AUTHORITATIVE',
  'NO_CLINICAL_VERIFICATION',
  'NO_DISEASE_MAPPING',
  'SOURCE_LINKED_NORMALIZATION_ONLY',
  'SCOPE_UNRESOLVED',
  'SYNTHETIC_FIXTURE_ONLY',
  'NO_UNIT_CONVERSION',
  'RECOMPUTE_CUES_FROM_SOURCE',
] as const;
export type FactNormalizationLimitationCode = (typeof FACT_NORMALIZATION_LIMITATION_CODES)[number];

/** Contract pin: parent fact SUPERSEDED must supersede linked ACTIVE norms in the same tx when a writer exists. */
export const F3D2D_PARENT_FACT_SUPERSEDE_PROPAGATES_NORMALIZATIONS = true as const;

/** Contract pin: individual cue-match rows are not persisted; recompute from source+pack+parser. */
export const F3D2D_CUE_MATCH_ROWS_PERSISTED = false as const;

export const FACT_NORMALIZATION_SELECTOR_FORBIDDEN_FIELD_NAMES = [
  'medicineCode',
  'medicine_code',
  'formula',
  'oralFormula',
  'potency',
  'dose',
  'dosage',
  'diseaseId',
  'disease_id',
  'selectedDisease',
  'analyzeComplete',
  'verified',
  'severity',
  'polarity',
  'temperament',
  'constitution',
] as const;

export type FactNormalizationDto = {
  id: string;
  organizationId: string;
  clinicId: string;
  patientId: string;
  consultationId: string;
  sourceFactCandidateId: string;
  sourceIdentityFingerprint: string;
  normalizationIdentityFingerprint: string;
  sourceChannel: string;
  sourceField: string;
  normalizationKind: FactNormalizationKind;
  canonicalLabel: string;
  negationScope: typeof FACT_NORMALIZATION_NEGATION_SCOPE | null;
  cueEntryIds: readonly string[];
  packId: string;
  packVersion: string;
  packContentChecksum: string;
  parserVersion: string;
  parserFingerprint: string;
  normalizerMethod: FactNormalizationMethod;
  normalizerVersion: string;
  normalizerFingerprint: string;
  authorityScope: typeof FACT_NORMALIZATION_AUTHORITY_SCOPE;
  decisionStatus: FactNormalizationDecisionStatus;
  supersedesNormalizationId: string | null;
  limitationCodes: readonly FactNormalizationLimitationCode[];
  clinicallyUsed: false;
  actorId: string;
  actorRole: 'Doctor' | 'ClinicAdmin';
  createdAt: string;
};
