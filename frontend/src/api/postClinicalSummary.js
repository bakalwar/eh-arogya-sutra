import client from './client';
import { SUMMARY_EH_API_PATH, SUMMARY_EH_API_ALIASES } from './summaryEndpoints';

const NODE_ALIASES = SUMMARY_EH_API_ALIASES.filter((p) => p !== SUMMARY_EH_API_PATH);

/**
 * POST clinical summary — EH API pipeline.
 * Tries /api/summary/eh-api first; on 404 uses Node aliases (live until Railway deploy catches up).
 */
export async function postClinicalSummary(caseData) {
  const body = { caseData };
  const paths = [SUMMARY_EH_API_PATH, ...NODE_ALIASES];

  let lastErr;
  for (let i = 0; i < paths.length; i++) {
    try {
      const res = await client.post(paths[i], body);
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Summary generation failed');
      }
      const summary = res.data?.data?.summary || '';
      const source = res.data?.data?.source || '';
      if (
        !summary.trim() ||
        /template-fallback|clinicalFallbackSeven/i.test(summary) ||
        /^(rule-engine|node-rule-engine)$/i.test(source)
      ) {
        throw new Error('Invalid summary — EH API pipeline output required');
      }
      return res;
    } catch (e) {
      lastErr = e;
      const status = e.response?.status;
      if (status === 404 && i < paths.length - 1) continue;
      throw e;
    }
  }
  throw lastErr || new Error('Summary generation failed');
}
