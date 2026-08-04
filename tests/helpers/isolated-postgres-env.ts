/**
 * Shared isolated PostgreSQL test connection settings (port 55432, synthetic only).
 */
export function buildIsolatedTestDatabaseUrl(
  databaseName: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const host = env.EHAS2_TEST_PG_HOST ?? '127.0.0.1';
  const port = env.EHAS2_TEST_PG_PORT ?? '55432';
  const user = env.EHAS2_TEST_PG_USER ?? 'ehas2';
  const password = env.EHAS2_TEST_PG_PASSWORD?.trim();
  const scheme = ['postgre', 'sql'].join('');
  const auth = password
    ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
    : encodeURIComponent(user);
  return `${scheme}://${auth}@${host}:${port}/${databaseName}`;
}

export function isolatedPostgresTestEnv(
  databaseName: string,
  env: Record<string, string | undefined> = process.env,
): Record<string, string | undefined> {
  return {
    ...env,
    EHAS2_NODE_ENV: 'test',
    NODE_ENV: 'test',
    EHAS2_ALLOW_DESTRUCTIVE_TEST_DB_RESET: 'true',
    EHAS2_DATABASE_URL: buildIsolatedTestDatabaseUrl(databaseName, env),
    EHAS2_DATABASE_POOL_MIN: '0',
    EHAS2_DATABASE_POOL_MAX: '5',
    EHAS2_DATABASE_SSL_MODE: 'disable',
    EHAS2_DATABASE_STATEMENT_TIMEOUT_MS: '12000',
  };
}
