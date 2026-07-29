import { DatabaseNotInstalledError } from './errors.js';

export type DatabaseSslMode = 'disable' | 'require' | 'verify-full';

export type DatabaseConfig = {
  url: string;
  poolMin: number;
  poolMax: number;
  sslMode: DatabaseSslMode;
  statementTimeoutMs: number;
};

const SSL_MODES: readonly DatabaseSslMode[] = ['disable', 'require', 'verify-full'];

function parsePositiveInt(raw: string | undefined, fallback: number, name: string): number {
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`Invalid ${name}`);
  }
  return n;
}

/**
 * Load validated DB config. Returns null when URL absent (readiness → DATABASE_NOT_INSTALLED).
 * Production refuses insecure SSL settings.
 */
export function loadDatabaseConfig(
  env: Record<string, string | undefined> = process.env,
): DatabaseConfig | null {
  const url = env.EHAS2_DATABASE_URL?.trim();
  if (!url) return null;

  // Never embed live URIs in source; accept only env-provided values at runtime.
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    throw new Error('EHAS2_DATABASE_URL must be a PostgreSQL connection URL');
  }

  const sslRaw = (env.EHAS2_DATABASE_SSL_MODE ?? 'disable').trim().toLowerCase();
  if (!SSL_MODES.includes(sslRaw as DatabaseSslMode)) {
    throw new Error('Invalid EHAS2_DATABASE_SSL_MODE');
  }
  const sslMode = sslRaw as DatabaseSslMode;

  const nodeEnv = env.EHAS2_NODE_ENV ?? env.NODE_ENV ?? 'development';
  if (nodeEnv === 'production' && sslMode === 'disable') {
    throw new Error('Production database configuration requires secure SSL settings');
  }

  const poolMin = parsePositiveInt(env.EHAS2_DATABASE_POOL_MIN, 0, 'EHAS2_DATABASE_POOL_MIN');
  const poolMax = parsePositiveInt(env.EHAS2_DATABASE_POOL_MAX, 10, 'EHAS2_DATABASE_POOL_MAX');
  if (poolMax < 1 || poolMin > poolMax) {
    throw new Error('Invalid database pool bounds');
  }

  const statementTimeoutMs = parsePositiveInt(
    env.EHAS2_DATABASE_STATEMENT_TIMEOUT_MS,
    30_000,
    'EHAS2_DATABASE_STATEMENT_TIMEOUT_MS',
  );

  return { url, poolMin, poolMax, sslMode, statementTimeoutMs };
}

export function requireDatabaseConfig(
  env: Record<string, string | undefined> = process.env,
): DatabaseConfig {
  const cfg = loadDatabaseConfig(env);
  if (!cfg) throw new DatabaseNotInstalledError();
  return cfg;
}

export function databaseReadinessCode(
  env: Record<string, string | undefined> = process.env,
): 'OK' | 'DATABASE_NOT_INSTALLED' {
  return loadDatabaseConfig(env) ? 'OK' : 'DATABASE_NOT_INSTALLED';
}
