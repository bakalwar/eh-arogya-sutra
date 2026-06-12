import client from './client';
import { SUMMARY_EH_API_PATH, SUMMARY_EH_API_ALIASES } from './summaryEndpoints';

/**
 * POST clinical summary — tries EH API route first; on 404 falls back to
 * /api/summary/generate (live Railway until eh-api route is deployed).
 */
export async function postClinicalSummary(caseData) {
  const body = { caseData };
  const paths = [
    SUMMARY_EH_API_PATH,
    ...SUMMARY_EH_API_ALIASES.filter((p) => p !== SUMMARY_EH_API_PATH)
  ];

  let lastError;
  for (let i = 0; i < paths.length; i++) {
    try {
      const res = await client.post(paths[i], body);
      if (res.data?.success) return res;
      lastError = new Error(res.data?.message || 'Summary generation failed');
    } catch (e) {
      lastError = e;
      const status = e.response?.status;
      if (status === 404 && i < paths.length - 1) continue;
      throw e;
    }
  }
  throw lastError || new Error('Summary generation failed');
}
