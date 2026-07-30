import {
  DEMO_CLINICAL_BANNER,
  DEMO_INDEPENDENT_SELECTION_LABEL,
  type ClinicalResultDisplay,
  type ExternalApplicationDisplay,
  type OralMixtureDisplay,
  type PrescriptionHistoryItem,
  type TabletSlotDisplay,
} from '../lib/clinicalDisplay/types';

function med(code: string, displayName: string) {
  return { code, displayName };
}

function mixture(
  partial: Omit<OralMixtureDisplay, 'sourceVersion'> & { sourceVersion?: string },
): OralMixtureDisplay {
  return { sourceVersion: 'demo-fixture-1c-c', ...partial };
}

function baseResult(
  overrides: Partial<ClinicalResultDisplay> &
    Pick<
      ClinicalResultDisplay,
      'resultId' | 'oralMixtures' | 'externalApplications' | 'tabletSectionB'
    >,
): ClinicalResultDisplay {
  return {
    synthetic: true,
    demoLabel: DEMO_CLINICAL_BANNER,
    engineVersion: 'NOT_CONNECTED',
    ruleVersion: 'NOT_INSTALLED',
    diseaseDataVersion: 'NOT_INSTALLED',
    medicineDataVersion: 'NOT_INSTALLED',
    patientContext: {
      syntheticPatientId: 'syn-patient-001',
      displayName: 'Demo Patient A',
      ageYears: 34,
      gender: 'female',
    },
    caseContext: {
      casePreviewId: 'preview-case-3mix',
      chiefComplaint: 'Synthetic wellness review (demo layout)',
      phase: 'subacute',
      severity: '4',
    },
    normalizedSymptoms: ['Fatigue (synthetic)', 'Mild joint discomfort (synthetic)'],
    reportFindings: [
      {
        id: 'syn-finding-1',
        reportType: 'Blood/Lab',
        findingLabel: 'Demo marker within reference (synthetic)',
        valueStatus: 'Within demo range',
        sourceDocumentLabel: 'SYN-LAB-PLACEHOLDER.pdf',
        confidenceStatus: 'Synthetic fixture',
        clinicalRelevance: 'Supplied by demo contract only — not OCR.',
        synthetic: true,
      },
    ],
    detectedDiseases: ['Demo syndrome layout A'],
    affectedSystems: ['Musculoskeletal', 'General'],
    primarySystem: 'Musculoskeletal',
    clinicalTarget: 'Supportive demo target',
    rootCause: 'Demo root-cause placeholder (not engine output)',
    temperament: 'calm',
    constitution: 'mixed',
    polarity: 'Balanced (demo label)',
    tabletSectionA: {
      status: 'generated',
      demoIndependentSelectionLabel: DEMO_INDEPENDENT_SELECTION_LABEL,
      medicines: [med('DM-T1', 'Demo Tablet Alpha')],
      clinicalTarget: 'Supportive tablet target (demo)',
      evidence: 'Fixture evidence only — UI does not select medicines.',
      potency: 'Demo potency token',
      electricity: { state: 'resolved', value: 'Demo-E1' },
      scheduleInstructions: 'After food · twice daily (demo schedule text)',
      selectionSource: 'synthetic-fixture',
      oralOverlapMetadata: 'No oral overlap claimed (demo metadata)',
    },
    dailySchedule: [
      { blockId: 'morning', label: 'Morning', instructions: ['Oral mixture 1 — as supplied'] },
      {
        blockId: 'before-food',
        label: 'Before food',
        instructions: ['Tablet B slot if generated'],
      },
      {
        blockId: 'after-food',
        label: 'After food',
        instructions: ['Tablet Section A — as supplied'],
      },
      {
        blockId: 'afternoon',
        label: 'Afternoon',
        instructions: ['Oral mixture mid-day — as supplied'],
      },
      {
        blockId: 'evening',
        label: 'Evening',
        instructions: ['Oral mixture evening — as supplied'],
      },
      { blockId: 'night', label: 'Night', instructions: ['Night slot if generated'] },
      {
        blockId: 'external',
        label: 'External application',
        instructions: ['Only if external formulas supplied'],
      },
    ],
    scheduleConflictWarning: null,
    dietGuidance: ['Hydration reminder (demo)', 'Avoid self-medication (demo)'],
    safetyWarnings: ['This is a synthetic layout — not a clinical prescription.'],
    stages: [2, 3, 4, 5, 6].map((stage) => ({
      stage: stage as 2 | 3 | 4 | 5 | 6,
      title: `Stage ${stage} (demo)`,
      clinicalPurpose: `Demo purpose for stage ${stage}`,
      findings: `Synthetic findings text for stage ${stage}.`,
      mechanism: `Synthetic mechanism text for stage ${stage}.`,
      expectedProgression: `Expected demo progression for stage ${stage}.`,
      monitoring: `Monitoring placeholder for stage ${stage}.`,
      warnings: `Stage ${stage} warning placeholder.`,
      evidenceSource: 'synthetic-fixture',
    })),
    evidenceNotes: ['All sections rendered from typed synthetic fixture only.'],
    clinicianReviewStatus: 'pending-review',
    prescriptionStatus: 'demo-layout',
    contractVersion: '1c-c-display-1',
    ...overrides,
  };
}

