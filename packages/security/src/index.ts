import { FoundationStatus } from '@ehas2/shared';
import type { HighRiskActionRequest, SecurityEvent } from '@ehas2/ops-contracts';

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
} as const;

export const SECURITY_PACKAGE_STATUS = 'NOT_IMPLEMENTED' as const;

/** Platform roles — least privilege; Super Admin is a separate control-plane identity. */
export const PlatformRole = {
  Doctor: 'Doctor',
  ClinicAdmin: 'ClinicAdmin',
  SupportOperator: 'SupportOperator',
  SecurityAnalyst: 'SecurityAnalyst',
  OperationsAdmin: 'OperationsAdmin',
  SuperAdmin: 'SuperAdmin',
  BreakGlassSuperAdmin: 'BreakGlassSuperAdmin',
} as const;

export type PlatformRoleName = (typeof PlatformRole)[keyof typeof PlatformRole];

export type AuthzDecision = {
  allowed: boolean;
  reason: string;
  policy: string;
};

const SUPER_ADMIN_ROLES: ReadonlySet<PlatformRoleName> = new Set([
  PlatformRole.SuperAdmin,
  PlatformRole.BreakGlassSuperAdmin,
]);

/**
 * Deny-by-default Super Admin policy check (foundation only).
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
 * Super Admin authentication — NOT live in Phase 1A-H.
 * Forbidden: hardcoded passwords, default credentials, bypass query params, shared doctor sessions.
 */
export class SuperAdminAuthService {
  static readonly status = FoundationStatus.NOT_IMPLEMENTED;

  static authenticate(_input: unknown): never {
    const err = new Error('SuperAdminAuthService: NOT_IMPLEMENTED (Phase 2+)');
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

export { SENSITIVE_FIELD_KEYS };
