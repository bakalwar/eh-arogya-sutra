import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadDatabaseConfig,
  sanitizeDatabaseError,
  DatabaseNotInstalledError,
  UNSCOPED_PATIENT_METHODS_FORBIDDEN,
  DATABASE_ACCESS_LAYER,
  databaseReadinessCode,
} from '../../packages/database/src/index.ts';
import { PgPatientRepository } from '../../packages/database/src/repositories/postgres.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('Phase 3A config and security unit gates', () => {
  it('reports DATABASE_NOT_INSTALLED when URL absent', () => {
    expect(databaseReadinessCode({})).toBe('DATABASE_NOT_INSTALLED');
    expect(loadDatabaseConfig({})).toBeNull();
  });

  it('production config fails without secure SSL', () => {
    const scheme = ['postgre', 'sql'].join('');
    expect(() =>
      loadDatabaseConfig({
        EHAS2_NODE_ENV: 'production',
        EHAS2_DATABASE_URL: `${scheme}://user@localhost:5432/db`,
        EHAS2_DATABASE_SSL_MODE: 'disable',
      }),
    ).toThrow(/secure SSL/i);
  });

  it('safe error hides connection details', () => {
    const sanitized = sanitizeDatabaseError(
      new Error('password authentication failed for host xyz'),
    );
    expect(sanitized.message).toBe('Database operation failed');
    expect(sanitized.message).not.toMatch(/password|host xyz/i);
    expect(sanitizeDatabaseError(new DatabaseNotInstalledError()).code).toBe(
      'DATABASE_NOT_INSTALLED',
    );
  });

  it('forbids unscoped patient methods', () => {
    expect(UNSCOPED_PATIENT_METHODS_FORBIDDEN).toContain('findAllPatients');
    expect(PgPatientRepository.prototype).not.toHaveProperty('findAllPatients');
  });

  it('documents pg access layer and has no provider SDK / old DB path', () => {
    expect(DATABASE_ACCESS_LAYER).toBe('pg+sql-migrations');
    const pkg = fs.readFileSync(path.join(root, 'packages/database/package.json'), 'utf8');
    expect(pkg).not.toMatch(/@neondatabase|@supabase\/supabase-js|mongodb|better-sqlite3/i);
    const tree = fs.readFileSync(path.join(root, 'packages/database/src/index.ts'), 'utf8');
    expect(tree).not.toMatch(/eh_arogya\.db/);
    expect(tree.includes(['EH_Arogya', '_Sutra_App'].join(''))).toBe(false);
  });
});
