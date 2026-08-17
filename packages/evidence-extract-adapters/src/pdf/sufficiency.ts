import type { PdfPageTextLayer } from './textLayerExtractor.js';

export const MIN_GLYPHS = 24;
export const MIN_PAGE_CHARS = 80;
export const MIN_TEXT_AREA_RATIO = 0.02;

export type PageTextMetrics = {
  glyphCount: number;
  charCount: number;
  textAreaRatio: number;
  whitespaceOnly: boolean;
};

export function pageTextMetrics(page: Pick<PdfPageTextLayer, 'items'>): PageTextMetrics {
  let glyphCount = 0;
  let charCount = 0;
  let textArea = 0;
  for (const item of page.items) {
    const trimmed = item.text.trim();
    if (!trimmed) continue;
    glyphCount += trimmed.length;
    charCount += trimmed.length;
    textArea += item.bbox.w * item.bbox.h;
  }
  const joined = page.items.map((item) => item.text).join('');
  const whitespaceOnly = joined.length > 0 && joined.trim().length === 0;
  return {
    glyphCount,
    charCount,
    textAreaRatio: textArea,
    whitespaceOnly,
  };
}

export function isTextLayerInsufficient(metrics: PageTextMetrics): boolean {
  if (metrics.whitespaceOnly) return true;
  if (metrics.glyphCount < MIN_GLYPHS) return true;
  if (metrics.charCount < MIN_PAGE_CHARS) return true;
  if (metrics.textAreaRatio < MIN_TEXT_AREA_RATIO) return true;
  return false;
}
