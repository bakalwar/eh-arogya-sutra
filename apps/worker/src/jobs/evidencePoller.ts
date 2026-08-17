import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { logInfo } from '@ehas2/observability';
import { clampPollIntervalMs, WORKER_POLL_INTERVAL_DEFAULT_MS } from '@ehas2/evidence-ingest';
import {
  assertBackgroundJobTenant,
  type EvidenceService,
  type TenantContext,
} from '@ehas2/database';

export function createWorkerInstanceId(): string {
  return `ehas2-w-${hostname()}-${process.pid}-${randomUUID().slice(0, 8)}`;
}

export type EvidenceJobPollerOptions = {
  enabled?: boolean;
  intervalMs?: number;
  workerId?: string;
  tenantProvider: () => Promise<TenantContext[]> | TenantContext[];
  service: EvidenceService;
  env?: Record<string, string | undefined>;
  now?: () => Date;
};

/**
 * Production-shaped poller around clinical_evidence_jobs.
 * Default-disabled. Must not be silently activated in production configs.
 */
export class EvidenceJobPoller {
  private accepting = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private active: Promise<void> = Promise.resolve();
  readonly workerId: string;
  readonly intervalMs: number;
  readonly enabled: boolean;

  constructor(private readonly options: EvidenceJobPollerOptions) {
    this.enabled = options.enabled === true;
    this.intervalMs = clampPollIntervalMs(options.intervalMs ?? WORKER_POLL_INTERVAL_DEFAULT_MS);
    this.workerId = options.workerId ?? createWorkerInstanceId();
  }

  start(): void {
    if (!this.enabled) {
      logInfo('evidence_poller_disabled', {
        code: 'POLLER_DISABLED',
        productionWorker: false,
      });
      return;
    }
    this.accepting = true;
    const tick = (): void => {
      if (!this.accepting) return;
      this.active = this.runOnce().then(
        () => undefined,
        () => undefined,
      );
    };
    tick();
    this.timer = setInterval(tick, this.intervalMs);
    this.timer.unref?.();
  }

  async stop(): Promise<void> {
    this.accepting = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    await this.active;
  }

  async runOnce(): Promise<{ processed: number; succeeded: number; failed: number; dead: number }> {
    const tenants = await this.options.tenantProvider();
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let dead = 0;
    for (const tenant of tenants) {
      assertBackgroundJobTenant(tenant);
      const now = this.options.now?.() ?? new Date();
      const result = await this.options.service.runDueJobs(
        tenant,
        this.workerId,
        now,
        this.options.env ?? process.env,
      );
      await this.options.service.reconcileBlobPresence(
        tenant,
        now,
        this.options.env ?? process.env,
      );
      processed += result.processed;
      succeeded += result.succeeded;
      failed += result.failed;
      dead += result.dead;
    }
    return { processed, succeeded, failed, dead };
  }
}

export function evidencePollerEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return env.EHAS2_EVIDENCE_JOB_POLLER === '1';
}
