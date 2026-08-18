import { assertNoStorageInLocator } from './fingerprint.js';
import type { SourceLocator } from './types.js';

const FORBIDDEN_LOCATOR_KEYS = new Set([
  'object_key',
  'objectkey',
  'object_url',
  'path',
  'url',
  'filename',
  'storage',
  'bucket',
  'public_url',
  'presigned_url',
  'original_filename',
  'credential',
  'secret',
  'key',
]);

/** Presentation locator: page / optional block / optional bbox only. */
export function presentSourceLocator(locator: SourceLocator): SourceLocator {
  assertNoStorageInLocator(locator);
  for (const key of Object.keys(locator as Record<string, unknown>)) {
    if (FORBIDDEN_LOCATOR_KEYS.has(key.toLowerCase())) {
      throw Object.assign(new Error('SOURCE_LOCATOR_STORAGE_FORBIDDEN'), {
        code: 'SOURCE_LOCATOR_STORAGE_FORBIDDEN',
      });
    }
    if (key !== 'page' && key !== 'blockIndex' && key !== 'bbox') {
      throw Object.assign(new Error('SOURCE_LOCATOR_UNKNOWN_FIELD'), {
        code: 'SOURCE_LOCATOR_UNKNOWN_FIELD',
      });
    }
  }
  const out: SourceLocator = { page: locator.page };
  if (locator.blockIndex != null) out.blockIndex = locator.blockIndex;
  if (locator.bbox) {
    out.bbox = {
      x: locator.bbox.x,
      y: locator.bbox.y,
      w: locator.bbox.w,
      h: locator.bbox.h,
    };
  }
  return out;
}

export function bboxToCssPercent(bbox: { x: number; y: number; w: number; h: number }): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  const pct = (n: number): string => `${Number((n * 100).toFixed(4))}%`;
  return {
    left: pct(bbox.x),
    top: pct(bbox.y),
    width: pct(bbox.w),
    height: pct(bbox.h),
  };
}
