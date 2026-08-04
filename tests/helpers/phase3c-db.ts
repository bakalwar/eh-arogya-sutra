/**
 * Isolated Phase 3C test DB helpers (synthetic only).
 */
import { buildIsolatedTestDatabaseUrl, isolatedPostgresTestEnv } from './isolated-postgres-env.ts';

const PHASE3C_DB = 'ehas2_phase3c_test';

export function buildIsolatedTestDatabaseUrlPhase3c(
  env: Record<string, string | undefined> = process.env,
): string {
  const db = env.EHAS2_TEST_PG_DB ?? PHASE3C_DB;
  return buildIsolatedTestDatabaseUrl(db, env);
}

export function phase3cTestEnv(): Record<string, string | undefined> {
  const db = process.env.EHAS2_TEST_PG_DB ?? PHASE3C_DB;
  return isolatedPostgresTestEnv(db);
}

export async function canConnectPhase3cDb(): Promise<boolean> {
  try {
    const pg = await import('pg');
    const Client =
      pg.default?.Client ?? (pg as unknown as { Client: typeof pg.default.Client }).Client;
    const client = new Client({ connectionString: buildIsolatedTestDatabaseUrlPhase3c() });
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return true;
  } catch {
    return false;
  }
}
