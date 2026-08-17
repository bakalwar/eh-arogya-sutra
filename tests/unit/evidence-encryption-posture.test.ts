import { describe, expect, it } from 'vitest';
import {
  TEST_ADAPTER_ENCRYPTION,
  evaluateEncryptionPosture,
  assertEncryptionPosture,
} from '../../packages/evidence-ingest/src/index.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('F2A encryption posture', () => {
  it('test adapter cannot claim production encryption', () => {
    expect(TEST_ADAPTER_ENCRYPTION.productionReady).toBe(false);
    expect(TEST_ADAPTER_ENCRYPTION.productionEncrypted).toBe(false);
    expect(TEST_ADAPTER_ENCRYPTION.posture).toBe('NOT_PRODUCTION');
    const ok = evaluateEncryptionPosture({
      posture: 'NOT_PRODUCTION',
      productionReady: false,
      kmsAvailable: false,
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.productionEncrypted).toBe(false);
    expect(
      evaluateEncryptionPosture({
        posture: 'NOT_PRODUCTION',
        productionReady: true,
        kmsAvailable: false,
      }).ok,
    ).toBe(false);
  });

  it('required KMS unavailable fails closed', () => {
    const result = evaluateEncryptionPosture({
      posture: 'SSE_KMS_CMEK',
      productionReady: false,
      kmsAvailable: false,
    });
    expect(result).toEqual({ ok: false, code: 'KMS_UNAVAILABLE' });
    expect(() =>
      assertEncryptionPosture({
        posture: 'SSE_KMS_CMEK',
        productionReady: false,
        kmsAvailable: false,
      }),
    ).toThrow(/KMS_UNAVAILABLE/);
  });

  it('does not commit key material or key IDs', () => {
    const src = fs.readFileSync(
      path.join(root, 'packages/evidence-ingest/src/encryption.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/AKIA[0-9A-Z]{16}/);
    expect(src).not.toMatch(/arn:aws:kms/);
    expect(src).not.toMatch(/BEGIN (RSA |EC )?PRIVATE KEY/);
    expect(src).not.toMatch(/kmsKeyId\s*=\s*['"]/);
  });
});
