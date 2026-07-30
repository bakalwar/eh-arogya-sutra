import type { NextFunction, Response } from 'express';
import type { TenantContext } from '@ehas2/database';
import type { AuthedRequest } from './authorization.js';
import { sendError } from '../http/errors.js';

export type TenantAuthedRequest = AuthedRequest & {
  tenantContext?: TenantContext | null;
};

export type TenantContextResolver = (req: TenantAuthedRequest) => TenantContext | null;

/**
 * Resolves DB TenantContext after permission checks.
 * Production has no session bridge yet — resolver returns null → fail closed.
 * Tests inject a synthetic TenantContext via createApp deps (not headers/query).
 */
export function requireTenantContext(resolve: TenantContextResolver) {
  return (req: TenantAuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.principal) {
      sendError(
        res,
        401,
        'AUTH_NOT_CONNECTED',
        'Authentication service is not connected.',
        req.requestId ?? 'unknown',
      );
      return;
    }
    const tenant = resolve(req);
    if (!tenant) {
      sendError(
        res,
        403,
        'TENANT_CONTEXT_REQUIRED',
        'Active tenant context is required.',
        req.requestId ?? 'unknown',
      );
      return;
    }
    if (tenant.membershipStatus !== 'ACTIVE') {
      sendError(res, 403, 'ACCESS_DENIED', 'Membership is not active.', req.requestId ?? 'unknown');
      return;
    }
    req.tenantContext = tenant;
    next();
  };
}
