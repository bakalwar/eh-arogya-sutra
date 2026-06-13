import { Pool } from 'pg';

let pool: Pool | null = null;

export function hasAuthDatabase(): boolean {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

export function getPool(): Pool {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not configured for auth.');
  }
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      ssl: url.includes('localhost') || url.includes('127.0.0.1') ? undefined : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}
