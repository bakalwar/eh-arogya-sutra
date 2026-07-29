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

/** Hide connection details from API/clients. */
export function sanitizeDatabaseError(err: unknown): { code: string; message: string } {
  if (err instanceof DatabaseNotInstalledError) {
    return { code: err.code, message: 'DATABASE_NOT_INSTALLED' };
  }
  if (err instanceof TenantContextRequiredError) {
    return { code: err.code, message: 'Tenant context required' };
  }
  if (err instanceof CrossTenantDeniedError) {
    return { code: err.code, message: 'Access denied' };
  }
  if (err instanceof MembershipInactiveError) {
    return { code: err.code, message: 'Membership inactive' };
  }
  if (err instanceof InvalidReviewTransitionError) {
    return { code: err.code, message: 'Invalid review transition' };
  }
  if (err instanceof ImmutablePrescriptionError) {
    return { code: err.code, message: 'Prescription is immutable' };
  }
  return { code: 'DATABASE_ERROR', message: 'Database operation failed' };
}
