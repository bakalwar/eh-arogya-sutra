/** F3D-2D5 clinical fact-verification types — representation review only. */

export const FACT_VERIFICATION_AUTHORITY_SCOPE = 'SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY' as const;

export const FACT_VERIFICATION_ACTIONS = [
  'ACCEPT_SOURCE_LINKED_FACT',
  'REJECT_SOURCE_LINKED_FACT',
  'MARK_UNRESOLVED',
  'REQUEST_SOURCE_CORRECTION',
] as const;

export type FactVerificationAction = (typeof FACT_VERIFICATION_ACTIONS)[number];

export const FACT_VERIFICATION_REASON_CODES = [
  'SOURCE_REPRESENTATION_REVIEWED',
  'SOURCE_REPRESENTATION_INACCURATE',
  'SOURCE_STALE_OR_CONFLICTING',
  'INSUFFICIENT_SOURCE_CONTEXT',
  'NORMALIZATION_SCOPE_UNRESOLVED',
  'SOURCE_TEXT_CORRECTION_REQUIRED',
  'SOURCE_VALUE_CORRECTION_REQUIRED',
] as const;

export type FactVerificationReasonCode = (typeof FACT_VERIFICATION_REASON_CODES)[number];

export const FACT_VERIFICATION_ACTION_REASON_CODES: Record<
  FactVerificationAction,
  readonly FactVerificationReasonCode[]
> = {
  ACCEPT_SOURCE_LINKED_FACT: ['SOURCE_REPRESENTATION_REVIEWED'],
  REJECT_SOURCE_LINKED_FACT: ['SOURCE_REPRESENTATION_INACCURATE', 'SOURCE_STALE_OR_CONFLICTING'],
  MARK_UNRESOLVED: ['INSUFFICIENT_SOURCE_CONTEXT', 'NORMALIZATION_SCOPE_UNRESOLVED'],
  REQUEST_SOURCE_CORRECTION: [
    'SOURCE_TEXT_CORRECTION_REQUIRED',
    'SOURCE_VALUE_CORRECTION_REQUIRED',
  ],
};

export const MAX_FACT_VERIFICATION_SNAPSHOT_NORMS = 32;

export type FactVerificationDecisionStatus = 'ACTIVE' | 'SUPERSEDED';

export type FactVerificationEventDto = {
  id: string;
  organizationId: string;
  clinicId: string;
  patientId: string;
  consultationId: string;
  factCandidateId: string;
  sourceChannel: string;
  sourceField: string;
  sourceIdentityFingerprint: string;
  contentFingerprint: string;
  normalizationSnapshotFingerprint: string;
  normalizationCount: number;
  action: FactVerificationAction;
  reasonCode: FactVerificationReasonCode;
  authorityScope: typeof FACT_VERIFICATION_AUTHORITY_SCOPE;
  decisionStatus: FactVerificationDecisionStatus;
  supersedesVerificationId: string | null;
  actorId: string;
  actorRole: 'Doctor';
  clinicallyUsed: false;
  createdAt: string;
};

export type FactVerificationNormalizationDto = {
  id: string;
  verificationEventId: string;
  organizationId: string;
  clinicId: string;
  factCandidateId: string;
  normalizationId: string;
  normalizationIdentityFingerprint: string;
  snapshotOrdinal: number;
  createdAt: string;
};
