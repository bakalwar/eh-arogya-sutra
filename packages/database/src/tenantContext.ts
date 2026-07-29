import { MembershipInactiveError, TenantContextRequiredError } from './errors.js';

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
