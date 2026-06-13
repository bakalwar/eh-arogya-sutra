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

/**
 * Clinical summary — EH API only (Node → Python /api/summary/eh-api → 9 Rule Engines + summary_engine.py).
 * No book RAG / Node rule-engine / Ollama fallbacks.
 */
export async function postClinicalSummary(caseData: Record<string, unknown>) {
  const body = { caseData: normalizeCaseDataForSummary(caseData) };

  let res: SummaryResponse | null = null;

  if (typeof window !== 'undefined' && appEnv === 'production') {
    const directBase = resolvePublicNodeApiBase();
    const token = await getValidToken();
    if (directBase && token) {
      try {
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
        if (upstream.ok && data?.success) {
          res = data;
        } else if (data?.message && upstream.status >= 400) {
          throw new ApiError(data.message, upstream.status, data);
        }
      } catch (e) {
        if (e instanceof ApiError && e.status !== 0) throw e;
        console.warn('[summary] Direct Railway call failed, trying Vercel route:', e);
      }
    }
  }

  if (!res) {
    res = await apiRequest<SummaryResponse>('/api/summary/eh-api', {
      method: 'POST',
      body,
      timeoutMs: 600_000,
      auth: true,
    });
  }

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
