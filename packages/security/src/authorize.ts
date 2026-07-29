import type { IdentityPrincipal } from './identity.js';
import { AUTHENTICATION_STATUS } from './identity.js';
import { Permission, roleHasPermission, type PermissionName } from './permissions.js';
import { evaluateResourceOwnership, type ResourceOwnershipInput } from './ownership.js';
import {
  isManagementRole,
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

/** Management shell entry — separate from Super Admin ops. */
export function evaluateManagementShellAccess(
  role: PlatformRoleName | string | undefined,
): AuthzDecision {
  if (role && roleHasPermission(role as PlatformRoleName, Permission.ManagementShellAccess)) {
    return {
      allowed: true,
      reason: 'role_matches_management_shell',
      policy: 'management-shell-v1',
    };
  }
  return {
    allowed: false,
    reason: 'permission_denied',
    policy: 'management-shell-v1',
  };
}

export type AuthorizeRequest = {
  principal: IdentityPrincipal | null | undefined;
  permission: PermissionName;
  resource?: ResourceOwnershipInput | null;
  /** Runtime environment — production rejects test principals. */
  runtimeEnv?: string | null;
};

/**
 * Central authorization entry — deny by default.
 * Null principal ⇒ authentication not connected (Phase 2A/2A-M).
 */
export function evaluateAuthorization(input: AuthorizeRequest): AuthzDecision {
  const policy = 'authorization-v1';
  const { principal, permission, resource, runtimeEnv } = input;

  if (!principal) {
    return {
      allowed: false,
      reason: 'authentication_not_connected',
      policy,
    };
  }

  const testRejection = rejectTestPrincipalInProduction(principal, runtimeEnv);
  if (!testRejection.allowed) return testRejection;

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

/**
 * Reject client-supplied role claims that would elevate a trusted principal.
 * Frontend visibility is UX only — this is the authoritative check for claim injection.
 */
export function rejectClientSuppliedRoleGrant(
  trustedPrincipal: IdentityPrincipal,
  clientClaimedRole: string | undefined | null,
): AuthzDecision {
  const policy = 'client-role-injection-v1';
  if (!clientClaimedRole || !clientClaimedRole.trim()) {
    return { allowed: true, reason: 'no_client_role_claim', policy };
  }
  if (clientClaimedRole === trustedPrincipal.role) {
    return { allowed: true, reason: 'client_role_matches_trusted', policy };
  }
  return {
    allowed: false,
    reason: 'client_supplied_role_rejected',
    policy,
  };
}

/** Production (and EHAS2 production) must reject test-principal injection. */
export function rejectTestPrincipalInProduction(
  principal: IdentityPrincipal,
  runtimeEnv?: string | null,
): AuthzDecision {
  const policy = 'test-principal-rejection-v1';
  const env = (runtimeEnv ?? '').toLowerCase();
  const isProduction = env === 'production';
  if (isProduction && principal.isTestPrincipal === true) {
    return {
      allowed: false,
      reason: 'test_principal_rejected_in_production',
      policy,
    };
  }
  return { allowed: true, reason: 'test_principal_policy_ok', policy };
}

/** Payload/URL role claims must never elevate a trusted doctor/clinic principal. */
export function doctorCannotElevateViaPayload(
  trustedRole: PlatformRoleName,
  claimedRoleFromPayload: string | undefined,
): boolean {
  if (trustedRole !== PlatformRole.Doctor && trustedRole !== PlatformRole.ClinicAdmin) {
    return true;
  }
  if (!claimedRoleFromPayload) return true;
  return !(isSuperAdminRole(claimedRoleFromPayload) || isManagementRole(claimedRoleFromPayload));
}

/** Management Admin must not inherit Super Admin by default. */
export function managementCannotAccessSuperAdminByDefault(role: PlatformRoleName): boolean {
  return isManagementRole(role) && !roleHasPermission(role, Permission.SuperAdminControlPlane);
}
