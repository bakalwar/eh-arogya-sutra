import { describe, expect, it } from 'vitest';
import {
  isTextLayerInsufficient,
  pageTextMetrics,
  MIN_GLYPHS,
  MIN_PAGE_CHARS,
  MIN_TEXT_AREA_RATIO,
} from '../../packages/evidence-extract-adapters/src/pdf/sufficiency.ts';

describe('F3B PDF text layer sufficiency', () => {
  it('marks whitespace-only pages insufficient', () => {
    const metrics = pageTextMetrics({
      items: [{ text: '   \n\t  ', bbox: { x: 0.1, y: 0.1, w: 0.2, h: 0.05 } }],
    });
    expect(metrics.whitespaceOnly).toBe(true);
    expect(isTextLayerInsufficient(metrics)).toBe(true);
  });

  it('accepts pages with enough glyphs, chars, and text area', () => {
    const text =
      'Hemoglobin 13.2 g/dL Reference Range 12.0 - 16.0 WBC Count 7200 per microliter Platelet count normal';
    const metrics = pageTextMetrics({
      items: [{ text, bbox: { x: 0.05, y: 0.1, w: 0.8, h: 0.12 } }],
    });
    expect(metrics.glyphCount).toBeGreaterThanOrEqual(MIN_GLYPHS);
    expect(metrics.charCount).toBeGreaterThanOrEqual(MIN_PAGE_CHARS);
    expect(metrics.textAreaRatio).toBeGreaterThanOrEqual(MIN_TEXT_AREA_RATIO);
    expect(isTextLayerInsufficient(metrics)).toBe(false);
  });

  it('rejects sparse text layers', () => {
    const metrics = pageTextMetrics({
      items: [{ text: 'Hb', bbox: { x: 0.1, y: 0.1, w: 0.001, h: 0.001 } }],
    });
    expect(isTextLayerInsufficient(metrics)).toBe(true);
  });
});
