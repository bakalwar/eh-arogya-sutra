/** Constitutional Baseline API — standalone :8001 (not eh-api). */
const NUMEROLOGY_API =
  process.env.NEXT_PUBLIC_NUMEROLOGY_API_URL || 'http://127.0.0.1:8001';

export interface ConstitutionalBaseline {
  number?: number;
  dosha_primary?: string;
  dosha_secondary?: string | null;
  organs?: string[];
  baseline_text: string;
  watch_points: string[];
  focus_areas?: string;
  note?: string;
  watch?: string[];
}

export interface ConstitutionalCorrelation extends ConstitutionalBaseline {
  numerology_dosha?: string;
  numerology_secondary?: string | null;
  numerology_organs?: string[];
  photo_dosha?: string;
  match_status?: 'CONFIRMED' | 'PARTIAL' | 'DUAL_TENDENCY';
  combined_organs?: string[];
  correlation_text: string;
}

export interface ConstitutionalTendencyView {
  focusAreas: string;
  note: string;
  watch: string[];
  baseline_text?: string;
  correlation_text?: string;
  match_status?: string;
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(`${NUMEROLOGY_API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchConstitutionalBaseline(input: {
  name: string;
  age: number | string;
  gender: string;
}): Promise<ConstitutionalBaseline | null> {
  const name = input.name.trim();
  if (!name) return null;
  return postJson<ConstitutionalBaseline>('/api/baseline', {
    name,
    age: Number(input.age) || 40,
    gender: input.gender || 'Male',
  });
}

export async function fetchConstitutionalCorrelation(input: {
  name: string;
  age: number | string;
  gender: string;
  photo_detected_dosha: string;
  photo_detected_organs: string[];
}): Promise<ConstitutionalCorrelation | null> {
  const name = input.name.trim();
  if (!name || !input.photo_detected_dosha) return null;
  return postJson<ConstitutionalCorrelation>('/api/correlation', {
    name,
    age: Number(input.age) || 40,
    gender: input.gender || 'Male',
    photo_detected_dosha: input.photo_detected_dosha,
    photo_detected_organs: input.photo_detected_organs,
  });
}

export function toTendencyView(
  data: ConstitutionalBaseline | ConstitutionalCorrelation | null
): ConstitutionalTendencyView | null {
  if (!data) return null;
  const correlation = data as ConstitutionalCorrelation;
  const text = correlation.correlation_text || data.baseline_text || '';
  const watchList = correlation.watch_points?.length
    ? correlation.watch_points
    : data.watch_points || data.watch || [];
  const organs =
    correlation.combined_organs?.join(', ') ||
    data.focus_areas ||
    data.organs?.join(', ') ||
    'General constitution';

  return {
    focusAreas: organs,
    note: text,
    watch: watchList.slice(0, 6),
    baseline_text: data.baseline_text,
    correlation_text: correlation.correlation_text,
    match_status: correlation.match_status,
  };
}

export function resolveLayer1Summary(input: {
  baselineText?: string;
  correlationText?: string;
  hasBodyPhoto: boolean;
}): string {
  if (input.hasBodyPhoto && input.correlationText?.trim()) {
    return input.correlationText.trim();
  }
  return (input.baselineText || '').trim();
}

export function containsForbiddenLabels(text: string): boolean {
  return /\b(numerology|astrology|planet|grah|dasha)\b/i.test(text || '');
}

export function baselineToPreview(data: ConstitutionalBaseline | null) {
  if (!data) return null;
  return {
    baselineText: data.baseline_text,
    organs: data.organs || [],
    watchPoints: data.watch_points || [],
  };
}

export async function numerologyHealth(): Promise<{ status: string; entries: number } | null> {
  try {
    const res = await fetch(`${NUMEROLOGY_API}/api/health`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
