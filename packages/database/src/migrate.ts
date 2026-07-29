import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withAdminClient } from './pool.js';

const MIGRATION_IDS = [
  '001_extensions_and_meta',
  '002_identity_tenancy',
  '003_patient_clinical',
  '004_operations',
  '005_indexes',
  '006_rls',
] as const;

export type MigrationId = (typeof MIGRATION_IDS)[number];

function migrationsDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [path.resolve(here, '../migrations'), path.resolve(here, '../../migrations')];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('migrations directory not found');
}

export function checksumFile(filePath: string): string {
  const body = fs.readFileSync(filePath);
  return createHash('sha256').update(body).digest('hex');
}

export function listMigrationFiles(direction: 'up' | 'down' = 'up'): {
  id: MigrationId;
  filePath: string;
  checksum: string;
}[] {
  const dir = migrationsDir();
  const ids = direction === 'up' ? [...MIGRATION_IDS] : [...MIGRATION_IDS].reverse();
  return ids.map((id) => {
    const filePath = path.join(dir, direction === 'up' ? `${id}.sql` : `${id}.down.sql`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing migration file: ${filePath}`);
    }
    return { id, filePath, checksum: checksumFile(filePath) };
  });
}

async function isApplied(
  query: (
    sql: string,
    params?: unknown[],
  ) => Promise<{ rows: { migration_id: string; checksum_sha256: string }[]; rowCount: number }>,
  id: string,
): Promise<{ applied: boolean; checksum?: string }> {
  try {
    const existing = await query(
      `SELECT migration_id, checksum_sha256 FROM migration_runs
       WHERE migration_id = $1 AND direction = 'up'
       LIMIT 1`,
      [id],
    );
    if (existing.rows[0]) {
      return { applied: true, checksum: existing.rows[0].checksum_sha256 };
    }
    return { applied: false };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/relation .*migration_runs.* does not exist/i.test(msg)) {
      return { applied: false };
    }
    throw err;
  }
}

export async function migrateUp(
  env: Record<string, string | undefined> = process.env,
): Promise<{ applied: string[]; skipped: string[] }> {
  const files = listMigrationFiles('up');
  const applied: string[] = [];
  const skipped: string[] = [];

  await withAdminClient(async (query) => {
    for (const file of files) {
      const state = await isApplied(query, file.id);
      if (state.applied) {
        if (state.checksum !== file.checksum) {
          throw new Error(`Migration checksum mismatch for ${file.id}`);
        }
        skipped.push(file.id);
        continue;
      }

      const sql = fs.readFileSync(file.filePath, 'utf8');
      await query('BEGIN');
      try {
        await query(sql);
        await query(
          `INSERT INTO migration_runs (migration_id, checksum_sha256, direction, integrity_result)
           VALUES ($1, $2, 'up', 'APPLIED')`,
          [file.id, file.checksum],
        );
        await query('COMMIT');
        applied.push(file.id);
      } catch (err) {
        try {
          await query('ROLLBACK');
        } catch {
          /* ignore */
        }
        throw err;
      }
    }
  }, env);

  return { applied, skipped };
}

export async function migrateDownLast(
  env: Record<string, string | undefined> = process.env,
): Promise<string | null> {
  return withAdminClient(async (query) => {
    const applied = await query<{ migration_id: string }>(
      `SELECT migration_id FROM migration_runs WHERE direction = 'up' ORDER BY applied_at DESC LIMIT 1`,
    );
    const id = applied.rows[0]?.migration_id as MigrationId | undefined;
    if (!id) return null;
    const file = listMigrationFiles('down').find((f) => f.id === id);
    if (!file) throw new Error(`No down migration for ${id}`);
    const sql = fs.readFileSync(file.filePath, 'utf8');
    await query('BEGIN');
    try {
      await query(sql);
      await query(`DELETE FROM migration_runs WHERE migration_id = $1 AND direction = 'up'`, [id]);
      await query(
        `INSERT INTO migration_runs (migration_id, checksum_sha256, direction, integrity_result)
         VALUES ($1, $2, 'down', 'ROLLED_BACK')`,
        [id, file.checksum],
      );
      await query('COMMIT');
      return id;
    } catch (err) {
      try {
        await query('ROLLBACK');
      } catch {
        /* ignore */
      }
      throw err;
    }
  }, env);
}

export async function resetDatabaseSchema(
  env: Record<string, string | undefined> = process.env,
): Promise<void> {
  await withAdminClient(async (query) => {
    await query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO public;
    `);
  }, env);
}

export function getOrderedMigrationIds(): readonly MigrationId[] {
  return MIGRATION_IDS;
}
