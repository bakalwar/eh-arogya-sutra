import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { MAX_EXTRACT_BYTES, MAX_EXTRACT_PAGES } from '../constants.js';

export type PdfTextItem = {
  text: string;
  bbox: { x: number; y: number; w: number; h: number };
};

export type PdfPageTextLayer = {
  pageNumber: number;
  width: number;
  height: number;
  items: PdfTextItem[];
};

export type PdfTextLayerResult =
  | { ok: true; pages: PdfPageTextLayer[] }
  | { ok: false; code: 'BYTE_LIMIT' | 'PAGE_LIMIT' | 'MALFORMED_DOCUMENT' | 'TIMEOUT' };

export type ExtractPdfTextLayerOptions = {
  abortSignal?: AbortSignal;
  maxPages?: number;
  maxBytes?: number;
};

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw Object.assign(new Error('TIMEOUT'), { code: 'TIMEOUT' });
  }
}

function bboxFromTransform(
  transform: number[],
  pageWidth: number,
  pageHeight: number,
): { x: number; y: number; w: number; h: number } {
  const scaleX = Math.abs(transform[0] ?? 0);
  const scaleY = Math.abs(transform[3] ?? 0);
  const fontSize = Math.max(scaleX, scaleY, 1);
  const xPt = transform[4] ?? 0;
  const yPt = transform[5] ?? 0;
  const wPt = Math.max(fontSize * 0.55, 1);
  const hPt = Math.max(fontSize, 1);
  const x = Math.min(1, Math.max(0, xPt / pageWidth));
  const yTop = pageHeight - yPt;
  const y = Math.min(1, Math.max(0, yTop / pageHeight));
  const w = Math.min(1 - x, wPt / pageWidth);
  const h = Math.min(1 - y, hPt / pageHeight);
  return { x, y, w: Math.max(w, 0.001), h: Math.max(h, 0.001) };
}

async function pageTextLayer(
  page: PDFPageProxy,
  pageNumber: number,
  signal?: AbortSignal,
): Promise<PdfPageTextLayer> {
  throwIfAborted(signal);
  const viewport = page.getViewport({ scale: 1 });
  const textContent = await page.getTextContent();
  throwIfAborted(signal);
  const items: PdfTextItem[] = [];
  for (const raw of textContent.items) {
    if (!('str' in raw)) continue;
    const text = raw.str;
    if (!text) continue;
    const transform = raw.transform;
    if (!Array.isArray(transform) || transform.length < 6) continue;
    items.push({
      text,
      bbox: bboxFromTransform(transform, viewport.width, viewport.height),
    });
  }
  return {
    pageNumber,
    width: viewport.width,
    height: viewport.height,
    items,
  };
}

export async function extractPdfTextLayer(
  bytes: Uint8Array,
  options: ExtractPdfTextLayerOptions = {},
): Promise<PdfTextLayerResult> {
  const signal = options.abortSignal;
  const maxPages = options.maxPages ?? MAX_EXTRACT_PAGES;
  const maxBytes = options.maxBytes ?? MAX_EXTRACT_BYTES;
  throwIfAborted(signal);
  if (bytes.byteLength > maxBytes) {
    return { ok: false, code: 'BYTE_LIMIT' };
  }
  let pdf: PDFDocumentProxy | undefined;
  try {
    const loadingTask = getDocument({
      data: bytes,
      disableAutoFetch: true,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          void loadingTask.destroy();
        },
        { once: true },
      );
    }
    pdf = await loadingTask.promise;
    throwIfAborted(signal);
    const pageCount = pdf.numPages;
    if (pageCount < 1) {
      return { ok: false, code: 'MALFORMED_DOCUMENT' };
    }
    if (pageCount > maxPages) {
      return { ok: false, code: 'PAGE_LIMIT' };
    }
    const pages: PdfPageTextLayer[] = [];
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      throwIfAborted(signal);
      const page = await pdf.getPage(pageNumber);
      pages.push(await pageTextLayer(page, pageNumber, signal));
    }
    return { ok: true, pages };
  } catch (err: unknown) {
    if (signal?.aborted) {
      return { ok: false, code: 'TIMEOUT' };
    }
    if ((err as Error)?.name === 'PasswordException') {
      return { ok: false, code: 'MALFORMED_DOCUMENT' };
    }
    return { ok: false, code: 'MALFORMED_DOCUMENT' };
  } finally {
    await pdf?.destroy();
  }
}

export type { PDFPageProxy };
