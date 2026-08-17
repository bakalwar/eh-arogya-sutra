import { extractJobsEnabled } from '@ehas2/evidence-extract';

export { extractJobsEnabled };

/** F3A extract jobs stay default-off. Production runtime cannot enable them. */
export function extractJobsConnected(env: Record<string, string | undefined> = process.env): false {
  void extractJobsEnabled(env);
  return false;
}
