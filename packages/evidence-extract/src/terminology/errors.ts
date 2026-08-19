export const TERMINOLOGY_PACK_ERROR_CODES = [
  'TERMINOLOGY_PACK_INVALID',
  'TERMINOLOGY_PACK_CHECKSUM_MISMATCH',
  'TERMINOLOGY_PACK_APPROVAL_INVALID',
  'TERMINOLOGY_PACK_PATH_FORBIDDEN',
  'TERMINOLOGY_PACK_PRODUCTION_SYNTHETIC_FORBIDDEN',
  'TERMINOLOGY_PACK_UNSUPPORTED_VERSION',
  'TERMINOLOGY_PACK_SELECTOR_FORBIDDEN',
  'TERMINOLOGY_PACK_PHI_FORBIDDEN',
  'TERMINOLOGY_PACK_DUPLICATE_ID',
  'TERMINOLOGY_PACK_DUPLICATE_ALIAS',
  'TERMINOLOGY_PACK_TOO_LARGE',
  'TERMINOLOGY_PACK_IO_FORBIDDEN',
  'TERMINOLOGY_PACK_PIN_MISMATCH',
] as const;
export type TerminologyPackErrorCode = (typeof TERMINOLOGY_PACK_ERROR_CODES)[number];

export class TerminologyPackError extends Error {
  readonly code: TerminologyPackErrorCode;
  readonly packId?: string;
  readonly packVersion?: string;
  readonly entryCount?: number;

  constructor(
    code: TerminologyPackErrorCode,
    meta?: {
      packId?: string;
      packVersion?: string;
      entryCount?: number;
    },
  ) {
    super(code);
    this.name = 'TerminologyPackError';
    this.code = code;
    this.packId = meta?.packId;
    this.packVersion = meta?.packVersion;
    this.entryCount = meta?.entryCount;
  }

  toJSON(): Record<string, string | number | undefined> {
    return {
      code: this.code,
      packId: this.packId,
      packVersion: this.packVersion,
      entryCount: this.entryCount,
    };
  }
}
