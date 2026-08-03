import { createHash } from 'node:crypto';

import { canonicalStableDumps } from './canonicalJson.js';

export const RULE4_SAFETY_FINGERPRINT_V1 = 'rule4-safety-fingerprint-v1' as const;

export type Rule4SafetyFingerprintV1Input = {
  safetyGateStatus: string;
  safetyStatus: string;
  prescriptionStatus: string;
  holdStatus: string;
  patientWideHold: boolean;
  urgentEscalationRequired: boolean;
  analysisStatus: string | null;
  d13HardStopActive: boolean;
  ageVerification: string;
  pediatricBand: string | null;
  bpCrisis: boolean;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
};

export function buildRule4SafetyFingerprintV1Payload(
  input: Rule4SafetyFingerprintV1Input,
): Record<string, unknown> {
  return {
    fingerprint_version: RULE4_SAFETY_FINGERPRINT_V1,
    safety_gate_status: input.safetyGateStatus,
    safety_status: input.safetyStatus,
    prescription_status: input.prescriptionStatus,
    hold_status: input.holdStatus,
    patient_wide_hold: input.patientWideHold,
    urgent_escalation_required: input.urgentEscalationRequired,
    analysis_status: input.analysisStatus,
    d13_hard_stop_active: input.d13HardStopActive,
    age_verification: input.ageVerification,
    pediatric_band: input.pediatricBand,
    bp_crisis: input.bpCrisis,
    reason_codes: [...new Set(input.reasonCodes)].sort(),
    limitation_codes: [...new Set(input.limitationCodes)].sort(),
  };
}

export function rule4SafetyFingerprintV1CanonicalString(
  input: Rule4SafetyFingerprintV1Input,
): string {
  return canonicalStableDumps(buildRule4SafetyFingerprintV1Payload(input));
}

export function rule4SafetyFingerprintV1Hash(input: Rule4SafetyFingerprintV1Input): string {
  const payload = rule4SafetyFingerprintV1CanonicalString(input);
  return createHash('sha256').update(payload, 'utf8').digest('hex').toUpperCase();
}
