import type { Rule6CandidateState, Rule6Outcome } from './constants.js';
import {
  RULE6_INPUT_CONTRACT_VERSION,
  RULE6_OUTPUT_CONTRACT_VERSION,
  RULE6_RULE_IDENTITY,
  RULE6_RULE_NUMBER,
} from './version.js';

export type Rule6UpstreamRef = {
  readonly refId: string;
  readonly status: string;
  readonly version: string;
};

export type Rule6SeverityRef =
  | { readonly status: 'UNAVAILABLE' }
  | { readonly refId: string; readonly status: string; readonly version: string };

export type Rule6EvidenceDataVersions = {
  readonly medicineDataVersion: string;
  readonly diseaseDataVersion: string;
  readonly evidenceDataVersion: string;
  readonly contractVersion: string;
};

export type Rule6UpstreamApplicability = {
  readonly status: string;
  readonly notes: readonly string[];
};

export type Rule6RelationshipEdge = {
  readonly edgeId: string;
  readonly sourceMedicineId: string;
  readonly targetMedicineIdOrSet: string | readonly string[];
  readonly directionality: 'DIRECTED' | 'UNDIRECTED';
  readonly relationshipType: string;
  readonly applicabilityConditions: readonly string[];
  readonly prohibitionConditions: readonly string[];
  readonly evidenceSourceId: string;
  readonly evidenceValidationStatus: string;
  readonly ownerClinicalApprovalStatus: string;
  readonly version: string;
  readonly effectiveStatus: string;
  readonly supersessionMetadata: string | null;
};

export type Rule6RelationshipEvidenceRegistry = {
  readonly registryVersion: string;
  readonly edges: readonly Rule6RelationshipEdge[];
};

export type Rule6Input = {
  readonly contractVersion: typeof RULE6_INPUT_CONTRACT_VERSION;
  readonly requestId: string;
  readonly diseaseConditionRefs: readonly string[];
  readonly clinicalTargetRefs: readonly string[];
  readonly rule1TemperamentRef: Rule6UpstreamRef;
  readonly rule3OrganSystemRef: Rule6UpstreamRef;
  readonly severityRef: Rule6SeverityRef;
  readonly candidateMedicinePool: readonly string[];
  readonly relationshipEvidenceRegistry: Rule6RelationshipEvidenceRegistry;
  readonly safetyExclusionRefs: readonly string[];
  readonly evidenceDataVersions: Rule6EvidenceDataVersions;
  readonly upstreamApplicability: Rule6UpstreamApplicability;
};

export type Rule6CandidateEvaluation = {
  readonly medicineId: string;
  readonly state: Rule6CandidateState;
  readonly reasonCodes: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly edgeIds: readonly string[];
};

export type Rule6CompositionCandidate = {
  readonly compositionId: string;
  readonly medicineIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly relationshipEdgeIds: readonly string[];
  readonly targetOrSystemReasons: readonly string[];
  readonly rejectionOrBlockerInfo: readonly string[];
  readonly rule9ValidationRequired: true;
};

export type Rule6Output = {
  readonly contractVersion: typeof RULE6_OUTPUT_CONTRACT_VERSION;
  readonly ruleNumber: typeof RULE6_RULE_NUMBER;
  readonly ruleIdentity: typeof RULE6_RULE_IDENTITY;
  readonly requestId: string;
  readonly status: Rule6Outcome;
  readonly applicability: string;
  readonly evaluatedSystemsOrConditions: readonly string[];
  readonly candidateEvaluations: readonly Rule6CandidateEvaluation[];
  readonly selectedEligibleCandidates: readonly string[];
  readonly rejectedCandidates: readonly string[];
  readonly proposedCompositionCandidates: readonly Rule6CompositionCandidate[];
  readonly evidenceRefs: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly blockersOrUnresolvedEvidence: readonly string[];
  readonly rule9SectionFValidationRequired: boolean;
  readonly deterministicFingerprint: string | null;
  readonly shadowOnly: true;
  readonly clinicalActivation: 'NONE';
};