const threeMixtures: OralMixtureDisplay[] = [
  mixture({
    id: 'om-1',
    label: 'Oral Mixture 1',
    clinicalTarget: 'Demo target 1',
    medicines: [med('DM-01', 'Demo Medicine One'), med('DM-02', 'Demo Medicine Two')],
    potency: 'P-demo-1',
    doseInstructions: '10 drops · twice daily (demo)',
    electricity: { state: 'resolved', value: 'E-demo-1' },
    evidence: 'Fixture evidence for mixture 1.',
  }),
  mixture({
    id: 'om-2',
    label: 'Oral Mixture 2',
    clinicalTarget: 'Demo target 2',
    medicines: [med('DM-03', 'Demo Medicine Three With A Considerably Longer Display Name')],
    potency: 'P-demo-2',
    doseInstructions: '15 drops · once daily (demo)',
    electricity: { state: 'resolved', value: 'E-demo-2' },
    evidence:
      'Fixture evidence for mixture 2 with extended explanation text for layout stress testing.',
  }),
  mixture({
    id: 'om-3',
    label: 'Oral Mixture 3',
    clinicalTarget: 'Demo target 3',
    medicines: [med('DM-04', 'Demo Medicine Four'), med('DM-05', 'Demo Medicine Five')],
    potency: 'P-demo-3',
    doseInstructions: 'As directed (demo)',
    electricity: { state: 'resolved', value: 'E-demo-3' },
    evidence: 'Fixture evidence for mixture 3.',
    noRepetitionWarning: 'Demo metadata: no medicine repetition in this fixture.',
  }),
];

const fourMixtures: OralMixtureDisplay[] = [
  ...threeMixtures,
  mixture({
    id: 'om-4',
    label: 'Oral Mixture 4',
    clinicalTarget: 'Demo target 4',
    medicines: [med('DM-06', 'Demo Medicine Six')],
    potency: 'P-demo-4',
    doseInstructions: '5 drops · thrice daily (demo)',
    electricity: {
      state: 'unresolved',
      reason: 'Electricity unresolved in demo fixture — not defaulted by UI.',
    },
    evidence: 'Fixture evidence for mixture 4 (unresolved electricity).',
  }),
];

const fiveMixtures: OralMixtureDisplay[] = [
  ...fourMixtures,
  mixture({
    id: 'om-5',
    label: 'Oral Mixture 5',
    clinicalTarget: 'Demo target 5',
    medicines: [med('DM-07', 'Demo Medicine Seven'), med('DM-08', 'Demo Medicine Eight')],
    potency: null,
    doseInstructions: null,
    electricity: { state: 'not-generated', reason: 'Not generated by clinical engine' },
    evidence: 'Fixture evidence for mixture 5 with missing potency handled explicitly.',
  }),
];

