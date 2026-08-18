import { describe, expect, it } from 'vitest';
import {
  CONTENT_INTENTS,
  extractOcrJobsEnabled,
} from '../../packages/evidence-extract/src/index.ts';
import {
  CONTENT_INTENT,
  assertExtractionAllowed,
} from '../../packages/evidence-extract-adapters/src/index.ts';

describe('F3B content intent gate', () => {
  it('covers all CONTENT_INTENTS in adapters', () => {
    for (const intent of CONTENT_INTENTS) {
      expect(Object.values(CONTENT_INTENT)).toContain(intent);
    }
  });

  it('requires document intent for extraction', () => {
    expect(assertExtractionAllowed('UNCLASSIFIED')).toEqual({
      ok: false,
      code: 'DOCUMENT_INTENT_REQUIRED',
    });
  });

  it('allows written report intents', () => {
    expect(assertExtractionAllowed('WRITTEN_REPORT_DOCUMENT')).toEqual({ ok: true });
    expect(assertExtractionAllowed('WRITTEN_REPORT_PAGE_IMAGE')).toEqual({ ok: true });
  });

  it('forbids diagnostic and patient photo intents', () => {
    expect(assertExtractionAllowed('DIAGNOSTIC_IMAGE')).toEqual({
      ok: false,
      code: 'IMAGE_INTERPRETATION_FORBIDDEN',
    });
    expect(assertExtractionAllowed('PATIENT_PHOTO')).toEqual({
      ok: false,
      code: 'PHOTO_DIAGNOSIS_FORBIDDEN',
    });
  });

  it('extractOcrJobsEnabled is false by default and blocked in production', () => {
    expect(extractOcrJobsEnabled({ EHAS2_NODE_ENV: 'test', NODE_ENV: 'test' })).toBe(false);
    expect(
      extractOcrJobsEnabled({
        EHAS2_NODE_ENV: 'production',
        NODE_ENV: 'production',
        EHAS2_EVIDENCE_EXTRACT_JOBS: '1',
        EHAS2_F3B_OCR_EXTRACT_JOBS: '1',
      }),
    ).toBe(false);
    expect(
      extractOcrJobsEnabled({
        EHAS2_NODE_ENV: 'test',
        NODE_ENV: 'test',
        EHAS2_EVIDENCE_EXTRACT_JOBS: '1',
        EHAS2_F3B_OCR_EXTRACT_JOBS: '1',
      }),
    ).toBe(true);
  });
});
