/**
 * Static Phase 5C / 5C-G clinical validation dashboard data.
 * Loaded in local preview only — no engine/DB calls from the browser.
 * SYNTHETIC / read-only labels.
 */

export const CLINICAL_VALIDATION_DASHBOARD = {
  watermark: 'SYNTHETIC VALIDATION ONLY — NOT MEDICAL ADVICE — NOT SAVED',
  phase: '5C-G' as const,
  cleanValidationStatus: 'PASS' as const,
  clinicalReadiness: false as const,
  realPatientData: 'NO' as const,
  prescriptionEngine: 'NOT_CONNECTED' as const,
  medicineOutput: 0 as const,
  databaseWritesFromPreview: 0 as const,
  dataset: {
    status: 'SANITIZED_LOCAL_ARTIFACT_OR_SYNTHETIC_CI',
    expectedFullCount: 116_284,
    syntheticCiCount: 11,
    installedLive: false,
  },
  registry: {
    status: 'AVAILABLE',
    count: 38,
    c11: 'EXCLUDED',
    registryVersion: 'ehas2-medicine-registry-v2',
  },
  rules: [
    { ruleNumber: 1, ruleName: 'Temperament (Prakriti)', status: 'READY_FOR_VALIDATION' },
    { ruleNumber: 2, ruleName: 'Polarity', status: 'READY_FOR_VALIDATION' },
    { ruleNumber: 3, ruleName: 'Organ / System Affinity', status: 'READY_FOR_VALIDATION' },
    {
      ruleNumber: 4,
      ruleName: 'Potency',
      status: 'READY_FOR_VALIDATION',
      note: 'PRESCRIPTION_ENGINE_NOT_CONNECTED',
    },
    {
      ruleNumber: 5,
      ruleName: 'Monitoring, Follow-up & Post-Release Safety Surveillance',
      status: 'NOT_IMPLEMENTED',
      note: 'Post-release monitoring not connected',
    },
    {
      ruleNumber: 6,
      ruleName: 'Multi-Disease / Organ-System Triad',
      status: 'READY_FOR_VALIDATION',
    },
    {
      ruleNumber: 7,
      ruleName: 'External Use Routes',
      status: 'READY_FOR_VALIDATION',
      note: 'PRESCRIPTION_ENGINE_NOT_CONNECTED',
    },
    {
      ruleNumber: 8,
      ruleName: 'Disease-level Prakruti Inference',
      status: 'OWNER_DECISION_REQUIRED',
    },
    { ruleNumber: 9, ruleName: 'Master Pipeline', status: 'READY_FOR_VALIDATION' },
  ] as const,
  rule8Status: 'OWNER_DECISION_REQUIRED' as const,
  rule8Implementation: 'NOT_IMPLEMENTED' as const,
  prescriptionReadiness: {
    oral: 'REQUIRES_RECONSTRUCTION',
    potency: 'REQUIRES_RECONSTRUCTION',
    electricity: 'REQUIRES_RECONSTRUCTION',
    tabletA: 'LEGACY_CONFLICT',
    tabletB: 'LEGACY_CONFLICT',
    external: 'REQUIRES_RECONSTRUCTION',
    minimum3EvidencePolicy: 'OWNER_DECISION_REQUIRED',
  },
  goldenCases: {
    total: 26,
    passed: 26,
    blocked: 0,
    reviewRequired: 0,
    assertionsMeaningful: 'PASS',
  },
  determinism: 'PASS' as const,
  safetyGate: 'PASS' as const,
  diseaseRetrieval: 'PASS' as const,
  phase5dReady: false as const,
  gates: {
    noForcedTop1: 'PASS',
    noGlobalSymptomLeakage: 'PASS',
    unknownStatesPreserved: 'PASS',
    zeroFrontendInference: 'PASS',
    zeroMedicineOutput: 'PASS',
  },
} as const;

export const SYNTHETIC_CASE_PREVIEWS = [
  {
    id: 'GC01',
    title: 'Simple single-system complaint',
    label: 'SYNTHETIC',
    inputEvidence: { chiefComplaint: 'fever', symptoms: ['fever'] },
    rankedCandidates: [{ name: 'Demo Metabolic Fever Syndrome', confidence: 0.8 }],
    ruleStatuses: { 1: 'UNRESOLVED', 2: 'EXECUTED', 3: 'EXECUTED', 8: 'NOT_IMPLEMENTED' },
    warnings: ['MISSING_VITALS'],
    unresolved: ['NO_PRAKRITI_EVIDENCE'],
    fingerprints: {
      input: 'SYNTHETIC_FP_GC01_INPUT',
      output: 'SYNTHETIC_FP_GC01_OUTPUT',
    },
  },
  {
    id: 'GC10',
    title: 'High-BP red flag',
    label: 'SYNTHETIC',
    inputEvidence: {
      chiefComplaint: 'headache',
      symptoms: ['headache'],
      vitals: { systolic_bp: 190 },
    },
    rankedCandidates: [{ name: 'Demo Neuro Headache', confidence: 0.7 }],
    ruleStatuses: { 6: 'BLOCKED_BY_SAFETY', 8: 'NOT_IMPLEMENTED' },
    warnings: ['HIGH_BP_RED_FLAG'],
    unresolved: [],
    fingerprints: {
      input: 'SYNTHETIC_FP_GC10_INPUT',
      output: 'SYNTHETIC_FP_GC10_OUTPUT',
    },
  },
  {
    id: 'GC08',
    title: 'No disease match',
    label: 'SYNTHETIC',
    inputEvidence: {
      chiefComplaint: 'zzzznonexistenttoken999',
      symptoms: ['qqqnomatchxyz'],
    },
    rankedCandidates: [],
    ruleStatuses: { 6: 'UNRESOLVED', 8: 'NOT_IMPLEMENTED' },
    warnings: ['MISSING_VITALS'],
    unresolved: ['NO_DISEASE_MATCH'],
    fingerprints: {
      input: 'SYNTHETIC_FP_GC08_INPUT',
      output: 'SYNTHETIC_FP_GC08_OUTPUT',
    },
  },
] as const;
