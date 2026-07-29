import { logInfo } from '@ehas2/observability';

/** Background worker shell — OCR/analysis jobs in Phase 7+. */
export function workerShell(): void {
  logInfo('EHAS2 worker shell (no jobs registered)', { phase: '1a' });
}
