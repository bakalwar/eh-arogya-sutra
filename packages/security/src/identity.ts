import type { PlatformRoleName } from './roles.js';

/**
 * Identity contracts for Phase 2A.
 * Authentication providers / OTP / sessions are NOT live — principals are injected only in tests
 * or future auth middleware.
 */
export const AUTHENTICATION_STATUS = 'NOT_IMPLEMENTED' as const;
export const AUTHORIZATION_POLICY_STATUS = 'PHASE_2A_ACTIVE' as const;

export type IdentityPrincipal = {
  /** Stable subject identifier (synthetic in Phase 2A). */
  subjectId: string;
  role: PlatformRoleName;
  /** Clinic/tenant scope. Null only for separate Super Admin control-plane identities. */
  tenantId: string | null;
  sessionId: string;
  /** Never claim live authentication in Phase 2A. */
  authenticationStatus: typeof AUTHENTICATION_STATUS;
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
}): IdentityPrincipal {
  if (input.role === 'Doctor' || input.role === 'ClinicAdmin') {
    if (!input.tenantId?.trim()) {
      throw new Error('Doctor-facing principals require a tenantId');
    }
  }
  return {
    subjectId: input.subjectId,
    role: input.role,
    tenantId: input.tenantId,
    sessionId: input.sessionId ?? `sess-policy-${input.subjectId}`,
    authenticationStatus: AUTHENTICATION_STATUS,
  };
}
