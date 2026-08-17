import type { EncryptionPosture } from './types.js';

export type EncryptionCapabilityInput = {
  posture: EncryptionPosture;
  productionReady: boolean;
  kmsAvailable: boolean;
};

export type EncryptionCapabilityResult =
  | { ok: true; productionEncrypted: false; posture: EncryptionPosture }
  | { ok: false; code: 'ENCRYPTION_POSTURE_NOT_PRODUCTION' | 'KMS_UNAVAILABLE' };

/**
 * Metadata/capability enforcement only. No key material, no key IDs, no env secrets.
 * Production capability cannot be true with NOT_PRODUCTION. Required KMS missing fails closed.
 */
export function evaluateEncryptionPosture(
  input: EncryptionCapabilityInput,
): EncryptionCapabilityResult {
  if (input.productionReady && input.posture === 'NOT_PRODUCTION') {
    return { ok: false, code: 'ENCRYPTION_POSTURE_NOT_PRODUCTION' };
  }
  if (input.posture === 'SSE_KMS_CMEK' && !input.kmsAvailable) {
    return { ok: false, code: 'KMS_UNAVAILABLE' };
  }
  if (input.productionReady) {
    return { ok: false, code: 'ENCRYPTION_POSTURE_NOT_PRODUCTION' };
  }
  return { ok: true, productionEncrypted: false, posture: input.posture };
}

export function assertEncryptionPosture(input: EncryptionCapabilityInput): void {
  const result = evaluateEncryptionPosture(input);
  if (!result.ok) {
    const err = new Error(result.code);
    (err as Error & { code: string }).code = result.code;
    throw err;
  }
}

export const TEST_ADAPTER_ENCRYPTION = {
  posture: 'NOT_PRODUCTION' as const,
  productionReady: false as const,
  kmsAvailable: false as const,
  productionEncrypted: false as const,
};
