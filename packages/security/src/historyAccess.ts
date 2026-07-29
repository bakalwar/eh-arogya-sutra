import type { IdentityPrincipal } from './identity.js';
import { evaluateAuthorization, type AuthzDecision } from './authorize.js';
import { Permission } from './permissions.js';
import { evaluateResourceOwnership } from './ownership.js';
import { isManagementRole, isSuperAdminRole } from './roles.js';

/**
 * Patient history / consultation search authorization — Phase 2A-D.
 * Client-provided tenant/doctor IDs are never trusted alone.
 */
export type TrustedHistoryQueryContext = {
  principal: IdentityPrincipal;
  /** Tenant asserted by trusted authorization context (never client-only). */
  trustedTenantId: string;
  clinicId?: string;
  patientId?: string;
  ownerDoctorId?: string;
};

export function evaluatePatientHistoryAccess(input: TrustedHistoryQueryContext): AuthzDecision {
  const { principal, trustedTenantId, ownerDoctorId } = input;

  if (isManagementRole(principal.role)) {
    return {
      allowed: false,
      reason: 'management_no_default_patient_phi',
      policy: 'patient-history-v1',
    };
  }

  if (isSuperAdminRole(principal.role)) {
    return {
      allowed: false,
      reason: 'super_admin_no_default_patient_resource_access',
      policy: 'patient-history-v1',
    };
  }

  const authz = evaluateAuthorization({
    principal,
    permission: Permission.PatientRead,
    resource: {
      resourceKind: 'patient',
      resourceTenantId: trustedTenantId,
      ownerDoctorId: ownerDoctorId ?? principal.subjectId,
    },
  });

  if (!authz.allowed) return authz;

  if (principal.tenantId !== trustedTenantId) {
    return {
      allowed: false,
      reason: 'tenant_mismatch',
      policy: 'patient-history-v1',
    };
  }

  return {
    allowed: true,
    reason: 'policy_allow',
    policy: 'patient-history-v1',
  };
}

export function evaluateCrossTenantHistoryDenied(input: {
  principal: IdentityPrincipal;
  otherTenantId: string;
  patientOwnerDoctorId: string;
}): AuthzDecision {
  return evaluateResourceOwnership(input.principal, {
    resourceKind: 'patient',
    resourceTenantId: input.otherTenantId,
    ownerDoctorId: input.patientOwnerDoctorId,
  });
}
