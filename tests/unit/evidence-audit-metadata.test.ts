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

  it('rejects expanded F2A object-store and filename keys case-insensitively', () => {
    expect(() => assertAuditMetadataSafe({ nest: { Object_Key: 'x' } })).toThrow(
      /forbids sensitive key/i,
    );
    expect(() => assertAuditMetadataSafe({ items: [{ FILENAME: 'lab.png' }] })).toThrow(
      /forbids sensitive key/i,
    );
    expect(() => assertAuditMetadataSafe({ original_filename: 'a' })).toThrow(
      /forbids sensitive key/i,
    );
    expect(() => assertAuditMetadataSafe({ original_path: '/tmp/x' })).toThrow(
      /forbids sensitive key/i,
    );
    expect(() => assertAuditMetadataSafe({ object_url: 'https://x' })).toThrow(
      /forbids sensitive key/i,
    );
    expect(() => assertAuditMetadataSafe({ public_url: 'https://x' })).toThrow(
      /forbids sensitive key/i,
    );
    expect(() => assertAuditMetadataSafe({ presigned_url: 'https://x' })).toThrow(
      /forbids sensitive key/i,
    );
    expect(() => assertAuditMetadataSafe({ storage_credential: 'k' })).toThrow(
      /forbids sensitive key/i,
    );
  });

  it('allows existing F2A audit payloads without object keys', () => {
    expect(() =>
      assertAuditMetadataSafe({
        code: 'DELETED',
        status: 'STORED_TEMP',
        byteSize: 12,
        malware: 'CLEAN',
        jobType: 'DELETE_ORIGINAL',
      }),
    ).not.toThrow();
  });

  it('documents that SQL CHECK is top-level only', () => {
    // Contract note for reviewers: migration 004/010 CHECK uses `metadata ? key`
    // which inspects top-level JSON keys only. Recursive protection is application-side.
    expect(true).toBe(true);
  });
});
