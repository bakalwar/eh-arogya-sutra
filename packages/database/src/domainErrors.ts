export class ValidationError extends Error {
  readonly code = 'VALIDATION_ERROR' as const;
  constructor(message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
  }
}

/** Non-disclosing not-found for cross-tenant / missing resources. */
export class ResourceNotFoundError extends Error {
  readonly code = 'NOT_FOUND' as const;
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'ResourceNotFoundError';
  }
}

export class ConflictError extends Error {
  readonly code = 'CONFLICT' as const;
  constructor(message = 'Conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class IdempotencyConflictError extends Error {
  readonly code = 'IDEMPOTENCY_CONFLICT' as const;
  constructor(message = 'Idempotency key reused with different payload') {
    super(message);
    this.name = 'IdempotencyConflictError';
  }
}

export class InvalidConsultationTransitionError extends Error {
  readonly code = 'INVALID_CONSULTATION_TRANSITION' as const;
  constructor(message = 'Invalid consultation state transition') {
    super(message);
    this.name = 'InvalidConsultationTransitionError';
  }
}

export class ImmutableArtifactError extends Error {
  readonly code = 'IMMUTABLE_ARTIFACT' as const;
  constructor(message = 'Clinical artifact is immutable') {
    super(message);
    this.name = 'ImmutableArtifactError';
  }
}

export class AccessDeniedError extends Error {
  readonly code = 'ACCESS_DENIED' as const;
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

export class RateLimitedError extends Error {
  readonly code = 'RATE_LIMITED' as const;
  readonly retryAfterSec: number;
  constructor(retryAfterSec = 1, message = 'RATE_LIMITED') {
    super(message);
    this.name = 'RateLimitedError';
    this.retryAfterSec = retryAfterSec;
  }
}

export class RateLimitUnavailableError extends Error {
  readonly code = 'RATE_LIMIT_UNAVAILABLE' as const;
  readonly retryAfterSec: number;
  constructor(retryAfterSec = 30, message = 'RATE_LIMIT_UNAVAILABLE') {
    super(message);
    this.name = 'RateLimitUnavailableError';
    this.retryAfterSec = retryAfterSec;
  }
}

export class ReviewConflictError extends Error {
  readonly code = 'REVIEW_CONFLICT' as const;
  constructor(message = 'REVIEW_CONFLICT') {
    super(message);
    this.name = 'ReviewConflictError';
  }
}

export class ObjectStoreUnavailableError extends Error {
  readonly code = 'OBJECT_STORE_UNAVAILABLE' as const;
  constructor(message = 'OBJECT_STORE_UNAVAILABLE') {
    super(message);
    this.name = 'ObjectStoreUnavailableError';
  }
}
