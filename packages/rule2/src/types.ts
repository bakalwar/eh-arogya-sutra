import type {
  Rule2DiseasePolarityToken,
  Rule2Outcome,
  Rule2ResolutionStatus,
  Rule2SupportSignalClass,
  Rule2TherapeuticPolarityToken,
} from './constants.js';
import {
  RULE2_INPUT_CONTRACT_VERSION,
  RULE2_OUTPUT_CONTRACT_VERSION,
  RULE2_RULE_IDENTITY,
  RULE2_RULE_NUMBER,
} from './version.js';

export type Rule2EvidenceDataVersions = {
  readonly evidenceDataVersion: string;
  readonly polarityRegistryVersion: string;
  readonly contractVersion: string;
  readonly governanceVersion: string;
};

export type Rule2UpstreamApplicability = {
  readonly status: string;
  readonly notes: readonly string[];
};

export type Rule2DoctorSuppliedSlotBoundEvidenceItem = {
  readonly itemId: string;
  readonly formulaSlotId: string;
  readonly evidenceClass: string;
};

export type Rule2FormulaSlotRef = {
  readonly formulaSlotId: string;
  readonly formulaTargetId: string;
};

export type Rule2PolarityEvidenceEntry = {
  readonly entryId: string;
  readonly formulaSlotId: string;
  readonly formulaTargetId: string;
  readonly diseasePolarity: Rule2DiseasePolarityToken;
  readonly contradictionMarkers: readonly string[];
  readonly evidenceSourceId: string;
  readonly evidenceValidationStatus: string;
  readonly ownerClinicalApprovalStatus: string;
  readonly version: string;
  readonly effectiveStatus: string;
  readonly supersessionMetadata: string | null;
  readonly testClassification: string;
};

export type Rule2FormulaSlotPolarityEvidenceRegistry = {
  readonly registryVersion: string;
  readonly entries: readonly Rule2PolarityEvidenceEntry[];
};

export type Rule2CasePolaritySummary =
  | { readonly status: 'NOT_SUPPLIED' }
  | {
      readonly status: 'SUPPLIED';
      readonly displayOnly: true;
      readonly mustNotDriveSelection: true;
      readonly headline: string | null;
    };

export type Rule2SupportSignalRef = {
  readonly formulaSlotId: string;
  readonly signalClass: Rule2SupportSignalClass;
  readonly signalRefId: string;
};

export type Rule2SlotBoundSupportingSignalRefs =
  | { readonly status: 'NOT_SUPPLIED' }
  | { readonly status: 'SUPPLIED'; readonly signals: readonly Rule2SupportSignalRef[] };

export type Rule2Input = {
  readonly contractVersion: typeof RULE2_INPUT_CONTRACT_VERSION;
  readonly requestId: string;
  readonly formulaSlotPolarityEvidenceRegistry: Rule2FormulaSlotPolarityEvidenceRegistry;
  readonly orderedFormulaSlotRefs: readonly Rule2FormulaSlotRef[];
  readonly doctorSuppliedSlotBoundEvidenceItems: readonly Rule2DoctorSuppliedSlotBoundEvidenceItem[];
  readonly casePolaritySummary: Rule2CasePolaritySummary;
  readonly slotBoundSupportingSignalRefs: Rule2SlotBoundSupportingSignalRefs;
  readonly evidenceDataVersions: Rule2EvidenceDataVersions;
  readonly upstreamApplicability: Rule2UpstreamApplicability;
};

export type Rule2FormulaSlotAnnotation = {
  readonly formulaSlotId: string;
  readonly formulaTargetId: string;
  readonly rule2RecordId: string;
  readonly targetPathologyRef: string | null;
  readonly diseasePolarity: Rule2DiseasePolarityToken | null;
  readonly requiredTherapeuticPolarity: Rule2TherapeuticPolarityToken;
  readonly resolutionStatus: Rule2ResolutionStatus;
  readonly fallbackPolicy: 'OWNER_APPROVED_NEUTRAL_FALLBACK' | null;
  readonly doctorReviewRequired: boolean;
  readonly evidenceGaps: readonly string[];
  readonly reasonCodes: readonly string[];
  readonly mutatesMixtures: false;
};

export type Rule2OutputCasePolaritySummary = {
  readonly displayOnly: true;
  readonly mustNotDriveSelection: true;
  readonly headline: string | null;
} | null;

export type Rule2Output = {
  readonly contractVersion: typeof RULE2_OUTPUT_CONTRACT_VERSION;
  readonly ruleNumber: typeof RULE2_RULE_NUMBER;
  readonly ruleIdentity: typeof RULE2_RULE_IDENTITY;
  readonly requestId: string;
  readonly status: Rule2Outcome;
  readonly applicability: string;
  readonly formulaSlotAnnotations: readonly Rule2FormulaSlotAnnotation[];
  readonly casePolaritySummary: Rule2OutputCasePolaritySummary;
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
