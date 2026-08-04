/**
 * Isolated Phase 3D test DB helpers (synthetic only).
 */
import { buildIsolatedTestDatabaseUrl, isolatedPostgresTestEnv } from './isolated-postgres-env.ts';

const PHASE3D_DB = 'ehas2_phase3d_test';

export function buildIsolatedTestDatabaseUrlPhase3d(
  env: Record<string, string | undefined> = process.env,
): string {
  const db = env.EHAS2_TEST_PG_DB ?? PHASE3D_DB;
  return buildIsolatedTestDatabaseUrl(db, env);
}

export function phase3dTestEnv(): Record<string, string | undefined> {
  const db = process.env.EHAS2_TEST_PG_DB ?? PHASE3D_DB;
  return isolatedPostgresTestEnv(db);
}

export async function canConnectPhase3dDb(): Promise<boolean> {
  try {
    const pg = await import('pg');
    const Client =
      pg.default?.Client ?? (pg as unknown as { Client: typeof pg.default.Client }).Client;
    const client = new Client({ connectionString: buildIsolatedTestDatabaseUrlPhase3d() });
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return true;
  } catch {
    return false;
  }
}
