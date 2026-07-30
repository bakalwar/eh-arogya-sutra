import { FoundationStatus } from '@ehas2/shared';
import type { HighRiskActionRequest, SecurityEvent } from '@ehas2/ops-contracts';

export {
  PlatformRole,
  SUPER_ADMIN_ROLES,
  MANAGEMENT_ROLES,
  isSuperAdminRole,
  isManagementRole,
  isDoctorFacingRole,
  isClinicScopedRole,
} from './roles.js';
export type { PlatformRoleName } from './roles.js';

export {
  Permission,
  ROLE_PERMISSIONS,
  permissionsForRole,
  roleHasPermission,
  roleMayAccessManagementShell,
  assertNoManagementPhiByDefault,
  assertClinicAdminNotPlatformManagement,
} from './permissions.js';
export type { PermissionName } from './permissions.js';

export {
  AUTHENTICATION_STATUS,
  AUTHORIZATION_POLICY_STATUS,
  MANAGEMENT_POLICY_STATUS,
  createPrincipalForPolicyEvaluation,
} from './identity.js';
export type { IdentityPrincipal, IdentitySessionClaims } from './identity.js';

export { createTenantContext, assertTenantMatch } from './tenant.js';
export type { TenantContext } from './tenant.js';

export { evaluateResourceOwnership } from './ownership.js';
export type { ResourceKind, ResourceOwnershipInput } from './ownership.js';

export {
  evaluateAuthorization,
  evaluateSuperAdminAccess,
  evaluateManagementShellAccess,
  doctorCannotElevateViaPayload,
  rejectClientSuppliedRoleGrant,
  rejectTestPrincipalInProduction,
  managementCannotAccessSuperAdminByDefault,
} from './authorize.js';
export type { AuthzDecision, AuthorizeRequest } from './authorize.js';

export { evaluatePatientHistoryAccess, evaluateCrossTenantHistoryDenied } from './historyAccess.js';
export type { TrustedHistoryQueryContext } from './historyAccess.js';

export {
  NotImplementedIdentityProvider,
  NotImplementedOtpProvider,
  NotImplementedPasskeyProvider,
  NotImplementedSessionStore,
  PROVIDER_OUTAGE_NO_BYPASS,
  providerIdentityIsNotAuthorizationTruth,
  authenticationRemainsNotImplemented,
  authenticationOtpProviderConfigured,
  forbiddenClientTokenStorageLocations,
  UNIVERSAL_OTP_FORBIDDEN,
  AUTH_PROVIDER_DECISION_ADR_STATUS,
  OTP_PROVIDER_STATUS as AUTH_PROVIDERS_OTP_STATUS,
} from './authProviders.js';
export type {
  IdentityProviderName,
  AuthenticationAssuranceLevel,
  ProviderAccountMapping,
  IdentityProviderChallenge,
  IdentityProvider,
  OtpProvider,
  PasskeyProvider,
  SessionStore,
  ProviderOutageBehavior,
} from './authProviders.js';

export {
  NotConfiguredOtpDeliveryProvider,
  createDefaultOtpDeliveryProvider,
  OTP_PROVIDER_STATUS,
} from './otpDelivery.js';
export type {
  OtpDeliveryProvider,
  OtpDeliveryRequest,
  OtpDeliveryResult,
  OtpDeliveryResultCode,
} from './otpDelivery.js';

export {
  requireAuthPepper,
  normalizeIndianMobile,
  hashContact,
  contactLast4,
  hashIp,
  hashUserAgent,
  generateOtpCode,
  hashOtp,
  verifyOtp,
  generateOpaqueToken,
  hashToken,
  generateCsrfToken,
  sha256Hex,
  newSalt,
} from './authCrypto.js';

export {
  requiredAssuranceForRole,
  smsOnlyLoginAllowed,
  authWorkspaceForRole,
  breakGlassActivated,
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_ABSOLUTE_TIMEOUT_MS,
  PRIVILEGED_SESSION_IDLE_TIMEOUT_MS,
  PRIVILEGED_SESSION_ABSOLUTE_TIMEOUT_MS,
  OTP_TTL_MS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_ATTEMPTS,
  OTP_PHONE_WINDOW_MS,
  OTP_PHONE_MAX_REQUESTS,
  OTP_IP_WINDOW_MS,
  OTP_IP_MAX_REQUESTS,
  ACCOUNT_LOCK_MS,
} from './authAssurance.js';
export type { AuthWorkspace } from './authAssurance.js';

