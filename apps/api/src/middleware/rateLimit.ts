import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from './authorization.js';
import { sendError } from '../http/errors.js';

type Bucket = { count: number; resetAt: number };

/**
 * In-memory mutation rate-limit foundation (Phase 3D).
 * Not a WAF substitute — ready for Redis/provider wiring in later hardening phases.
 */
const buckets = new Map<string, Bucket>();

export function mutationRateLimit(limit = 60, windowMs = 60_000) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const subject = req.principal?.subjectId ?? 'anonymous';
    const key = `${req.method}:${req.path}:${subject}`;
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > limit) {
      sendError(
        res,
        429,
        'RATE_LIMITED',
        'Too many profile mutations. Try again shortly.',
        req.requestId ?? 'unknown',
      );
      return;
    }
    next();
  };
}

/** Test helper — clears in-memory buckets. */
export function resetMutationRateLimitBuckets(): void {
  buckets.clear();
}
