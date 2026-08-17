import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from './authorization.js';

/**
 * F1 in-process Map limiter removed for evidence ingest.
 * Durable limiter port is applied in EvidenceService; production without a
 * configured durable adapter fails closed with RATE_LIMIT_UNAVAILABLE.
 */
export function ingestRateLimit() {
  return (_req: AuthedRequest, _res: Response, next: NextFunction): void => {
    next();
  };
}

export function resetIngestRateLimitBuckets(): void {
  /* evidence ingest no longer uses a process-local Map */
}
