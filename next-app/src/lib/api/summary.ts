import { apiRequest } from '@/lib/api/client';
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

/**
 * Clinical summary — same-origin Vercel route → trusted proxy → Railway → EH API 9 Rule Engines.
 */
export async function postClinicalSummary(caseData: Record<string, unknown>) {
  const body = { caseData: normalizeCaseDataForSummary(caseData) };
  const res = await apiRequest<SummaryResponse>('/api/summary/eh-api', {
    method: 'POST',
    body,
    timeoutMs: 600_000,
    auth: true,
  });
  return validateSummaryResponse(res);
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