export {
  SESSION_COOKIE_NAME,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  sessionCookieAttrs,
  csrfCookieAttrs,
  serializeCookie,
  clearCookie,
  parseCookies,
  originAllowed,
} from './sessionCookies.js';
export type { CookieAttrs } from './sessionCookies.js';

export {
  WorkspaceKind,
  createTrustedAuthzContext,
  switchTrustedWorkspace,
  managementNavigationVisible,
  doctorSeesFeedbackAndSupport,
  workspaceForRole,
} from './workspace.js';
export type {
  WorkspaceKindName,
  TrustedAuthzContext,
  WorkspaceSwitchAuditEvent,
  WorkspaceSwitchSink,
} from './workspace.js';

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
} as const;

/** Live OTP provider not configured; session/CSRF core is Phase 4A. */
export const SECURITY_PACKAGE_STATUS = 'PHASE_4A_AUTH_CORE' as const;

export type DoctorSafeError = {
  message: string;
  errorCode: string;
  supportId: string;
  retryGuidance?: string;
};

/** Doctor-facing errors must never include stack traces or internals. */
export function toDoctorSafeError(input: {
  errorCode: string;
  supportId: string;
  message?: string;
  retryGuidance?: string;
  stack?: string;
  internalDetail?: string;
}): DoctorSafeError {
  void input.stack;
  void input.internalDetail;
  return {
    message: input.message ?? 'Something went wrong. Please try again or contact support.',
    errorCode: input.errorCode,
    supportId: input.supportId,
    retryGuidance: input.retryGuidance,
  };
}

const SENSITIVE_FIELD_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'otp',
  'apiKey',
  'authorization',
  'patientName',
  'phone',
  'phoneNumber',
  'symptoms',
  'prescription',
  'clinicalNotes',
  'ocrText',
  'reportContents',
  'cookie',
] as const;

export type RedactionResult = {
  data: Record<string, unknown>;
  removedKeys: string[];
};

/** Removes defined sensitive fields from a shallow metadata object. */
export function redactSensitiveFields(input: Record<string, unknown>): RedactionResult {
  const data: Record<string, unknown> = {};
  const removedKeys: string[] = [];
  const banned = new Set(SENSITIVE_FIELD_KEYS.map((k) => k.toLowerCase()));
  for (const [key, value] of Object.entries(input)) {
    if (banned.has(key.toLowerCase())) {
      removedKeys.push(key);
      continue;
    }
    data[key] = value;
  }
  return { data, removedKeys };
}

export function assertHighRiskActionMetadata(req: HighRiskActionRequest): void {
  if (!req.reason.trim()) {
    throw new Error('High-risk actions require a non-empty reason');
  }
  if (!req.requestId.trim()) {
    throw new Error('High-risk actions require a requestId');
  }
  if (!req.requiresReauth || !req.requiresAudit) {
    throw new Error('High-risk actions require re-authentication and audit metadata');
  }
}

export function assertSecurityEventIdentifiers(
  event: Pick<SecurityEvent, 'eventId' | 'requestId' | 'traceId'>,
): void {
  if (!event.eventId?.trim() || !event.requestId?.trim() || !event.traceId?.trim()) {
    throw new Error('Security events require eventId, requestId, and traceId');
  }
}

/**
 * Super Admin authentication — NOT live.
 * Forbidden: hardcoded passwords, default credentials, bypass query params, shared doctor sessions.
 */
export class SuperAdminAuthService {
  static readonly status = FoundationStatus.NOT_IMPLEMENTED;

  static authenticate(_input: unknown): never {
    const err = new Error('SuperAdminAuthService: NOT_IMPLEMENTED (Phase 2+ live auth)');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }
}

/** Live monitoring / blocking must not be implied. */
export class SuperAdminMonitoringService {
  static readonly status = FoundationStatus.NOT_IMPLEMENTED;

  static getDashboard(): never {
    const err = new Error('SuperAdminMonitoringService: NOT_IMPLEMENTED (Phase 9/14)');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }
}

/** Management Admin login — NOT live (Phase 2A-M foundation only). */
export class ManagementAdminAuthService {
  static readonly status = FoundationStatus.NOT_IMPLEMENTED;

  static authenticate(_input: unknown): never {
    const err = new Error('ManagementAdminAuthService: NOT_IMPLEMENTED');
    (err as Error & { code: string }).code = 'NOT_IMPLEMENTED';
    throw err;
  }
}

export { SENSITIVE_FIELD_KEYS };
