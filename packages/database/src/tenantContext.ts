import { MembershipInactiveError, TenantContextRequiredError } from './errors.js';
import { AccessDeniedError } from './domainErrors.js';

/** Trusted server-side tenant context — never accept client-supplied alone. */
export type TenantContext = {
  organizationId: string;
  clinicId: string;
  actorId: string;
  actorRole: string;
  membershipStatus: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  /** Explicit privilege flags — default false for Management/Super Admin PHI. */
  allowPatientPhi: boolean;
};

const PROFILE_PHI_DENIED_ROLES = new Set([
  'ManagementAdmin',
  'DoctorVerificationAdmin',
  'BillingAdmin',
  'SupportAdmin',
  'FinanceViewer',
  'PlatformOperationsManager',
  'ManagementReadOnlyAuditor',
  'SuperAdmin',
  'BreakGlassSuperAdmin',
  'SecurityAnalyst',
  'OperationsAdmin',
  'SupportOperator',
]);

export type TransactionContext = {
  /** Opaque queryable bound to a transaction / client. */
  query: <T = unknown>(sql: string, params?: unknown[]) => Promise<{ rows: T[]; rowCount: number }>;
};

export function assertTenantContext(
  ctx: TenantContext | null | undefined,
): asserts ctx is TenantContext {
  if (!ctx?.organizationId || !ctx.clinicId || !ctx.actorId) {
    throw new TenantContextRequiredError();
  }
  if (!ctx.allowPatientPhi) {
    throw new TenantContextRequiredError('Patient PHI access not granted for this principal');
  }
  if (ctx.membershipStatus !== 'ACTIVE') {
    throw new MembershipInactiveError();
  }
}

export function assertBackgroundJobTenant(
  ctx: TenantContext | null | undefined,
): asserts ctx is TenantContext {
  if (!ctx?.organizationId || !ctx.clinicId) {
    throw new TenantContextRequiredError('Background job requires tenant context');
  }
  if (!ctx.allowPatientPhi) {
    throw new TenantContextRequiredError('Background job lacks patient PHI grant');
  }
}

/**
 * Clinic-scoped profile access — active membership required.
 * Management / Super Admin do not receive profile PHI by default.
 * Does not imply patient PHI access.
 */
export function assertProfileAccessContext(
  ctx: TenantContext | null | undefined,
): asserts ctx is TenantContext {
  if (!ctx?.organizationId || !ctx.clinicId || !ctx.actorId) {
    throw new TenantContextRequiredError();
  }
  if (ctx.membershipStatus !== 'ACTIVE') {
    throw new MembershipInactiveError();
  }
  if (PROFILE_PHI_DENIED_ROLES.has(ctx.actorRole)) {
    throw new AccessDeniedError('Profile access denied for this principal');
  }
}

export function assertClinicAdminRole(ctx: TenantContext): void {
  assertProfileAccessContext(ctx);
  if (ctx.actorRole !== 'ClinicAdmin') {
    throw new AccessDeniedError('Clinic profile mutation requires ClinicAdmin');
  }
}
