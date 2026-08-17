import { describe, expect, it } from 'vitest';
import {
  assertMalwareUnavailableIsNotClean,
  sanitizeEvidenceFilename,
  validateEvidenceBytes,
} from '../../packages/evidence-ingest/src/index.ts';

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex',
);
const JPEG = Buffer.from('ffd8ffe000104a46494600010100000100010000ffd9', 'hex');
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
const ZIP = Buffer.from('504b0304140000000800', 'hex');
const EXE = Buffer.from('4d5a90000300000004000000ffff', 'hex');

describe('evidence file validation', () => {
  it('accepts png/jpeg/pdf with matching magic bytes', () => {
    const png = validateEvidenceBytes({
      filename: 'skin.png',
      declaredMime: 'image/png',
      bytes: PNG,
    });
    expect(png.ok).toBe(true);
    if (png.ok) {
      expect(png.detectedMime).toBe('image/png');
      expect(png.contentSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(png.byteSize).toBe(PNG.length);
    }
    const jpeg = validateEvidenceBytes({
      filename: 'photo.jpg',
      declaredMime: 'image/jpeg',
      bytes: JPEG,
    });
    expect(jpeg.ok).toBe(true);
    const pdf = validateEvidenceBytes({
      filename: 'lab.pdf',
      declaredMime: 'application/pdf',
      bytes: PDF,
    });
    expect(pdf.ok).toBe(true);
  });

  it('rejects path traversal and windows paths', () => {
    expect(sanitizeEvidenceFilename('../etc/passwd.pdf')).toBeNull();
    expect(sanitizeEvidenceFilename('C:\\\\temp\\\\x.pdf')).toBeNull();
    expect(sanitizeEvidenceFilename('a/../../x.pdf')).toBeNull();
    expect(sanitizeEvidenceFilename('ok report.png')).toBe('ok report.png');
  });

  it('rejects zip/exe/html/svg/dicom and mime mismatch', () => {
    expect(
      validateEvidenceBytes({ filename: 'x.pdf', declaredMime: 'application/pdf', bytes: ZIP }).ok,
    ).toBe(false);
    expect(
      validateEvidenceBytes({ filename: 'x.pdf', declaredMime: 'application/pdf', bytes: EXE }).ok,
    ).toBe(false);
    expect(
      validateEvidenceBytes({
        filename: 'x.pdf',
        declaredMime: 'application/pdf',
        bytes: Buffer.from('<html><body>x</body></html>'),
      }).ok,
    ).toBe(false);
    expect(
      validateEvidenceBytes({
        filename: 'x.png',
        declaredMime: 'image/png',
        bytes: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
      }).ok,
    ).toBe(false);
    const dicom = Buffer.alloc(132, 0);
    dicom.write('DICM', 128);
    expect(
      validateEvidenceBytes({ filename: 'x.png', declaredMime: 'image/png', bytes: dicom }).ok,
    ).toBe(false);
    expect(
      validateEvidenceBytes({
        filename: 'x.png',
        declaredMime: 'image/png',
        bytes: PDF,
      }).ok,
    ).toBe(false);
  });

  it('rejects pdf+zip polyglot in the first 8KiB', () => {
    const poly = Buffer.concat([PDF, ZIP]);
    const result = validateEvidenceBytes({
      filename: 'x.pdf',
      declaredMime: 'application/pdf',
      bytes: poly,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('POLYGLOT_REJECTED');
  });

  it('rejects empty and oversized files', () => {
    expect(
      validateEvidenceBytes({
        filename: 'x.png',
        declaredMime: 'image/png',
        bytes: Buffer.alloc(0),
      }).ok,
    ).toBe(false);
    const huge = Buffer.concat([PNG, Buffer.alloc(10 * 1024 * 1024)]);
    const result = validateEvidenceBytes({
      filename: 'x.png',
      declaredMime: 'image/png',
      bytes: huge,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('SIZE_REJECTED');
  });

  it('treats UNAVAILABLE malware as not CLEAN', () => {
    expect(assertMalwareUnavailableIsNotClean('UNAVAILABLE')).toBe(true);
    expect(assertMalwareUnavailableIsNotClean('INFECTED')).toBe(true);
    expect(assertMalwareUnavailableIsNotClean('CLEAN')).toBe(false);
  });
});
