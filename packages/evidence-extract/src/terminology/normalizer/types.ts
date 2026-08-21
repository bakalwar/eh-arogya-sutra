/**
 * F3D-2D2 pure in-memory source-preserving normalizer contracts.
 * Drafts only — no database, locks, HTTP, or clinical authority.
 */

import type { CueParserResult } from '../parser/types.js';
import type {
  FactNormalizationKind,
  FactNormalizationLimitationCode,
  FactNormalizationMethod,
} from '../../factNormalizationTypes.js';
import {
  FACT_NORMALIZATION_AUTHORITY_SCOPE,
  FACT_NORMALIZATION_METHODS,
  FACT_NORMALIZATION_NEGATION_SCOPE,
} from '../../factNormalizationTypes.js';

export const F3D2D2_DETERMINISTIC_NORMALIZER_FOUNDATION = true as const;
export const F3D2D2_PERSISTENCE_CONNECTED = false as const;
export const F3D2D2_PRODUCTION_WRITER_CONNECTED = false as const;

export const FACT_NORMALIZER_METHOD: FactNormalizationMethod = FACT_NORMALIZATION_METHODS[0];
export const FACT_NORMALIZER_VERSION = 'f3d2d2-src-norm-v1' as const;
/** Identity canonicalization contract id bound into normalizerFingerprint. */
export const FACT_NORMALIZATION_IDENTITY_CANONICALIZATION =
  'ehas2-fact-normalization-identity-v1' as const;

export const MAX_NORMALIZER_DRAFTS = 32;
export const MAX_DRAFT_CUE_ENTRY_IDS = 8;
export const MAX_SOURCE_REF_CHARS = 128;
export const MAX_ASSERTED_VALUE_CHARS = 64;
export const MAX_UNIT_TEXT_CHARS = 32;
export const MAX_ELIGIBLE_TEXT_CHARS = 2000;

export const NORMALIZER_CUE_SOURCE_COMBINATIONS = [
  { sourceChannel: 'DOCTOR_DECLARED', sourceField: 'CHIEF_COMPLAINT' },
  { sourceChannel: 'DOCTOR_DECLARED', sourceField: 'SYMPTOM_ROW' },
  { sourceChannel: 'DOCTOR_DECLARED', sourceField: 'DOCTOR_OBSERVATIONS' },
  { sourceChannel: 'DOCTOR_DECLARED', sourceField: 'HISTORY_NOTES' },
  { sourceChannel: 'REVIEWED_REPORT_TEXT', sourceField: 'REVIEWED_EXTRACTION_CANDIDATE' },
] as const;

export const NORMALIZER_STRUCTURED_VITAL_FIELDS = [
  'VITAL_BP_SYSTOLIC',
  'VITAL_BP_DIASTOLIC',
  'VITAL_PULSE',
  'VITAL_TEMPERATURE',
  'VITAL_SPO2',
  'VITAL_WEIGHT',
  'VITAL_HEIGHT',
] as const;

export type NormalizerStructuredVitalField = (typeof NORMALIZER_STRUCTURED_VITAL_FIELDS)[number];

export const NORMALIZER_UNIT_POSTURES = [
  'NOT_APPLICABLE',
  'EXACT_AS_SOURCE',
  'UNRESOLVED_UNIT',
] as const;
export type NormalizerUnitPosture = (typeof NORMALIZER_UNIT_POSTURES)[number];

export const NORMALIZER_FAILURE_CODES = [
  'INVALID_INPUT',
  'MALFORMED_UNICODE',
  'SOURCE_TOO_LARGE',
  'PACK_INVALID',
  'PACK_CHECKSUM_MISMATCH',
  'PARSER_FAILED',
  'PARSER_TIMEOUT',
  'TOO_MANY_MATCHES',
  'AMBIGUOUS_OVERLAP',
  'UNSUPPORTED_SOURCE_COMBINATION',
  'DRAFT_CAP_OVERFLOW',
] as const;
export type NormalizerFailureCode = (typeof NORMALIZER_FAILURE_CODES)[number];

export const NORMALIZER_SUCCESS_REASONS = ['NORMALIZED', 'NO_MATCHES'] as const;
export type NormalizerSuccessReason = (typeof NORMALIZER_SUCCESS_REASONS)[number];

/** Keys rejected on any closed normalizer input object. */
export const NORMALIZER_FORBIDDEN_INPUT_KEYS = [
  'authority',
  'authorityScope',
  'authorityStatus',
  'clinicallyUsed',
  'clinically_used',
  'decisionStatus',
  'actor',
  'actorId',
  'actorRole',
  'organizationId',
  'clinicId',
  'patientId',
  'consultationId',
  'diseaseId',
  'disease_id',
  'selectedDisease',
  'medicineCode',
  'medicine_code',
  'medicineId',
  'formula',
  'oralFormula',
  'potency',
  'dose',
  'dosage',
  'severity',
  'temperament',
  'constitution',
  'organSystem',
  'analyzeComplete',
  'verified',
  'polarity',
  'negated',
  'structuredFindings',
] as const;

export type FactNormalizationDraft = {
  readonly sourceRef: string;
  readonly sourceIdentityFingerprint: string;
  readonly normalizationKind: FactNormalizationKind;
  readonly canonicalLabel: string;
  readonly negationScope: typeof FACT_NORMALIZATION_NEGATION_SCOPE | null;
  readonly cueEntryIds: readonly string[];
  readonly normalizationIdentityFingerprint: string;
  readonly packId: string;
  readonly packVersion: string;
  readonly packContentChecksum: string;
  readonly parserVersion: string;
  readonly parserFingerprint: string;
  readonly normalizerMethod: typeof FACT_NORMALIZER_METHOD;
  readonly normalizerVersion: typeof FACT_NORMALIZER_VERSION;
  readonly normalizerFingerprint: string;
  readonly limitationCodes: readonly FactNormalizationLimitationCode[];
  readonly authorityScope: typeof FACT_NORMALIZATION_AUTHORITY_SCOPE;
  readonly clinicallyUsed: false;
  readonly selectorProhibition: 'SELECTOR_FORBIDDEN';
};

export type NormalizeCueResultInput = {
  readonly mode: 'CUE_RESULT';
  readonly sourceRef: string;
  readonly sourceChannel: string;
  readonly sourceField: string;
  readonly sourceIdentityFingerprint: string;
  readonly parserResult: CueParserResult;
};

export type NormalizeStructuredUnitInput = {
  readonly mode: 'STRUCTURED_UNIT';
  readonly sourceRef: string;
  readonly sourceChannel: 'STRUCTURED_INTAKE';
  readonly sourceField: NormalizerStructuredVitalField;
  readonly sourceIdentityFingerprint: string;
  readonly assertedValueText?: string;
  readonly unitText: string;
  readonly unitPosture: NormalizerUnitPosture;
};

export type NormalizeSourceLinkedFactInput = NormalizeCueResultInput | NormalizeStructuredUnitInput;

export type NormalizeSourceLinkedFactSuccess = {
  readonly ok: true;
  readonly drafts: readonly FactNormalizationDraft[];
  readonly reason: NormalizerSuccessReason;
};

export type NormalizeSourceLinkedFactFailure = {
  readonly ok: false;
  readonly drafts: readonly [];
  readonly reason: NormalizerFailureCode;
};

export type NormalizeSourceLinkedFactResult =
  NormalizeSourceLinkedFactSuccess | NormalizeSourceLinkedFactFailure;
