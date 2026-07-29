import type {
  BodySiteInput,
  ClinicalCaseDraft,
  ClinicalContextInput,
  PatientDraft,
  SymptomInput,
  VitalsDraft,
} from './types';

export type FieldErrors = Record<string, string>;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function parseNumber(value: string): number | null {
  if (isBlank(value)) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function validatePatientDraft(patient: PatientDraft): FieldErrors {
  const errors: FieldErrors = {};
  if (patient.mode === 'existing') {
    if (!patient.existingPatientId) {
      errors.existingPatientId = 'Select a synthetic patient, or switch to add-new.';
    }
  } else {
    if (isBlank(patient.displayName)) {
      errors.displayName = 'Patient name is required.';
    }
    if (patient.ageInputMode === 'age') {
      const age = parseNumber(patient.ageYears);
      if (age === null) errors.ageYears = 'Enter age in years.';
      else if (age < 0 || age > 120) errors.ageYears = 'Age must be between 0 and 120.';
    } else if (isBlank(patient.dateOfBirth)) {
      errors.dateOfBirth = 'Enter date of birth, or switch to age.';
    }
    if (!patient.gender) errors.gender = 'Select gender.';
    const weight = parseNumber(patient.weightKg);
    if (weight === null) errors.weightKg = 'Enter weight in kg.';
    else if (weight <= 0 || weight > 400) errors.weightKg = 'Weight must be between 0 and 400 kg.';
  }
  return errors;
}

export function validateVitalsDraft(vitals: VitalsDraft): FieldErrors {
  const errors: FieldErrors = {};
  const sys = parseNumber(vitals.systolicBp);
  const dia = parseNumber(vitals.diastolicBp);
  if (sys === null) errors.systolicBp = 'Systolic BP is required.';
  else if (sys < 60 || sys > 260) errors.systolicBp = 'Systolic BP must be 60–260.';
  if (dia === null) errors.diastolicBp = 'Diastolic BP is required.';
  else if (dia < 30 || dia > 160) errors.diastolicBp = 'Diastolic BP must be 30–160.';
  if (sys !== null && dia !== null && sys <= dia) {
    errors.systolicBp = 'Systolic BP must be higher than diastolic BP.';
  }
  const pulse = parseNumber(vitals.pulse);
  if (pulse === null) errors.pulse = 'Pulse is required.';
  else if (pulse < 20 || pulse > 250) errors.pulse = 'Pulse must be 20–250.';
  const temp = parseNumber(vitals.temperatureC);
  if (temp !== null && (temp < 30 || temp > 45)) {
    errors.temperatureC = 'Temperature must be 30–45°C when entered.';
  }
  const spo2 = parseNumber(vitals.oxygenSaturation);
  if (spo2 !== null && (spo2 < 50 || spo2 > 100)) {
    errors.oxygenSaturation = 'SpO₂ must be 50–100 when entered.';
  }
  for (const key of [
    'systolicBp',
    'diastolicBp',
    'pulse',
    'temperatureC',
    'oxygenSaturation',
  ] as const) {
    const n = parseNumber(vitals[key]);
    if (n !== null && n < 0) errors[key] = 'Negative values are not allowed.';
  }
  return errors;
}

export function validateSymptoms(symptoms: SymptomInput): FieldErrors {
  const errors: FieldErrors = {};
  if (isBlank(symptoms.chiefComplaint)) {
    errors.chiefComplaint = 'Chief complaint is required.';
  }
  if (isBlank(symptoms.completeSymptoms)) {
    errors.completeSymptoms = 'Symptoms cannot be empty or only spaces.';
  }
  if (!symptoms.phase) errors.phase = 'Select phase.';
  const severity = parseNumber(symptoms.severity);
  if (severity === null) errors.severity = 'Severity (1–10) is required.';
  else if (severity < 1 || severity > 10 || !Number.isInteger(severity)) {
    errors.severity = 'Severity must be a whole number from 1 to 10.';
  }
  if (isBlank(symptoms.duration)) errors.duration = 'Duration is required.';
  return errors;
}

export function validateClinicalContext(clinical: ClinicalContextInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!clinical.followUpType) errors.followUpType = 'Select follow-up type.';
  if (clinical.redFlags.length > 0 && !clinical.emergencyAcknowledged) {
    errors.emergencyAcknowledged =
      'Acknowledge the emergency warning before continuing when red flags are selected.';
  }
  return errors;
}

export function validateBodySites(sites: BodySiteInput): FieldErrors {
  const errors: FieldErrors = {};
  if (sites.siteIds.length === 0 && isBlank(sites.freeText)) {
    errors.siteIds = 'Select at least one body site, or add a short clarification.';
  }
  return errors;
}

export function validateCaseStep(
  step: 'patient' | 'vitals' | 'symptoms' | 'clinical' | 'reports' | 'review',
  draft: ClinicalCaseDraft,
): FieldErrors {
  if (step === 'patient') return validatePatientDraft(draft.patient);
  if (step === 'vitals') return validateVitalsDraft(draft.vitals);
  if (step === 'symptoms') {
    return { ...validateSymptoms(draft.symptoms), ...validateBodySites(draft.bodySites) };
  }
  if (step === 'clinical') return validateClinicalContext(draft.clinical);
  if (step === 'reports') return {};
  if (step === 'review') {
    const all = {
      ...validatePatientDraft(draft.patient),
      ...validateVitalsDraft(draft.vitals),
      ...validateSymptoms(draft.symptoms),
      ...validateBodySites(draft.bodySites),
      ...validateClinicalContext(draft.clinical),
    };
    if (!draft.consentAcknowledged) {
      all.consentAcknowledged = 'Confirm the preview acknowledgement before analysis.';
    }
    return all;
  }
  return {};
}

export function firstErrorField(errors: FieldErrors): string | undefined {
  return Object.keys(errors)[0];
}
