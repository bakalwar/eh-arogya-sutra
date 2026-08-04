/**
 * Isolated Phase 4A auth test DB helpers (synthetic labelled identities only).
 */
import { buildIsolatedTestDatabaseUrl, isolatedPostgresTestEnv } from './isolated-postgres-env.ts';

const PHASE4A_DB = 'ehas2_phase4a_preflight';

export function buildIsolatedTestDatabaseUrlPhase4a(
  env: Record<string, string | undefined> = process.env,
): string {
  const db = env.EHAS2_TEST_PG_DB ?? PHASE4A_DB;
  return buildIsolatedTestDatabaseUrl(db, env);
}

export function phase4aTestEnv(): Record<string, string | undefined> {
  const db = process.env.EHAS2_TEST_PG_DB ?? PHASE4A_DB;
  return {
    ...isolatedPostgresTestEnv(db),
    EHAS2_AUTH_PEPPER: 'EHAS2_TEST_AUTH_PEPPER_SYNTHETIC_ONLY_DO_NOT_USE_IN_PROD_32',
  };
}

export async function canConnectPhase4aDb(): Promise<boolean> {
  try {
    const pg = await import('pg');
    const Client =
      pg.default?.Client ?? (pg as unknown as { Client: typeof pg.default.Client }).Client;
    const client = new Client({ connectionString: buildIsolatedTestDatabaseUrlPhase4a() });
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return true;
  } catch {
    return false;
  }
}
