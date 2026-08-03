import { rule4SafetyFingerprintV1Hash } from '../safetyFingerprintV1.js';
import type {
  Rule4AgeResolution,
  Rule4BpCrisisEvaluation,
  Rule4HoldStatus,
  Rule4PrescriptionStatus,
  Rule4SafetyGateResult,
  Rule4SafetyGateStatus,
} from './types.js';
import type { Rule4CriticalEvaluation } from './structuredCritical.js';

export type HoldAggregatorInput = {
  bpCrisis: Rule4BpCrisisEvaluation;
  ageResolution: Rule4AgeResolution;
  criticalEvaluation: Rule4CriticalEvaluation;
  explicitPrescriptionHold: boolean;
  explicitContraindicationHold: boolean;
  explicitCrisisHold: boolean;
  rawLabKeywordPresent: boolean;
};

function applyHoldPrescriptionStatus(current: Rule4PrescriptionStatus): Rule4PrescriptionStatus {
  return current === 'BLOCKED' ? 'BLOCKED' : 'PRESCRIPTION_HOLD';
}

export function aggregatePatientWideHolds(input: HoldAggregatorInput): Rule4SafetyGateResult {
  const reasonCodes: string[] = ['RULE4_SAFETY_GATE_EVALUATED'];
  const limitationCodes: string[] = ['PHASE2_NO_POTENCY_CASCADE'];

  if (input.rawLabKeywordPresent) {
    reasonCodes.push('RAW_LAB_KEYWORD_NOT_EXECUTABLE');
    limitationCodes.push('NON_BP_CRITICAL_CATALOG_NOT_EXECUTABLE');
  }

  const bpCrisis = input.bpCrisis.crisisDetected || input.explicitCrisisHold === true;
  if (input.bpCrisis.reasonCodes.length) {
    reasonCodes.push(...input.bpCrisis.reasonCodes);
  }
  limitationCodes.push(...input.bpCrisis.limitationCodes);
  limitationCodes.push(...input.ageResolution.limitationCodes);

  reasonCodes.push(...input.criticalEvaluation.reasonCodes);
  limitationCodes.push(...input.criticalEvaluation.limitationCodes);

  const structuredCritical = input.criticalEvaluation.escalationEligible;
  const criticalInputBlocked =
    input.criticalEvaluation.hasUnknownCodes || input.criticalEvaluation.hasInvalidEntries;

  const ageFail =
    input.ageResolution.verificationStatus === 'MISSING' ||
    input.ageResolution.verificationStatus === 'INVALID' ||
    input.ageResolution.verificationStatus === 'CONTRADICTORY' ||
    input.ageResolution.verificationStatus === 'UNRESOLVED';
  if (ageFail) {
    reasonCodes.push(...input.ageResolution.reasonCodes);
  }

  const d13Active =
    input.ageResolution.verificationStatus === 'VERIFIED' && input.ageResolution.isUnderOneYear;

  let safetyGateStatus: Rule4SafetyGateStatus = 'SAFETY_CLEAR_FOR_FUTURE_CASCADE';
  let safetyStatus: 'NORMAL' | 'ACUTE_RED_FLAG' = 'NORMAL';
  let prescriptionStatus: Rule4PrescriptionStatus = 'OPEN';
  let holdStatus: Rule4HoldStatus = 'NONE';
  let patientWideHold = false;
  let urgentEscalationRequired = false;
  let analysisStatus: Rule4SafetyGateResult['analysisStatus'] = 'NOT_EVALUATED';
  let clinicalPrescriptionSummary: 'NOT_GENERATED' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';
  let d13HardStopActive = false;
  let safetyNoticeKey: 'D13_HS_UNDER_ONE' | null = null;

  if (bpCrisis || structuredCritical) {
    safetyStatus = 'ACUTE_RED_FLAG';
    safetyGateStatus = 'ACUTE_RED_FLAG';
    patientWideHold = true;
    holdStatus = 'PRESCRIPTION_HOLD';
    prescriptionStatus = applyHoldPrescriptionStatus(prescriptionStatus);
    urgentEscalationRequired = true;
    reasonCodes.push('PRESCRIPTION_HOLD');
  }

  if (input.explicitPrescriptionHold === true) {
    patientWideHold = true;
    holdStatus = 'PRESCRIPTION_HOLD';
    prescriptionStatus = applyHoldPrescriptionStatus(prescriptionStatus);
    if (safetyGateStatus === 'SAFETY_CLEAR_FOR_FUTURE_CASCADE') {
      safetyGateStatus = 'PRESCRIPTION_HOLD';
    }
    reasonCodes.push('EXPLICIT_PRESCRIPTION_HOLD', 'PRESCRIPTION_HOLD');
  }

  if (input.explicitContraindicationHold === true) {
    patientWideHold = true;
    holdStatus = 'PRESCRIPTION_HOLD';
    prescriptionStatus = applyHoldPrescriptionStatus(prescriptionStatus);
    reasonCodes.push('PATIENT_WIDE_CONTRAINDICATION_HOLD', 'PRESCRIPTION_HOLD');
    if (safetyGateStatus === 'SAFETY_CLEAR_FOR_FUTURE_CASCADE') {
      safetyGateStatus = 'PRESCRIPTION_HOLD';
    }
  }

  if (d13Active) {
    d13HardStopActive = true;
    analysisStatus = 'PEDIATRIC_UNDER_ONE_NOT_SUPPORTED';
    prescriptionStatus = 'BLOCKED';
    clinicalPrescriptionSummary = 'NOT_GENERATED';
    safetyNoticeKey = 'D13_HS_UNDER_ONE';
    safetyGateStatus = 'D13_HS_BLOCKED';
    reasonCodes.push('D13_HS_UNDER_ONE_HARD_STOP');
    limitationCodes.push('PEDIATRIC_UNDER_ONE_HARD_STOP');

    if (bpCrisis || structuredCritical) {
      patientWideHold = true;
      holdStatus = 'PRESCRIPTION_HOLD';
      urgentEscalationRequired = true;
      reasonCodes.push('PRESCRIPTION_HOLD');
    }
  }

  if ((ageFail || criticalInputBlocked) && !patientWideHold && !d13Active) {
    safetyGateStatus = 'UNRESOLVED';
  }

  if (
    input.rawLabKeywordPresent &&
    !patientWideHold &&
    !d13HardStopActive &&
    safetyGateStatus === 'SAFETY_CLEAR_FOR_FUTURE_CASCADE'
  ) {
    safetyGateStatus = 'UNRESOLVED';
  }

  const safetyClearForFutureCascade =
    !patientWideHold &&
    !d13HardStopActive &&
    !ageFail &&
    !bpCrisis &&
    !structuredCritical &&
    !criticalInputBlocked &&
    input.explicitPrescriptionHold !== true &&
    input.explicitContraindicationHold !== true &&
    !input.rawLabKeywordPresent;

  if (safetyClearForFutureCascade) {
    reasonCodes.push('RULE4_SAFETY_GATE_CLEAR_FOR_FUTURE_CASCADE');
  }

  const uniqueReason = [...new Set(reasonCodes)];
  const uniqueLimitation = [...new Set(limitationCodes)];

  const deterministicSafetyFingerprint = rule4SafetyFingerprintV1Hash({
    safetyGateStatus,
    safetyStatus,
    prescriptionStatus,
    holdStatus,
    patientWideHold,
    urgentEscalationRequired,
    analysisStatus,
    d13HardStopActive,
    ageVerification: input.ageResolution.verificationStatus,
    pediatricBand: input.ageResolution.pediatricBand,
    bpCrisis,
    reasonCodes: uniqueReason,
    limitationCodes: uniqueLimitation,
  });

  return {
    safetyGateStatus,
    safetyStatus,
    prescriptionStatus,
    holdStatus,
    patientWideHold,
    urgentEscalationRequired,
    analysisStatus,
    clinicalPrescriptionSummary,
    finalDoctorApprovalRequired: true,
    d13HardStopActive,
    safetyNoticeKey,
    ageResolution: input.ageResolution,
    bpCrisis: input.bpCrisis,
    reasonCodes: uniqueReason,
    limitationCodes: uniqueLimitation,
    safetyClearForFutureCascade,
    deterministicSafetyFingerprint,
  };
}

export { D13_HS_SAFETY_NOTICE_HI } from './types.js';