const tabletBPartial: TabletSlotDisplay[] = [
  {
    slotId: 'before-food',
    status: 'generated',
    medicine: med('DM-TB1', 'Demo Tablet Before'),
    clinicalTarget: 'Before-food demo target',
    evidence: 'Fixture evidence before food.',
    timing: 'Before food',
    potency: 'P-tb-1',
    electricity: { state: 'resolved', value: 'E-tb-1' },
  },
  {
    slotId: 'after-food',
    status: 'not-generated',
    reason: 'NO_CLINICALLY_JUSTIFIED_CANDIDATE',
  },
  {
    slotId: 'night',
    status: 'generated',
    medicine: med('DM-TB3', 'Demo Tablet Night'),
    clinicalTarget: 'Night demo target',
    evidence: 'Fixture evidence night.',
    timing: 'Night',
    potency: 'P-tb-3',
    electricity: { state: 'resolved', value: 'E-tb-3' },
  },
];

function externalSet(count: number): ExternalApplicationDisplay[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `ext-${i + 1}`,
    stageRouteLabel: `Stage/Route demo ${i + 1}`,
    bodySite: ['Left knee', 'Right elbow', 'Lower back', 'Neck'][i] ?? 'Unspecified site (demo)',
    clinicalTarget: `External target ${i + 1}`,
    medicines: [med(`DM-EX${i + 1}`, `Demo External ${i + 1}`)],
    preparation: 'Prepare as directed in demo fixture',
    frequency: 'Twice daily (demo)',
    duration: '7 days (demo)',
    potency: 'P-ext',
    electricity: { state: 'resolved', value: `E-ext-${i + 1}` },
    evidence: `External fixture evidence ${i + 1}.`,
    safetyInstructions: 'For demo layout only — not a treatment instruction.',
  }));
}

export const SYNTHETIC_CLINICAL_RESULTS = {
  threeMixture: baseResult({
    resultId: 'syn-result-3mix',
    caseContext: {
      casePreviewId: 'preview-case-3mix',
      chiefComplaint: 'Synthetic 3-mixture layout',
      phase: 'acute',
      severity: '3',
    },
    oralMixtures: threeMixtures,
    tabletSectionB: tabletBPartial,
    externalApplications: [],
  }),
  fourMixture: baseResult({
    resultId: 'syn-result-4mix',
    caseContext: {
      casePreviewId: 'preview-case-4mix',
      chiefComplaint: 'Synthetic 4-mixture layout with unresolved electricity',
      phase: 'subacute',
      severity: '5',
    },
    oralMixtures: fourMixtures,
    tabletSectionB: tabletBPartial,
    externalApplications: externalSet(2),
    scheduleConflictWarning:
      'Demo conflict metadata — clinician review required (not resolved by UI).',
  }),
  fiveMixture: baseResult({
    resultId: 'syn-result-5mix',
    caseContext: {
      casePreviewId: 'preview-case-5mix',
      chiefComplaint: 'Synthetic 5-mixture + four external layout',
      phase: 'chronic',
      severity: '6',
    },
    oralMixtures: fiveMixtures,
    tabletSectionB: [
      {
        slotId: 'before-food',
        status: 'not-generated',
        reason: 'NO_CLINICALLY_JUSTIFIED_CANDIDATE',
      },
      {
        slotId: 'after-food',
        status: 'not-generated',
        reason: 'NO_CLINICALLY_JUSTIFIED_CANDIDATE',
      },
      { slotId: 'night', status: 'not-generated', reason: 'NO_CLINICALLY_JUSTIFIED_CANDIDATE' },
    ],
    externalApplications: externalSet(4),
  }),
  oneExternal: baseResult({
    resultId: 'syn-result-ext-1',
    caseContext: {
      casePreviewId: 'preview-case-ext-1',
      chiefComplaint: 'Synthetic one-external layout fixture',
      phase: 'acute',
      severity: '2',
    },
    oralMixtures: threeMixtures.slice(0, 1),
    tabletSectionB: tabletBPartial,
    externalApplications: externalSet(1),
  }),
  threeExternal: baseResult({
    resultId: 'syn-result-ext-3',
    caseContext: {
      casePreviewId: 'preview-case-ext-3',
      chiefComplaint: 'Synthetic three-external layout fixture',
      phase: 'subacute',
      severity: '4',
    },
    oralMixtures: threeMixtures,
    tabletSectionB: tabletBPartial,
    externalApplications: externalSet(3),
  }),
  notGenerated: baseResult({
    resultId: 'syn-result-empty',
    prescriptionStatus: 'not-generated',
    caseContext: {
      casePreviewId: 'preview-case-empty',
      chiefComplaint: 'Not generated demo',
      phase: 'unknown',
      severity: '—',
    },
    oralMixtures: [],
    tabletSectionA: {
      status: 'not-generated',
      medicines: [],
      clinicalTarget: null,
      evidence: null,
      potency: null,
      electricity: null,
      scheduleInstructions: null,
      selectionSource: null,
      oralOverlapMetadata: null,
      notGeneratedReason: 'Not generated by clinical engine',
    },
    tabletSectionB: [
      {
        slotId: 'before-food',
        status: 'not-generated',
        reason: 'Not generated by clinical engine',
      },
      { slotId: 'after-food', status: 'not-generated', reason: 'Not generated by clinical engine' },
      { slotId: 'night', status: 'not-generated', reason: 'Not generated by clinical engine' },
    ],
    externalApplications: [],
    stages: [],
    reportFindings: [],
    detectedDiseases: [],
    affectedSystems: [],
    primarySystem: null,
    clinicalTarget: null,
    rootCause: null,
    polarity: null,
    dailySchedule: [],
  }),
} as const;

