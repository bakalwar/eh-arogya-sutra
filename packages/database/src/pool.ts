import pg from 'pg';
import { loadDatabaseConfig, type DatabaseConfig } from './config.js';
import { DatabaseNotInstalledError } from './errors.js';
import type { TenantContext, TransactionContext } from './tenantContext.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let boundConfig: DatabaseConfig | null = null;

function sslOption(mode: DatabaseConfig['sslMode']): boolean | { rejectUnauthorized: boolean } {
  if (mode === 'disable') return false;
  if (mode === 'require') return { rejectUnauthorized: false };
  return { rejectUnauthorized: true };
}

export function getPool(env: Record<string, string | undefined> = process.env): pg.Pool {
  const cfg = loadDatabaseConfig(env);
  if (!cfg) throw new DatabaseNotInstalledError();
  if (!pool || boundConfig?.url !== cfg.url) {
    if (pool) {
      void pool.end();
    }
    boundConfig = cfg;
    pool = new Pool({
      connectionString: cfg.url,
      min: cfg.poolMin,
      max: cfg.poolMax,
      ssl: sslOption(cfg.sslMode),
      statement_timeout: cfg.statementTimeoutMs,
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    boundConfig = null;
  }
}

export async function withTenantTransaction<T>(
  tenant: TenantContext,
  fn: (tx: TransactionContext) => Promise<T>,
  env: Record<string, string | undefined> = process.env,
): Promise<T> {
  const client = await getPool(env).connect();
  try {
    await client.query('BEGIN');
    // Use non-superuser app role so FORCE RLS cannot be bypassed by cluster superusers.
    await client.query(`SET LOCAL ROLE ehas2_app`);
    await client.query(`SELECT set_config('ehas2.tenant_id', $1, true)`, [tenant.organizationId]);
    await client.query(`SELECT set_config('ehas2.clinic_id', $1, true)`, [tenant.clinicId]);
    await client.query(`SELECT set_config('ehas2.actor_id', $1, true)`, [tenant.actorId]);
    await client.query(`SELECT set_config('ehas2.actor_role', $1, true)`, [tenant.actorRole]);
    const tx: TransactionContext = {
      query: async <R = unknown>(sql: string, params: unknown[] = []) => {
        const result = await client.query(sql, params);
        return { rows: result.rows as R[], rowCount: result.rowCount ?? 0 };
      },
    };
    const out = await fn(tx);
    await client.query('COMMIT');
    return out;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    client.release();
  }
}

/** Recover from unique violations without aborting the outer tenant transaction (25P02). */
export async function runInSavepoint<T>(
  tx: TransactionContext,
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const ident = name.replace(/[^A-Za-z0-9_]/g, '_');
  await tx.query(`SAVEPOINT ${ident}`);
  try {
    const out = await fn();
    await tx.query(`RELEASE SAVEPOINT ${ident}`);
    return out;
  } catch (err) {
    await tx.query(`ROLLBACK TO SAVEPOINT ${ident}`);
    await tx.query(`RELEASE SAVEPOINT ${ident}`);
    throw err;
  }
}

/** Admin/migrator connection without tenant GUC (schema ops only). */
export async function withAdminClient<T>(
  fn: (query: TransactionContext['query']) => Promise<T>,
  env: Record<string, string | undefined> = process.env,
): Promise<T> {
  const client = await getPool(env).connect();
  try {
    const query: TransactionContext['query'] = async <R = unknown>(
      sql: string,
      params: unknown[] = [],
    ) => {
      const result = await client.query(sql, params);
      return { rows: result.rows as R[], rowCount: result.rowCount ?? 0 };
    };
    return await fn(query);
  } finally {
    client.release();
  }
}
