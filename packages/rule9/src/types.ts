import type { Rule9ComplexityTier, Rule9CountValidationState, Rule9Outcome } from './constants.js';
import {
  RULE9_INPUT_CONTRACT_VERSION,
  RULE9_OUTPUT_CONTRACT_VERSION,
  RULE9_RULE_IDENTITY,
  RULE9_RULE_NUMBER,
} from './version.js';

export type Rule9ApplicabilityStatus = 'APPLICABLE' | 'NOT_APPLICABLE' | 'NOT_EVALUABLE';

export type Rule9ComplexityNonSuccess = {
  readonly status: 'UNAVAILABLE' | 'UNAPPROVED' | 'CONTRADICTORY' | 'STALE';
};

export type Rule9ComplexityApproved = {
  readonly tier: Rule9ComplexityTier;
  readonly ownerApprovalStatus: 'explicitly-approved-for-shadow-validation';
  readonly evidenceSourceId: string;
  readonly version: string;
};

export type Rule9ComplexityTierRef = Rule9ComplexityNonSuccess | Rule9ComplexityApproved;

export type Rule9EnvelopeAbsent = {
  readonly status: 'UNAVAILABLE' | 'NOT_IMPLEMENTED';
};

export type Rule9RuleEnvelopeFull = {
  readonly ruleNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly ruleIdentity: string;
  readonly contractVersion: string;
  readonly status: string;
  readonly applicability: Rule9ApplicabilityStatus;
  /** Present for Rules 6–8 only; validated active clinical data count (currently 0 in production). */
  readonly validatedActiveClinicalDataCount?: number;
};

export type Rule9RuleEnvelope = Rule9EnvelopeAbsent | Rule9RuleEnvelopeFull;

export type Rule9OralMixture = {
  readonly mixtureId: string;
  readonly medicineIds: readonly string[];
  readonly evidenceRefs: readonly string[];
};

export type Rule9ProposedOralComposition =
  { readonly status: 'ABSENT' } | { readonly mixtures: readonly Rule9OralMixture[] };

export type Rule9EvidenceDataVersions = {
  readonly pipelineDataVersion: string;
  readonly contractVersion: string;
};

export type Rule9UpstreamApplicability = {
  readonly status: Rule9ApplicabilityStatus;
  readonly reasonCodes: readonly string[];
};

export type Rule9Input = {
  readonly contractVersion: typeof RULE9_INPUT_CONTRACT_VERSION;
  readonly requestId: string;
  readonly complexityTierRef: Rule9ComplexityTierRef;
  readonly rule1Envelope: Rule9RuleEnvelope;
  readonly rule2Envelope: Rule9RuleEnvelope;
  readonly rule3Envelope: Rule9RuleEnvelope;
  readonly rule4Envelope: Rule9RuleEnvelope;
  readonly rule5Envelope: Rule9RuleEnvelope;
  readonly rule6Envelope: Rule9RuleEnvelope;
  readonly rule7Envelope: Rule9RuleEnvelope;
  readonly rule8Envelope: Rule9RuleEnvelope;
  readonly proposedOralComposition: Rule9ProposedOralComposition;
  readonly evidenceDataVersions: Rule9EvidenceDataVersions;
  readonly upstreamApplicability: Rule9UpstreamApplicability;
};

export type Rule9ShadowPackage = {
  readonly packageId: string;
  readonly sourceRuleEnvelopes: readonly string[];
  readonly oralMixtures: readonly Rule9OralMixture[];
  readonly sectionSeparations: {
    readonly tabletExcludedFromOralCount: true;
    readonly externalExcludedFromOralCount: true;
  };
  readonly countValidated: boolean;
  readonly packagingNotes: readonly string[];
};

export type Rule9UpstreamRuleState = {
  readonly ruleNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly status: string;
  readonly applicability: string;
};

export type Rule9Output = {
  readonly contractVersion: typeof RULE9_OUTPUT_CONTRACT_VERSION;
  readonly ruleNumber: typeof RULE9_RULE_NUMBER;
  readonly ruleIdentity: typeof RULE9_RULE_IDENTITY;
  readonly requestId: string;
  readonly status: Rule9Outcome;
  readonly applicability: string;
  readonly complexityTierAccepted: Rule9ComplexityTier | null;
  readonly requiredOralMixtureCount: 3 | 4 | 5 | null;
  readonly observedOralMixtureCount: number | null;
  readonly countValidationState: Rule9CountValidationState;
  readonly packagedShadowProposal: Rule9ShadowPackage | null;
  readonly rejectionReasons: readonly string[];
  readonly insufficientClinicalEvidence: boolean;
  readonly doctorReviewRequired: boolean;
  readonly upstreamRuleStates: readonly Rule9UpstreamRuleState[];
  readonly evidenceRefs: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly blockersOrUnresolvedEvidence: readonly string[];
  readonly deterministicFingerprint: string | null;
  readonly shadowOnly: true;
  readonly clinicalActivation: 'NONE';
  readonly medicineSelectionInfluence: 'NONE';
  readonly prescriptionEffect: 'NONE';
  readonly notAClinicallyActivatedPrescription: true;
};