export const SYNTHETIC_PRESCRIPTION_HISTORY: readonly PrescriptionHistoryItem[] = [
  {
    id: 'syn-rx-001',
    casePreviewId: 'preview-case-3mix',
    syntheticPatientName: 'Demo Patient A',
    date: '2026-07-20',
    status: 'pending-review',
    versionLabel: 'v-demo-1',
    demoLabel: 'DEMO DATA',
    mixtureCount: 3,
  },
  {
    id: 'syn-rx-002',
    casePreviewId: 'preview-case-4mix',
    syntheticPatientName: 'Demo Patient B',
    date: '2026-07-18',
    status: 'accepted',
    versionLabel: 'v-demo-2',
    demoLabel: 'DEMO DATA',
    mixtureCount: 4,
  },
  {
    id: 'syn-rx-003',
    casePreviewId: 'preview-case-5mix',
    syntheticPatientName: 'Synthetic Patient C',
    date: '2026-07-10',
    status: 'needs-clarification',
    versionLabel: 'v-demo-3',
    demoLabel: 'DEMO DATA',
    mixtureCount: 5,
  },
] as const;

export function getClinicalResultByCaseId(caseId: string): ClinicalResultDisplay | undefined {
  const map: Record<string, ClinicalResultDisplay> = {
    'preview-case-3mix': SYNTHETIC_CLINICAL_RESULTS.threeMixture,
    'preview-case-4mix': SYNTHETIC_CLINICAL_RESULTS.fourMixture,
    'preview-case-5mix': SYNTHETIC_CLINICAL_RESULTS.fiveMixture,
    'preview-case-ext-1': SYNTHETIC_CLINICAL_RESULTS.oneExternal,
    'preview-case-ext-3': SYNTHETIC_CLINICAL_RESULTS.threeExternal,
    'preview-case-empty': SYNTHETIC_CLINICAL_RESULTS.notGenerated,
    'syn-case-3mix': SYNTHETIC_CLINICAL_RESULTS.threeMixture,
  };
  return map[caseId];
}

export function getClinicalResultByPrescriptionId(
  prescriptionId: string,
): ClinicalResultDisplay | undefined {
  const item = SYNTHETIC_PRESCRIPTION_HISTORY.find((p) => p.id === prescriptionId);
  return item ? getClinicalResultByCaseId(item.casePreviewId) : undefined;
}

export function assertNoForbiddenClinicalDefaults(text: string): boolean {
  if (/\bWE\b/.test(text) && /default/i.test(text)) return false;
  if (/irfaz/i.test(text)) return false;
  if (/phase\s*f/i.test(text) && /import/i.test(text)) return false;
  return true;
}
