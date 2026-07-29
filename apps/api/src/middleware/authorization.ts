import type { NextFunction, Response } from 'express';
import {
  evaluateAuthorization,
  type AuthzDecision,
  type IdentityPrincipal,
  type PermissionName,
  type ResourceOwnershipInput,
} from '@ehas2/security';
import type { Request } from 'express';

export type AuthedRequest = Request & {
  requestId?: string;
  principal?: IdentityPrincipal | null;
};

export type ResourceResolver = (req: AuthedRequest) => ResourceOwnershipInput | null | undefined;

/**
 * Express authorization middleware — backend check on every protected route.
 * Phase 2A: principals are null until a real auth provider is wired (still deny).
 */
export function requirePermission(permission: PermissionName, resolveResource?: ResourceResolver) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    const resource = resolveResource ? resolveResource(req) : null;
    const runtimeEnv = process.env.EHAS2_NODE_ENV ?? process.env.NODE_ENV ?? null;
    const decision = evaluateAuthorization({
      principal: req.principal ?? null,
      permission,
      resource,
      runtimeEnv,
    });
    if (!decision.allowed) {
      sendAuthzDenied(res, req.requestId ?? 'unknown', decision);
      return;
    }
    next();
  };
}

function sendAuthzDenied(res: Response, requestId: string, decision: AuthzDecision): void {
  const unauthenticated = decision.reason === 'authentication_not_connected';
  res.status(unauthenticated ? 401 : 403).json({
    success: false,
    code: unauthenticated ? 'AUTH_NOT_CONNECTED' : 'PERMISSION_DENIED',
    message: unauthenticated
      ? 'Authentication service is not connected.'
      : 'PERMISSION_DENIED — you are not authorized to perform this action.',
    reason: decision.reason,
    policy: decision.policy,
    requestId,
  });
}
