import type { ContentIntent, LimitationCode } from '@ehas2/evidence-extract';

export const CONTENT_INTENT = {
  WRITTEN_REPORT_DOCUMENT: 'WRITTEN_REPORT_DOCUMENT',
  WRITTEN_REPORT_PAGE_IMAGE: 'WRITTEN_REPORT_PAGE_IMAGE',
  DIAGNOSTIC_IMAGE: 'DIAGNOSTIC_IMAGE',
  PATIENT_PHOTO: 'PATIENT_PHOTO',
  UNCLASSIFIED: 'UNCLASSIFIED',
} as const satisfies Record<string, ContentIntent>;

export type { ContentIntent };

export type ExtractionIntentGate = { ok: true } | { ok: false; code: LimitationCode };

export function assertExtractionAllowed(contentIntent: ContentIntent): ExtractionIntentGate {
  if (contentIntent === CONTENT_INTENT.UNCLASSIFIED) {
    return { ok: false, code: 'DOCUMENT_INTENT_REQUIRED' };
  }
  if (contentIntent === CONTENT_INTENT.DIAGNOSTIC_IMAGE) {
    return { ok: false, code: 'IMAGE_INTERPRETATION_FORBIDDEN' };
  }
  if (contentIntent === CONTENT_INTENT.PATIENT_PHOTO) {
    return { ok: false, code: 'PHOTO_DIAGNOSIS_FORBIDDEN' };
  }
  return { ok: true };
}
