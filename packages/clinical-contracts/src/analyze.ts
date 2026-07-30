/**
 * Phase 5B — versioned AnalyzeComplete contracts.
 * No default medicines, no fake clinical success values.
 */

export const ANALYZE_CONTRACT_VERSION = 'ehas2-analyze-contract-v1' as const;

export type ClinicalEvidenceConfidence = {
  score: number | null;
  label: 'high' | 'medium' | 'low' | 'unknown' | null;
  notes: string | null;
};

export type StructuredFindingInput = {
  findingId: string;
  text: string;
  sourceCategory: string;
  verificationStatus:
    | 'EXTRACTED_UNVERIFIED'
    | 'NEEDS_REVIEW'
    | 'VERIFIED'
    | 'CORRECTED_BY_DOCTOR'
    | 'REJECTED_AS_INCORRECT'
    | 'NOT_CLINICALLY_USED';
  confidence: ClinicalEvidenceConfidence | null;
  /** Original bytes must never be embedded. */
  originalBytesPresent: false;
};

export type AnalyzeCompleteRequest = {
  schemaVersion: typeof ANALYZE_CONTRACT_VERSION;
  requestId: string;
  timeoutMs: number | null;
  demographic: {
    ageYears: number | null;
    sexAtBirth: string | null;
  };
  chiefComplaint: string | null;
  symptoms: readonly string[];
  duration: string | null;
  severity: string | null;
  phase: string | null;
  vitals: {
    bloodPressureSystolic: number | null;
    bloodPressureDiastolic: number | null;
    pulseBpm: number | null;
  } | null;
  doctorSuppliedDiagnosis: string | null;
  history: string | null;
  allergies: readonly string[];
  currentMedicines: readonly string[];
  affectedSite: string | null;
  structuredReportFindings: readonly StructuredFindingInput[];
};

export type EmptyClinicalSlot = {
  status:
    'NOT_GENERATED' | 'NOT_IMPLEMENTED' | 'NO_CLINICALLY_JUSTIFIED_CANDIDATE' | 'NOT_CONNECTED';
  medicines: readonly [];
  reason: string;
};

export type AnalyzeCompleteResult = {
  schemaVersion: typeof ANALYZE_CONTRACT_VERSION;
  requestId: string;
  status:
    | 'CLINICAL_ENGINE_NOT_CONNECTED'
    | 'CLINICAL_RULES_NOT_IMPLEMENTED'
    | 'UNRESOLVED'
    | 'BLOCKED_BY_SAFETY'
    | 'FAILED'
    | 'OK';
  engineVersion: string;
  datasetVersion: string | null;
  medicineRegistryVersion: string | null;
  ruleSetVersion: string | null;
  detectedDiseaseCandidates: readonly [];
  detectedOrganSystems: readonly [];
  rootCauseInterpretation: null;
  polarity: null;
  prakriti: null;
  temperament: null;
  constitution: null;
  severity: null;
  phase: null;
  oralFormulaCandidates: readonly [];
  tabletSectionA: EmptyClinicalSlot;
  tabletSectionB: EmptyClinicalSlot;
  externalApplications: readonly [];
  potency: null;
  electricity: null;
  /** Explicit: no default WE */
  defaultWeUsed: false;
  evidence: readonly [];
  safetyFlags: readonly string[];
  unknownUnresolvedReasons: readonly string[];
  doctorReviewRequired: true;
  deterministicFingerprint: string | null;
  message: string;
};

export function createNotConnectedAnalyzeResult(requestId: string): AnalyzeCompleteResult {
  const emptySlot: EmptyClinicalSlot = {
    status: 'NOT_CONNECTED',
    medicines: [],
    reason: 'CLINICAL_ENGINE_NOT_CONNECTED',
  };
  return {
    schemaVersion: ANALYZE_CONTRACT_VERSION,
    requestId,
    status: 'CLINICAL_ENGINE_NOT_CONNECTED',
    engineVersion: 'ehas2-clinical-engine-scaffold-v1',
    datasetVersion: null,
    medicineRegistryVersion: null,
    ruleSetVersion: null,
    detectedDiseaseCandidates: [],
    detectedOrganSystems: [],
    rootCauseInterpretation: null,
    polarity: null,
    prakriti: null,
    temperament: null,
    constitution: null,
    severity: null,
    phase: null,
    oralFormulaCandidates: [],
    tabletSectionA: emptySlot,
    tabletSectionB: {
      ...emptySlot,
      status: 'NOT_IMPLEMENTED',
      reason: 'TABLET_ENGINE_NOT_IMPLEMENTED',
    },
    externalApplications: [],
    potency: null,
    electricity: null,
    defaultWeUsed: false,
    evidence: [],
    safetyFlags: [],
    unknownUnresolvedReasons: ['CLINICAL_ENGINE_NOT_CONNECTED'],
    doctorReviewRequired: true,
    deterministicFingerprint: null,
    message: 'Clinical engine is not connected. No prescription generated.',
  };
}

export function assertNoDefaultMedicines(result: AnalyzeCompleteResult): void {
  if (result.oralFormulaCandidates.length > 0) {
    throw new Error('Unexpected oral medicines in non-live result');
  }
  if (result.tabletSectionA.medicines.length > 0 || result.tabletSectionB.medicines.length > 0) {
    throw new Error('Unexpected tablet medicines in non-live result');
  }
  if (result.defaultWeUsed) {
    throw new Error('default WE must never be set');
  }
}
