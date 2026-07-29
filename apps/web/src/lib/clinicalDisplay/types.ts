/**
 * Frontend presentation contract for Phase 1C-C.
 * Display-only — no clinical selection, inference, or formula creation.
 */

export const DEMO_CLINICAL_BANNER = 'DEMO CLINICAL LAYOUT — NOT A GENERATED PRESCRIPTION' as const;

export const DEMO_INDEPENDENT_SELECTION_LABEL = 'DEMO INDEPENDENT-SELECTION LAYOUT' as const;

export type ClinicianReviewStatus =
  'pending-review' | 'accepted' | 'modified' | 'rejected' | 'needs-clarification';

export type ElectricityStatus =
  | { state: 'resolved'; value: string }
  | { state: 'unresolved'; reason: string }
  | { state: 'not-generated'; reason: string };

export type MedicineToken = {
  code: string;
  displayName: string;
};

export type OralMixtureDisplay = {
  id: string;
  label: string;
  clinicalTarget: string;
  medicines: MedicineToken[];
  potency: string | null;
  doseInstructions: string | null;
  electricity: ElectricityStatus;
  evidence: string;
  sourceVersion: string;
  noRepetitionWarning?: string;
};

export type TabletSectionADisplay = {
  status: 'generated' | 'not-generated';
  demoIndependentSelectionLabel?: string;
  medicines: MedicineToken[];
  clinicalTarget: string | null;
  evidence: string | null;
  potency: string | null;
  electricity: ElectricityStatus | null;
  scheduleInstructions: string | null;
  selectionSource: string | null;
  oralOverlapMetadata: string | null;
  notGeneratedReason?: string;
};

export type TabletSlotId = 'before-food' | 'after-food' | 'night';

export type TabletSlotDisplay =
  | {
      slotId: TabletSlotId;
      status: 'generated';
      medicine: MedicineToken;
      clinicalTarget: string;
      evidence: string;
      timing: string;
      potency: string | null;
      electricity: ElectricityStatus | null;
    }
  | {
      slotId: TabletSlotId;
      status: 'not-generated';
      reason: string;
    };

export type ExternalApplicationDisplay = {
  id: string;
  stageRouteLabel: string;
  bodySite: string;
  clinicalTarget: string;
  medicines: MedicineToken[];
  preparation: string;
  frequency: string;
  duration: string;
  potency: string | null;
  electricity: ElectricityStatus | null;
  evidence: string;
  safetyInstructions: string;
  notClinicallyIndicatedReason?: string;
};

export type ScheduleBlockId =
  'morning' | 'before-food' | 'after-food' | 'afternoon' | 'evening' | 'night' | 'external';

export type DailyScheduleItem = {
  blockId: ScheduleBlockId;
  label: string;
  instructions: string[];
};

export type ReportFindingDisplay = {
  id: string;
  reportType: string;
  findingLabel: string;
  valueStatus: string;
  sourceDocumentLabel: string;
  confidenceStatus: string;
  clinicalRelevance: string;
  synthetic: true;
};

export type ClinicalStageDisplay = {
  stage: 2 | 3 | 4 | 5 | 6;
  title: string;
  clinicalPurpose: string;
  findings: string;
  mechanism: string;
  expectedProgression: string;
  monitoring: string;
  warnings: string;
  evidenceSource: string;
};

export type ClinicalResultDisplay = {
  resultId: string;
  synthetic: true;
  demoLabel: typeof DEMO_CLINICAL_BANNER;
  engineVersion: string;
  ruleVersion: string;
  diseaseDataVersion: string;
  medicineDataVersion: string;
  patientContext: {
    syntheticPatientId: string;
    displayName: string;
    ageYears: number;
    gender: string;
  };
  caseContext: {
    casePreviewId: string;
    chiefComplaint: string;
    phase: string;
    severity: string;
  };
  normalizedSymptoms: string[];
  reportFindings: ReportFindingDisplay[];
  detectedDiseases: string[];
  affectedSystems: string[];
  primarySystem: string | null;
  clinicalTarget: string | null;
  rootCause: string | null;
  temperament: string | null;
  constitution: string | null;
  polarity: string | null;
  oralMixtures: OralMixtureDisplay[];
  tabletSectionA: TabletSectionADisplay;
  tabletSectionB: TabletSlotDisplay[];
  externalApplications: ExternalApplicationDisplay[];
  dailySchedule: DailyScheduleItem[];
  scheduleConflictWarning: string | null;
  dietGuidance: string[];
  safetyWarnings: string[];
  stages: ClinicalStageDisplay[];
  evidenceNotes: string[];
  clinicianReviewStatus: ClinicianReviewStatus;
  prescriptionStatus: 'demo-layout' | 'not-generated' | 'incomplete';
  contractVersion: string;
};

export type PrescriptionHistoryItem = {
  id: string;
  casePreviewId: string;
  syntheticPatientName: string;
  date: string;
  status: ClinicianReviewStatus;
  versionLabel: string;
  demoLabel: 'DEMO DATA';
  mixtureCount: number;
};
