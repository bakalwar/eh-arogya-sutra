/**
 * Isolated Phase 3B test DB helpers (synthetic only).
 */
import { buildIsolatedTestDatabaseUrl, isolatedPostgresTestEnv } from './isolated-postgres-env.ts';

const PHASE3B_DB = 'ehas2_phase3b_test';

export function buildIsolatedTestDatabaseUrlPhase3b(
  env: Record<string, string | undefined> = process.env,
): string {
  const db = env.EHAS2_TEST_PG_DB ?? PHASE3B_DB;
  return buildIsolatedTestDatabaseUrl(db, env);
}

export function phase3bTestEnv(): Record<string, string | undefined> {
  const db = process.env.EHAS2_TEST_PG_DB ?? PHASE3B_DB;
  return isolatedPostgresTestEnv(db);
}

export async function canConnectPhase3bDb(): Promise<boolean> {
  try {
    const pg = await import('pg');
    const Client =
      pg.default?.Client ?? (pg as unknown as { Client: typeof pg.default.Client }).Client;
    const client = new Client({ connectionString: buildIsolatedTestDatabaseUrlPhase3b() });
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return true;
  } catch {
    return false;
  }
}
