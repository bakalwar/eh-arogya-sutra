import type { Rule7EligibilityState, Rule7Outcome } from './constants.js';
import {
  RULE7_INPUT_CONTRACT_VERSION,
  RULE7_OUTPUT_CONTRACT_VERSION,
  RULE7_RULE_IDENTITY,
  RULE7_RULE_NUMBER,
} from './version.js';

export type Rule7UpstreamRef = {
  readonly refId: string;
  readonly status: string;
  readonly version: string;
};

export type Rule7OptionalRef = { readonly status: 'UNAVAILABLE' } | Rule7UpstreamRef;

export type Rule7EvidenceDataVersions = {
  readonly siteDataVersion: string;
  readonly evidenceDataVersion: string;
  readonly routeRegistryVersion: string;
  readonly contractVersion: string;
};

export type Rule7UpstreamApplicability = {
  readonly status: string;
  readonly notes: readonly string[];
};

export type Rule7RouteEvidenceEntry = {
  readonly entryId: string;
  readonly routeCode: string;
  readonly bodySiteRef: string;
  readonly applicabilityConditions: readonly string[];
  readonly prohibitionConditions: readonly string[];
  readonly evidenceSourceId: string;
  readonly evidenceValidationStatus: string;
  readonly ownerClinicalApprovalStatus: string;
  readonly version: string;
  readonly effectiveStatus: string;
  readonly supersessionMetadata: string | null;
};

export type Rule7RouteEvidenceRegistry = {
  readonly registryVersion: string;
  readonly entries: readonly Rule7RouteEvidenceEntry[];
};

export type Rule7Input = {
  readonly contractVersion: typeof RULE7_INPUT_CONTRACT_VERSION;
  readonly requestId: string;
  readonly clinicalTargetRefs: readonly string[];
  readonly bodySiteRefs: readonly string[];
  readonly rule3OrganSystemRef: Rule7OptionalRef;
  readonly severityRef: Rule7OptionalRef;
  readonly phaseRef: Rule7OptionalRef;
  readonly routeEvidenceRegistry: Rule7RouteEvidenceRegistry;
  readonly evidenceDataVersions: Rule7EvidenceDataVersions;
  readonly upstreamApplicability: Rule7UpstreamApplicability;
};

export type Rule7RouteIndication = {
  readonly indicationId: string;
  readonly routeCode: string;
  readonly bodySiteRef: string;
  readonly eligibilityState: Rule7EligibilityState;
  readonly evidenceRefs: readonly string[];
  readonly reasonCodes: readonly string[];
};

export type Rule7Output = {
  readonly contractVersion: typeof RULE7_OUTPUT_CONTRACT_VERSION;
  readonly ruleNumber: typeof RULE7_RULE_NUMBER;
  readonly ruleIdentity: typeof RULE7_RULE_IDENTITY;
  readonly requestId: string;
  readonly status: Rule7Outcome;
  readonly applicability: string;
  readonly evaluatedBodySites: readonly string[];
  readonly routeIndications: readonly Rule7RouteIndication[];
  readonly notClinicallyIndicated: boolean | { readonly reasons: readonly string[] };
  readonly evidenceRefs: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly blockersOrUnresolvedEvidence: readonly string[];
  readonly deterministicFingerprint: string | null;
  readonly shadowOnly: true;
  readonly clinicalActivation: 'NONE';
};
