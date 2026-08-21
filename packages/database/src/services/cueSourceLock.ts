import { ValidationError } from '../domainErrors.js';
import type { TenantContext, TransactionContext } from '../tenantContext.js';
import { assertUuid } from '../validation.js';
import {
  isStructuredVitalSourceField,
  sortStructuredVitalFields,
  type StructuredVitalSourceField,
} from './structuredVitalSource.js';

/** Dedicated chief-complaint cue-source lock. Not F3C candidate or F3D fact identity. */
export const CUE_SOURCE_LOCK_PREFIX = 'ehas2:cue-source:v1' as const;
export const CUE_SOURCE_LOCK_FIELD_CHIEF_COMPLAINT = 'CHIEF_COMPLAINT' as const;

/** Dedicated F3C reviewed-source + extraction-candidate lifecycle lock.
 * Shared by review writers, cue/fact reviewed-source readers, and supersedeRuns.
 * Not chief-complaint or F3D fact identity. */
export const F3C_REVIEWED_CUE_SOURCE_LOCK_PREFIX = 'ehas2:f3c-reviewed-cue-source:v1' as const;

/** Dedicated structured-vital source lock domain (F3D-2D4). Not chief or F3C. */
export const STRUCTURED_VITAL_SOURCE_LOCK_PREFIX = 'ehas2:structured-vital-source:v1' as const;

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

export function f3cReviewedCueSourceLockKey(input: {
  organizationId: string;
  clinicId: string;
  candidateId: string;
}): string {
  assertUuid(input.organizationId, 'organizationId');
  assertUuid(input.clinicId, 'clinicId');
  assertUuid(input.candidateId, 'candidateId');
  return `${F3C_REVIEWED_CUE_SOURCE_LOCK_PREFIX}:${input.organizationId}:${input.clinicId}:${input.candidateId}`;
}

async function acquireHashTextExtendedXactLock(tx: TransactionContext, key: string): Promise<void> {
  try {
    await tx.query(`SELECT pg_advisory_xact_lock(hashtextextended($1::text, $2::bigint))`, [
      key,
      0,
    ]);
  } catch {
    throw new ValidationError('LOCK_UNAVAILABLE');
  }
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
  await acquireHashTextExtendedXactLock(tx, key);
}

/**
 * Shared F3C reviewed-source and candidate-lifecycle lock for:
 * review writers, C2 cue reader, F3D-1 reviewed materialize, and supersedeRuns.
 * Same key and SQL for all paths. Acquire in sorted candidate-id order when locking many.
 */
export async function lockF3cReviewedCueSource(
  tx: TransactionContext,
  tenant: TenantContext,
  candidateId: string,
): Promise<void> {
  const key = f3cReviewedCueSourceLockKey({
    organizationId: tenant.organizationId,
    clinicId: tenant.clinicId,
    candidateId,
  });
  await acquireHashTextExtendedXactLock(tx, key);
}

export function structuredVitalSourceLockKey(input: {
  organizationId: string;
  clinicId: string;
  consultationId: string;
  sourceField: StructuredVitalSourceField;
}): string {
  assertUuid(input.organizationId, 'organizationId');
  assertUuid(input.clinicId, 'clinicId');
  assertUuid(input.consultationId, 'consultationId');
  if (!isStructuredVitalSourceField(input.sourceField)) {
    throw new ValidationError('SOURCE_INELIGIBLE');
  }
  return `${STRUCTURED_VITAL_SOURCE_LOCK_PREFIX}:${input.organizationId}:${input.clinicId}:${input.consultationId}:${input.sourceField}`;
}

/**
 * Acquire transaction-scoped structured-vital source locks in sorted field order.
 * Fail closed: no session lock and no unlocked fallback.
 */
export async function lockStructuredVitalSourceFields(
  tx: TransactionContext,
  tenant: TenantContext,
  consultationId: string,
  sourceFields: readonly string[],
): Promise<StructuredVitalSourceField[]> {
  const sorted = sortStructuredVitalFields(sourceFields);
  for (const sourceField of sorted) {
    const key = structuredVitalSourceLockKey({
      organizationId: tenant.organizationId,
      clinicId: tenant.clinicId,
      consultationId,
      sourceField,
    });
    await acquireHashTextExtendedXactLock(tx, key);
  }
  return sorted;
}
