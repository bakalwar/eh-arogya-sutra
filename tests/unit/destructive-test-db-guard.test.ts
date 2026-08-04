import { describe, expect, it } from 'vitest';
import {
  assertDestructiveTestDatabaseOperationAllowed,
  DestructiveTestDatabaseGuardError,
  ISOLATED_TEST_PG_ALLOWLIST_DATABASES,
} from '../../packages/database/src/destructiveTestDbGuard.ts';

function testDbUrl(host: string, port: string, user: string, database: string): string {
  const scheme = ['postgre', 'sql'].join('');
  return `${scheme}://${user}@${host}:${port}/${database}`;
}

function baseEnv(database: string): Record<string, string | undefined> {
  return {
    EHAS2_NODE_ENV: 'test',
    NODE_ENV: 'test',
    EHAS2_ALLOW_DESTRUCTIVE_TEST_DB_RESET: 'true',
    EHAS2_DATABASE_SSL_MODE: 'disable',
    EHAS2_DATABASE_URL: testDbUrl('127.0.0.1', '55432', 'ehas2', database),
  };
}

describe('destructive test database guard', () => {
  it('allows valid isolated configuration', () => {
    for (const db of ISOLATED_TEST_PG_ALLOWLIST_DATABASES) {
      const target = assertDestructiveTestDatabaseOperationAllowed(baseEnv(db));
      expect(target.database).toBe(db);
      expect(target.port).toBe('55432');
    }
  });

  it('blocks port 5432', () => {
    const env = baseEnv('ehas2_phase3a_test');
    env.EHAS2_DATABASE_URL = testDbUrl('127.0.0.1', '5432', 'ehas2', 'ehas2_phase3a_test');
    expect(() => assertDestructiveTestDatabaseOperationAllowed(env)).toThrow(
      DestructiveTestDatabaseGuardError,
    );
    try {
      assertDestructiveTestDatabaseOperationAllowed(env);
    } catch (e) {
      expect((e as DestructiveTestDatabaseGuardError).reason).toBe('PORT_5432_REJECTED');
    }
  });

  it('blocks remote host', () => {
    const env = baseEnv('ehas2_phase3a_test');
    env.EHAS2_DATABASE_URL = testDbUrl('192.168.1.50', '55432', 'ehas2', 'ehas2_phase3a_test');
    expect(() => assertDestructiveTestDatabaseOperationAllowed(env)).toThrow(
      DestructiveTestDatabaseGuardError,
    );
    try {
      assertDestructiveTestDatabaseOperationAllowed(env);
    } catch (e) {
      expect((e as DestructiveTestDatabaseGuardError).reason).toBe('HOST_NOT_ALLOWED');
    }
  });

  it('blocks production-like hostname', () => {
    const env = baseEnv('ehas2_phase3a_test');
    env.EHAS2_DATABASE_URL = testDbUrl(
      'db.abc123.supabase.co',
      '55432',
      'ehas2',
      'ehas2_phase3a_test',
    );
    try {
      assertDestructiveTestDatabaseOperationAllowed(env);
      expect.unreachable('should throw');
    } catch (e) {
      expect((e as DestructiveTestDatabaseGuardError).reason).toBe('PRODUCTION_HOST_REJECTED');
    }
  });

  it('blocks unknown database', () => {
    const env = baseEnv('ehas2_dev_main');
    try {
      assertDestructiveTestDatabaseOperationAllowed(env);
      expect.unreachable('should throw');
    } catch (e) {
      expect((e as DestructiveTestDatabaseGuardError).reason).toBe('DATABASE_NOT_ALLOWLISTED');
    }
  });

  it('blocks postgres system database', () => {
    const env = baseEnv('postgres');
    try {
      assertDestructiveTestDatabaseOperationAllowed(env);
      expect.unreachable('should throw');
    } catch (e) {
      expect((e as DestructiveTestDatabaseGuardError).reason).toBe('SYSTEM_DATABASE_REJECTED');
    }
  });

  it('blocks missing opt-in', () => {
    const env = baseEnv('ehas2_phase3a_test');
    delete env.EHAS2_ALLOW_DESTRUCTIVE_TEST_DB_RESET;
    try {
      assertDestructiveTestDatabaseOperationAllowed(env);
      expect.unreachable('should throw');
    } catch (e) {
      expect((e as DestructiveTestDatabaseGuardError).reason).toBe('OPT_IN_NOT_GRANTED');
    }
  });

  it('blocks wrong user', () => {
    const env = baseEnv('ehas2_phase3a_test');
    env.EHAS2_DATABASE_URL = testDbUrl('127.0.0.1', '55432', 'postgres', 'ehas2_phase3a_test');
    try {
      assertDestructiveTestDatabaseOperationAllowed(env);
      expect.unreachable('should throw');
    } catch (e) {
      expect((e as DestructiveTestDatabaseGuardError).reason).toBe('USER_NOT_ALLOWED');
    }
  });

  it('blocks NODE_ENV not test', () => {
    const env = baseEnv('ehas2_phase3a_test');
    env.EHAS2_NODE_ENV = 'production';
    env.NODE_ENV = 'production';
    try {
      assertDestructiveTestDatabaseOperationAllowed(env);
      expect.unreachable('should throw');
    } catch (e) {
      expect((e as DestructiveTestDatabaseGuardError).reason).toBe('NODE_ENV_NOT_TEST');
    }
  });

  it('blocks malformed values', () => {
    const env = baseEnv('ehas2_phase3a_test');
    env.EHAS2_DATABASE_URL = 'not-a-valid-url';
    try {
      assertDestructiveTestDatabaseOperationAllowed(env);
      expect.unreachable('should throw');
    } catch (e) {
      expect((e as DestructiveTestDatabaseGuardError).reason).toBe('MALFORMED_DATABASE_URL');
    }
  });

  it('blocks SSL not disabled', () => {
    const env = baseEnv('ehas2_phase3a_test');
    env.EHAS2_DATABASE_SSL_MODE = 'require';
    try {
      assertDestructiveTestDatabaseOperationAllowed(env);
      expect.unreachable('should throw');
    } catch (e) {
      expect((e as DestructiveTestDatabaseGuardError).reason).toBe('SSL_NOT_DISABLED');
    }
  });
});
