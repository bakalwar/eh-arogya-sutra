import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { getPool } from '@/lib/auth/pg';

const ACCESS_EXPIRE = process.env.JWT_ACCESS_EXPIRE || '24h';
const REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';
const ACCESS_SECRET = String(process.env.JWT_SECRET || 'dev-secret').trim();
const REFRESH_SECRET = String(
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret'
).trim();

export interface AuthUserRow {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  role: string;
  must_change_password: boolean;
  password_hash: string | null;
  is_suspended: boolean;
  failed_login_attempts: number;
  locked_until: Date | null;
}

export function userResponse(row: AuthUserRow) {
  return {
    id: String(row.id),
    name: row.name,
    mobile: row.mobile,
    email: row.email || undefined,
    role: row.role,
    mustChangePassword: !!row.must_change_password,
  };
}

function hashToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload & {
    id?: string;
    role?: string;
    type?: string;
  };
}

export function signAccessToken(user: AuthUserRow) {
  return jwt.sign(
    { id: String(user.id), role: user.role || 'doctor', type: 'access' },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRE as jwt.SignOptions['expiresIn'] }
  );
}

export function signRefreshToken(user: AuthUserRow) {
  return jwt.sign(
    { id: String(user.id), role: user.role || 'doctor', type: 'refresh' },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRE as jwt.SignOptions['expiresIn'] }
  );
}

export function verifyRefreshJwt(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as jwt.JwtPayload;
}

async function storeRefreshToken(userId: string, rawRefreshToken: string) {
  const expiresAt = new Date();
  const days = parseInt(process.env.JWT_REFRESH_DAYS || '7', 10) || 7;
  expiresAt.setDate(expiresAt.getDate() + days);
  await getPool().query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hashToken(rawRefreshToken), expiresAt]
  );
}

export async function issueTokenPair(user: AuthUserRow) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await storeRefreshToken(user.id, refreshToken);
  return { accessToken, refreshToken };
}

export async function validateStoredRefresh(rawRefreshToken: string): Promise<AuthUserRow | null> {
  const pool = getPool();
  const hash = hashToken(rawRefreshToken);
  const tokenRes = await pool.query<{
    user_id: string;
    expires_at: Date;
    revoked_at: Date | null;
  }>(
    `SELECT user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1 LIMIT 1`,
    [hash]
  );
  const tokenRow = tokenRes.rows[0];
  if (!tokenRow || tokenRow.revoked_at || new Date(tokenRow.expires_at) < new Date()) return null;

  const userRes = await pool.query<AuthUserRow>(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [
    tokenRow.user_id,
  ]);
  return userRes.rows[0] || null;
}

export async function revokeRefreshToken(rawRefreshToken: string) {
  await getPool().query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`, [
    hashToken(rawRefreshToken),
  ]);
}

export { ACCESS_EXPIRE };
