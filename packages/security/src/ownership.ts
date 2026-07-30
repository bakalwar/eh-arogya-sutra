import type { IdentityPrincipal } from './identity.js';
import { isManagementRole, PlatformRole } from './roles.js';
import { assertTenantMatch } from './tenant.js';

export type ResourceKind =
  | 'patient'
  | 'case'
  | 'prescription'
  | 'report'
  | 'clinic-config'
  | 'doctor-profile'
  | 'clinic-profile'
  | 'support-ticket';

export type ResourceOwnershipInput = {
  resourceKind: ResourceKind;
  resourceTenantId: string;
  /** Owning doctor subject id when resource is doctor-scoped. */
  ownerDoctorId?: string;
};

export type OwnershipDecision = {
  allowed: boolean;
  reason: string;
  policy: string;
};

const CLINICAL_KINDS: ReadonlySet<ResourceKind> = new Set([
  'patient',
  'case',
  'prescription',
  'report',
]);

const OWNER_SCOPED_KINDS: ReadonlySet<ResourceKind> = new Set([
  ...CLINICAL_KINDS,
  'doctor-profile',
]);

/**
 * Resource ownership / tenant isolation policy (deterministic).
 * Does not load a database — callers supply ownership attributes.
 */
export function evaluateResourceOwnership(
  principal: IdentityPrincipal,
  resource: ResourceOwnershipInput,
): OwnershipDecision {
  const policy = 'resource-ownership-v1';

  if (
    principal.role === PlatformRole.SuperAdmin ||
    principal.role === PlatformRole.BreakGlassSuperAdmin
  ) {
    return {
      allowed: false,
      reason: 'super_admin_no_default_patient_resource_access',
      policy,
    };
  }

  if (isManagementRole(principal.role)) {
    if (CLINICAL_KINDS.has(resource.resourceKind)) {
      return {
        allowed: false,
        reason: 'management_no_default_patient_phi',
        policy,
      };
    }
    return {
      allowed: false,
      reason: 'management_clinical_resource_denied',
      policy,
    };
  }

  if (!assertTenantMatch(principal.tenantId, resource.resourceTenantId)) {
    return {
      allowed: false,
      reason: 'tenant_mismatch',
      policy,
    };
  }

  if (principal.role === PlatformRole.ClinicAdmin) {
    return {
      allowed: true,
      reason: 'clinic_admin_same_tenant',
      policy,
    };
  }

  if (principal.role === PlatformRole.Doctor) {
    if (
      resource.ownerDoctorId &&
      resource.ownerDoctorId !== principal.subjectId &&
      OWNER_SCOPED_KINDS.has(resource.resourceKind)
    ) {
      return {
        allowed: false,
        reason: 'doctor_not_resource_owner',
        policy,
      };
    }
    return {
      allowed: true,
      reason: 'doctor_same_tenant_owner_or_unscoped',
      policy,
    };
  }

  if (principal.role === PlatformRole.SupportOperator) {
    if (resource.resourceKind === 'support-ticket') {
      return { allowed: true, reason: 'support_ticket_same_tenant', policy };
    }
    return {
      allowed: false,
      reason: 'support_no_default_clinical_resource',
      policy,
    };
  }

  return {
    allowed: false,
    reason: 'deny_by_default',
    policy,
  };
}
