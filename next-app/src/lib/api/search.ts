import { apiRequest } from '@/lib/api/client';

export interface SymptomItem {
  name: string;
  name_hi?: string;
}

export interface DiseaseSearchHit {
  name?: string;
  disease?: string;
  score?: number;
}

export async function fetchSymptoms(): Promise<SymptomItem[]> {
  const res = await apiRequest<{ success: boolean; data?: SymptomItem[] }>('/api/search/symptoms');
  return res?.success && Array.isArray(res.data) ? res.data : [];
}

/** 14k disease fuzzy search — production → Railway Node /api/v3/search → EH Python */
export async function searchDiseases(query: string, limit = 8): Promise<DiseaseSearchHit[]> {
  if (!query.trim() || query.trim().length < 2) return [];
  const q = encodeURIComponent(query.trim());
  const res = await apiRequest<{
    matches?: Array<string | { name?: string; disease?: string }>;
    results?: DiseaseSearchHit[];
  }>(`/api/v3/search?q=${q}&limit=${limit}`, { auth: false });

  const raw = res?.matches || res?.results || [];
  return raw.map((item) =>
    typeof item === 'string' ? { name: item } : { name: item.name || item.disease }
  );
}

export interface AnalyzeResult {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  pipeline?: string;
  eh_engine_online?: boolean;
}

function formHasUploads(form: FormData): boolean {
  const fileKeys = [
    'report_files',
    'report_file',
    'files',
    'body_photos',
    'body_photo',
    'face_image',
  ];
  for (const key of fileKeys) {
    for (const entry of form.getAll(key)) {
      if (entry instanceof File && entry.size > 0) return true;
    }
  }
  return false;
}

/** Smart Search — JSON (symptoms) or multipart (files); production hits Railway via NEXT_PUBLIC_NODE_API_URL */
export async function analyzeCaseComplete(form: FormData): Promise<AnalyzeResult> {
  if (!formHasUploads(form)) {
    const name = String(form.get('patient_name') || form.get('patientName') || '').trim();
    const chief = String(form.get('chief_complaint') || form.get('chiefComplaint') || '').trim();
    const body = {
      name,
      patient: {
        name,
        age: Number(form.get('age')) || 30,
        gender: String(form.get('gender') || 'Male'),
        bp_systolic: Number(form.get('bp_systolic')) || 120,
        bp_diastolic: Number(form.get('bp_diastolic')) || 80,
      },
      chief_complaint: chief,
      duration_days: Number(form.get('duration_days')) || 7,
      phase: String(form.get('phase') || 'ACUTE'),
      condition: String(form.get('condition') || ''),
    };
    return apiRequest<AnalyzeResult>('/api/search/analyze', {
      method: 'POST',
      body,
      timeoutMs: 300_000,
    });
  }

  return apiRequest<AnalyzeResult>('/api/search/analyze-complete', {
    method: 'POST',
    body: form,
    timeoutMs: 300_000,
  });
}
