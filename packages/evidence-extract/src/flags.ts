import { isProductionRuntime } from '@ehas2/evidence-ingest';
import { RETENTION_JOB_TYPES, type EvidenceJobType } from './types.js';

/** Non-production F3C source-linked candidate review API. Production always false. */
export function candidateReviewEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (isProductionRuntime(env)) return false;
  return env.EHAS2_F3C_CANDIDATE_REVIEW === '1';
}

/** Non-production F3D-1 fact-candidate materialize API. Production always false. */
export function factCandidatesEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (isProductionRuntime(env)) return false;
  return env.EHAS2_F3D_FACT_CANDIDATES === '1';
}

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

/** Non-production OCR adapter jobs: requires extract jobs plus EHAS2_F3B_OCR_EXTRACT_JOBS=1. */
export function extractOcrJobsEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (isProductionRuntime(env)) return false;
  if (!extractJobsEnabled(env)) return false;
  return env.EHAS2_F3B_OCR_EXTRACT_JOBS === '1';
}
