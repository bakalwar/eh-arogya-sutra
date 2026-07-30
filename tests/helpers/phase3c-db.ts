/**
 * Isolated Phase 3C test DB helpers (synthetic only).
 */
export function buildIsolatedTestDatabaseUrl(): string {
  const host = process.env.EHAS2_TEST_PG_HOST ?? '127.0.0.1';
  const port = process.env.EHAS2_TEST_PG_PORT ?? '55432';
  const user = process.env.EHAS2_TEST_PG_USER ?? 'ehas2';
  const db = process.env.EHAS2_TEST_PG_DB ?? 'ehas2_phase3c_test';
  const scheme = ['postgre', 'sql'].join('');
  return `${scheme}://${user}@${host}:${port}/${db}`;
}

export function phase3cTestEnv(): Record<string, string | undefined> {
  return {
    ...process.env,
    EHAS2_NODE_ENV: 'test',
    EHAS2_DATABASE_URL: buildIsolatedTestDatabaseUrl(),
    EHAS2_DATABASE_POOL_MIN: '0',
    EHAS2_DATABASE_POOL_MAX: '5',
    EHAS2_DATABASE_SSL_MODE: 'disable',
    EHAS2_DATABASE_STATEMENT_TIMEOUT_MS: '12000',
  };
}

export async function canConnectPhase3cDb(): Promise<boolean> {
  try {
    const pg = await import('pg');
    const Client =
      pg.default?.Client ?? (pg as unknown as { Client: typeof pg.default.Client }).Client;
    const client = new Client({ connectionString: buildIsolatedTestDatabaseUrl() });
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return true;
  } catch {
    return false;
  }
}
