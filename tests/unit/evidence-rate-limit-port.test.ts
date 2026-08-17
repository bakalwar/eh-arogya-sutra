import { describe, expect, it } from 'vitest';
import {
  EVIDENCE_DISTRIBUTED_RATE_LIMITER,
  MemoryRateLimiter,
  UnavailableRateLimiter,
  isProductionRuntime,
  resolveEvidenceRateLimiter,
  RATE_LIMIT_TEST_DEFAULTS,
} from '../../packages/evidence-ingest/src/index.ts';

describe('F2A durable rate-limit port', () => {
  it('memory adapter is not distributed or production', async () => {
    expect(EVIDENCE_DISTRIBUTED_RATE_LIMITER).toBe(false);
    const limiter = new MemoryRateLimiter();
    expect(limiter.productionReady).toBe(false);
    expect(limiter.distributedReady).toBe(false);
    const actor = {
      actorId: 'actor-1',
      organizationId: 'org-1',
      clinicId: 'clinic-1',
      consultationId: 'case-1',
    };
    for (let i = 0; i < RATE_LIMIT_TEST_DEFAULTS.initiatesPerActorPerWindow; i += 1) {
      expect((await limiter.tryInitiate(actor)).ok).toBe(true);
    }
    const denied = await limiter.tryInitiate(actor);
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.code).toBe('RATE_LIMITED');
  });

  it('two logical replicas sharing the limiter see the same counters', async () => {
    const shared = new MemoryRateLimiter({
      ...RATE_LIMIT_TEST_DEFAULTS,
      concurrentUploadsPerActor: 1,
    });
    const replicaA = shared;
    const replicaB = shared;
    const first = await replicaA.acquireUploadLease({ actorId: 'actor-2' });
    expect(first.ok).toBe(true);
    const second = await replicaB.acquireUploadLease({ actorId: 'actor-2' });
    expect(second.ok).toBe(false);
    if (first.ok && first.leaseId) await replicaA.releaseUploadLease(first.leaseId);
    const third = await replicaB.acquireUploadLease({ actorId: 'actor-2' });
    expect(third.ok).toBe(true);
    if (third.ok && third.leaseId) await replicaB.releaseUploadLease(third.leaseId);
  });

  it('releases concurrency and byte quota after abort', async () => {
    const limiter = new MemoryRateLimiter({
      ...RATE_LIMIT_TEST_DEFAULTS,
      concurrentUploadsPerActor: 1,
      bytesPerActorPerWindow: 100,
    });
    const lease = await limiter.acquireUploadLease({ actorId: 'actor-3' });
    expect(lease.ok).toBe(true);
    expect((await limiter.consumeBytes('actor-3', 80)).ok).toBe(true);
    expect((await limiter.consumeBytes('actor-3', 30)).ok).toBe(false);
    if (lease.ok && lease.leaseId) await limiter.releaseUploadLease(lease.leaseId);
    await limiter.releaseBytes('actor-3', 80);
    const again = await limiter.acquireUploadLease({ actorId: 'actor-3' });
    expect(again.ok).toBe(true);
    expect((await limiter.consumeBytes('actor-3', 80)).ok).toBe(true);
    if (again.ok && again.leaseId) await limiter.releaseUploadLease(again.leaseId);
  });

  it('unavailable adapter is 503 fail-closed and production has no Map fallback', async () => {
    const unavailable = new UnavailableRateLimiter();
    const decision = await unavailable.tryInitiate({
      actorId: 'a',
      organizationId: 'o',
      clinicId: 'c',
      consultationId: 'k',
    });
    expect(decision).toMatchObject({ ok: false, code: 'RATE_LIMIT_UNAVAILABLE' });
    expect(resolveEvidenceRateLimiter(undefined, { NODE_ENV: 'production' }).adapter).toBe(
      'unavailable',
    );
    expect(isProductionRuntime({ NODE_ENV: 'production' })).toBe(true);
    expect(resolveEvidenceRateLimiter(undefined, { NODE_ENV: 'test' }).adapter).toBe(
      'memory_test_or_dev',
    );
  });
});
