import type {
  Rule1EvidenceKind,
  Rule1Outcome,
  Rule1ResolutionState,
  Rule1Rule8ComparisonState,
  Rule1TemperamentToken,
} from './constants.js';
import {
  RULE1_INPUT_CONTRACT_VERSION,
  RULE1_OUTPUT_CONTRACT_VERSION,
  RULE1_RULE_IDENTITY,
  RULE1_RULE_NUMBER,
} from './version.js';

export type Rule1StatusRef =
  | { readonly status: 'NOT_SUPPLIED' }
  | { readonly status: 'UNAVAILABLE' }
  | { readonly status: 'CONSISTENT'; readonly refId: string; readonly version: string }
  | { readonly status: 'CONFLICT'; readonly refId: string; readonly version: string }
  | { readonly status: 'UNRESOLVED'; readonly refId: string; readonly version: string };

export type Rule1BloodPressureEvidence =
  | { readonly status: 'NOT_SUPPLIED' }
  | { readonly status: 'SUPPLIED'; readonly systolicMmHg: number; readonly unit: 'mmHg' };

export type Rule1PhotoEvidenceRef =
  | { readonly status: 'NOT_SUPPLIED' }
  | { readonly status: 'SUPPLIED'; readonly mediaRefId: string };

export type Rule1BloodLymphAxisContext =
  | { readonly status: 'NOT_SUPPLIED' }
  | { readonly status: 'SUPPLIED'; readonly axisRefs: readonly string[] };

export type Rule1EvidenceDataVersions = {
  readonly evidenceDataVersion: string;
  readonly temperamentRegistryVersion: string;
  readonly contractVersion: string;
  readonly governanceVersion: string;
};

export type Rule1UpstreamApplicability = {
  readonly status: string;
  readonly notes: readonly string[];
};

export type Rule1DoctorSuppliedEvidenceItem = {
  readonly itemId: string;
  readonly evidenceClass: string;
};

export type Rule1TemperamentEvidenceEntry = {
  readonly entryId: string;
  readonly temperamentToken: Rule1TemperamentToken;
  readonly evidenceKind: Rule1EvidenceKind;
  readonly supportUnits: number;
  readonly contradictionMarkers: readonly string[];
  readonly evidenceSourceId: string;
  readonly evidenceValidationStatus: string;
  readonly ownerClinicalApprovalStatus: string;
  readonly version: string;
  readonly effectiveStatus: string;
  readonly supersessionMetadata: string | null;
  readonly testClassification: string;
  readonly biliousSecondaryRequired: boolean;
};

export type Rule1CaseTemperamentEvidenceRegistry = {
  readonly registryVersion: string;
  readonly entries: readonly Rule1TemperamentEvidenceEntry[];
};

export type Rule1Input = {
  readonly contractVersion: typeof RULE1_INPUT_CONTRACT_VERSION;
  readonly requestId: string;
  readonly caseTemperamentEvidenceRegistry: Rule1CaseTemperamentEvidenceRegistry;
  readonly doctorSuppliedEvidenceItems: readonly Rule1DoctorSuppliedEvidenceItem[];
  readonly bloodPressureEvidence: Rule1BloodPressureEvidence;
  readonly photoEvidenceRef: Rule1PhotoEvidenceRef;
  readonly bloodLymphAxisContext: Rule1BloodLymphAxisContext;
  readonly rule8ComparisonRef: Rule1StatusRef;
  readonly evidenceDataVersions: Rule1EvidenceDataVersions;
  readonly upstreamApplicability: Rule1UpstreamApplicability;
};

export type Rule1DoshaMapping = {
  readonly doshaPrimary: string | null;
  readonly doshaSecondary: string | null;
  readonly doshaClassification: string | null;
};

export type Rule1Output = {
  readonly contractVersion: typeof RULE1_OUTPUT_CONTRACT_VERSION;
  readonly ruleNumber: typeof RULE1_RULE_NUMBER;
  readonly ruleIdentity: typeof RULE1_RULE_IDENTITY;
  readonly requestId: string;
  readonly status: Rule1Outcome;
  readonly applicability: string;
  readonly primaryTemperament: Rule1TemperamentToken | null;
  readonly secondaryTemperament: Rule1TemperamentToken | null;
  readonly mixedComponents: readonly Rule1TemperamentToken[];
  readonly resolutionState: Rule1ResolutionState;
  readonly doshaMapping: Rule1DoshaMapping | null;
  readonly evidenceGaps: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly blockersOrUnresolvedEvidence: readonly string[];
  readonly rule8ComparisonState: Rule1Rule8ComparisonState;
  readonly deterministicFingerprint: string | null;
  readonly shadowOnly: true;
  readonly clinicalActivation: 'NONE';
  readonly medicineSelectionInfluence: 'NONE';
  readonly prescriptionEffect: 'NONE';
};
