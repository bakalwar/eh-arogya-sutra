/**
 * F3D-1 source-linked fact-candidate contracts.
 * Candidates are not clinical truth, disease IDs, or treatment authority.
 */

import type { SourceLocator } from './types.js';

export const F3D_FACT_CANDIDATE_FOUNDATION = true as const;

export const FACT_CANDIDATE_CHANNELS = [
  'DOCTOR_DECLARED',
  'STRUCTURED_INTAKE',
  'REVIEWED_REPORT_TEXT',
] as const;
export type FactCandidateChannel = (typeof FACT_CANDIDATE_CHANNELS)[number];

export const FACT_CANDIDATE_CATEGORIES = [
  'SYMPTOM',
  'SIGN',
  'VITAL',
  'LAB_OBSERVATION',
  'IMAGING_REPORT_STATEMENT',
  'SOURCE_STATED_DIAGNOSIS',
  'MEDICATION_HISTORY_STATEMENT',
  'ALLERGY_STATEMENT',
  'NEGATED_FINDING',
] as const;
export type FactCandidateCategory = (typeof FACT_CANDIDATE_CATEGORIES)[number];

export const FACT_CANDIDATE_SOURCE_FIELDS = [
  'CHIEF_COMPLAINT',
  'SYMPTOM_ROW',
  'DOCTOR_OBSERVATIONS',
  'HISTORY_NOTES',
  'VITAL_BP_SYSTOLIC',
  'VITAL_BP_DIASTOLIC',
  'VITAL_PULSE',
  'VITAL_TEMPERATURE',
  'VITAL_SPO2',
  'VITAL_WEIGHT',
  'VITAL_HEIGHT',
  'REVIEWED_EXTRACTION_CANDIDATE',
] as const;
export type FactCandidateSourceField = (typeof FACT_CANDIDATE_SOURCE_FIELDS)[number];

export const FACT_CANDIDATE_AUTHORITY_STATUSES = [
  'FACT_CANDIDATE_UNVERIFIED',
  'FACT_NORMALIZED_SOURCE_LINKED',
] as const;
export type FactCandidateAuthorityStatus = (typeof FACT_CANDIDATE_AUTHORITY_STATUSES)[number];

export const FACT_CANDIDATE_F3D1_AUTHORITY = 'FACT_CANDIDATE_UNVERIFIED' as const;

export const FACT_CANDIDATE_DECISION_STATUSES = ['ACTIVE', 'SUPERSEDED'] as const;
export type FactCandidateDecisionStatus = (typeof FACT_CANDIDATE_DECISION_STATUSES)[number];

export const FACT_UNIT_POSTURES = ['NOT_APPLICABLE', 'EXACT_AS_SOURCE', 'UNRESOLVED_UNIT'] as const;
export type FactUnitPosture = (typeof FACT_UNIT_POSTURES)[number];

export const FACT_NORMALIZATION_METHOD_F3D1 = 'NONE' as const;
export const FACT_NORMALIZATION_VERSION_F3D1 = 'none' as const;
/** sha256('F3D1_NORMALIZATION_NONE') — no terminology/NLP applied. */
export const FACT_NORMALIZATION_FINGERPRINT_F3D1 =
  '793676c471de3ea0d266c258cea95db43195c82702c8642269d17cc2b57dad7a' as const;

export const FACT_LIMITATION_CODES = [
  'SYNTHETIC_FIXTURE_ONLY',
  'NOT_AUTHORITATIVE',
  'NO_NORMALIZATION',
  'UNRESOLVED_UNIT',
  'SOURCE_DECLARED_ONLY',
  'TRANSCRIPTION_ONLY',
  'NO_DISEASE_MAPPING',
  'NO_CLINICAL_VERIFICATION',
] as const;
export type FactLimitationCode = (typeof FACT_LIMITATION_CODES)[number];

export const FACT_SELECTOR_FORBIDDEN_FIELD_NAMES = [
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

export type FactCandidateDto = {
  id: string;
  organizationId: string;
  clinicId: string;
  patientId: string;
  consultationId: string;
  sourceChannel: FactCandidateChannel;
  factCategory: FactCandidateCategory;
  sourceField: FactCandidateSourceField;
  intakeSymptomId: string | null;
  evidenceItemId: string | null;
  extractionRunId: string | null;
  extractionCandidateId: string | null;
  reviewEventId: string | null;
  originalSourceSpan: string;
  assertedText: string | null;
  assertedValue: string | null;
  unitText: string | null;
  unitPosture: FactUnitPosture;
  negated: boolean;
  durationText: string | null;
  onsetText: string | null;
  sourceLocator: SourceLocator | null;
  sourceIdentityFingerprint: string;
  contentFingerprint: string;
  limitationCodes: readonly FactLimitationCode[];
  confidence: number | null;
  normalizationMethod: typeof FACT_NORMALIZATION_METHOD_F3D1;
  normalizationVersion: typeof FACT_NORMALIZATION_VERSION_F3D1;
  normalizationFingerprint: string;
  authorityStatus: typeof FACT_CANDIDATE_F3D1_AUTHORITY;
  decisionStatus: FactCandidateDecisionStatus;
  supersedesFactId: string | null;
  clinicallyUsed: false;
  actorId: string;
  actorRole: 'Doctor' | 'ClinicAdmin';
  createdAt: string;
};
