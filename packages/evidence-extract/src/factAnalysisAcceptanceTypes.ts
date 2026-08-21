/** F3D-2E1 source-linked fact analysis-eligibility acceptance only. */

export const FACT_ANALYSIS_ACCEPTANCE_ACTION =
  'ACCEPT_SOURCE_LINKED_FACT_FOR_ANALYSIS_ONLY' as const;
export const FACT_ANALYSIS_ACCEPTANCE_AUTHORITY =
  'SOURCE_LINKED_FACT_ANALYSIS_ELIGIBLE_ONLY' as const;
export const FACT_ANALYSIS_ACCEPTANCE_REASON = 'SOURCE_LINKED_FACT_ANALYSIS_ACCEPTED' as const;
export const FACT_ANALYSIS_ACCEPTANCE_CONTRACT_VERSION = 'f3d2e1-analysis-acceptance-v1' as const;
export const MAX_FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_NORMS = 32;

export type FactAnalysisAcceptanceDecisionStatus = 'ACTIVE' | 'SUPERSEDED';

export type FactAnalysisAcceptanceEventDto = {
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
  verificationEventId: string;
  normalizationSnapshotFingerprint: string;
  normalizationCount: number;
  action: typeof FACT_ANALYSIS_ACCEPTANCE_ACTION;
  authorityScope: typeof FACT_ANALYSIS_ACCEPTANCE_AUTHORITY;
  reasonCode: typeof FACT_ANALYSIS_ACCEPTANCE_REASON;
  decisionStatus: FactAnalysisAcceptanceDecisionStatus;
  supersedesAcceptanceId: string | null;
  actorId: string;
  actorRole: 'Doctor';
  clinicallyUsed: false;
  acceptanceContractVersion: typeof FACT_ANALYSIS_ACCEPTANCE_CONTRACT_VERSION;
  packId: string;
  packVersion: string;
  packContentChecksum: string;
  parserVersion: string;
  parserFingerprint: string;
  normalizerMethod: string;
  normalizerVersion: string;
  normalizerFingerprint: string;
  createdAt: string;
};

export type FactAnalysisAcceptanceNormalizationDto = {
  id: string;
  acceptanceEventId: string;
  organizationId: string;
  clinicId: string;
  factCandidateId: string;
  normalizationId: string;
  normalizationIdentityFingerprint: string;
  snapshotOrdinal: number;
  createdAt: string;
};
