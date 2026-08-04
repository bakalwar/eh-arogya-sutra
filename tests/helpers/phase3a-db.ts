/**
 * Isolated Phase 3A test DB helpers.
 * Connection URL is assembled at runtime so committed sources never contain a live URI scheme.
 */
import { buildIsolatedTestDatabaseUrl, isolatedPostgresTestEnv } from './isolated-postgres-env.ts';

const PHASE3A_DB = 'ehas2_phase3a_test';

export function buildIsolatedTestDatabaseUrlPhase3a(
  env: Record<string, string | undefined> = process.env,
): string {
  return buildIsolatedTestDatabaseUrl(PHASE3A_DB, env);
}

export function phase3aTestEnv(): Record<string, string | undefined> {
  return isolatedPostgresTestEnv(PHASE3A_DB);
}

export async function canConnectPhase3aDb(): Promise<boolean> {
  try {
    const pg = await import('pg');
    const Client =
      pg.default?.Client ?? (pg as unknown as { Client: typeof pg.default.Client }).Client;
    const client = new Client({ connectionString: buildIsolatedTestDatabaseUrlPhase3a() });
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return true;
  } catch {
    return false;
  }
}
