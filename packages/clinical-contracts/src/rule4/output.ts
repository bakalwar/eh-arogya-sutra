import type {
  Rule4EngineMode,
  Rule4ExecutionStatus,
  Rule4PotencyStatus,
  Rule4RuntimeDelta,
} from './version.js';

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
};
