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

/** Python EH API — 14k disease fuzzy search (via Next rewrite → :8005) */
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

/** Full Smart Search — Node orchestrates Python 9 rule engines */
export async function analyzeCaseComplete(form: FormData): Promise<AnalyzeResult> {
  return apiRequest<AnalyzeResult>('/api/search/analyze-complete', {
    method: 'POST',
    body: form,
    timeoutMs: 300_000,
  });
}
