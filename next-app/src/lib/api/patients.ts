import { apiRequest } from '@/lib/api/client';
import type { PatientRecord, PolarityType } from '@/lib/types';

export interface ApiPatient {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  mobile?: string;
  symptoms?: string | string[];
  notes?: string;
  personalFactor?: string;
  createdAt?: string;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

function mapPolarity(raw?: string): PolarityType {
  const p = (raw || '').toLowerCase();
  if (p.includes('negative')) return 'negative';
  if (p.includes('mixed')) return 'mixed';
  return 'positive';
}

export function mapApiPatientToRecord(p: ApiPatient): PatientRecord {
  const symptoms =
    typeof p.symptoms === 'string'
      ? p.symptoms
      : Array.isArray(p.symptoms)
        ? p.symptoms.join(', ')
        : p.notes || '—';
  return {
    id: p.id,
    initials: initials(p.name || '?'),
    name: p.name,
    age: p.age ?? 0,
    gender: p.gender || '—',
    diagnosis: p.personalFactor || p.notes || '—',
    symptoms,
    polarity: mapPolarity(p.personalFactor),
    formula: [],
  };
}

export async function fetchPatients(): Promise<PatientRecord[]> {
  const res = await apiRequest<{ success: boolean; data?: ApiPatient[] }>('/api/patients');
  if (!res?.success || !Array.isArray(res.data)) return [];
  return res.data.map(mapApiPatientToRecord);
}

export async function createPatient(payload: {
  name: string;
  age?: number;
  gender?: string;
  mobile?: string;
}) {
  return apiRequest<{ success: boolean; data?: ApiPatient }>('/api/patients', {
    method: 'POST',
    body: payload,
  });
}
