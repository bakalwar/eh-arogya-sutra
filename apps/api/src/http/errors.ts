import type { Response } from 'express';
import {
  AccessDeniedError,
  ConflictError,
  IdempotencyConflictError,
  MembershipInactiveError,
  ObjectStoreUnavailableError,
  RateLimitedError,
  RateLimitUnavailableError,
  ResourceNotFoundError,
  ReviewConflictError,
  FactConflictError,
  TenantContextRequiredError,
  ValidationError,
} from '@ehas2/database';

export type ApiErrorCode =
  | 'NOT_IMPLEMENTED'
  | 'NOT_READY'
  | 'DATA_PACKAGE_NOT_INSTALLED'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'AUTH_NOT_CONNECTED'
  | 'PERMISSION_DENIED'
  | 'FORBIDDEN'
  | 'ACCESS_DENIED'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'TENANT_CONTEXT_REQUIRED'
  | 'RATE_LIMITED'
  | 'RATE_LIMIT_UNAVAILABLE'
  | 'OBJECT_STORE_UNAVAILABLE'
  | 'PAYLOAD_TOO_LARGE'
  | 'IDEMPOTENCY_CONFLICT'
  | 'REVIEW_CONFLICT'
  | 'FACT_CONFLICT';

export type ApiErrorBody = {
  success: false;
  code: ApiErrorCode;
  message: string;
  requestId: string;
  details?: unknown;
};

export function sendError(
  res: Response,
  status: number,
  code: ApiErrorCode,
  message: string,
  requestId: string,
  details?: unknown,
): void {
  const body: ApiErrorBody = { success: false, code, message, requestId };
  if (details !== undefined) body.details = details;
  res.status(status).json(body);
}

export function sendSuccess(res: Response, data: unknown, requestId: string, status = 200): void {
  res.status(status).json({ success: true, data, requestId });
}

/** Map domain errors to HTTP without leaking stack traces or profile field values. */
export function sendDomainError(res: Response, err: unknown, requestId: string): void {
  if (err instanceof ValidationError) {
    sendError(res, 400, 'VALIDATION_ERROR', err.message, requestId);
    return;
  }
  if (err instanceof AccessDeniedError) {
    sendError(res, 403, 'ACCESS_DENIED', 'Access denied', requestId);
    return;
  }
  if (err instanceof MembershipInactiveError || err instanceof TenantContextRequiredError) {
    sendError(res, 403, 'ACCESS_DENIED', 'Access denied', requestId);
    return;
  }
  if (err instanceof ResourceNotFoundError) {
    sendError(res, 404, 'NOT_FOUND', 'Resource not found', requestId);
    return;
  }
  if (err instanceof ConflictError) {
    sendError(res, 409, 'CONFLICT', err.message, requestId);
    return;
  }
  if (err instanceof IdempotencyConflictError) {
    sendError(res, 409, 'IDEMPOTENCY_CONFLICT', 'Idempotency key conflict', requestId);
    return;
  }
  if (err instanceof ReviewConflictError) {
    sendError(res, 409, 'REVIEW_CONFLICT', 'REVIEW_CONFLICT', requestId);
    return;
  }
  if (err instanceof FactConflictError) {
    sendError(res, 409, 'FACT_CONFLICT', 'FACT_CONFLICT', requestId);
    return;
  }
  if (err instanceof RateLimitedError) {
    res.setHeader('Retry-After', String(err.retryAfterSec));
    sendError(
      res,
      429,
      'RATE_LIMITED',
      'Too many evidence ingest attempts. Try again shortly.',
      requestId,
    );
    return;
  }
  if (err instanceof RateLimitUnavailableError) {
    res.setHeader('Retry-After', String(err.retryAfterSec));
    sendError(res, 503, 'RATE_LIMIT_UNAVAILABLE', 'Rate limit service unavailable', requestId);
    return;
  }
  if (err instanceof ObjectStoreUnavailableError) {
    sendError(res, 503, 'OBJECT_STORE_UNAVAILABLE', 'Object store unavailable', requestId);
    return;
  }
  const code = (err as { code?: string } | null)?.code;
  if (code === 'NOT_FOUND' || code === 'CROSS_TENANT_DENIED') {
    sendError(res, 404, 'NOT_FOUND', 'Resource not found', requestId);
    return;
  }
  sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error', requestId);
}
