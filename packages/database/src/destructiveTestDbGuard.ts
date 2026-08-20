export class DestructiveTestDatabaseGuardError extends Error {
  readonly code = 'DESTRUCTIVE_TEST_DB_GUARD_BLOCKED' as const;
  readonly reason: DestructiveTestDatabaseGuardReason;

  constructor(reason: DestructiveTestDatabaseGuardReason, message?: string) {
    super(message ?? `DESTRUCTIVE_TEST_DB_GUARD_BLOCKED:${reason}`);
    this.name = 'DestructiveTestDatabaseGuardError';
    this.reason = reason;
  }
}

export type DestructiveTestDatabaseGuardReason =
  | 'MISSING_DATABASE_URL'
  | 'MALFORMED_DATABASE_URL'
  | 'NODE_ENV_NOT_TEST'
  | 'OPT_IN_NOT_GRANTED'
  | 'HOST_NOT_ALLOWED'
  | 'PRODUCTION_HOST_REJECTED'
  | 'PORT_NOT_ALLOWED'
  | 'PORT_5432_REJECTED'
  | 'USER_NOT_ALLOWED'
  | 'DATABASE_NOT_ALLOWLISTED'
  | 'DATABASE_SUFFIX_INVALID'
  | 'SYSTEM_DATABASE_REJECTED'
  | 'SSL_NOT_DISABLED'
  | 'CONFIG_LOAD_FAILED';

export const ISOLATED_TEST_PG_ALLOWLIST_DATABASES = [
  'ehas2_phase3a_test',
  'ehas2_phase3b_test',
  'ehas2_phase3c_test',
  'ehas2_phase3d_test',
  'ehas2_phase4a_preflight',
  'ehas2_phase_evidence_test',
  'ehas2_phase_extract_test',
  'ehas2_phase_ocr_test',
  'ehas2_phase_f3c_test',
  'ehas2_phase_f3d_test',
  'ehas2_phase_f3d2d1_test',
] as const;

export const ISOLATED_TEST_PG_ALLOWED_PORT = '55432';
export const ISOLATED_TEST_PG_ALLOWED_USER = 'ehas2';
export const ISOLATED_TEST_PG_ALLOWED_HOSTS = new Set(['127.0.0.1', 'localhost']);

const SYSTEM_DATABASES = new Set(['postgres', 'template0', 'template1']);

const PRODUCTION_HOST_SUBSTRINGS = [
  '.amazonaws.com',
  '.rds.amazonaws.com',
  '.supabase.co',
  '.neon.tech',
  '.railway.app',
  '.render.com',
  '.elephantsql.com',
  '.digitalocean.com',
  'vercel-storage.com',
  '.azure.com',
  '.googleusercontent.com',
  '.cloudsql',
] as const;

export type ParsedIsolatedTestDbTarget = {
  host: string;
  port: string;
  user: string;
  database: string;
};

export function parsePostgresTarget(urlString: string): ParsedIsolatedTestDbTarget {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new DestructiveTestDatabaseGuardError('MALFORMED_DATABASE_URL');
  }
  if (!/^postgres(?:ql)?:$/i.test(url.protocol)) {
    throw new DestructiveTestDatabaseGuardError('MALFORMED_DATABASE_URL');
  }
  const database = decodeURIComponent(url.pathname.replace(/^\//, '')).trim();
  if (!database) {
    throw new DestructiveTestDatabaseGuardError('MALFORMED_DATABASE_URL');
  }
  const host = url.hostname.trim().toLowerCase();
  const port = url.port || '5432';
  const user = decodeURIComponent(url.username || '').trim();
  if (!host || !user) {
    throw new DestructiveTestDatabaseGuardError('MALFORMED_DATABASE_URL');
  }
  return { host, port, user, database };
}

function isTestNodeEnv(env: Record<string, string | undefined>): boolean {
  const nodeEnv = (env.EHAS2_NODE_ENV ?? env.NODE_ENV ?? '').trim().toLowerCase();
  return nodeEnv === 'test';
}

function optInGranted(env: Record<string, string | undefined>): boolean {
  return env.EHAS2_ALLOW_DESTRUCTIVE_TEST_DB_RESET === 'true';
}

function sslDisabledForTest(env: Record<string, string | undefined>): boolean {
  const raw = (env.EHAS2_DATABASE_SSL_MODE ?? 'disable').trim().toLowerCase();
  return raw === 'disable';
}

function databaseSuffixOk(database: string): boolean {
  return database.includes('test') || database.includes('preflight');
}

/**
 * Fail-closed guard before test-only schema reset (DROP SCHEMA / destructive test setup).
 * Never logs connection URLs, passwords, or host-specific secrets.
 */
export function assertDestructiveTestDatabaseOperationAllowed(
  env: Record<string, string | undefined> = process.env,
): ParsedIsolatedTestDbTarget {
  if (!isTestNodeEnv(env)) {
    throw new DestructiveTestDatabaseGuardError('NODE_ENV_NOT_TEST');
  }
  if (!optInGranted(env)) {
    throw new DestructiveTestDatabaseGuardError('OPT_IN_NOT_GRANTED');
  }

  const urlRaw = env.EHAS2_DATABASE_URL?.trim();
  if (!urlRaw) {
    throw new DestructiveTestDatabaseGuardError('MISSING_DATABASE_URL');
  }
  if (!sslDisabledForTest(env)) {
    throw new DestructiveTestDatabaseGuardError('SSL_NOT_DISABLED');
  }

  const target = parsePostgresTarget(urlRaw);

  if (!ISOLATED_TEST_PG_ALLOWED_HOSTS.has(target.host)) {
    if (PRODUCTION_HOST_SUBSTRINGS.some((m) => target.host.includes(m))) {
      throw new DestructiveTestDatabaseGuardError('PRODUCTION_HOST_REJECTED');
    }
    throw new DestructiveTestDatabaseGuardError('HOST_NOT_ALLOWED');
  }

  if (target.port === '5432') {
    throw new DestructiveTestDatabaseGuardError('PORT_5432_REJECTED');
  }
  if (target.port !== ISOLATED_TEST_PG_ALLOWED_PORT) {
    throw new DestructiveTestDatabaseGuardError('PORT_NOT_ALLOWED');
  }

  if (target.user !== ISOLATED_TEST_PG_ALLOWED_USER) {
    throw new DestructiveTestDatabaseGuardError('USER_NOT_ALLOWED');
  }

  if (SYSTEM_DATABASES.has(target.database)) {
    throw new DestructiveTestDatabaseGuardError('SYSTEM_DATABASE_REJECTED');
  }

  if (!(ISOLATED_TEST_PG_ALLOWLIST_DATABASES as readonly string[]).includes(target.database)) {
    throw new DestructiveTestDatabaseGuardError('DATABASE_NOT_ALLOWLISTED');
  }

  if (!databaseSuffixOk(target.database)) {
    throw new DestructiveTestDatabaseGuardError('DATABASE_SUFFIX_INVALID');
  }

  return target;
}
