import type { Rule4SafetyGateOutput } from '../output.js';
import type { Rule4VerifiedAgeContext } from '../input.js';
import type { Rule4SelectionAdapterOutput } from '../selection/types.js';
import type { Rule4FrozenDilution, Rule4SelectedCascade } from '../selection/types.js';
import type { Rule4PediatricBand } from '../safety/types.js';
import type { Rule4OverlayMatrixCell, Rule4PediatricMatrixAuthority } from './overlayMatrix.js';

export const RULE4_OVERLAY_GATE_OUTCOMES = ['PASS', 'FAIL'] as const;
export type Rule4OverlayGateOutcome = (typeof RULE4_OVERLAY_GATE_OUTCOMES)[number];

export type Rule4OverlayGateRow = {
  gateId: string;
  outcome: Rule4OverlayGateOutcome;
};

export type Rule4D13DJustificationStatus = 'PASS' | 'FAIL' | 'NOT_REQUIRED' | 'NOT_APPLICABLE';

export type Rule4PediatricRestrictGateLedger = {
  q8DGates?: readonly Rule4OverlayGateRow[];
  q8CDGates?: readonly Rule4OverlayGateRow[];
  d13DJustification?: { status: Rule4D13DJustificationStatus };
  d10fGates?: readonly Rule4OverlayGateRow[];
  d30fGates?: readonly Rule4OverlayGateRow[];
};

export type Rule4PediatricOverlaySlotRecord = {
  formulaSlotId: string;
  formulaTargetId: string;
  phase8SelectionFingerprint: string;
  restrictGateLedger?: Rule4PediatricRestrictGateLedger | null;
};

export type Rule4PediatricOverlayAdapterInput = {
  contractVersion: string;
  rulesetVersion: string;
  registryVersion: string;
  label: 'SYNTHETIC' | 'PRODUCTION';
  formulaSlotIds: readonly string[];
  slotOverlayRecords: readonly Rule4PediatricOverlaySlotRecord[];
};

export const RULE4_PEDIATRIC_OVERLAY_STATUS_VALUES = [
  'NOT_EVALUATED',
  'NOT_APPLICABLE',
  'NOT_APPLICABLE_UNDER_HARD_STOP',
  'BLOCKED_BY_SAFETY',
  'BLOCKED_D13_HS',
  'AGE_UNRESOLVED',
  'PHASE8_AUTH_FAILED',
  'OVERLAY_APPLIED',
  'OVERLAY_BLOCKED',
  'OVERLAY_UNRESOLVED',
] as const;

export type Rule4PediatricOverlayStatus = (typeof RULE4_PEDIATRIC_OVERLAY_STATUS_VALUES)[number];

export type Rule4SlotPediatricOverlayResolution = {
  formulaSlotId: string;
  formulaTargetId: string | null;
  verifiedAgeBand: Rule4PediatricBand;
  ageVerificationStatus: string;
  ageProvenanceDigest: string;
  phase8SelectionFingerprint: string | null;
  baseSelectedCascade: Rule4SelectedCascade | null;
  baseSelectedDilution: Rule4FrozenDilution | null;
  pediatricMatrixAuthority: Rule4PediatricMatrixAuthority;
  pediatricOverlayStatus: Rule4PediatricOverlayStatus;
  overlayGateResults: readonly {
    dilution: Rule4FrozenDilution | null;
    matrixCell: Rule4OverlayMatrixCell | 'NOT_APPLICABLE' | 'NOT_APPLICABLE_UNDER_HARD_STOP';
    outcome: 'RETAINED' | 'BLOCKED' | 'NOT_EVALUATED';
  }[];
  d13DJustificationStatus: Rule4D13DJustificationStatus;
  finalDraftCascade: Rule4SelectedCascade | null;
  finalDraftDilution: Rule4FrozenDilution | null;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
  finalDoctorApprovalRequired: true;
  prescriptionIssueAllowed: false;
  deterministicPediatricOverlayFingerprint: string;
};

export type Rule4PediatricOverlayAdapterOutput = {
  contractVersion: string;
  rulesetVersion: string;
  registryVersion: string;
  executionStatus: 'NOT_IMPLEMENTED';
  automaticPediatricOverlayRuntime: false;
  automaticPrescriptionIssuanceRuntime: false;
  prescriptionIssueAllowed: false;
  finalDoctorApprovalRequired: true;
  currentRuntimePotencyDelta: 'NONE';
  slotResolutions: readonly Rule4SlotPediatricOverlayResolution[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
  deterministicPediatricOverlayFingerprint: string;
};

export type Rule4PediatricOverlayEvaluationContext = {
  safetyGate?: Rule4SafetyGateOutput | null;
  verifiedAge?: Rule4VerifiedAgeContext | null;
  selectionResolution?: Rule4SelectionAdapterOutput | null;
  upstreamEligibilityFingerprint?: string | null;
};
