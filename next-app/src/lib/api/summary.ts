import { apiRequest } from '@/lib/api/client';
import { appEnv } from '@/lib/api/config';
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
  const res = await apiRequest<SummaryResponse>('/api/summary/eh-api', {
    method: 'POST',
    body,
    timeoutMs: 600_000,
    auth: appEnv !== 'local',
  });

  if (!res?.success) {
    throw new Error(res?.message || 'Summary generation failed');
  }

  const summary = res.data?.summary || '';
  const source = res.data?.source || '';
  if (
    !summary.trim() ||
    /template-fallback|clinicalFallbackSeven|ollama-book|book-rag/i.test(summary) ||
    /^(rule-engine|node-rule-engine|ollama-book)$/i.test(source)
  ) {
    throw new Error('Invalid summary — EH API pipeline output required');
  }

  return res;
}
