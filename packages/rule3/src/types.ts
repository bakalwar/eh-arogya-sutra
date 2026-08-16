import type {
  Rule3DetectionMethodClass,
  Rule3IndicationStatus,
  Rule3Outcome,
  Rule3SystemRole,
  Rule3VerificationStatus,
} from './constants.js';
import {
  RULE3_INPUT_CONTRACT_VERSION,
  RULE3_OUTPUT_CONTRACT_VERSION,
  RULE3_RULE_IDENTITY,
  RULE3_RULE_NUMBER,
} from './version.js';

export type Rule3EvidenceDataVersions = {
  readonly evidenceDataVersion: string;
  readonly organSystemRegistryVersion: string;
  readonly contractVersion: string;
  readonly governanceVersion: string;
};

export type Rule3UpstreamApplicability = {
  readonly status: string;
  readonly notes: readonly string[];
};

export type Rule3EvidenceBindingRef = {
  readonly bindingRefId: string;
};

export type Rule3DoctorSuppliedStructuredEvidenceItem = {
  readonly itemId: string;
  readonly bindingRefId: string;
  readonly evidenceClass: string;
};

export type Rule3OrganSystemEvidenceEntry = {
  readonly entryId: string;
  readonly bindingRefId: string;
  readonly organSystemToken: string;
  readonly systemRole: Rule3SystemRole;
  readonly verificationStatus: Rule3VerificationStatus;
  readonly detectionMethodClass: Rule3DetectionMethodClass;
  readonly evidenceSourceId: string;
  readonly evidenceValidationStatus: string;
  readonly ownerClinicalApprovalStatus: string;
  readonly version: string;
  readonly effectiveStatus: string;
  readonly testClassification: string;
};

export type Rule3OrganSystemAffinityEvidenceRegistry = {
  readonly registryVersion: string;
  readonly entries: readonly Rule3OrganSystemEvidenceEntry[];
  readonly activeRealMappingCount: 0;
};

export type Rule3CaseOrganSystemSummary =
  | { readonly status: 'NOT_SUPPLIED' }
  | {
      readonly status: 'SUPPLIED';
      readonly displayOnly: true;
      readonly mustNotDriveSelection: true;
      readonly headline: string | null;
    };

export type Rule3FindingRef = {
  readonly findingRefId: string;
  readonly bindingRefId: string;
};

export type Rule3StructuredFindingRefs =
  | { readonly status: 'NOT_SUPPLIED' }
  | { readonly status: 'SUPPLIED'; readonly findings: readonly Rule3FindingRef[] };

export type Rule3Input = {
  readonly contractVersion: typeof RULE3_INPUT_CONTRACT_VERSION;
  readonly requestId: string;
  readonly organSystemAffinityEvidenceRegistry: Rule3OrganSystemAffinityEvidenceRegistry;
  readonly orderedEvidenceBindingRefs: readonly Rule3EvidenceBindingRef[];
  readonly doctorSuppliedStructuredEvidenceItems: readonly Rule3DoctorSuppliedStructuredEvidenceItem[];
  readonly caseOrganSystemSummary: Rule3CaseOrganSystemSummary;
  readonly structuredFindingRefs: Rule3StructuredFindingRefs;
  readonly evidenceDataVersions: Rule3EvidenceDataVersions;
  readonly upstreamApplicability: Rule3UpstreamApplicability;
};

export type Rule3OrganSystemAnnotation = {
  readonly organSystemIndicationId: string;
  readonly bindingRefId: string;
  readonly organSystemToken: string | null;
  readonly systemRole: Rule3SystemRole | null;
  readonly indicationStatus: Rule3IndicationStatus;
  readonly verificationStatus: Rule3VerificationStatus | null;
  readonly detectionMethodClass: Rule3DetectionMethodClass | null;
  readonly unresolvedReason: 'INSUFFICIENT_ORGAN_SYSTEM_EVIDENCE' | null;
  readonly doctorReviewRequired: boolean;
  readonly evidenceGaps: readonly string[];
  readonly reasonCodes: readonly string[];
};

export type Rule3OutputCaseOrganSystemSummary = {
  readonly displayOnly: true;
  readonly mustNotDriveSelection: true;
  readonly headline: string | null;
} | null;

export type Rule3Output = {
  readonly contractVersion: typeof RULE3_OUTPUT_CONTRACT_VERSION;
  readonly ruleNumber: typeof RULE3_RULE_NUMBER;
  readonly ruleIdentity: typeof RULE3_RULE_IDENTITY;
  readonly requestId: string;
  readonly status: Rule3Outcome;
  readonly applicability: string;
  readonly organSystemAnnotations: readonly Rule3OrganSystemAnnotation[];
  readonly caseOrganSystemSummary: Rule3OutputCaseOrganSystemSummary;
  readonly evidenceGaps: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly blockersOrUnresolvedEvidence: readonly string[];
  readonly doctorReviewRequired: boolean;
  readonly deterministicFingerprint: string;
  readonly shadowOnly: true;
  readonly formulaMutation: 'NONE';
  readonly medicineSelectionInfluence: 'NONE';
  readonly clinicalActivation: 'NONE';
  readonly prescriptionEffect: 'NONE';
};
