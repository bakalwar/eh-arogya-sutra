import { ValidationError } from '../domainErrors.js';
import type { TenantContext, TransactionContext } from '../tenantContext.js';
import { assertUuid } from '../validation.js';

/** Dedicated chief-complaint cue-source lock. Not F3C candidate or F3D fact identity. */
export const CUE_SOURCE_LOCK_PREFIX = 'ehas2:cue-source:v1' as const;
export const CUE_SOURCE_LOCK_FIELD_CHIEF_COMPLAINT = 'CHIEF_COMPLAINT' as const;

export function chiefComplaintCueSourceLockKey(input: {
  organizationId: string;
  clinicId: string;
  consultationId: string;
}): string {
  assertUuid(input.organizationId, 'organizationId');
  assertUuid(input.clinicId, 'clinicId');
  assertUuid(input.consultationId, 'consultationId');
  return `${CUE_SOURCE_LOCK_PREFIX}:${input.organizationId}:${input.clinicId}:${input.consultationId}:${CUE_SOURCE_LOCK_FIELD_CHIEF_COMPLAINT}`;
}

/**
 * Transaction-scoped 64-bit advisory lock via parameterized hashtextextended.
 * Fail closed: no session lock and no unlocked fallback.
 */
export async function lockChiefComplaintCueSource(
  tx: TransactionContext,
  tenant: TenantContext,
  consultationId: string,
): Promise<void> {
  const key = chiefComplaintCueSourceLockKey({
    organizationId: tenant.organizationId,
    clinicId: tenant.clinicId,
    consultationId,
  });
  try {
    await tx.query(`SELECT pg_advisory_xact_lock(hashtextextended($1::text, $2::bigint))`, [
      key,
      0,
    ]);
  } catch {
    throw new ValidationError('LOCK_UNAVAILABLE');
  }
}
