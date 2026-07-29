/** UI draft types for Phase 1C-B — not clinical-engine contracts. */

export type GenderOption = 'female' | 'male' | 'other' | 'unknown';

export type PatientDraft = {
  mode: 'existing' | 'new';
  existingPatientId: string;
  displayName: string;
  ageYears: string;
  dateOfBirth: string;
  ageInputMode: 'age' | 'dob';
  gender: GenderOption | '';
  weightKg: string;
};

export type VitalsDraft = {
  systolicBp: string;
  diastolicBp: string;
  pulse: string;
  temperatureC: string;
  oxygenSaturation: string;
  notes: string;
};

export type SymptomInput = {
  chiefComplaint: string;
  completeSymptoms: string;
  duration: string;
  phase: '' | 'acute' | 'subacute' | 'chronic' | 'unknown';
  severity: string;
  suspectedDiagnosis: string;
};

export type ClinicalContextInput = {
  followUpType: '' | 'new' | 'follow-up' | 'review' | 'unknown';
  redFlags: string[];
  emergencyAcknowledged: boolean;
  temperament: '' | 'unknown' | 'calm' | 'irritable' | 'anxious' | 'other';
  constitution: '' | 'unknown' | 'vata' | 'pitta' | 'kapha' | 'mixed' | 'other';
  lifestyleFactors: string;
  doctorNotes: string;
};

export type BodySiteInput = {
  siteIds: string[];
  laterality: '' | 'left' | 'right' | 'bilateral' | 'na';
  freeText: string;
};

export type ReportCategory =
  'blood-lab' | 'usg' | 'xray' | 'mri' | 'ct' | 'clinical-image' | 'other';

export type ReportSelectionMetadata = {
  id: string;
  displayName: string;
  category: ReportCategory;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  previewKind: 'image' | 'pdf-placeholder' | 'unsupported';
  mimeExtensionConsistent: boolean;
};

export type ClinicalCaseDraft = {
  patient: PatientDraft;
  vitals: VitalsDraft;
  symptoms: SymptomInput;
  clinical: ClinicalContextInput;
  bodySites: BodySiteInput;
  reports: ReportSelectionMetadata[];
  consentAcknowledged: boolean;
};

export type CaseReviewModel = ClinicalCaseDraft & {
  casePreviewId: string;
  syntheticLabel: string;
};

export type CaseStepId = 'patient' | 'vitals' | 'symptoms' | 'clinical' | 'reports' | 'review';

export const CASE_STEPS: { id: CaseStepId; label: string }[] = [
  { id: 'patient', label: 'Patient' },
  { id: 'vitals', label: 'Vitals' },
  { id: 'symptoms', label: 'Symptoms' },
  { id: 'clinical', label: 'Clinical context' },
  { id: 'reports', label: 'Reports' },
  { id: 'review', label: 'Review' },
];

export function createEmptyCaseDraft(): ClinicalCaseDraft {
  return {
    patient: {
      mode: 'existing',
      existingPatientId: '',
      displayName: '',
      ageYears: '',
      dateOfBirth: '',
      ageInputMode: 'age',
      gender: '',
      weightKg: '',
    },
    vitals: {
      systolicBp: '',
      diastolicBp: '',
      pulse: '',
      temperatureC: '',
      oxygenSaturation: '',
      notes: '',
    },
    symptoms: {
      chiefComplaint: '',
      completeSymptoms: '',
      duration: '',
      phase: '',
      severity: '',
      suspectedDiagnosis: '',
    },
    clinical: {
      followUpType: '',
      redFlags: [],
      emergencyAcknowledged: false,
      temperament: '',
      constitution: '',
      lifestyleFactors: '',
      doctorNotes: '',
    },
    bodySites: {
      siteIds: [],
      laterality: '',
      freeText: '',
    },
    reports: [],
    consentAcknowledged: false,
  };
}
