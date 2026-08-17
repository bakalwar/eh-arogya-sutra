import { describe, expect, it } from 'vitest';
import {
  EVIDENCE_PRODUCTION_WORKER,
  WORKER_POLL_INTERVAL_DEFAULT_MS,
  WORKER_POLL_INTERVAL_MAX_MS,
  WORKER_POLL_INTERVAL_MIN_MS,
  clampPollIntervalMs,
  jobBackoffMs,
} from '../../packages/evidence-ingest/src/index.ts';
import {
  EvidenceJobPoller,
  createWorkerInstanceId,
  evidencePollerEnabled,
} from '../../apps/worker/src/jobs/evidencePoller.ts';
import type { EvidenceService, TenantContext } from '../../packages/database/src/index.ts';

const tenant: TenantContext = {
  organizationId: '00000000-0000-4000-8000-000000000001',
  clinicId: '00000000-0000-4000-8000-000000000002',
  actorId: '00000000-0000-4000-8000-000000000003',
  actorRole: 'Doctor',
  membershipStatus: 'ACTIVE',
  allowPatientPhi: true,
};

describe('F2A worker poller shell', () => {
  it('stays disabled by default and clamps interval', () => {
    expect(EVIDENCE_PRODUCTION_WORKER).toBe(false);
    expect(evidencePollerEnabled({})).toBe(false);
    expect(evidencePollerEnabled({ EHAS2_EVIDENCE_JOB_POLLER: '1' })).toBe(true);
    expect(clampPollIntervalMs(1_000)).toBe(WORKER_POLL_INTERVAL_MIN_MS);
    expect(clampPollIntervalMs(60_000)).toBe(WORKER_POLL_INTERVAL_MAX_MS);
    expect(clampPollIntervalMs(Number.NaN)).toBe(WORKER_POLL_INTERVAL_DEFAULT_MS);
    expect(jobBackoffMs(2, 10)).toBe(30_010);
    const a = createWorkerInstanceId();
    const b = createWorkerInstanceId();
    expect(a).not.toBe(b);
  });

  it('does not start when disabled and stop drains the current tick', async () => {
    let ticks = 0;
    const service = {
      runDueJobs: async () => {
        ticks += 1;
        return { processed: 0, succeeded: 0, failed: 0, dead: 0 };
      },
      reconcileBlobPresence: async () => ({ checked: 0, mismatches: 0, orphansDeleted: 0 }),
    } as unknown as EvidenceService;
    const disabled = new EvidenceJobPoller({
      enabled: false,
      tenantProvider: () => [tenant],
      service,
    });
    disabled.start();
    expect(ticks).toBe(0);
    const enabled = new EvidenceJobPoller({
      enabled: true,
      intervalMs: 15_000,
      tenantProvider: () => [tenant],
      service,
    });
    enabled.start();
    await enabled.stop();
    expect(ticks).toBeGreaterThanOrEqual(1);
  });
});
