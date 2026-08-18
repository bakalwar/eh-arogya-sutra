import {
  MAX_EXTRACT_CANDIDATES,
  type ExtractionProvider,
  type ExtractionRefusal,
  type ExtractionRequest,
  type ExtractionResult,
  type LimitationCode,
} from '@ehas2/evidence-extract';
import { assertExtractionAllowed } from '../contentIntent.js';
import {
  EXTRACTOR_NAME,
  EXTRACTOR_VERSION,
  MAX_EXTRACT_BYTES,
  MAX_RENDER_PIXELS,
  PDFJS_VERSION,
  PIPELINE_CONFIG_VERSION,
  TESSERACT_VERSION,
} from '../constants.js';
import { pinnedLangpackHashes } from '../toolchainManifest.js';
import { pipelineFingerprint } from '../fingerprint.js';
import { createJobTempDir } from '../ocr/jobTempDir.js';
import { TesseractSidecar } from '../ocr/tesseractSidecar.js';
import { renderPageToPng } from '../pdf/pageRenderer.js';
import { isTextLayerInsufficient, pageTextMetrics } from '../pdf/sufficiency.js';
import { extractPdfTextLayer, pdfjsData } from '../pdf/textLayerExtractor.js';
import { segmentPageTextToCandidates, textItemsToBlocks } from '../segment/textToCandidates.js';

const METHOD = 'TWO_STAGE_PIPELINE' as const;
const LANGPACK_MODEL = `${TESSERACT_VERSION}:eng+hin`;

function looksLikePdf(bytes: Uint8Array): boolean {
  return Buffer.from(bytes.subarray(0, 5)).toString('latin1') === '%PDF-';
}

function looksLikePdfMime(input: ExtractionRequest): boolean {
  return (
    input.declaredMime === 'application/pdf' ||
    input.detectedMime === 'application/pdf' ||
    looksLikePdf(input.bytes ?? input.magicPrefix)
  );
}

function refuse(
  fingerprint: string,
  code: LimitationCode,
  extra: readonly LimitationCode[] = [],
): ExtractionRefusal {
  return {
    ok: false,
    code,
    method: METHOD,
    extractorName: EXTRACTOR_NAME,
    extractorVersion: EXTRACTOR_VERSION,
    modelOrLangpackVersion: LANGPACK_MODEL,
    extractorFingerprint: fingerprint,
    limitationCodes: [code, 'NOT_AUTHORITATIVE', ...extra],
    candidates: [],
  };
}

function baseFingerprint(input: ExtractionRequest): string {
  return pipelineFingerprint({
    evidenceItemId: input.evidenceItemId,
    inputContentSha256: input.contentSha256,
    extractorName: EXTRACTOR_NAME,
    version: EXTRACTOR_VERSION,
    method: METHOD,
    textLayerLibraryVersion: PDFJS_VERSION,
    ocrSidecarVersion: TESSERACT_VERSION,
    langpackHashes: pinnedLangpackHashes(),
    pipelineConfigVersion: PIPELINE_CONFIG_VERSION,
  });
}

/**
 * F3B two-stage extractor: content intent gate → PDF text layer → OCR on insufficient pages.
 * Candidates only; not production-connected.
 */
export class TwoStageOpenSourceExtractor implements ExtractionProvider {
  readonly productionReady = false as const;
  readonly ocrConnected = false as const;
  readonly method = METHOD;
  readonly name = EXTRACTOR_NAME;
  readonly version = EXTRACTOR_VERSION;
  readonly modelOrLangpackVersion = LANGPACK_MODEL;

  private readonly tesseract = new TesseractSidecar();

  fingerprint(input: ExtractionRequest): string {
    return baseFingerprint(input);
  }

