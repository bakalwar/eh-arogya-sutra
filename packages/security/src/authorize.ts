import type { IdentityPrincipal } from './identity.js';
import { AUTHENTICATION_STATUS } from './identity.js';
import { Permission, roleHasPermission, type PermissionName } from './permissions.js';
import { evaluateResourceOwnership, type ResourceOwnershipInput } from './ownership.js';
import {
  isSuperAdminRole,
  PlatformRole,
  SUPER_ADMIN_ROLES,
  type PlatformRoleName,
} from './roles.js';

export type AuthzDecision = {
  allowed: boolean;
  reason: string;
  policy: string;
};

/**
 * Deny-by-default Super Admin policy check.
 * URL or payload changes must never grant Super Admin to Doctor.
 */
export function evaluateSuperAdminAccess(
  role: PlatformRoleName | string | undefined,
): AuthzDecision {
  if (role && SUPER_ADMIN_ROLES.has(role as PlatformRoleName)) {
    return {
      allowed: true,
      reason: 'role_matches_super_admin_control_plane',
      policy: 'super-admin-control-plane',
    };
  }
  return {
    allowed: false,
    reason: 'deny_by_default',
    policy: 'super-admin-control-plane',
  };
}

export type AuthorizeRequest = {
  principal: IdentityPrincipal | null | undefined;
  permission: PermissionName;
  resource?: ResourceOwnershipInput | null;
};

/**
 * Central authorization entry — deny by default.
 * Null principal ⇒ authentication not connected (Phase 2A).
 */
export function evaluateAuthorization(input: AuthorizeRequest): AuthzDecision {
  const policy = 'authorization-v1';
  const { principal, permission, resource } = input;

  if (!principal) {
    return {
      allowed: false,
      reason: 'authentication_not_connected',
      policy,
    };
  }

  if (principal.authenticationStatus !== AUTHENTICATION_STATUS) {
    return {
      allowed: false,
      reason: 'invalid_authentication_status',
      policy,
    };
  }

  if (permission === Permission.SuperAdminControlPlane) {
    return evaluateSuperAdminAccess(principal.role);
  }

  if (!roleHasPermission(principal.role, permission)) {
    return {
      allowed: false,
      reason: 'permission_denied',
      policy,
    };
  }

  if (resource) {
    const ownership = evaluateResourceOwnership(principal, resource);
    if (!ownership.allowed) return ownership;
  }

  return {
    allowed: true,
    reason: 'policy_allow',
    policy,
  };
}

/** Payload/URL role claims must never elevate a trusted doctor principal. */
export function doctorCannotElevateViaPayload(
  trustedRole: PlatformRoleName,
  claimedRoleFromPayload: string | undefined,
): boolean {
  if (trustedRole !== PlatformRole.Doctor && trustedRole !== PlatformRole.ClinicAdmin) {
    return true;
  }
  return !isSuperAdminRole(claimedRoleFromPayload);
}
