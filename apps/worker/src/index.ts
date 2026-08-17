import { logInfo } from '@ehas2/observability';
import { runEvidenceRetentionOnce, workerShell } from './jobs/evidenceRetention.js';
import { evidencePollerEnabled } from './jobs/evidencePoller.js';

export { runEvidenceRetentionOnce, workerShell };
export {
  EvidenceJobPoller,
  createWorkerInstanceId,
  evidencePollerEnabled,
} from './jobs/evidencePoller.js';

if (process.env.EHAS2_WORKER_LISTEN === '1') {
  workerShell();
  if (evidencePollerEnabled()) {
    logInfo('evidence_poller_not_started', {
      code: 'POLLER_TENANT_PROVIDER_REQUIRED',
      productionWorker: false,
    });
  }
}
