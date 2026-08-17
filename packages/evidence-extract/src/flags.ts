import { isProductionRuntime } from '@ehas2/evidence-ingest';
import { RETENTION_JOB_TYPES, type EvidenceJobType } from './types.js';

/** Production and default-off: EXTRACT_CANDIDATES jobs are not claimed. */
export function extractJobsEnabled(env: Record<string, string | undefined> = process.env): boolean {
  if (isProductionRuntime(env)) return false;
  return env.EHAS2_EVIDENCE_EXTRACT_JOBS === '1';
}

export function claimableEvidenceJobTypes(
  env: Record<string, string | undefined> = process.env,
): readonly EvidenceJobType[] {
  if (extractJobsEnabled(env)) {
    return [...RETENTION_JOB_TYPES, 'EXTRACT_CANDIDATES'];
  }
  return RETENTION_JOB_TYPES;
}
