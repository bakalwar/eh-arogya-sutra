import { logInfo } from '@ehas2/observability';
import { assertBackgroundJobTenant, evidenceService, type TenantContext } from '@ehas2/database';

/** Background worker shell — OCR/analysis jobs remain unregistered. */
export function workerShell(): void {
  logInfo('EHAS2 worker shell (evidence retention jobs only; no OCR)', {
    phase: 'f1',
    ocr: false,
    clinicalEngine: false,
  });
}

export async function runEvidenceRetentionOnce(
  tenant: TenantContext,
  workerId = 'ehas2-worker-f1',
  now: Date = new Date(),
  env: Record<string, string | undefined> = process.env,
): Promise<{ processed: number; succeeded: number; failed: number }> {
  assertBackgroundJobTenant(tenant);
  return evidenceService.runDueJobs(tenant, workerId, now, env);
}
