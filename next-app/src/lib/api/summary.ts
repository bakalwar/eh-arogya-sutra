import { apiRequest, ApiError } from '@/lib/api/client';
import { appEnv, resolvePublicNodeApiBase } from '@/lib/api/config';
import { getValidToken } from '@/lib/session/tokenManager';
import { normalizeCaseDataForSummary } from '@/lib/summaryCaseData';

export interface SummaryResponse {
  success: boolean;
  message?: string;
  data?: {
    summary?: string;
    source?: string;
    summary_via?: string;
    engine_result?: Record<string, unknown>;
  };
}

function validateSummaryResponse(res: SummaryResponse): SummaryResponse {
  if (!res?.success) {
    throw new Error(res?.message || 'Summary generation failed');
  }

  const summary = res.data?.summary || '';
  if (!summary.trim()) {
    throw new Error(res?.message || 'Summary generation failed — EH API returned empty text.');
  }

  const source = res.data?.source || '';
  if (
    /template-fallback|clinicalFallbackSeven|ollama-book|book-rag/i.test(summary) ||
    (/^(rule-engine|node-rule-engine|ollama-book)$/i.test(source) && summary.length < 80)
  ) {
    throw new Error(res?.message || 'Invalid summary — EH API pipeline output required');
  }

  return res;
}

async function fetchSummaryViaDirectRailway(
  body: { caseData: Record<string, unknown> }
): Promise<SummaryResponse | null> {
  const directBase = resolvePublicNodeApiBase();
  const token = await getValidToken();
  if (!directBase || !token) return null;

  const upstream = await fetch(`${directBase}/api/summary/eh-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    credentials: 'omit',
  });

  const data = (await upstream.json().catch(() => null)) as SummaryResponse | null;
  if (upstream.ok && data?.success) return data;

  // 401/403 on direct Railway — JWT host mismatch; let caller try Vercel trusted proxy.
  if (upstream.status === 401 || upstream.status === 403) return null;

  if (data?.message) throw new ApiError(data.message, upstream.status, data);
  return null;
}

/**
 * Clinical summary — Vercel validates JWT → trusted proxy → Railway → EH API 9 Rule Engines + summary_engine.py.
 */
export async function postClinicalSummary(caseData: Record<string, unknown>) {
  const body = { caseData: normalizeCaseDataForSummary(caseData) };

  // Primary: same-origin Vercel route (trusted x-eh-proxy-* headers — no Invalid token).
  try {
    const res = await apiRequest<SummaryResponse>('/api/summary/eh-api', {
      method: 'POST',
      body,
      timeoutMs: 600_000,
      auth: true,
    });
    return validateSummaryResponse(res);
  } catch (vercelErr) {
    const retryable =
      vercelErr instanceof ApiError &&
      (vercelErr.status === 502 || vercelErr.status === 503 || vercelErr.status === 504 || vercelErr.status === 0);

    if (typeof window !== 'undefined' && appEnv === 'production' && retryable) {
      try {
        const direct = await fetchSummaryViaDirectRailway(body);
        if (direct) return validateSummaryResponse(direct);
      } catch (directErr) {
        console.warn('[summary] Direct Railway fallback failed:', directErr);
      }
    }

    throw vercelErr instanceof Error ? vercelErr : new Error('Summary generation failed');
  }
}

/** True when analyze payload has no full EH summary_engine output yet. */
export function needsFullClinicalSummary(caseData: Record<string, unknown>): boolean {
  const text = normalizeCaseDataForSummary(caseData);
  const summary =
    (text.clinical_summary as string) ||
    (text.summary as string) ||
    ((text.eh_analysis as Record<string, unknown>)?.clinical_summary as string) ||
    '';
  return !summary.trim() || summary.trim().length < 250;
}
