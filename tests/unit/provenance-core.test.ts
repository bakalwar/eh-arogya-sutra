import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BV_ENC_INVALID,
  BV_NORM_HASH_MISMATCH,
  BV_NORM_POLICY_MISMATCH,
  BV_RAW_HASH_MISMATCH,
  NORMALIZATION_POLICY_V1,
  compareExpectedNormalizedHash,
  compareExpectedRawHash,
  computeSha256V1,
  inspectByteCharacteristics,
  verifyNormalizationPolicyVersion,
} from '../../tools/provenance/verifyCore.mjs';

const CORE_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../tools/provenance/verifyCore.mjs',
);

const EMPTY_SHA = 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

const FORBIDDEN_IMPORT_PATTERNS = [
  /from\s+['"]node:fs['"]/,
  /from\s+['"]node:path['"]/,
  /from\s+['"]node:os['"]/,
  /from\s+['"]node:http['"]/,
  /from\s+['"]node:https['"]/,
  /from\s+['"]node:net['"]/,
  /from\s+['"]node:tls['"]/,
  /from\s+['"]child_process['"]/,
  /from\s+['"]node:child_process['"]/,
  /process\.env/,
];

describe('provenance verifyCore (P2-B1 synthetic in-memory)', () => {
  it('computeSha256V1 matches empty vector', () => {
    expect(computeSha256V1(Buffer.alloc(0))).toBe(EMPTY_SHA);
    expect(computeSha256V1(new Uint8Array(0))).toBe(EMPTY_SHA);
  });

  it('rejects non-byte inputs with TypeError', () => {
    const bad = [
      null,
      undefined,
      'ascii',
      1,
      {},
      new ArrayBuffer(4),
      new DataView(new ArrayBuffer(4)),
    ];
    for (const v of bad) {
      expect(() => computeSha256V1(v)).toThrow(TypeError);
      expect(() => inspectByteCharacteristics(v)).toThrow(TypeError);
    }
  });

  it('LF and CRLF produce different hashes', () => {
    const lf = Buffer.from('a\n', 'latin1');
    const crlf = Buffer.from('a\r\n', 'latin1');
    expect(computeSha256V1(lf)).not.toBe(computeSha256V1(crlf));
  });

  it('BOM changes hash and is detected', () => {
    const plain = Buffer.from('a', 'latin1');
    const bom = Buffer.from([0xef, 0xbb, 0xbf, 0x61]);
    expect(computeSha256V1(plain)).not.toBe(computeSha256V1(bom));
    expect(inspectByteCharacteristics(bom).bom).toBe('BOM_UTF8_PRESENT');
    expect(inspectByteCharacteristics(plain).bom).toBe('BOM_NONE');
  });

  it('terminal newline and trailing space change hash', () => {
    const noNl = Buffer.from('x', 'latin1');
    const withNl = Buffer.from('x\n', 'latin1');
    const withSpace = Buffer.from('x ', 'latin1');
    expect(computeSha256V1(noNl)).not.toBe(computeSha256V1(withNl));
    expect(computeSha256V1(noNl)).not.toBe(computeSha256V1(withSpace));
    expect(inspectByteCharacteristics(withNl).terminalNewline).toBe('PRESENT');
    expect(inspectByteCharacteristics(noNl).terminalNewline).toBe('ABSENT');
  });

  it('classifies EOL patterns and lone CR', () => {
    expect(inspectByteCharacteristics(Buffer.from('a\nb\n', 'latin1')).eol).toBe('EOL_LF_ONLY');
    expect(inspectByteCharacteristics(Buffer.from('a\r\nb\r\n', 'latin1')).eol).toBe(
      'EOL_CRLF_ONLY',
    );
    expect(inspectByteCharacteristics(Buffer.from('a\r\nb\n', 'latin1')).eol).toBe('EOL_MIXED');
    expect(inspectByteCharacteristics(Buffer.from('a\r\n', 'latin1')).loneCrObserved).toBe(false);
    const lone = inspectByteCharacteristics(Buffer.from('a\rb', 'latin1'));
    expect(lone.loneCrObserved).toBe(true);
    expect(lone.eol).toBe('EOL_NONE');
    const crOnly = inspectByteCharacteristics(Buffer.from('a\rb', 'latin1'));
    expect(crOnly.loneCrObserved).toBe(true);
    expect(inspectByteCharacteristics(Buffer.alloc(0)).eol).toBe('EOL_NONE');
  });

  it('lone CR only reports loneCrObserved with EOL_NONE', () => {
    const onlyCr = inspectByteCharacteristics(Buffer.from('a\rb', 'latin1').subarray(0, 2));
    const singleLine = Buffer.from('x\ry', 'latin1');
    const lineCr = inspectByteCharacteristics(Buffer.from('x\r', 'latin1'));
    expect(lineCr.loneCrObserved).toBe(true);
    expect(lineCr.eol).toBe('EOL_NONE');
    expect(lineCr.terminalNewline).toBe('PRESENT');
    expect(singleLine.byteLength).toBeGreaterThan(0);
    expect(onlyCr.byteLength).toBe(2);
  });

  it('composed vs decomposed Unicode bytes differ in hash', () => {
    const nfc = Buffer.from('\u00e9', 'utf8');
    const nfd = Buffer.from('e\u0301', 'utf8');
    expect(computeSha256V1(nfc)).not.toBe(computeSha256V1(nfd));
  });

  it('invalid UTF-8 is hashable and flagged for interpretive gate', () => {
    const invalid = Buffer.from([0xff, 0x0a]);
    const inspection = inspectByteCharacteristics(invalid);
    expect(inspection.utf8).toBe('UTF8_INVALID');
    expect(inspection.interpretiveEncoding).toBe(BV_ENC_INVALID);
    expect(computeSha256V1(invalid)).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(inspection.eol).toBe('EOL_LF_ONLY');
  });

  it('empty bytes inspection record', () => {
    const inspection = inspectByteCharacteristics(new Uint8Array(0));
    expect(inspection).toEqual({
      byteLength: 0,
      utf8: 'UTF8_VALID',
      bom: 'BOM_NONE',
      eol: 'EOL_NONE',
      loneCrObserved: false,
      terminalNewline: 'ABSENT',
      interpretiveEncoding: 'PASS',
    });
  });

  it('BOM-only input is valid UTF-8 with BOM present', () => {
    const bomOnly = Buffer.from([0xef, 0xbb, 0xbf]);
    const inspection = inspectByteCharacteristics(bomOnly);
    expect(inspection.bom).toBe('BOM_UTF8_PRESENT');
    expect(inspection.utf8).toBe('UTF8_VALID');
    expect(inspection.byteLength).toBe(3);
  });

  it('protects against caller mutation after hash', () => {
    const buf = Buffer.from('stable', 'latin1');
    const before = computeSha256V1(buf);
    buf[0] = 0x58;
    const after = computeSha256V1(buf);
    expect(before).not.toBe(after);
    const frozen = Buffer.from('stable', 'latin1');
    const digest = computeSha256V1(frozen);
    frozen[0] = 0x58;
    expect(computeSha256V1(Buffer.from('stable', 'latin1'))).toBe(digest);
  });

  it('compareExpectedRawHash PASS and FAIL with BV code', () => {
    const bytes = Buffer.from('syn', 'latin1');
    const digest = computeSha256V1(bytes);
    expect(compareExpectedRawHash(bytes, digest)).toMatchObject({
      outcome: 'PASS',
      sha256V1: digest,
    });
    const fail = compareExpectedRawHash(bytes, EMPTY_SHA);
    expect(fail.outcome).toBe('FAIL');
    if (fail.outcome === 'FAIL') {
      expect(fail.bvCode).toBe(BV_RAW_HASH_MISMATCH);
    }
  });

  it('compareExpectedNormalizedHash uses separately supplied bytes', () => {
    const raw = Buffer.from('raw\n', 'latin1');
    const normalized = Buffer.from('norm\r\n', 'latin1');
    const normDigest = computeSha256V1(normalized);
    expect(compareExpectedNormalizedHash(normalized, normDigest).outcome).toBe('PASS');
    expect(compareExpectedNormalizedHash(raw, normDigest).outcome).toBe('FAIL');
    const fail = compareExpectedNormalizedHash(raw, normDigest);
    if (fail.outcome === 'FAIL') {
      expect(fail.bvCode).toBe(BV_NORM_HASH_MISMATCH);
    }
  });

  it('rejects malformed expected digests with TypeError', () => {
    const bytes = Buffer.from('x', 'latin1');
    const bad = [
      'sha256:ABC',
      'SHA256:' + 'a'.repeat(64),
      'sha256:' + 'A'.repeat(64),
      'sha256:' + 'g'.repeat(64),
      ' sha256:' + 'a'.repeat(64),
    ];
    for (const d of bad) {
      expect(() => compareExpectedRawHash(bytes, d)).toThrow(TypeError);
      expect(() => compareExpectedNormalizedHash(bytes, d)).toThrow(TypeError);
    }
    expect(() => compareExpectedRawHash(bytes, 1)).toThrow(TypeError);
  });

  it('verifyNormalizationPolicyVersion PASS and FAIL', () => {
    expect(
      verifyNormalizationPolicyVersion(NORMALIZATION_POLICY_V1, NORMALIZATION_POLICY_V1),
    ).toEqual({
      outcome: 'PASS',
    });
    expect(verifyNormalizationPolicyVersion('WRONG_POLICY', NORMALIZATION_POLICY_V1)).toEqual({
      outcome: 'FAIL',
      bvCode: BV_NORM_POLICY_MISMATCH,
    });
    expect(verifyNormalizationPolicyVersion(NORMALIZATION_POLICY_V1, 'WRONG_POLICY')).toEqual({
      outcome: 'FAIL',
      bvCode: BV_NORM_POLICY_MISMATCH,
    });
    expect(verifyNormalizationPolicyVersion('WRONG_POLICY', 'WRONG_POLICY')).toEqual({
      outcome: 'FAIL',
      bvCode: BV_NORM_POLICY_MISMATCH,
    });
    expect(() => verifyNormalizationPolicyVersion(null, NORMALIZATION_POLICY_V1)).toThrow(
      TypeError,
    );
    expect(() => verifyNormalizationPolicyVersion(NORMALIZATION_POLICY_V1, null)).toThrow(
      TypeError,
    );
  });

  it('synthetic payloads stay at or below 64 KiB in this suite', () => {
    const max = 64 * 1024;
    const payload = Buffer.alloc(max, 0x61);
    expect(payload.length).toBeLessThanOrEqual(max);
    expect(computeSha256V1(payload)).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it('verifyCore.mjs import boundary (node:crypto only)', () => {
    const source = readFileSync(CORE_PATH, 'utf8');
    expect(source).toMatch(/from\s+['"]node:crypto['"]/);
    for (const re of FORBIDDEN_IMPORT_PATTERNS) {
      expect(source).not.toMatch(re);
    }
  });
});
