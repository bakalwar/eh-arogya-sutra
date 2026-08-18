import { assertNoStorageInLocator, type SourceLocator } from '@ehas2/evidence-extract';
import { MAX_EXTRACT_PAGES } from './constants.js';

const ALLOWED_LOCATOR_KEYS = new Set(['page', 'blockIndex', 'bbox']);
const FORBIDDEN_LOCATOR_KEYS = new Set([
  'object_key',
  'objectKey',
  'object_url',
  'path',
  'url',
  'filename',
  'storage',
  'bucket',
  'public_url',
  'presigned_url',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw Object.assign(new Error('MALFORMED_LOCATOR'), { code: 'MALFORMED_LOCATOR', field });
  }
  return value;
}

function canonicalizeBbox(value: unknown): SourceLocator['bbox'] {
  if (!isPlainObject(value)) {
    throw Object.assign(new Error('MALFORMED_LOCATOR'), {
      code: 'MALFORMED_LOCATOR',
      field: 'bbox',
    });
  }
  const x = assertFiniteNumber(value.x, 'bbox.x');
  const y = assertFiniteNumber(value.y, 'bbox.y');
  const w = assertFiniteNumber(value.w, 'bbox.w');
  const h = assertFiniteNumber(value.h, 'bbox.h');
  if (x < 0 || y < 0 || w <= 0 || h <= 0 || w > 1 || h > 1) {
    throw Object.assign(new Error('MALFORMED_LOCATOR'), {
      code: 'MALFORMED_LOCATOR',
      field: 'bbox',
    });
  }
  return { x, y, w, h };
}

/**
 * Strips locators to page/blockIndex/bbox only; rejects unknown or storage-bearing keys.
 */
export function validateAndCanonicalizeLocator(locator: unknown): SourceLocator {
  if (!isPlainObject(locator)) {
    throw Object.assign(new Error('MALFORMED_LOCATOR'), { code: 'MALFORMED_LOCATOR' });
  }
  assertNoStorageInLocator(locator);
  for (const key of Object.keys(locator)) {
    if (FORBIDDEN_LOCATOR_KEYS.has(key)) {
      throw Object.assign(new Error('SOURCE_LOCATOR_STORAGE_FORBIDDEN'), {
        code: 'SOURCE_LOCATOR_STORAGE_FORBIDDEN',
      });
    }
    if (!ALLOWED_LOCATOR_KEYS.has(key)) {
      throw Object.assign(new Error('MALFORMED_LOCATOR'), {
        code: 'MALFORMED_LOCATOR',
        field: key,
      });
    }
  }
  const page = Math.trunc(assertFiniteNumber(locator.page, 'page'));
  if (page < 1 || page > MAX_EXTRACT_PAGES) {
    throw Object.assign(new Error('MALFORMED_LOCATOR'), {
      code: 'MALFORMED_LOCATOR',
      field: 'page',
    });
  }
  const out: SourceLocator = { page };
  if (locator.blockIndex !== undefined) {
    const blockIndex = Math.trunc(assertFiniteNumber(locator.blockIndex, 'blockIndex'));
    if (blockIndex < 0 || blockIndex > 9999) {
      throw Object.assign(new Error('MALFORMED_LOCATOR'), {
        code: 'MALFORMED_LOCATOR',
        field: 'blockIndex',
      });
    }
    out.blockIndex = blockIndex;
  }
  if (locator.bbox !== undefined) {
    out.bbox = canonicalizeBbox(locator.bbox);
  }
  return out;
}
