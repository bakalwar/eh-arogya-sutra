import { contentAwareExtractorFingerprint, type ExtractionMethod } from '@ehas2/evidence-extract';
import {
  EXTRACTOR_NAME,
  EXTRACTOR_VERSION,
  PDFJS_VERSION,
  PIPELINE_CONFIG_VERSION,
  TESSERACT_VERSION,
} from './constants.js';

export function pipelineFingerprint(input: {
  evidenceItemId: string;
  inputContentSha256: string | null;
  extractorName: string;
  version: string;
  method: ExtractionMethod;
  textLayerLibraryVersion: string;
  ocrSidecarVersion: string;
  langpackHashes: Readonly<Record<string, string>>;
  pipelineConfigVersion: string;
}): string {
  return contentAwareExtractorFingerprint({
    evidenceItemId: input.evidenceItemId,
    inputContentSha256: input.inputContentSha256,
    extractorName: input.extractorName,
    version: input.version,
    method: input.method,
    textLayerLibraryVersion: input.textLayerLibraryVersion,
    ocrSidecarVersion: input.ocrSidecarVersion,
    langpackHashes: input.langpackHashes,
    pipelineConfigVersion: input.pipelineConfigVersion,
  });
}

/** Default pinned-toolchain fingerprint for F3B OCR jobs (content-aware via contentAwareExtractorFingerprint). */
export function defaultOcrPipelineFingerprint(input: {
  evidenceItemId: string;
  inputContentSha256: string | null;
  method: ExtractionMethod;
}): string {
  return pipelineFingerprint({
    evidenceItemId: input.evidenceItemId,
    inputContentSha256: input.inputContentSha256,
    extractorName: EXTRACTOR_NAME,
    version: EXTRACTOR_VERSION,
    method: input.method,
    textLayerLibraryVersion: PDFJS_VERSION,
    ocrSidecarVersion: TESSERACT_VERSION,
    langpackHashes: { eng: 'bootstrap', hin: 'bootstrap' },
    pipelineConfigVersion: PIPELINE_CONFIG_VERSION,
  });
}
