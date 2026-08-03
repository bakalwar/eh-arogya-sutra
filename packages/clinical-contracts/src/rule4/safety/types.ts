export type Rule4BpEvidenceStatus =
  | 'VERIFIED_CURRENT_READING'
  | 'REPEATED_CONFIRMED_READING'
  | 'SINGLE_UNCONFIRMED_READING'
  | 'HISTORICAL_READING'
  | 'DEVICE_OR_ENTRY_ERROR_SUSPECTED'
  | 'MISSING'
  | 'INVALID'
  | 'CONTRADICTORY';

export type Rule4BpReadingInput = {
  systolic: number | null;
  diastolic: number | null;
  unit: string | null;
  evidenceStatus: Rule4BpEvidenceStatus;
  sourceKind: 'MANUAL' | 'STRUCTURED' | 'DEVICE' | null;
  measuredAt: string | null;
};

export type Rule4PediatricBand = 'P13_A' | 'P13_B' | 'P13_C' | 'P13_D' | 'P13_E' | null;

export type Rule4AgeVerificationStatus =
  'VERIFIED' | 'MISSING' | 'INVALID' | 'CONTRADICTORY' | 'UNRESOLVED';

export type Rule4VerifiedAgeContextPhase2 = {
  ageYears: number | null;
  verificationStatus: Rule4AgeVerificationStatus;
  verifiedDateOfBirth: string | null;
  consultationAssessmentDate: string | null;
  ageSource: string | null;
  upstreamVerifiedPediatricBand: Rule4PediatricBand;
  pediatricBandVerificationStatus: Rule4AgeVerificationStatus | null;
};

export type Rule4PatientWideSafetyFlagsPhase2 = {
  crisisHold: boolean | null;
  prescriptionHold: boolean | null;
  contraindicationHold: boolean | null;
};

export type Rule4SafetyGateStatus =
  | 'SAFETY_NOT_EVALUATED'
  | 'SAFETY_CLEAR_FOR_FUTURE_CASCADE'
  | 'UNRESOLVED'
  | 'ACUTE_RED_FLAG'
  | 'D13_HS_BLOCKED'
  | 'PRESCRIPTION_HOLD';

export type Rule4PrescriptionStatus = 'OPEN' | 'BLOCKED' | 'PRESCRIPTION_HOLD';

export type Rule4HoldStatus = 'NONE' | 'PRESCRIPTION_HOLD';

export type Rule4AnalysisStatus = 'NOT_EVALUATED' | 'PEDIATRIC_UNDER_ONE_NOT_SUPPORTED' | null;

export type Rule4AgeResolution = {
  verificationStatus: Rule4AgeVerificationStatus;
  pediatricBand: Rule4PediatricBand;
  daysSinceBirth: number | null;
  isUnderOneYear: boolean;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
};

export type Rule4BpCrisisEvaluation = {
  crisisDetected: boolean;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
};

export type Rule4SafetyGateResult = {
  safetyGateStatus: Rule4SafetyGateStatus;
  safetyStatus: 'NORMAL' | 'ACUTE_RED_FLAG';
  prescriptionStatus: Rule4PrescriptionStatus;
  holdStatus: Rule4HoldStatus;
  patientWideHold: boolean;
  urgentEscalationRequired: boolean;
  analysisStatus: Rule4AnalysisStatus;
  clinicalPrescriptionSummary: 'NOT_GENERATED' | 'NOT_APPLICABLE';
  finalDoctorApprovalRequired: true;
  d13HardStopActive: boolean;
  safetyNoticeKey: 'D13_HS_UNDER_ONE' | null;
  ageResolution: Rule4AgeResolution;
  bpCrisis: Rule4BpCrisisEvaluation;
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
  safetyClearForFutureCascade: boolean;
  deterministicSafetyFingerprint: string;
};

export const D13_HS_SAFETY_NOTICE_HI =
  'एक वर्ष से कम आयु के बच्चों के लिए यह सिस्टम औषधि, फॉर्मूला, potency, dose या clinical prescription summary तैयार नहीं करता। बच्चे का मूल्यांकन योग्य बाल-चिकित्सक द्वारा कराया जाए।';

export const BP_CRISIS_SYSTOLIC_MIN = 180;
export const BP_CRISIS_DIASTOLIC_MIN = 110;
export const BP_CANONICAL_UNIT = 'mmHg';

export const CRISIS_COMPARABLE_BP_STATUSES: ReadonlySet<Rule4BpEvidenceStatus> = new Set([
  'VERIFIED_CURRENT_READING',
  'REPEATED_CONFIRMED_READING',
]);
