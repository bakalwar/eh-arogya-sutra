import { getClinicalResultByCaseId } from '../../data/syntheticClinicalResults';
import type { ClinicalResultDisplay } from './types';

export type ClinicalLoadErrorCode = 'invalid-id' | 'not-found' | 'unsupported';

export function loadCaseClinicalResult(
  caseId: string,
): { ok: true; result: ClinicalResultDisplay } | { ok: false; error: ClinicalLoadErrorCode } {
  if (!caseId.startsWith('preview-case-') && !caseId.startsWith('syn-case-')) {
    return { ok: false, error: 'invalid-id' };
  }
  const result = getClinicalResultByCaseId(caseId);
  if (!result) return { ok: false, error: 'not-found' };
  if (result.contractVersion !== '1c-c-display-1') return { ok: false, error: 'unsupported' };
  return { ok: true, result };
}

export function clinicalLoadErrorBody(error: ClinicalLoadErrorCode): string {
  if (error === 'invalid-id') return 'Only synthetic preview case IDs are accepted.';
  if (error === 'unsupported') return 'Unsupported clinical display contract version.';
  return 'No synthetic clinical result is available for this case.';
}
