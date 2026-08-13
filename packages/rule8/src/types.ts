import type {
  Rule8EligibilityState,
  Rule8Outcome,
  Rule8Rule1ComparisonState,
} from './constants.js';
import {
  RULE8_INPUT_CONTRACT_VERSION,
  RULE8_OUTPUT_CONTRACT_VERSION,
  RULE8_RULE_IDENTITY,
  RULE8_RULE_NUMBER,
} from './version.js';

export type Rule8UpstreamRef = {
  readonly refId: string;
  readonly status: string;
  readonly version: string;
};

export type Rule8OptionalRef = { readonly status: 'UNAVAILABLE' } | Rule8UpstreamRef;

export type Rule8EvidenceDataVersions = {
  readonly diseaseDataVersion: string;
  readonly evidenceDataVersion: string;
  readonly prakritiRegistryVersion: string;
  readonly contractVersion: string;
};

export type Rule8UpstreamApplicability = {
  readonly status: string;
  readonly notes: readonly string[];
};

export type Rule8PrakritiEvidenceEntry = {
  readonly entryId: string;
  readonly diseaseConditionRef: string;
  readonly prakritiCategoryRef: string;
  readonly applicabilityConditions: readonly string[];
  readonly contradictionMarkers: readonly string[];
  readonly evidenceSourceId: string;
  readonly evidenceValidationStatus: string;
  readonly ownerClinicalApprovalStatus: string;
  readonly version: string;
  readonly effectiveStatus: string;
  readonly supersessionMetadata: string | null;
  readonly testClassification: string;
};

export type Rule8PrakritiEvidenceRegistry = {
  readonly registryVersion: string;
  readonly entries: readonly Rule8PrakritiEvidenceEntry[];
};

export type Rule8Input = {
  readonly contractVersion: typeof RULE8_INPUT_CONTRACT_VERSION;
  readonly requestId: string;
  readonly diseaseConditionRefs: readonly string[];
  readonly rule1TemperamentRef: Rule8OptionalRef;
  readonly prakritiEvidenceRegistry: Rule8PrakritiEvidenceRegistry;
  readonly evidenceDataVersions: Rule8EvidenceDataVersions;
  readonly upstreamApplicability: Rule8UpstreamApplicability;
};

export type Rule8PrakritiIndication = {
  readonly indicationId: string;
  readonly diseaseConditionRef: string;
  readonly prakritiCategoryRef: string;
  readonly eligibilityState: Rule8EligibilityState;
  readonly evidenceRefs: readonly string[];
  readonly reasonCodes: readonly string[];
};

export type Rule8Output = {
  readonly contractVersion: typeof RULE8_OUTPUT_CONTRACT_VERSION;
  readonly ruleNumber: typeof RULE8_RULE_NUMBER;
  readonly ruleIdentity: typeof RULE8_RULE_IDENTITY;
  readonly requestId: string;
  readonly status: Rule8Outcome;
  readonly applicability: string;
  readonly evaluatedDiseaseRefs: readonly string[];
  readonly prakritiIndications: readonly Rule8PrakritiIndication[];
  readonly notClinicallyIndicated: boolean;
  readonly rule1ComparisonState: Rule8Rule1ComparisonState;
  readonly evidenceRefs: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly blockersOrUnresolvedEvidence: readonly string[];
  readonly deterministicFingerprint: string | null;
  readonly shadowOnly: true;
  readonly clinicalActivation: 'NONE';
  readonly medicineSelectionInfluence: 'NONE';
  readonly notRequiredForPrescription: true;
};
