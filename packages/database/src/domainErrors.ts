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
