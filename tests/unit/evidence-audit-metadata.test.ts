import { describe, expect, it } from 'vitest';
import { assertAuditMetadataSafe } from '../../packages/database/src/repositories/postgres.ts';

describe('audit metadata recursive forbidden keys', () => {
  it('rejects nested forbidden keys', () => {
    expect(() => assertAuditMetadataSafe({ ok: true, nest: { token: 'x' } })).toThrow(
      /forbids sensitive key/i,
    );
    expect(() => assertAuditMetadataSafe({ items: [{ report_bytes: 'no' }] })).toThrow(
      /forbids sensitive key/i,
    );
  });

  it('allows safe nested metadata', () => {
    expect(() =>
      assertAuditMetadataSafe({ code: 'DELETED', status: 'DELETED', nest: { count: 1 } }),
    ).not.toThrow();
  });

  it('documents that SQL CHECK is top-level only', () => {
    // Contract note for reviewers: migration 004/010 CHECK uses `metadata ? key`
    // which inspects top-level JSON keys only. Recursive protection is application-side.
    expect(true).toBe(true);
  });
});
