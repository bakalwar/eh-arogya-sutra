/**
 * R5-M3 hard-blocker / evidence matrix (metadata-only).
 * TypeScript canonical; JSON fixture is deterministic mirror.
 */

import { RULE5_HARD_BLOCKER_MATRIX_VERSION } from './version.js';

/** Closed technical metadata — not a clinical reason code. */
export const RULE5_MATRIX_EVIDENCE_GATE = 'R5_M6_EVIDENCE_AUDIT_REQUIRED' as const;

export const RULE5_MATRIX_THRESHOLD_POLICY = 'NO_THRESHOLD_AUTHORIZED' as const;

export type Rule5HardBlockerSafetyGroup = 'G1' | 'G2' | 'G3' | 'G4';

export type Rule5HardBlockerConditionEntry = {
  conditionId: string;
  conditionLabel: string;
  ownerDecisionAnchor: 'OD-R5-M0-016';
  executable: false;
};

export type Rule5HardBlockerMappingEntry = {
  mappingId: string;
  conditionId: string;
  reasonCode: string;
  safetyGroup: Rule5HardBlockerSafetyGroup;
  evidenceGate: typeof RULE5_MATRIX_EVIDENCE_GATE;
  thresholdPolicy: typeof RULE5_MATRIX_THRESHOLD_POLICY;
  doctorReviewRequired: true;
  executable: false;
  ownerDecisionAnchor: 'OD-R5-M0-016';
};

export type Rule5HardBlockerCrossCuttingGovernance = {
  reasonCodeReferences: readonly string[];
  acknowledgmentDoesNotClearBlocker: true;
  missingEvidenceNeverMeansPass: true;
  automaticClinicalActionAuthorized: false;
  evidenceStateCatalogDeferredToM6: true;
  rule4ExcludedThresholdsAndDataAssets: true;
  automatedBlockerActivationAuthorized: false;
};

export type Rule5HardBlockerMatrix = {
  matrixVersion: typeof RULE5_HARD_BLOCKER_MATRIX_VERSION;
  conditions: readonly Rule5HardBlockerConditionEntry[];
  mappings: readonly Rule5HardBlockerMappingEntry[];
  crossCuttingGovernance: Rule5HardBlockerCrossCuttingGovernance;
};

const CONDITION_DEFINITIONS = [
  { conditionId: 'HB-001', conditionLabel: 'Emergency red flag' },
  { conditionId: 'HB-002', conditionLabel: 'Suspected serious adverse event' },
  { conditionId: 'HB-003', conditionLabel: 'Severe allergic reaction' },
  { conditionId: 'HB-004', conditionLabel: 'Confirmed applicable allergy' },
  { conditionId: 'HB-005', conditionLabel: 'Absolute contraindication' },
  { conditionId: 'HB-006', conditionLabel: 'Prohibited interaction' },
  { conditionId: 'HB-007', conditionLabel: 'Dangerous vital/laboratory result' },
  { conditionId: 'HB-008', conditionLabel: 'Acute clinical deterioration' },
  { conditionId: 'HB-009', conditionLabel: 'Formulation-route mismatch' },
  { conditionId: 'HB-010', conditionLabel: 'Overdose or uncomputable exposure' },
  { conditionId: 'HB-011', conditionLabel: 'Mandatory monitoring unavailable/overdue' },
  {
    conditionId: 'HB-012',
    conditionLabel: 'Maximum duration or cumulative exposure exceeded',
  },
  { conditionId: 'HB-013', conditionLabel: 'Product-quality or identity uncertainty' },
  { conditionId: 'HB-014', conditionLabel: 'Unsafe concurrent medicine change' },
  { conditionId: 'HB-015', conditionLabel: 'Patient-facing instructions not delivered' },
  { conditionId: 'HB-016', conditionLabel: 'Critical follow-up contradiction' },
] as const;

const MAPPING_DEFINITIONS: readonly Omit<
  Rule5HardBlockerMappingEntry,
  'evidenceGate' | 'thresholdPolicy' | 'doctorReviewRequired' | 'executable' | 'ownerDecisionAnchor'
