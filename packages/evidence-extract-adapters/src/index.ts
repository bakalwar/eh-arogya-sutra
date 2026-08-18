export {
  EXTRACT_JOB_TIMEOUT_MS,
  EXTRACT_PAGE_OCR_TIMEOUT_MS,
  MAX_EXTRACT_BYTES,
  MAX_EXTRACT_CANDIDATES,
  MAX_EXTRACT_PAGES,
  MAX_CANDIDATES_PER_EVIDENCE,
  MAX_RENDER_PIXELS,
  MAX_STDIO_BYTES,
  PDFJS_VERSION,
  PIPELINE_CONFIG_VERSION,
  TESSERACT_VERSION,
  TESSERACT_LANGUAGES,
  EXTRACTOR_NAME,
  EXTRACTOR_VERSION,
} from './constants.js';

export { CONTENT_INTENT, assertExtractionAllowed } from './contentIntent.js';
export type { ContentIntent, ExtractionIntentGate } from './contentIntent.js';

export { validateAndCanonicalizeLocator } from './locator.js';
export { pipelineFingerprint, defaultOcrPipelineFingerprint } from './fingerprint.js';

export {
  extractPdfTextLayer,
  type PdfTextItem,
  type PdfPageTextLayer,
  type PdfTextLayerResult,
  type ExtractPdfTextLayerOptions,
} from './pdf/textLayerExtractor.js';
export {
  isTextLayerInsufficient,
  pageTextMetrics,
  MIN_GLYPHS,
  MIN_PAGE_CHARS,
  MIN_TEXT_AREA_RATIO,
  type PageTextMetrics,
} from './pdf/sufficiency.js';
export { renderPageToPng, type RenderPageResult } from './pdf/pageRenderer.js';

export { createJobTempDir, writePrivateFile, type JobTempDir } from './ocr/jobTempDir.js';
export {
  TesseractSidecar,
  resolveTesseractBinary,
  resolveTessdataPrefix,
  verifyPinnedTessdata,
  tesseractArgv,
  type TesseractOcrResult,
} from './ocr/tesseractSidecar.js';
export { pinnedLangpackHashes, readExtractToolchainManifest } from './toolchainManifest.js';
export { parseTsv, type TsvWordBlock } from './ocr/tsvParser.js';

export {
  segmentPageTextToCandidates,
  textItemsToBlocks,
  type PageTextBlock,
} from './segment/textToCandidates.js';

export { TwoStageOpenSourceExtractor } from './pipeline/twoStageExtractor.js';
