import { runEvidenceRetentionOnce, workerShell } from './jobs/evidenceRetention.js';

export { runEvidenceRetentionOnce, workerShell };

if (process.env.EHAS2_WORKER_LISTEN === '1') {
  workerShell();
}