>[] = [
  {
    mappingId: 'HB-001',
    conditionId: 'HB-001',
    reasonCode: 'R5_EMERGENCY_RED_FLAG_DETECTED',
    safetyGroup: 'G1',
  },
  {
    mappingId: 'HB-002',
    conditionId: 'HB-002',
    reasonCode: 'R5_SERIOUS_ADVERSE_EVENT_SUSPECTED',
    safetyGroup: 'G2',
  },
  {
    mappingId: 'HB-003',
    conditionId: 'HB-003',
    reasonCode: 'R5_SEVERE_REACTION_SUSPECTED',
    safetyGroup: 'G1',
  },
  {
    mappingId: 'HB-004',
    conditionId: 'HB-004',
    reasonCode: 'R5_CONFIRMED_APPLICABLE_ALLERGY',
    safetyGroup: 'G3',
  },
  {
    mappingId: 'HB-005',
    conditionId: 'HB-005',
    reasonCode: 'R5_ABSOLUTE_CONTRAINDICATION_DETECTED',
    safetyGroup: 'G3',
  },
  {
    mappingId: 'HB-006',
    conditionId: 'HB-006',
    reasonCode: 'R5_PROHIBITED_INTERACTION_DETECTED',
    safetyGroup: 'G3',
  },
  {
    mappingId: 'HB-007',
    conditionId: 'HB-007',
    reasonCode: 'R5_DANGEROUS_VITAL_OR_LAB_RESULT',
    safetyGroup: 'G2',
  },
  {
    mappingId: 'HB-008',
    conditionId: 'HB-008',
    reasonCode: 'R5_ACUTE_CLINICAL_DETERIORATION',
    safetyGroup: 'G1',
  },
  {
    mappingId: 'HB-009',
    conditionId: 'HB-009',
    reasonCode: 'R5_FORMULATION_ROUTE_MISMATCH',
    safetyGroup: 'G3',
  },
  {
    mappingId: 'HB-010A',
    conditionId: 'HB-010',
    reasonCode: 'R5_OVERDOSE_SUSPECTED',
    safetyGroup: 'G1',
  },
  {
    mappingId: 'HB-010B',
    conditionId: 'HB-010',
    reasonCode: 'R5_EXPOSURE_UNCOMPUTABLE',
    safetyGroup: 'G2',
  },
  {
    mappingId: 'HB-011',
    conditionId: 'HB-011',
    reasonCode: 'R5_REQUIRED_MONITORING_DATA_MISSING',
    safetyGroup: 'G4',
  },
  {
    mappingId: 'HB-012',
    conditionId: 'HB-012',
    reasonCode: 'R5_MAXIMUM_DURATION_OR_CUMULATIVE_EXPOSURE_EXCEEDED',
    safetyGroup: 'G3',
  },
  {
    mappingId: 'HB-013',
    conditionId: 'HB-013',
    reasonCode: 'R5_PRODUCT_QUALITY_ISSUE_SUSPECTED',
    safetyGroup: 'G3',
  },
  {
    mappingId: 'HB-014',
    conditionId: 'HB-014',
    reasonCode: 'R5_UNSAFE_CONCURRENT_MEDICINE_CHANGE',
    safetyGroup: 'G3',
  },
  {
    mappingId: 'HB-015',
    conditionId: 'HB-015',
    reasonCode: 'R5_PATIENT_INSTRUCTIONS_NOT_DELIVERED',
    safetyGroup: 'G3',
  },
  {
    mappingId: 'HB-016',
    conditionId: 'HB-016',
    reasonCode: 'R5_CRITICAL_FOLLOW_UP_CONTRADICTION',
    safetyGroup: 'G4',
  },
] as const;

function freezeMapping(entry: (typeof MAPPING_DEFINITIONS)[number]): Rule5HardBlockerMappingEntry {
  return Object.freeze({
    ...entry,
    evidenceGate: RULE5_MATRIX_EVIDENCE_GATE,
    thresholdPolicy: RULE5_MATRIX_THRESHOLD_POLICY,
    doctorReviewRequired: true as const,
    executable: false as const,
    ownerDecisionAnchor: 'OD-R5-M0-016' as const,
  });
}

function freezeCondition(
  entry: (typeof CONDITION_DEFINITIONS)[number],
): Rule5HardBlockerConditionEntry {
  return Object.freeze({
    ...entry,
    ownerDecisionAnchor: 'OD-R5-M0-016' as const,
    executable: false as const,
  });
}

const FROZEN_CONDITIONS = Object.freeze(
  CONDITION_DEFINITIONS.map((c) => freezeCondition(c)),
) as readonly Rule5HardBlockerConditionEntry[];

const FROZEN_MAPPINGS = Object.freeze(
  MAPPING_DEFINITIONS.map((m) => freezeMapping(m)),
) as readonly Rule5HardBlockerMappingEntry[];

const FROZEN_CROSS_CUTTING: Rule5HardBlockerCrossCuttingGovernance = Object.freeze({
  reasonCodeReferences: Object.freeze(['R5_UNKNOWN_SEVERITY', 'R5_EVIDENCE_MISSING_OR_UNVERIFIED']),
  acknowledgmentDoesNotClearBlocker: true as const,
  missingEvidenceNeverMeansPass: true as const,
  automaticClinicalActionAuthorized: false as const,
  evidenceStateCatalogDeferredToM6: true as const,
  rule4ExcludedThresholdsAndDataAssets: true as const,
  automatedBlockerActivationAuthorized: false as const,
});

export const RULE5_CANONICAL_HARD_BLOCKER_MATRIX: Rule5HardBlockerMatrix = Object.freeze({
  matrixVersion: RULE5_HARD_BLOCKER_MATRIX_VERSION,
  conditions: FROZEN_CONDITIONS,
  mappings: FROZEN_MAPPINGS,
  crossCuttingGovernance: FROZEN_CROSS_CUTTING,
});

export const RULE5_HARD_BLOCKER_CONDITION_COUNT = 16 as const;
export const RULE5_HARD_BLOCKER_MAPPING_COUNT = 17 as const;

export const RULE5_BLOCKER_SAFETY_GROUP_G1_CODES: readonly string[] = Object.freeze(
  FROZEN_MAPPINGS.filter((m) => m.safetyGroup === 'G1').map((m) => m.reasonCode),
);

export const RULE5_BLOCKER_SAFETY_GROUP_G2_CODES: readonly string[] = Object.freeze(
  FROZEN_MAPPINGS.filter((m) => m.safetyGroup === 'G2').map((m) => m.reasonCode),
);

export const RULE5_BLOCKER_SAFETY_GROUP_G3_CODES: readonly string[] = Object.freeze(
  FROZEN_MAPPINGS.filter((m) => m.safetyGroup === 'G3').map((m) => m.reasonCode),
);

export const RULE5_BLOCKER_SAFETY_GROUP_G4_CODES: readonly string[] = Object.freeze(
  FROZEN_MAPPINGS.filter((m) => m.safetyGroup === 'G4').map((m) => m.reasonCode),
);
