import { createHash, type Hash } from 'node:crypto';
import { DiseaseIdentityError } from './errors.js';
import {
  ORDERED_SANITIZED_IDENTITY_FP_ALGORITHM,
  ORDERED_SANITIZED_IDENTITY_FP_DOMAIN_PREFIX,
  SANITIZED_RECORD_SCHEMA_VERSION,
} from './sanitizedIdentityConstants.js';
import {
  serializeSanitizedRecordLine,
  type SanitizedDiseaseIdentityRecord,
} from './sanitizedIdentityRecord.js';

/**
 * Streaming hasher for EHAS2_ORDERED_SANITIZED_DISEASE_IDENTITY_FP_V1_SHA256.
 * Per row: UTF8(canonicalJsonString(record)) || LF
 * Whole: domainPrefix || NUL || schemaVersion || NUL || decimalCount || NUL || SHA256(stream)
 */
export class OrderedSanitizedIdentityFingerprintBuilder {
  private readonly streamHash: Hash = createHash('sha256');
  private count = 0;
  private lastId = 0;
  private closed = false;

  appendRecord(record: SanitizedDiseaseIdentityRecord): void {
    if (this.closed) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Fingerprint builder already finalized');
    }
    if (record.legacyDbDiseaseId <= this.lastId) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Sanitized rows must be strictly ascending by id',
      );
    }
    const line = serializeSanitizedRecordLine(record);
    this.streamHash.update(line, 'utf8');
    this.streamHash.update('\n', 'utf8');
    this.lastId = record.legacyDbDiseaseId;
    this.count += 1;
  }

  /** Append a pre-serialized canonical line (must already include no trailing LF). */
  appendCanonicalLine(line: string, legacyDbDiseaseId: number): void {
    if (this.closed) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Fingerprint builder already finalized');
    }
    if (legacyDbDiseaseId <= this.lastId) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        'Sanitized rows must be strictly ascending by id',
      );
    }
    this.streamHash.update(line, 'utf8');
    this.streamHash.update('\n', 'utf8');
    this.lastId = legacyDbDiseaseId;
    this.count += 1;
  }

  finalize(expectedCount?: number): {
    readonly algorithm: typeof ORDERED_SANITIZED_IDENTITY_FP_ALGORITHM;
    readonly recordCount: number;
    readonly orderedIdentityFingerprint: string;
    readonly recordByteStreamSha256: string;
  } {
    if (this.closed) {
      throw new DiseaseIdentityError('MALFORMED_INPUT', 'Fingerprint builder already finalized');
    }
    this.closed = true;
    if (expectedCount !== undefined && this.count !== expectedCount) {
      throw new DiseaseIdentityError(
        'MALFORMED_INPUT',
        `Ordered fingerprint count mismatch: expected ${expectedCount}, observed ${this.count}`,
      );
    }
    const recordByteStreamSha256 = this.streamHash.digest('hex');
    const outer = createHash('sha256');
    outer.update(ORDERED_SANITIZED_IDENTITY_FP_DOMAIN_PREFIX, 'utf8');
    outer.update('\0', 'utf8');
    outer.update(SANITIZED_RECORD_SCHEMA_VERSION, 'utf8');
    outer.update('\0', 'utf8');
    outer.update(String(this.count), 'utf8');
    outer.update('\0', 'utf8');
    outer.update(recordByteStreamSha256, 'utf8');
    return {
      algorithm: ORDERED_SANITIZED_IDENTITY_FP_ALGORITHM,
      recordCount: this.count,
      orderedIdentityFingerprint: outer.digest('hex'),
      recordByteStreamSha256,
    };
  }
}

export function assertOrderedFingerprintAlgorithm(value: string): void {
  if (value !== ORDERED_SANITIZED_IDENTITY_FP_ALGORITHM) {
    throw new DiseaseIdentityError('MALFORMED_INPUT', 'Ordered fingerprint algorithm mismatch');
  }
}
