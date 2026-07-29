/** Synthetic patient fixtures only — DEMO / UI PREVIEW. No real clinical records. */

export type SyntheticPatientStatus = 'active' | 'follow-up' | 'inactive';

export type SyntheticPatient = {
  id: string;
  displayName: string;
  ageYears: number;
  gender: 'female' | 'male' | 'other' | 'unknown';
  lastConsultationDate: string | null;
  status: SyntheticPatientStatus;
  pendingFollowUp: boolean;
  reportCount: number;
  activeConcerns: string[];
  allergiesPlaceholder: string;
  vitalsSummary: string;
  contactPlaceholder: string;
};

export type SyntheticConsultation = {
  id: string;
  patientId: string;
  date: string;
  status: 'completed' | 'pending-review' | 'cancelled';
  chiefComplaintSummary: string;
  prescriptionStatus: 'not-available' | 'coming-1c-c';
  clinicianReviewStatus: 'not-reviewed' | 'pending' | 'reviewed-placeholder';
  reportPlaceholderCount: number;
};

export const SYNTHETIC_DATA_BANNER = 'DEMO PATIENT RECORD — SYNTHETIC DATA' as const;

export const SYNTHETIC_PATIENTS: readonly SyntheticPatient[] = [
  {
    id: 'syn-patient-001',
    displayName: 'Demo Patient A',
    ageYears: 34,
    gender: 'female',
    lastConsultationDate: '2026-07-12',
    status: 'follow-up',
    pendingFollowUp: true,
    reportCount: 0,
    activeConcerns: ['General wellness check (synthetic)'],
    allergiesPlaceholder: 'Not recorded in this preview',
    vitalsSummary: 'No live vitals — preview only',
    contactPlaceholder: 'Contact details are not stored in Phase 1C-B',
  },
  {
    id: 'syn-patient-002',
    displayName: 'Demo Patient B',
    ageYears: 52,
    gender: 'male',
    lastConsultationDate: '2026-06-28',
    status: 'active',
    pendingFollowUp: false,
    reportCount: 0,
    activeConcerns: ['Synthetic follow-up placeholder'],
    allergiesPlaceholder: 'Not recorded in this preview',
    vitalsSummary: 'No live vitals — preview only',
    contactPlaceholder: 'Contact details are not stored in Phase 1C-B',
  },
  {
    id: 'syn-patient-003',
    displayName: 'Synthetic Patient C',
    ageYears: 27,
    gender: 'other',
    lastConsultationDate: null,
    status: 'inactive',
    pendingFollowUp: false,
    reportCount: 0,
    activeConcerns: [],
    allergiesPlaceholder: 'Not recorded in this preview',
    vitalsSummary: 'No live vitals — preview only',
    contactPlaceholder: 'Contact details are not stored in Phase 1C-B',
  },
] as const;

export const SYNTHETIC_CONSULTATIONS: readonly SyntheticConsultation[] = [
  {
    id: 'syn-consult-001',
    patientId: 'syn-patient-001',
    date: '2026-07-12',
    status: 'pending-review',
    chiefComplaintSummary: 'Synthetic wellness visit (no clinical findings)',
    prescriptionStatus: 'coming-1c-c',
    clinicianReviewStatus: 'pending',
    reportPlaceholderCount: 0,
  },
  {
    id: 'syn-consult-002',
    patientId: 'syn-patient-002',
    date: '2026-06-28',
    status: 'completed',
    chiefComplaintSummary: 'Synthetic review placeholder',
    prescriptionStatus: 'coming-1c-c',
    clinicianReviewStatus: 'reviewed-placeholder',
    reportPlaceholderCount: 0,
  },
] as const;

export function getSyntheticPatient(id: string): SyntheticPatient | undefined {
  return SYNTHETIC_PATIENTS.find((p) => p.id === id);
}

export function getPatientConsultations(patientId: string): SyntheticConsultation[] {
  return SYNTHETIC_CONSULTATIONS.filter((c) => c.patientId === patientId);
}

export function filterSyntheticPatients(opts: {
  query: string;
  status: 'all' | SyntheticPatientStatus;
  sort: 'name' | 'recent' | 'age';
}): SyntheticPatient[] {
  const q = opts.query.trim().toLowerCase();
  let list = SYNTHETIC_PATIENTS.filter((p) => {
    if (opts.status !== 'all' && p.status !== opts.status) return false;
    if (!q) return true;
    return p.displayName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
  });
  list = [...list].sort((a, b) => {
    if (opts.sort === 'name') return a.displayName.localeCompare(b.displayName);
    if (opts.sort === 'age') return a.ageYears - b.ageYears;
    const ad = a.lastConsultationDate ?? '';
    const bd = b.lastConsultationDate ?? '';
    return bd.localeCompare(ad);
  });
  return list;
}

export function assertNoRealPatientFixtures(text: string): boolean {
  return !/irfaz\s*khan/i.test(text) && !/\b(?:\+91[-\s]?)?[6-9]\d{9}\b/.test(text);
}