  async extract(input: ExtractionRequest): Promise<ExtractionResult> {
    const fingerprint = this.fingerprint(input);
    if (input.abortSignal?.aborted) {
      return refuse(fingerprint, 'TIMEOUT');
    }
    const intent = input.contentIntent ?? 'UNCLASSIFIED';
    const gate = assertExtractionAllowed(intent);
    if (!gate.ok) {
      return refuse(fingerprint, gate.code);
    }
    if (!input.bytes || input.bytes.byteLength === 0) {
      return refuse(fingerprint, 'ORIGINAL_UNAVAILABLE');
    }
    if (input.bytes.byteLength > MAX_EXTRACT_BYTES) {
      return refuse(fingerprint, 'BYTE_LIMIT');
    }

    const limitationCodes: LimitationCode[] = ['NOT_AUTHORITATIVE', 'NO_TRANSLATION'];
    const blocks = [];
    let tempDir: Awaited<ReturnType<typeof createJobTempDir>> | undefined;

    try {
      if (looksLikePdfMime(input)) {
        const layer = await extractPdfTextLayer(input.bytes, { abortSignal: input.abortSignal });
        if (!layer.ok) {
          return refuse(fingerprint, layer.code);
        }
        const ocrPages: number[] = [];
        for (const page of layer.pages) {
          const metrics = pageTextMetrics(page);
          if (isTextLayerInsufficient(metrics)) {
            ocrPages.push(page.pageNumber);
            continue;
          }
          blocks.push(
            ...textItemsToBlocks({
              pageNumber: page.pageNumber,
              items: page.items,
              method: 'PDF_TEXT_LAYER',
            }),
          );
        }
        if (ocrPages.length > 0) {
          tempDir = await createJobTempDir();
          const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
          const loadingTask = getDocument({
            data: pdfjsData(input.bytes),
            disableAutoFetch: true,
            disableStream: true,
            disableRange: true,
            isEvalSupported: false,
            isOffscreenCanvasSupported: false,
            useSystemFonts: false,
            useWorkerFetch: false,
            verbosity: 0,
          });
          const pdf = await loadingTask.promise;
          try {
            for (const pageNumber of ocrPages) {
              if (input.abortSignal?.aborted) {
                return refuse(fingerprint, 'TIMEOUT');
              }
              const page = await pdf.getPage(pageNumber);
              const rendered = await renderPageToPng(page, MAX_RENDER_PIXELS);
              if (!rendered.ok) {
                limitationCodes.push('PARTIAL_EXTRACTION', 'LOW_CONFIDENCE');
                continue;
              }
              const ocr = await this.tesseract.recognizePng({
                png: rendered.png,
                pageWidth: rendered.width,
                pageHeight: rendered.height,
                workDir: tempDir.path,
                abortSignal: input.abortSignal,
              });
              if (!ocr.ok) {
                if (ocr.code === 'HASH_MISMATCH') {
                  return refuse(fingerprint, 'TOOLCHAIN_HASH_MISMATCH');
                }
                limitationCodes.push('PARTIAL_EXTRACTION', 'LOW_CONFIDENCE');
                if (ocr.code === 'TIMEOUT') {
                  return refuse(fingerprint, 'TIMEOUT', limitationCodes);
                }
                continue;
              }
              blocks.push(
                ...ocr.words.map((word, index) => ({
                  pageNumber,
                  blockIndex: word.blockIndex ?? index,
                  rawText: word.text,
                  bbox: word.bbox,
                  method: 'TESSERACT_OCR' as const,
                  confidence: word.confidence,
                  limitationCodes: ['LOW_CONFIDENCE'] as const,
                })),
              );
            }
          } finally {
            await pdf.destroy();
          }
        }
      } else if (intent === 'WRITTEN_REPORT_PAGE_IMAGE') {
        tempDir = await createJobTempDir();
        const ocr = await this.tesseract.recognizePng({
          png: input.bytes,
          pageWidth: 1,
          pageHeight: 1,
          workDir: tempDir.path,
          abortSignal: input.abortSignal,
        });
        if (!ocr.ok) {
          if (ocr.code === 'TIMEOUT') {
            return refuse(fingerprint, 'TIMEOUT');
          }
          if (ocr.code === 'HASH_MISMATCH') {
            return refuse(fingerprint, 'TOOLCHAIN_HASH_MISMATCH');
          }
          return refuse(fingerprint, 'PARTIAL_EXTRACTION', ['LOW_CONFIDENCE']);
        }
        blocks.push(
          ...ocr.words.map((word, index) => ({
            pageNumber: 1,
            blockIndex: word.blockIndex ?? index,
            rawText: word.text,
            bbox: word.bbox,
            method: 'TESSERACT_OCR' as const,
            confidence: word.confidence,
            limitationCodes: ['LOW_CONFIDENCE'] as const,
          })),
        );
      } else {
        return refuse(fingerprint, 'UNSUPPORTED_TYPE');
      }

      let candidates = segmentPageTextToCandidates({
        request: input,
        blocks,
        extractorName: this.name,
        extractorVersion: this.version,
        modelOrLangpackVersion: this.modelOrLangpackVersion,
        extraLimitationCodes: limitationCodes,
      });

      if (candidates.length > MAX_EXTRACT_CANDIDATES) {
        return refuse(fingerprint, 'TEXT_LIMIT', limitationCodes);
      }

      if (candidates.length === 0) {
        return refuse(fingerprint, 'PARTIAL_EXTRACTION', limitationCodes);
      }

      return {
        ok: true,
        method: METHOD,
        extractorName: this.name,
        extractorVersion: this.version,
        modelOrLangpackVersion: this.modelOrLangpackVersion,
        extractorFingerprint: fingerprint,
        limitationCodes,
        candidates,
      };
    } finally {
      await tempDir?.cleanup();
    }
  }
}
