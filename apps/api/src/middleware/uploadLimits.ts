import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from './authorization.js';
import { sendError } from '../http/errors.js';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** In-memory ingest limiter — not a production WAF or Redis cluster. */
export function ingestRateLimit(limit = 10, windowMs = 10 * 60_000) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const subject = req.principal?.subjectId ?? 'anonymous';
    const key = `ingest:${subject}`;
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
        'Too many evidence ingest attempts. Try again shortly.',
        req.requestId ?? 'unknown',
      );
      return;
    }
    next();
  };
}

export function resetIngestRateLimitBuckets(): void {
  buckets.clear();
}
