import { createHash } from 'node:crypto';

import { canonicalStableDumps } from './canonicalJson.js';

/** @deprecated Prefer rule4SafetyFingerprintV1Hash / rule4EmptyResultFingerprintV1Hash for Rule 4 audit. */
export function rule4StableDumps(obj: unknown): string {
  return canonicalStableDumps(obj);
}

export function rule4Fingerprint(obj: unknown): string {
  const payload = canonicalStableDumps(obj);
  return createHash('sha256').update(payload, 'utf8').digest('hex').toUpperCase();
}

export { canonicalStableDumps } from './canonicalJson.js';
