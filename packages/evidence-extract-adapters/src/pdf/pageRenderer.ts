import type { PDFPageProxy } from './textLayerExtractor.js';

export type RenderPageResult =
  | { ok: true; png: Uint8Array; width: number; height: number }
  | { ok: false; code: 'CANVAS_UNAVAILABLE' | 'RENDER_FAILED' };

type CanvasModule = typeof import('@napi-rs/canvas');

let canvasModule: CanvasModule | null | undefined;

async function loadCanvas(): Promise<CanvasModule | null> {
  if (canvasModule !== undefined) return canvasModule;
  try {
    canvasModule = await import('@napi-rs/canvas');
    return canvasModule;
  } catch {
    canvasModule = null;
    return null;
  }
}

function boundedScale(pageWidth: number, pageHeight: number, maxPixels: number): number {
  const area = pageWidth * pageHeight;
  if (area <= 0) return 1;
  if (area <= maxPixels) return 1;
  return Math.sqrt(maxPixels / area);
}

export async function renderPageToPng(
  page: PDFPageProxy,
  maxPixels: number,
): Promise<RenderPageResult> {
  const canvas = await loadCanvas();
  if (!canvas) {
    return { ok: false, code: 'CANVAS_UNAVAILABLE' };
  }
  try {
    const base = page.getViewport({ scale: 1 });
    const scale = boundedScale(base.width, base.height, maxPixels);
    const viewport = page.getViewport({ scale });
    const width = Math.max(1, Math.floor(viewport.width));
    const height = Math.max(1, Math.floor(viewport.height));
    const surface = canvas.createCanvas(width, height);
    const context = surface.getContext('2d');
    await page.render({
      canvasContext: context as never,
      viewport,
    }).promise;
    const png = new Uint8Array(surface.toBuffer('image/png'));
    return { ok: true, png, width, height };
  } catch {
    return { ok: false, code: 'RENDER_FAILED' };
  }
}
