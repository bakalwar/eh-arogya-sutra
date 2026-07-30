import { PlatformRole, type PlatformRoleName } from './roles.js';
import type { AuthenticationAssuranceLevel } from './authProviders.js';

export type AuthWorkspace = 'doctor' | 'management' | 'super_admin' | 'break_glass';

/** Privileged-role stronger-authentication policies (Phase 4A). */
export function requiredAssuranceForRole(role: PlatformRoleName): AuthenticationAssuranceLevel {
  if (role === PlatformRole.SuperAdmin || role === PlatformRole.BreakGlassSuperAdmin) {
    return 'aal3_phishing_resistant_hardware';
  }
  if (
    role === PlatformRole.ManagementAdmin ||
    role === PlatformRole.DoctorVerificationAdmin ||
    role === PlatformRole.BillingAdmin ||
    role === PlatformRole.SupportAdmin ||
    role === PlatformRole.PlatformOperationsManager
  ) {
    return 'aal2_mfa_or_passkey';
  }
  return 'aal1_otp_or_password';
}

/** SMS-only login is prohibited for Super Admin / break-glass. */
export function smsOnlyLoginAllowed(role: PlatformRoleName): boolean {
  if (role === PlatformRole.SuperAdmin || role === PlatformRole.BreakGlassSuperAdmin) {
    return false;
  }
  return true;
}

export function authWorkspaceForRole(role: PlatformRoleName): AuthWorkspace {
  if (role === PlatformRole.SuperAdmin || role === PlatformRole.BreakGlassSuperAdmin) {
    return 'super_admin';
  }
  if (
    role === PlatformRole.ManagementAdmin ||
    role === PlatformRole.DoctorVerificationAdmin ||
    role === PlatformRole.BillingAdmin ||
    role === PlatformRole.SupportAdmin ||
    role === PlatformRole.FinanceViewer ||
    role === PlatformRole.PlatformOperationsManager ||
    role === PlatformRole.ManagementReadOnlyAuditor
  ) {
    return 'management';
  }
  return 'doctor';
}

export function breakGlassActivated(): false {
  return false;
}

export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const SESSION_ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000;
export const PRIVILEGED_SESSION_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const PRIVILEGED_SESSION_ABSOLUTE_TIMEOUT_MS = 4 * 60 * 60 * 1000;
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_PHONE_WINDOW_MS = 15 * 60 * 1000;
export const OTP_PHONE_MAX_REQUESTS = 5;
export const OTP_IP_WINDOW_MS = 15 * 60 * 1000;
export const OTP_IP_MAX_REQUESTS = 20;
export const ACCOUNT_LOCK_MS = 15 * 60 * 1000;
