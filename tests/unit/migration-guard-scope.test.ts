import { beforeEach, describe, expect, it, vi } from 'vitest';

const withAdminClientMock = vi.fn();

vi.mock('../../packages/database/src/pool.js', () => ({
  withAdminClient: (...args: unknown[]) => withAdminClientMock(...args),
}));

const assertGuardMock = vi.fn();

vi.mock('../../packages/database/src/destructiveTestDbGuard.js', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../packages/database/src/destructiveTestDbGuard.js')>();
  return {
    ...actual,
    assertDestructiveTestDatabaseOperationAllowed: (env?: Record<string, string | undefined>) => {
      assertGuardMock(env);
      return actual.assertDestructiveTestDatabaseOperationAllowed(env);
    },
  };
});

import { migrateUp, resetDatabaseSchema } from '../../packages/database/src/migrate.ts';
import {
  DestructiveTestDatabaseGuardError,
  assertDestructiveTestDatabaseOperationAllowed,
} from '../../packages/database/src/destructiveTestDbGuard.ts';

function prodLikeEnv(): Record<string, string | undefined> {
  const scheme = ['postgre', 'sql'].join('');
  return {
    EHAS2_NODE_ENV: 'production',
    NODE_ENV: 'production',
    EHAS2_DATABASE_SSL_MODE: 'require',
    EHAS2_DATABASE_URL: `${scheme}://app_user:SuperSecretP@ssw0rd!@db.prod.example.rds.amazonaws.com:5432/clinic_production`,
  };
}

function isolatedResetEnv(): Record<string, string | undefined> {
  const scheme = ['postgre', 'sql'].join('');
  return {
    EHAS2_NODE_ENV: 'test',
    NODE_ENV: 'test',
    EHAS2_ALLOW_DESTRUCTIVE_TEST_DB_RESET: 'true',
    EHAS2_DATABASE_SSL_MODE: 'disable',
    EHAS2_DATABASE_URL: `${scheme}://ehas2@127.0.0.1:55432/ehas2_phase3a_test`,
  };
}

describe('migration guard scope', () => {
  beforeEach(() => {
    withAdminClientMock.mockReset();
    assertGuardMock.mockClear();
    withAdminClientMock.mockImplementation(async (fn: (q: unknown) => Promise<unknown>) => {
      const query = async () => ({ rows: [], rowCount: 0 });
      return fn(query);
    });
  });

  it('blocks unsafe resetDatabaseSchema before any DB call', async () => {
    await expect(resetDatabaseSchema(prodLikeEnv())).rejects.toBeInstanceOf(
      DestructiveTestDatabaseGuardError,
    );
    expect(withAdminClientMock).not.toHaveBeenCalled();
  });

  it('allows allowlisted reset to reach withAdminClient', async () => {
    await resetDatabaseSchema(isolatedResetEnv());
    expect(assertGuardMock).toHaveBeenCalled();
    expect(withAdminClientMock).toHaveBeenCalledTimes(1);
  });

  it('does not invoke destructive guard for normal migrateUp', async () => {
    const env = prodLikeEnv();
    delete env.EHAS2_ALLOW_DESTRUCTIVE_TEST_DB_RESET;
    await expect(migrateUp(env)).resolves.toMatchObject({ applied: expect.any(Array) });
    expect(assertGuardMock).not.toHaveBeenCalled();
    expect(withAdminClientMock).toHaveBeenCalled();
  });

  it('does not require destructive opt-in for migrateUp', async () => {
    const env = {
      EHAS2_NODE_ENV: 'test',
      NODE_ENV: 'test',
      EHAS2_DATABASE_SSL_MODE: 'disable',
      EHAS2_DATABASE_URL: `${['postgre', 'sql'].join('')}://ehas2@127.0.0.1:55432/ehas2_phase3a_test`,
    };
    await expect(migrateUp(env)).resolves.toMatchObject({ applied: expect.any(Array) });
    expect(assertGuardMock).not.toHaveBeenCalled();
  });

  it('rejects production URL for test reset via guard', () => {
    expect(() => assertDestructiveTestDatabaseOperationAllowed(prodLikeEnv())).toThrow(
      DestructiveTestDatabaseGuardError,
    );
  });

  it('guard errors do not expose password or full URL', () => {
    const env = prodLikeEnv();
    env.EHAS2_NODE_ENV = 'test';
    env.NODE_ENV = 'test';
    env.EHAS2_ALLOW_DESTRUCTIVE_TEST_DB_RESET = 'true';
    env.EHAS2_DATABASE_SSL_MODE = 'disable';
    try {
      assertDestructiveTestDatabaseOperationAllowed(env);
      expect.unreachable('should throw');
    } catch (e) {
      const err = e as DestructiveTestDatabaseGuardError;
      const blob = `${err.message}|${err.reason}|${err.stack ?? ''}`;
      expect(blob).not.toMatch(/SuperSecretP@ssw0rd/i);
      expect(blob).not.toMatch(/clinic_production/);
      expect(blob).not.toMatch(/db\.prod\.example/);
    }
  });
});
