import type {
  Rule4EngineMode,
  Rule4ExecutionStatus,
  Rule4PotencyStatus,
  Rule4RuntimeDelta,
} from './version.js';
import type {
  Rule4AnalysisStatus,
  Rule4HoldStatus,
  Rule4PrescriptionStatus,
  Rule4SafetyGateStatus,
} from './safety/types.js';

export type Rule4SafetyGateOutput = {
  safetyGateStatus: Rule4SafetyGateStatus;
  safetyStatus: 'NORMAL' | 'ACUTE_RED_FLAG';
  prescriptionStatus: Rule4PrescriptionStatus;
  holdStatus: Rule4HoldStatus;
  patientWideHold: boolean;
  urgentEscalationRequired: boolean;
  analysisStatus: Rule4AnalysisStatus;
  clinicalPrescriptionSummary: 'NOT_GENERATED' | 'NOT_APPLICABLE';
  d13HardStopActive: boolean;
  safetyNoticeKey: 'D13_HS_UNDER_ONE' | null;
  safetyClearForFutureCascade: boolean;
  deterministicSafetyFingerprint: string;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
  ageVerificationStatus: string;
  pediatricBand: string | null;
};

export type Rule4SlotResult = {
  formulaSlotId: string;
  formulaTargetId: string | null;
  potencyStatus: Rule4PotencyStatus;
  selectedDilution: null;
  selectedCascade: null;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
  evidenceItemIds: readonly string[];
};

export type Rule4Result = {
  contractVersion: string;
  rulesetVersion: string;
  executionStatus: Rule4ExecutionStatus;
  engineMode: Rule4EngineMode;
  automaticPotencyRuntime: false;
  automaticPrescriptionIssuanceRuntime: false;
  currentRuntimePotencyDelta: Rule4RuntimeDelta;
  currentRuntimeIssuanceDelta: Rule4RuntimeDelta;
  finalDoctorApprovalRequired: true;
  prescriptionIssueAllowed: false;
  slots: readonly Rule4SlotResult[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
  deterministicFingerprint: string;
  safetyGate?: Rule4SafetyGateOutput;
};
