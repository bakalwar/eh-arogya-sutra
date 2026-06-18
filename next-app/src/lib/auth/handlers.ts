import bcrypt from 'bcryptjs';
import { getPool } from '@/lib/auth/pg';
import { mobileLookupValues, normalizeMobile } from '@/lib/auth/mobile';
import {
  ACCESS_EXPIRE,
  AuthUserRow,
  issueTokenPair,
  userResponse,
} from '@/lib/auth/tokens';

const MAX_FAILED = parseInt(process.env.AUTH_MAX_FAILED_ATTEMPTS || '5', 10) || 5;
const LOCK_MINUTES = parseInt(process.env.AUTH_LOCK_MINUTES || '15', 10) || 15;

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function bodyMobile(body: Record<string, unknown>) {
  return body.mobile ?? body.mobile_number ?? body.mobileNumber;
}

function bodyName(body: Record<string, unknown>) {
  return String(body.full_name || body.fullName || body.name || '').trim();
}

function bodyClinicName(body: Record<string, unknown>) {
  return String(body.clinic_name || body.clinicName || '').trim();
}

function termsAccepted(body: Record<string, unknown>) {
  const v = body.terms_accepted ?? body.termsAccepted;
  return v === true || v === 'true' || v === 1 || v === '1';
}

async function findUserByMobile(mobile10: string): Promise<AuthUserRow | null> {
  const variants = mobileLookupValues(mobile10);
  const res = await getPool().query<AuthUserRow>(
    `SELECT * FROM users WHERE mobile = ANY($1::text[]) LIMIT 1`,
    [variants]
  );
  return res.rows[0] || null;
}

function isLocked(user: AuthUserRow) {
  return !!(user.locked_until && new Date(user.locked_until) > new Date());
}

async function clearLoginFailures(userId: string) {
  await getPool().query(
    `UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1`,
    [userId]
  );
}

async function recordPasswordFailure(user: AuthUserRow) {
  const attempts = (user.failed_login_attempts || 0) + 1;
  if (attempts >= MAX_FAILED) {
    const until = new Date();
    until.setMinutes(until.getMinutes() + LOCK_MINUTES);
    await getPool().query(
      `UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3`,
      [attempts, until, user.id]
    );
    return attempts;
  }
  await getPool().query(`UPDATE users SET failed_login_attempts = $1 WHERE id = $2`, [
    attempts,
    user.id,
  ]);
  return attempts;
}

async function completeLogin(user: AuthUserRow) {
  await clearLoginFailures(user.id);
  await getPool().query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [user.id]);
  const fresh = await getPool().query<AuthUserRow>(`SELECT * FROM users WHERE id = $1`, [user.id]);
  const row = fresh.rows[0] || user;
  const { accessToken, refreshToken } = await issueTokenPair(row);
  const u = userResponse(row);
  return json({
    success: true,
    message: u.mustChangePassword ? 'Please set a new password to continue.' : 'Login successful',
    user: u,
    doctor: u,
    token: accessToken,
    accessToken,
    refreshToken,
    mustChangePassword: u.mustChangePassword,
    expiresIn: ACCESS_EXPIRE,
  });
}

export async function handleMe(userId: string) {
  const res = await getPool().query<
    AuthUserRow & { subscription_status?: string; clinic_name?: string | null }
  >(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [userId]);
  const row = res.rows[0];
  if (!row) return json({ success: false, message: 'User not found.' }, 404);
  const u = userResponse(row);
  return json({ success: true, user: u, doctor: u });
}

export async function handleSignup(body: Record<string, unknown>) {
  const mobileNorm = normalizeMobile(bodyMobile(body));
  const name = bodyName(body);
  const clinicName = bodyClinicName(body);
  const pwd = body.password != null ? String(body.password) : '';
  const confirm = body.confirmPassword != null ? String(body.confirmPassword) : pwd;

  if (!mobileNorm || mobileNorm.length !== 10) {
    return json({ success: false, message: 'Enter a valid 10-digit mobile number.' }, 400);
  }
  if (!name) return json({ success: false, message: 'Full name is required.' }, 400);
  if (!clinicName) return json({ success: false, message: 'Clinic name is required.' }, 400);
  if (!termsAccepted(body)) {
    return json({ success: false, message: 'You must accept the terms to register.' }, 400);
  }
  if (!pwd || pwd.length < 6) {
    return json({ success: false, message: 'Password must be at least 6 characters.' }, 400);
  }
  if (confirm && pwd !== confirm) return json({ success: false, message: 'Passwords do not match.' }, 400);

  const existing = await findUserByMobile(mobileNorm);
  if (existing) {
    return json(
      { success: false, message: 'This mobile number is already registered. Please login.' },
      409
    );
  }

  const password_hash = await bcrypt.hash(pwd, 10);
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 14);

  const created = await getPool().query<AuthUserRow>(
    `INSERT INTO users (
      name, full_name, mobile, clinic_name, role, password_hash, must_change_password,
      subscription_status, trial_ends_at, profile_completed
    ) VALUES ($1, $2, $3, $4, 'doctor', $5, false, 'trial', $6, false)
    RETURNING *`,
    [name, name, mobileNorm, clinicName, password_hash, trialEnds]
  );

  const user = created.rows[0];
  const { accessToken, refreshToken } = await issueTokenPair(user);
  const u = userResponse(user);

  return json(
    {
      success: true,
      message: 'Account created successfully.',
      user: u,
      doctor: u,
      token: accessToken,
      accessToken,
      refreshToken,
      mustChangePassword: false,
      expiresIn: ACCESS_EXPIRE,
    },
    201
  );
}

export async function handleLogin(body: Record<string, unknown>) {
  const mobileNorm = normalizeMobile(bodyMobile(body));
  const pwd = body.password != null ? String(body.password) : '';

  if (!mobileNorm || mobileNorm.length !== 10) {
    return json({ success: false, message: 'Enter a valid 10-digit mobile number.' }, 400);
  }
  if (!pwd || pwd.length < 6) {
    return json({ success: false, message: 'Password must be at least 6 characters.' }, 400);
  }

  const user = await findUserByMobile(mobileNorm);
  if (!user) {
    return json({ success: false, message: 'Invalid mobile number or password' }, 401);
  }
  if (user.is_suspended) {
    return json({ success: false, message: 'Account is blocked. Contact admin.' }, 403);
  }
  if (isLocked(user)) {
    return json(
      {
        success: false,
        message: `Account locked after ${MAX_FAILED} failed attempts. Try again in ${LOCK_MINUTES} minutes.`,
      },
      423
    );
  }
  if (!user.password_hash) {
    return json({ success: false, message: 'Password not set. Contact admin for a reset.' }, 401);
  }

  const ok = await bcrypt.compare(pwd, user.password_hash);
  if (!ok) {
    const attemptsAfter = await recordPasswordFailure(user);
    if (attemptsAfter >= MAX_FAILED) {
      return json(
        {
          success: false,
          message: `Account locked for ${LOCK_MINUTES} minutes after too many failed attempts.`,
        },
        423
      );
    }
    return json({ success: false, message: 'Invalid mobile number or password' }, 401);
  }

  return completeLogin(user);
}
