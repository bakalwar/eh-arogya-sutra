export class DatabaseNotInstalledError extends Error {
  readonly code = 'DATABASE_NOT_INSTALLED' as const;
  constructor(message = 'DATABASE_NOT_INSTALLED') {
    super(message);
    this.name = 'DatabaseNotInstalledError';
  }
}

export class TenantContextRequiredError extends Error {
  readonly code = 'TENANT_CONTEXT_REQUIRED' as const;
  constructor(message = 'Trusted TenantContext is required') {
    super(message);
    this.name = 'TenantContextRequiredError';
  }
}

export class MembershipInactiveError extends Error {
  readonly code = 'MEMBERSHIP_INACTIVE' as const;
  constructor(message = 'Membership is inactive') {
    super(message);
    this.name = 'MembershipInactiveError';
  }
}

export class CrossTenantDeniedError extends Error {
  readonly code = 'CROSS_TENANT_DENIED' as const;
  constructor(message = 'Cross-tenant access denied') {
    super(message);
    this.name = 'CrossTenantDeniedError';
  }
}

export class InvalidReviewTransitionError extends Error {
  readonly code = 'INVALID_REVIEW_TRANSITION' as const;
  constructor(message = 'Invalid clinician review transition') {
    super(message);
    this.name = 'InvalidReviewTransitionError';
  }
}

export class ImmutablePrescriptionError extends Error {
  readonly code = 'IMMUTABLE_PRESCRIPTION' as const;
  constructor(message = 'Issued prescription cannot be overwritten') {
    super(message);
    this.name = 'ImmutablePrescriptionError';
  }
}

import {
  ValidationError,
  ResourceNotFoundError,
  ConflictError,
  IdempotencyConflictError,
  InvalidConsultationTransitionError,
  ImmutableArtifactError,
  RateLimitedError,
  RateLimitUnavailableError,
  ObjectStoreUnavailableError,
} from './domainErrors.js';

/** Hide connection details from API/clients. */
export function sanitizeDatabaseError(err: unknown): { code: string; message: string } {
  if (err instanceof DatabaseNotInstalledError) {
    return { code: err.code, message: 'DATABASE_NOT_INSTALLED' };
  }
  if (err instanceof TenantContextRequiredError) {
    return { code: err.code, message: 'Tenant context required' };
  }
  if (err instanceof CrossTenantDeniedError || err instanceof ResourceNotFoundError) {
    return { code: 'NOT_FOUND', message: 'Resource not found' };
  }
  if (err instanceof MembershipInactiveError) {
    return { code: err.code, message: 'Membership inactive' };
  }
  if (
    err instanceof InvalidReviewTransitionError ||
    err instanceof InvalidConsultationTransitionError
  ) {
    return { code: 'INVALID_TRANSITION', message: 'Invalid state transition' };
  }
  if (err instanceof ImmutablePrescriptionError || err instanceof ImmutableArtifactError) {
    return { code: 'IMMUTABLE_ARTIFACT', message: 'Artifact is immutable' };
  }
  if (err instanceof ValidationError) {
    return { code: err.code, message: 'Validation failed' };
  }
  if (err instanceof ConflictError) {
    return { code: err.code, message: 'Conflict' };
  }
  if (err instanceof IdempotencyConflictError) {
    return { code: err.code, message: 'Idempotency conflict' };
  }
  if (err instanceof RateLimitedError) {
    return { code: err.code, message: 'RATE_LIMITED' };
  }
  if (err instanceof RateLimitUnavailableError) {
    return { code: err.code, message: 'RATE_LIMIT_UNAVAILABLE' };
  }
  if (err instanceof ObjectStoreUnavailableError) {
    return { code: err.code, message: 'OBJECT_STORE_UNAVAILABLE' };
  }
  return { code: 'DATABASE_ERROR', message: 'Database operation failed' };
}
