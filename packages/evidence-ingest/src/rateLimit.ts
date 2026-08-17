import type { DurableRateLimiter, RateLimitDecision } from './types.js';

export const RATE_LIMIT_TEST_DEFAULTS = {
  initiatesPerActorPerWindow: 10,
  initiateWindowMs: 10 * 60_000,
  concurrentUploadsPerActor: 3,
  bytesPerActorPerWindow: 40 * 1024 * 1024,
  byteWindowMs: 10 * 60_000,
} as const;

type WindowCounter = { count: number; resetAt: number };

function unavailable(retryAfterSec = 30): RateLimitDecision {
  return { ok: false, code: 'RATE_LIMIT_UNAVAILABLE', retryAfterSec };
}

function limited(resetAt: number): RateLimitDecision {
  return {
    ok: false,
    code: 'RATE_LIMITED',
    retryAfterSec: Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
  };
}

function bump(
  map: Map<string, WindowCounter>,
  key: string,
  windowMs: number,
  now: number,
): WindowCounter {
  let bucket = map.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    map.set(key, bucket);
  }
  return bucket;
}

/**
 * In-memory adapter for tests and local development only.
 * Never distributed. Never production-ready. Must not be a silent production fallback.
 */
export class MemoryRateLimiter implements DurableRateLimiter {
  readonly adapter = 'memory_test_or_dev' as const;
  readonly productionReady = false as const;
  readonly distributedReady = false as const;

  private readonly initiates = new Map<string, WindowCounter>();
  private readonly bytes = new Map<string, WindowCounter>();
  private readonly leases = new Map<string, { actorId: string }>();
  private readonly concurrent = new Map<string, number>();
  private leaseSeq = 0;

  constructor(private readonly limits = RATE_LIMIT_TEST_DEFAULTS) {}

  async tryInitiate(input: {
    actorId: string;
    organizationId: string;
    clinicId: string;
    consultationId: string;
  }): Promise<RateLimitDecision> {
    void input.organizationId;
    void input.clinicId;
    void input.consultationId;
    const now = Date.now();
    const bucket = bump(
      this.initiates,
      `actor:${input.actorId}`,
      this.limits.initiateWindowMs,
      now,
    );
    if (bucket.count >= this.limits.initiatesPerActorPerWindow) return limited(bucket.resetAt);
    bucket.count += 1;
    return { ok: true };
  }

  async acquireUploadLease(input: {
    actorId: string;
  }): Promise<RateLimitDecision & { leaseId?: string }> {
    const current = this.concurrent.get(input.actorId) ?? 0;
    if (current >= this.limits.concurrentUploadsPerActor) {
      return { ok: false, code: 'RATE_LIMITED', retryAfterSec: 1 };
    }
    this.concurrent.set(input.actorId, current + 1);
    this.leaseSeq += 1;
    const leaseId = `lease-${this.leaseSeq}`;
    this.leases.set(leaseId, { actorId: input.actorId });
    return { ok: true, leaseId };
  }

  async releaseUploadLease(leaseId: string): Promise<void> {
    const lease = this.leases.get(leaseId);
    if (!lease) return;
    this.leases.delete(leaseId);
    const current = this.concurrent.get(lease.actorId) ?? 0;
    this.concurrent.set(lease.actorId, Math.max(0, current - 1));
  }

  async consumeBytes(actorId: string, bytes: number): Promise<RateLimitDecision> {
    const now = Date.now();
    const bucket = bump(this.bytes, `actor:${actorId}`, this.limits.byteWindowMs, now);
    if (bucket.count + bytes > this.limits.bytesPerActorPerWindow) return limited(bucket.resetAt);
    bucket.count += bytes;
    return { ok: true };
  }

  async releaseBytes(actorId: string, bytes: number): Promise<void> {
    const bucket = this.bytes.get(`actor:${actorId}`);
    if (!bucket) return;
    bucket.count = Math.max(0, bucket.count - bytes);
  }

  reset(): void {
    this.initiates.clear();
    this.bytes.clear();
    this.leases.clear();
    this.concurrent.clear();
  }
}

export class UnavailableRateLimiter implements DurableRateLimiter {
  readonly adapter = 'unavailable' as const;
  readonly productionReady = false as const;
  readonly distributedReady = false as const;

  async tryInitiate(): Promise<RateLimitDecision> {
    return unavailable();
  }

  async acquireUploadLease(): Promise<RateLimitDecision> {
    return unavailable();
  }

  async releaseUploadLease(): Promise<void> {
    return;
  }

  async consumeBytes(): Promise<RateLimitDecision> {
    return unavailable();
  }

  async releaseBytes(): Promise<void> {
    return;
  }
}

export const unavailableEvidenceRateLimiter = new UnavailableRateLimiter();

let memoryLimiter: MemoryRateLimiter | null = null;

export function getMemoryEvidenceRateLimiter(): MemoryRateLimiter {
  if (!memoryLimiter) memoryLimiter = new MemoryRateLimiter();
  return memoryLimiter;
}

export function resetMemoryEvidenceRateLimiter(): void {
  memoryLimiter = new MemoryRateLimiter();
}

export function isProductionRuntime(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.EHAS2_NODE_ENV === 'production' || env.NODE_ENV === 'production';
}

/** Production without a durable configured adapter fails closed. No silent Map fallback. */
export function resolveEvidenceRateLimiter(
  configured: DurableRateLimiter | undefined,
  env: Record<string, string | undefined> = process.env,
): DurableRateLimiter {
  if (configured) return configured;
  if (isProductionRuntime(env)) return unavailableEvidenceRateLimiter;
  return getMemoryEvidenceRateLimiter();
}

export function clampPollIntervalMs(ms: number): number {
  if (!Number.isFinite(ms)) return 20_000;
  return Math.min(30_000, Math.max(15_000, Math.floor(ms)));
}

export function jobBackoffMs(attempt: number, jitterMs: number): number {
  const base = Math.min(Math.max(attempt, 1), 5) * 15_000;
  const jitter = Math.max(0, Math.min(1_000, Math.floor(jitterMs)));
  return base + jitter;
}
