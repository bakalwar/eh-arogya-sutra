import {
  EXTRACT_JOB_TIMEOUT_MS,
  EXTRACT_PAGE_OCR_TIMEOUT_MS,
  MAX_EXTRACT_CANDIDATES,
  MAX_EXTRACT_PAGES,
  MAX_CANDIDATES_PER_EVIDENCE,
} from '@ehas2/evidence-extract';
import { MAX_EVIDENCE_BYTES } from '@ehas2/evidence-ingest';

export {
  EXTRACT_JOB_TIMEOUT_MS,
  EXTRACT_PAGE_OCR_TIMEOUT_MS,
  MAX_EXTRACT_CANDIDATES,
  MAX_EXTRACT_PAGES,
  MAX_CANDIDATES_PER_EVIDENCE,
};

export const MAX_EXTRACT_BYTES = MAX_EVIDENCE_BYTES;
export const PDFJS_VERSION = '4.10.38' as const;
export const TESSERACT_VERSION = '5.5.3' as const;
export const PIPELINE_CONFIG_VERSION = 'f3b-pipeline-1.0.0' as const;
export const EXTRACTOR_NAME = 'ehas2-two-stage-ocr' as const;
export const EXTRACTOR_VERSION = 'f3b-1.0.0' as const;

export const MAX_RENDER_PIXELS = 4_000_000;
export const MAX_STDIO_BYTES = 64 * 1024;
export const TESSERACT_LANGUAGES = 'eng+hin' as const;
