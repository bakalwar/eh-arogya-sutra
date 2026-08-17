import type { TenantContext, TransactionContext } from '../tenantContext.js';
import { IdempotencyConflictError } from '../domainErrors.js';
import { runInSavepoint } from '../pool.js';

export type IdempotencyRecord = {
  resourceType: string;
  resourceId: string;
  requestHash: string;
};

export class PgIdempotencyRepository {
  async find(
    tenant: TenantContext,
    tx: TransactionContext,
    operation: string,
    key: string,
  ): Promise<IdempotencyRecord | null> {
    const r = await tx.query(
      `SELECT resource_type, resource_id, request_hash FROM idempotency_keys
       WHERE organization_id = $1 AND clinic_id = $2 AND actor_id = $3
         AND operation = $4 AND idempotency_key = $5`,
      [tenant.organizationId, tenant.clinicId, tenant.actorId, operation, key],
    );
    if (!r.rows[0]) return null;
    const row = r.rows[0] as Record<string, unknown>;
    return {
      resourceType: String(row.resource_type),
      resourceId: String(row.resource_id),
      requestHash: String(row.request_hash),
    };
  }

  async insert(
    tenant: TenantContext,
    tx: TransactionContext,
    input: {
      operation: string;
      key: string;
      requestHash: string;
      resourceType: string;
      resourceId: string;
    },
  ): Promise<void> {
    try {
      await runInSavepoint(tx, 'idempotency_insert', async () => {
        await tx.query(
          `INSERT INTO idempotency_keys (
             organization_id, clinic_id, actor_id, operation, idempotency_key,
             request_hash, resource_type, resource_id
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            tenant.organizationId,
            tenant.clinicId,
            tenant.actorId,
            input.operation,
            input.key,
            input.requestHash,
            input.resourceType,
            input.resourceId,
          ],
        );
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string } | null)?.code;
      if (code === '23505' || /unique|duplicate/i.test(msg)) {
        const existing = await this.find(tenant, tx, input.operation, input.key);
        if (!existing) throw new IdempotencyConflictError();
        if (existing.requestHash !== input.requestHash) {
          throw new IdempotencyConflictError();
        }
        return;
      }
      throw err;
    }
  }

  async resolveOrThrow(
    tenant: TenantContext,
    tx: TransactionContext,
    operation: string,
    key: string | undefined,
    requestHash: string,
  ): Promise<IdempotencyRecord | null> {
    if (!key) return null;
    const existing = await this.find(tenant, tx, operation, key);
    if (!existing) return null;
    if (existing.requestHash !== requestHash) throw new IdempotencyConflictError();
    return existing;
  }
}
