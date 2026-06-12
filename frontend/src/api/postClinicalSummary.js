import client from './client';
import { SUMMARY_EH_API_PATH } from './summaryEndpoints';

/** POST clinical summary — EH API pipeline only (no rule-engine / generate fallback). */
export async function postClinicalSummary(caseData) {
  const res = await client.post(SUMMARY_EH_API_PATH, { caseData });
  if (!res.data?.success) {
    throw new Error(res.data?.message || 'Summary generation failed');
  }
  const summary = res.data?.data?.summary || '';
  const source = res.data?.data?.source || '';
  if (
    !summary.trim() ||
    /rule-engine|template-fallback|clinicalFallback/i.test(summary) ||
    /rule-engine/i.test(source)
  ) {
    throw new Error('Invalid summary — EH API pipeline output required');
  }
  return res;
}
