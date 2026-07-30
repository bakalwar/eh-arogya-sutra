import {
  isClinicScopedRole,
  isManagementRole,
  isSuperAdminRole,
  type PlatformRoleName,
} from './roles.js';

/**
 * Identity contracts for Phase 4A session core.
 * OTP provider remains NOT_CONFIGURED — no real OTP traffic until Phase 4B owner approval.
 * Principals from live sessions use authenticationStatus = AUTHENTICATION_STATUS.
 * Test principals may still be injected only outside production.
 */
export const AUTHENTICATION_STATUS = 'PHASE_4A_SESSION_CORE' as const;
export const AUTHORIZATION_POLICY_STATUS = 'PHASE_2A_ACTIVE' as const;
export const MANAGEMENT_POLICY_STATUS = 'PHASE_2A_M_ACTIVE' as const;

export type IdentityPrincipal = {
  /** Stable subject identifier (synthetic in policy tests). */
  subjectId: string;
  role: PlatformRoleName;
  /** Clinic/tenant scope. Null for Super Admin and Management platform-scope identities. */
  tenantId: string | null;
  sessionId: string;
  /** Never claim live authentication in Phase 2A/2A-M. */
  authenticationStatus: typeof AUTHENTICATION_STATUS;
  /**
   * Test-only flag. Must never be accepted when NODE_ENV/EHAS2_NODE_ENV is production.
   */
  isTestPrincipal?: boolean;
};

export type IdentitySessionClaims = {
  subjectId: string;
  role: PlatformRoleName;
  tenantId: string | null;
  sessionId: string;
  issuedAt: string;
  expiresAt: string;
};

/** Build a principal for policy tests / future auth adapters — does not authenticate. */
export function createPrincipalForPolicyEvaluation(input: {
  subjectId: string;
  role: PlatformRoleName;
  tenantId: string | null;
  sessionId?: string;
  isTestPrincipal?: boolean;
}): IdentityPrincipal {
  if (isClinicScopedRole(input.role)) {
    if (!input.tenantId?.trim()) {
      throw new Error('Clinic-scoped principals require a tenantId');
    }
  }
  if (isManagementRole(input.role) || isSuperAdminRole(input.role)) {
    // Platform-scope identities may use null tenantId.
  }
  return {
    subjectId: input.subjectId,
    role: input.role,
    tenantId: input.tenantId,
    sessionId: input.sessionId ?? `sess-policy-${input.subjectId}`,
    authenticationStatus: AUTHENTICATION_STATUS,
    isTestPrincipal: input.isTestPrincipal === true,
  };
}
