import { describe, expect, it } from 'vitest';
import { validateAndCanonicalizeLocator } from '../../packages/evidence-extract-adapters/src/locator.ts';

describe('F3B locator validation', () => {
  it('canonicalizes page and blockIndex', () => {
    expect(validateAndCanonicalizeLocator({ page: 1, blockIndex: 2 })).toEqual({
      page: 1,
      blockIndex: 2,
    });
  });

  it('canonicalizes normalized bbox', () => {
    expect(
      validateAndCanonicalizeLocator({
        page: 2,
        bbox: { x: 0.1, y: 0.2, w: 0.3, h: 0.4 },
      }),
    ).toEqual({
      page: 2,
      bbox: { x: 0.1, y: 0.2, w: 0.3, h: 0.4 },
    });
  });

  it('rejects storage-bearing locator keys', () => {
    expect(() => validateAndCanonicalizeLocator({ page: 1, object_key: 'secret/path' })).toThrow(
      /SOURCE_LOCATOR_STORAGE_FORBIDDEN|MALFORMED_LOCATOR/,
    );
  });

  it('rejects out-of-range pages', () => {
    expect(() => validateAndCanonicalizeLocator({ page: 0 })).toThrow(/MALFORMED_LOCATOR/);
    expect(() => validateAndCanonicalizeLocator({ page: 21 })).toThrow(/MALFORMED_LOCATOR/);
  });
});
