import {
  extractJobsEnabled,
  extractOcrJobsEnabled,
  F3B_OPEN_SOURCE_OCR_ADAPTER_FOUNDATION,
} from '@ehas2/evidence-extract';
import { logInfo } from '@ehas2/observability';

export { extractJobsEnabled };

/** F3A extract jobs stay default-off. Production runtime cannot enable them. */
export function extractJobsConnected(env: Record<string, string | undefined> = process.env): false {
  void extractJobsEnabled(env);
  return false;
}

/** Log F3B adapter foundation flag at worker startup (OCR remains disconnected in production). */
export function logF3bExtractFoundation(
  env: Record<string, string | undefined> = process.env,
): void {
  logInfo('f3b_extract_foundation', {
    f3bOpenSourceOcrAdapterFoundation: F3B_OPEN_SOURCE_OCR_ADAPTER_FOUNDATION,
    ocrExtractJobsEnabled: extractOcrJobsEnabled(env),
    ocr: false,
  });
}
