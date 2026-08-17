import { describe, expect, it } from 'vitest';
import { EvidenceService, type TenantContext } from '../../packages/database/src/index.ts';
import {
  EVIDENCE_PRODUCTION_OBJECT_STORE,
  MemoryRateLimiter,
  getMemoryFakeObjectStore,
  resetMemoryFakeObjectStore,
  resolveEvidenceObjectStore,
} from '../../packages/evidence-ingest/src/index.ts';

const tenant: TenantContext = {
  organizationId: '00000000-0000-4000-8000-000000000001',
  clinicId: '00000000-0000-4000-8000-000000000002',
  actorId: '00000000-0000-4000-8000-000000000003',
  actorRole: 'Doctor',
  membershipStatus: 'ACTIVE',
  allowPatientPhi: true,
};

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
);

describe('F2A production object-store fail-closed selection', () => {
  it('does not select memory_fake in production even when a limiter is injected', async () => {
    expect(EVIDENCE_PRODUCTION_OBJECT_STORE).toBe(false);
    resetMemoryFakeObjectStore();
    const fake = getMemoryFakeObjectStore();
    expect(fake.size()).toBe(0);
    const resolved = resolveEvidenceObjectStore(undefined, { NODE_ENV: 'production' });
    expect(resolved.provider).toBe('unavailable');
    expect(resolved.productionReady).toBe(false);
    const svc = new EvidenceService({ rateLimiter: new MemoryRateLimiter() });
    await expect(
      svc.receiveBytes(tenant, tenant.clinicId, tenant.organizationId, PNG, {
        NODE_ENV: 'production',
        EHAS2_NODE_ENV: 'production',
      }),
    ).rejects.toMatchObject({
      name: 'ObjectStoreUnavailableError',
      code: 'OBJECT_STORE_UNAVAILABLE',
    });
    expect(fake.size()).toBe(0);
  });
});
