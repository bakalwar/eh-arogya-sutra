import { createHash } from 'node:crypto';
import { catalogFingerprintMaterial } from './catalog.js';
import { RULE1_CATALOG_VERSION } from './version.js';

export function sha256Hex(material: string): string {
  return createHash('sha256').update(material, 'utf8').digest('hex');
}

export function assertNfc(value: string, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be string`);
  }
  const nfc = value.normalize('NFC');
  if (nfc !== value) {
    throw new Error(`${label} must be Unicode NFC`);
  }
  if (nfc.length === 0) {
    throw new Error(`${label} must be non-empty`);
  }
  return nfc;
}

export function computeCatalogFingerprint(): string {
  return sha256Hex(`${RULE1_CATALOG_VERSION}\n${catalogFingerprintMaterial()}`);
}
