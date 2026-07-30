import { assertTenantContext, type TenantContext } from '../tenantContext.js';
import { withTenantTransaction } from '../pool.js';
import { PgPatientRepository, PgAuditEventRepository } from '../repositories/postgres.js';
import { PgIdempotencyRepository } from '../repositories/idempotency.js';
import type {
  PatientCreateInput,
  PatientRecord,
  PatientStatus,
  PatientUpdateInput,
} from '../repositories/types.js';
import { ResourceNotFoundError, ValidationError } from '../domainErrors.js';
import {
  assertOptionalDateOfBirth,
  assertOptionalMaskedContact,
  assertUuid,
  clampPageLimit,
  hashPayload,
  normalizeDisplayName,
} from '../validation.js';
import { sanitizeDatabaseError } from '../errors.js';

const patients = new PgPatientRepository();
const audit = new PgAuditEventRepository();
const idempotency = new PgIdempotencyRepository();

function validateCreate(input: PatientCreateInput): PatientCreateInput {
  return {
    displayName: normalizeDisplayName(input.displayName),
    dateOfBirth: assertOptionalDateOfBirth(input.dateOfBirth),
    sexAtBirth: input.sexAtBirth?.trim() || null,
    phoneMasked: assertOptionalMaskedContact(input.phoneMasked, 'phoneMasked'),
    emailMasked: assertOptionalMaskedContact(input.emailMasked, 'emailMasked'),
  };
}

function rejectProtectedFields(raw: Record<string, unknown>): void {
  const forbidden = [
    'organizationId',
    'clinicId',
    'id',
    'publicId',
    'createdByActorId',
    'updatedByActorId',
    'status',
  ];
  for (const key of forbidden) {
    if (Object.prototype.hasOwnProperty.call(raw, key)) {
      throw new ValidationError(`Protected field not allowed: ${key}`);
    }
  }
}

export class PatientService {
  async create(
    tenant: TenantContext,
    input: PatientCreateInput,
    opts: { idempotencyKey?: string } = {},
    env: Record<string, string | undefined> = process.env,
  ): Promise<PatientRecord> {
    assertTenantContext(tenant);
    const validated = validateCreate(input);
    const requestHash = hashPayload(validated);
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const existing = await idempotency.resolveOrThrow(
          tenant,
          tx,
          'patient.create',
          opts.idempotencyKey,
          requestHash,
        );
        if (existing) {
          const found = await patients.findById(tenant, tx, existing.resourceId);
          if (!found) throw new ResourceNotFoundError();
          return found;
        }
        const created = await patients.create(tenant, tx, validated);
        if (opts.idempotencyKey) {
          await idempotency.insert(tenant, tx, {
            operation: 'patient.create',
            key: opts.idempotencyKey,
            requestHash,
            resourceType: 'patient',
            resourceId: created.id,
          });
        }
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'patient_created',
          resourceType: 'patient',
          resourceId: created.id,
          outcome: 'SUCCESS',
          metadata: { status: created.status },
        });
        return created;
      },
      env,
    );
  }

  async getById(
    tenant: TenantContext,
    patientId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<PatientRecord> {
    assertTenantContext(tenant);
    assertUuid(patientId, 'patientId');
    const found = await withTenantTransaction(
      tenant,
      async (tx) => patients.findById(tenant, tx, patientId),
      env,
    );
    if (!found) throw new ResourceNotFoundError();
    return found;
  }

  async list(
    tenant: TenantContext,
    opts: {
      cursor?: string;
      limit?: number;
      status?: PatientStatus;
      displayNamePrefix?: string;
    } = {},
    env: Record<string, string | undefined> = process.env,
  ): Promise<{ items: PatientRecord[]; nextCursor: string | null }> {
    assertTenantContext(tenant);
    const limit = clampPageLimit(opts.limit);
    if (opts.cursor) assertUuid(opts.cursor, 'cursor');
    if (opts.displayNamePrefix && opts.displayNamePrefix.length > 64) {
      throw new ValidationError('displayNamePrefix too long');
    }
    return withTenantTransaction(
      tenant,
      async (tx) =>
        patients.listByClinic(tenant, tx, {
          ...opts,
          limit,
        }),
      env,
    );
  }

  async update(
    tenant: TenantContext,
    patientId: string,
    raw: PatientUpdateInput & Record<string, unknown>,
    opts: { expectedUpdatedAt?: string } = {},
    env: Record<string, string | undefined> = process.env,
  ): Promise<PatientRecord> {
    assertTenantContext(tenant);
    assertUuid(patientId, 'patientId');
    rejectProtectedFields(raw);
    const input: PatientUpdateInput = {};
    if (Object.prototype.hasOwnProperty.call(raw, 'displayName')) {
      input.displayName = normalizeDisplayName(String(raw.displayName));
    }
    if (Object.prototype.hasOwnProperty.call(raw, 'dateOfBirth')) {
      input.dateOfBirth = assertOptionalDateOfBirth(raw.dateOfBirth as string | null);
    }
    if (Object.prototype.hasOwnProperty.call(raw, 'sexAtBirth')) {
      input.sexAtBirth = (raw.sexAtBirth as string | null)?.toString().trim() || null;
    }
    if (Object.prototype.hasOwnProperty.call(raw, 'phoneMasked')) {
      input.phoneMasked = assertOptionalMaskedContact(
        raw.phoneMasked as string | null,
        'phoneMasked',
      );
    }
    if (Object.prototype.hasOwnProperty.call(raw, 'emailMasked')) {
      input.emailMasked = assertOptionalMaskedContact(
        raw.emailMasked as string | null,
        'emailMasked',
      );
    }
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const updated = await patients.updateAllowedFields(
          tenant,
          tx,
          patientId,
          input,
          opts.expectedUpdatedAt,
        );
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'patient_updated',
          resourceType: 'patient',
          resourceId: updated.id,
          outcome: 'SUCCESS',
          metadata: { fields: Object.keys(input) },
        });
        return updated;
      },
      env,
    );
  }

  async archive(
    tenant: TenantContext,
    patientId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<PatientRecord> {
    assertTenantContext(tenant);
    assertUuid(patientId, 'patientId');
    return withTenantTransaction(
      tenant,
      async (tx) => {
        const archived = await patients.archive(tenant, tx, patientId);
        await audit.append(tx, {
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          actorId: tenant.actorId,
          actorRole: tenant.actorRole,
          eventType: 'patient_archived',
          resourceType: 'patient',
          resourceId: archived.id,
          outcome: 'SUCCESS',
          metadata: { status: archived.status },
        });
        return archived;
      },
      env,
    );
  }

  safeError(err: unknown): { code: string; message: string } {
    if (err instanceof ResourceNotFoundError) return { code: err.code, message: err.message };
    if (err instanceof ValidationError) return { code: err.code, message: err.message };
    return sanitizeDatabaseError(err);
  }
}

export const patientService = new PatientService();
