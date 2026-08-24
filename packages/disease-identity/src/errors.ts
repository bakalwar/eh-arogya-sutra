export class DiseaseIdentityError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'DiseaseIdentityError';
    this.code = code;
  }
}

export const IDENTITY_ID_COLLISION = 'IDENTITY_ID_COLLISION';
export const NORMALIZATION_COLLISION = 'NORMALIZATION_COLLISION';
export const INVALID_NAMESPACE = 'INVALID_NAMESPACE';
export const INVALID_CODE = 'INVALID_CODE';
export const PROHIBITED_FIELD = 'PROHIBITED_FIELD';
export const FIELD_TOO_LONG = 'FIELD_TOO_LONG';
export const CANDIDATE_LIMIT_EXCEEDED = 'CANDIDATE_LIMIT_EXCEEDED';
export const INVALID_DIGEST = 'INVALID_DIGEST';
export const FULL_CORPUS_NOT_AUTHORIZED = 'FULL_CORPUS_NOT_AUTHORIZED';
export const MALFORMED_INPUT = 'MALFORMED_INPUT';
