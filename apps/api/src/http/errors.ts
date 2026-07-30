import type { Response } from 'express';
import {
  AccessDeniedError,
  ConflictError,
  MembershipInactiveError,
  ResourceNotFoundError,
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
  | 'RATE_LIMITED';

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
  const code = (err as { code?: string } | null)?.code;
  if (code === 'NOT_FOUND' || code === 'CROSS_TENANT_DENIED') {
    sendError(res, 404, 'NOT_FOUND', 'Resource not found', requestId);
    return;
  }
  sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error', requestId);
}
