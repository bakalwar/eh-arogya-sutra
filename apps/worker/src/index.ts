import { logInfo } from '@ehas2/observability';
import { F3A_EXTRACTION_CANDIDATE_FOUNDATION } from '@ehas2/evidence-extract';
import { runEvidenceRetentionOnce, workerShell } from './jobs/evidenceRetention.js';
import { evidencePollerEnabled } from './jobs/evidencePoller.js';
import { extractJobsConnected } from './jobs/extractCandidates.js';

export { runEvidenceRetentionOnce, workerShell };
export {
  EvidenceJobPoller,
  createWorkerInstanceId,
  evidencePollerEnabled,
} from './jobs/evidencePoller.js';
export { extractJobsEnabled, extractJobsConnected } from './jobs/extractCandidates.js';

if (process.env.EHAS2_WORKER_LISTEN === '1') {
  workerShell();
  if (evidencePollerEnabled()) {
    logInfo('evidence_poller_not_started', {
      code: 'POLLER_TENANT_PROVIDER_REQUIRED',
      productionWorker: false,
      f3aExtractionCandidateFoundation: F3A_EXTRACTION_CANDIDATE_FOUNDATION,
      extractJobsConnected: extractJobsConnected(),
    });
  }
}
