const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { asyncHandler } = require('../utils/asyncHandler');
const { normalizeMobile, mobilesMatch } = require('../utils/mobile');
const { isDbReady, getPostgresModels } = require('../utils/dataSource');
const { writeAudit } = require('../services/auditLog');
const { generateOtpSecretAndCode, verifyOtpCode, sendLoginOtpEmail } = require('../services/emailOtp');
const { verifyTotpToken } = require('../services/twoFactor');
const {
  issueTokenPair,
  revokeRefreshToken,
  validateStoredRefresh,
  verifyRefreshJwt,
  signAccessToken
} = require('../services/authTokens');

const router = express.Router();

const MAX_FAILED = parseInt(process.env.AUTH_MAX_FAILED_ATTEMPTS || '10', 10) || 10;
const LOCK_MINUTES = parseInt(process.env.AUTH_LOCK_MINUTES || '30', 10) || 30;
const MAX_OTP_VERIFY = parseInt(process.env.AUTH_OTP_MAX_ATTEMPTS || '5', 10) || 5;

function userResponse(userDoc) {
  const u = userDoc.get({ plain: true });
  return {
    id: String(u.id),
    name: u.name,
    mobile: u.mobile,
    email: u.email || undefined,
    role: u.role
  };
}

function isLocked(user) {
  const row = user.get({ plain: true });
  if (!row.locked_until) return false;
  return new Date(row.locked_until) > new Date();
}

async function recordPasswordFailure(user, ip) {
  const row = user.get({ plain: true });
  const attempts = (row.failed_login_attempts || 0) + 1;
  const patch = { failed_login_attempts: attempts };
  if (attempts >= MAX_FAILED) {
    const until = new Date();
    until.setMinutes(until.getMinutes() + LOCK_MINUTES);
    patch.locked_until = until;
    await writeAudit(user.id, 'login.account_locked', { ip, attempts });
  }
  await user.update(patch);
  await writeAudit(user.id, 'login.password_failed', { ip, attempts });
}

async function clearLoginFailures(user) {
  await user.update({ failed_login_attempts: 0, locked_until: null });
}

function getDefaultOtpEmail() {
  const demo = (process.env.DEMO_DOCTOR_EMAIL || '').trim();
  if (demo && demo.includes('@') && !demo.endsWith('.local')) return demo;
  const smtpUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  if (smtpUser && smtpUser.includes('@')) return smtpUser;
  if (demo && demo.includes('@')) return demo;
  return smtpUser || 'doctor@eh-arogya.local';
}

function resolveUserEmail(user) {
  const row = user.get({ plain: true });
  if (row.email && String(row.email).includes('@')) return String(row.email).trim();
  const demoEmail = getDefaultOtpEmail();
  const demoMobile = normalizeMobile(process.env.DEMO_DOCTOR_MOBILE || '9876543210');
  if (demoEmail && mobilesMatch(row.mobile, demoMobile)) return demoEmail;
  if (process.env.NODE_ENV === 'development' && row.role === 'doctor') return demoEmail;
  return null;
}

/** Ensure DB has an email for OTP; patches missing emails in dev / demo accounts. */
async function ensureOtpEmail(user) {
  let email = resolveUserEmail(user);
  if (email) {
    const row = user.get({ plain: true });
    if (!row.email || !String(row.email).includes('@')) {
      await user.update({ email });
      await user.reload();
    }
    return email;
  }
  return null;
}

function mobileLookupWhere(mobile10) {
  return {
    [Op.or]: [
      { mobile: mobile10 },
      { mobile: `+91${mobile10}` },
      { mobile: `91${mobile10}` },
      { mobile: `0${mobile10}` }
    ]
  };
}

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { mobile, password, name } = req.body || {};
    const mobileNorm = normalizeMobile(mobile);
    const pwd = password != null ? String(password) : '';
    const ip = req.ip;

    if (!mobileNorm || mobileNorm.length !== 10) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number.' });
    }
    if (!pwd || pwd.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (!isDbReady()) {
      return res.status(503).json({
        success: false,
        message: 'PostgreSQL is not ready. Run npm run db:setup and restart the server.'
      });
    }

    const { UserPg, LoginOtpPg } = getPostgresModels();
    let user = await UserPg.findOne({ where: mobileLookupWhere(mobileNorm) });

    if (!user) {
      const password_hash = await bcrypt.hash(pwd, 10);
      user = await UserPg.create({
        name: (name && String(name).trim()) || 'Doctor',
        mobile: mobileNorm,
        role: 'doctor',
        password_hash,
        email: getDefaultOtpEmail()
      });
    } else {
      if (isLocked(user)) {
        await writeAudit(user.id, 'login.blocked_locked', { ip });
        return res.status(423).json({
          success: false,
          message: `Account locked after ${MAX_FAILED} failed attempts. Try again later.`
        });
      }
      const row = user.get({ plain: true });
      if (!row.password_hash) {
        await user.update({ password_hash: await bcrypt.hash(pwd, 10) });
        await user.reload();
      } else {
        const ok = await bcrypt.compare(pwd, row.password_hash);
        if (!ok) {
          await recordPasswordFailure(user, ip);
          return res.status(401).json({ success: false, message: 'Invalid mobile or password.' });
        }
      }
    }

    if (normalizeMobile(user.get('mobile')) !== mobileNorm) {
      await user.update({ mobile: mobileNorm });
      await user.reload();
    }

    const email = await ensureOtpEmail(user);
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'No email on file for OTP. Set DEMO_DOCTOR_EMAIL in .env or add email to your account.'
      });
    }

    await clearLoginFailures(user);

    // Check if TOTP is enabled
    const row = user.get({ plain: true });
    if (row.totp_secret) {
      return res.json({
        success: true,
        requires2fa: true,
        userId: String(user.id),
        message: 'Enter the 6-digit code from your authenticator app.'
      });
    }

    const { secret, code } = generateOtpSecretAndCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await LoginOtpPg.update(
      { consumed_at: new Date() },
      { where: { user_id: user.id, consumed_at: null } }
    );

    const challenge = await LoginOtpPg.create({
      user_id: user.id,
      otp_secret: secret,
      expires_at: expiresAt,
      verify_attempts: 0
    });

    const mailResult = await sendLoginOtpEmail(email, code, user.get('name'));
    await writeAudit(user.id, 'login.otp_sent', { ip, challengeId: challenge.id, email });

    const sentToGmail = mailResult.sent;
    const devHint = mailResult.devOtp
      ? 'OTP is shown below (development mode).'
      : mailResult.devLogged
        ? 'OTP is in the server terminal (=== OTP CODE ===).'
        : '';
    return res.json({
      success: true,
      requiresOtp: true,
      requireOtp: true,
      message: sentToGmail
        ? `Verification code sent to your email. ${devHint}`.trim()
        : devHint || 'Enter the verification code.',
      challengeId: String(challenge.id),
      emailHint: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      otpDevConsole: !!mailResult.devLogged,
      devOtp: mailResult.devOtp || undefined
    });
  })
);

router.post(
  '/verify-otp',
  asyncHandler(async (req, res) => {
    const { challengeId, otp, code } = req.body || {};
    const token = String(otp || code || '').trim();
    const ip = req.ip;

    if (!challengeId || !token) {
      return res.status(400).json({ success: false, message: 'challengeId and 6-digit code are required.' });
    }
    if (!/^\d{6}$/.test(token)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 6-digit code.' });
    }
    if (!isDbReady()) {
      return res.status(503).json({ success: false, message: 'Database unavailable.' });
    }

    const { UserPg, LoginOtpPg } = getPostgresModels();
    const challenge = await LoginOtpPg.findByPk(challengeId);
    if (!challenge) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification session.' });
    }

    const ch = challenge.get({ plain: true });
    if (ch.consumed_at) {
      return res.status(400).json({ success: false, message: 'This code was already used. Sign in again.' });
    }
    if (new Date(ch.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Code expired. Sign in again.' });
    }

    const user = await UserPg.findByPk(ch.user_id);
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found.' });
    }
    if (isLocked(user)) {
      return res.status(423).json({ success: false, message: 'Account is locked.' });
    }

    const valid = verifyOtpCode(ch.otp_secret, token);
    if (!valid) {
      const attempts = ch.verify_attempts + 1;
      await challenge.update({ verify_attempts: attempts });
      await writeAudit(user.id, 'login.otp_failed', { ip, attempts });
      if (attempts >= MAX_OTP_VERIFY) {
        await challenge.update({ consumed_at: new Date() });
        return res.status(429).json({
          success: false,
          message: 'Too many wrong codes. Please sign in again.'
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid verification code.' });
    }

    await challenge.update({ consumed_at: new Date() });
    await clearLoginFailures(user);
    const { accessToken, refreshToken } = await issueTokenPair(user);
    await writeAudit(user.id, 'login.success', { ip, method: 'email_otp' });

    return res.json({
      success: true,
      message: 'Login successful',
      user: userResponse(user),
      token: accessToken,
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m'
    });
  })
);

router.post(
  '/verify-2fa',
  asyncHandler(async (req, res) => {
    const { userId, token } = req.body || {};
    const ip = req.ip;

    if (!userId || !token) {
      return res.status(400).json({ success: false, message: 'userId and 6-digit code are required.' });
    }

    if (!isDbReady()) {
      return res.status(503).json({ success: false, message: 'Database unavailable.' });
    }

    const { UserPg } = getPostgresModels();
    const user = await UserPg.findByPk(userId);

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found.' });
    }

    if (isLocked(user)) {
      return res.status(423).json({ success: false, message: 'Account is locked.' });
    }

    const row = user.get({ plain: true });
    if (!row.totp_secret) {
      return res.status(400).json({ success: false, message: '2FA not enabled for this account.' });
    }

    const valid = verifyTotpToken(row.totp_secret, token);
    if (!valid) {
      await recordPasswordFailure(user, ip);
      return res.status(401).json({ success: false, message: 'Invalid 2FA code.' });
    }

    await clearLoginFailures(user);
    const { accessToken, refreshToken } = await issueTokenPair(user);
    await writeAudit(user.id, 'login.success', { ip, method: 'totp_2fa' });

    return res.json({
      success: true,
      message: 'Login successful',
      user: userResponse(user),
      token: accessToken,
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m'
    });
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const raw =
      req.body?.refreshToken ||
      req.cookies?.eh_refresh ||
      (req.headers['x-refresh-token'] && String(req.headers['x-refresh-token'])) ||
      '';

    if (!raw) {
      return res.status(400).json({ success: false, message: 'refreshToken required.' });
    }

    try {
      verifyRefreshJwt(raw);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const user = await validateStoredRefresh(raw);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Refresh token revoked or expired.' });
    }

    const accessToken = signAccessToken(user);
    await writeAudit(user.id, 'token.refresh', { ip: req.ip });

    return res.json({
      success: true,
      token: accessToken,
      accessToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m'
    });
  })
);

/**
 * POST /api/auth/dev-login — development only
 * Skips OTP; returns fresh tokens for demo doctor (9876543210 / demo123).
 */
router.post(
  '/dev-login',
  asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_LOGIN !== '1') {
      return res.status(404).json({ success: false, message: 'Not available.' });
    }
    if (!isDbReady()) {
      return res.status(503).json({ success: false, message: 'Database unavailable.' });
    }

    const demoMobile = normalizeMobile(process.env.DEMO_DOCTOR_MOBILE || '9876543210');
    const demoPass = String(process.env.DEMO_DOCTOR_PASSWORD || 'demo123');

    const { UserPg } = getPostgresModels();
    let user = await UserPg.findOne({ where: mobileLookupWhere(demoMobile) });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Demo user not found. Run: npm run seed:postgres'
      });
    }

    const row = user.get({ plain: true });
    if (!row.password_hash) {
      await user.update({ password_hash: await bcrypt.hash(demoPass, 10) });
      await user.reload();
    } else {
      const ok = await bcrypt.compare(demoPass, row.password_hash);
      if (!ok) {
        await user.update({ password_hash: await bcrypt.hash(demoPass, 10) });
        await user.reload();
      }
    }

    // Demo mobile = clinic doctor (dashboard), never platform admin
    const plain = user.get({ plain: true });
    if (normalizeMobile(plain.mobile) === demoMobile && plain.role !== 'doctor') {
      await user.update({ role: 'doctor' });
      await user.reload();
    }

    await clearLoginFailures(user);
    const { accessToken, refreshToken } = await issueTokenPair(user);
    await writeAudit(user.id, 'login.success', { ip: req.ip, method: 'dev_login' });

    return res.json({
      success: true,
      message: 'Dev login successful',
      user: userResponse(user),
      token: accessToken,
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m'
    });
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const raw = req.body?.refreshToken || req.cookies?.eh_refresh || '';
    if (raw) {
      await revokeRefreshToken(raw);
      try {
        const payload = verifyRefreshJwt(raw);
        await writeAudit(payload.id, 'logout', { ip: req.ip });
      } catch {
        /* ignore */
      }
    }
    res.json({ success: true, message: 'Logged out' });
  })
);

/**
 * 2FA Setup & Enable
 */
const { requireAuth } = require('../middleware/requireAuth');
const { generateTotpSecret, generateQrCode } = require('../services/twoFactor');

router.get(
  '/setup-2fa',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const secret = generateTotpSecret(user.email || user.mobile);
    const qrCode = await generateQrCode(secret.otpauth_url);

    // Store secret temporarily (or just return it for the user to verify)
    // We'll return the secret and QR code. The user must then call /enable-2fa with a valid token.
    res.json({
      success: true,
      secret: secret.base32,
      qrCode
    });
  })
);

router.post(
  '/enable-2fa',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { secret, token } = req.body;
    const user = await getPostgresModels().UserPg.findByPk(req.user.id);

    if (!secret || !token) {
      return res.status(400).json({ success: false, message: 'Secret and token are required.' });
    }

    const valid = verifyTotpToken(secret, token);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Invalid token. 2FA not enabled.' });
    }

    await user.update({ totp_secret: secret });
    await writeAudit(user.id, 'auth.2fa_enabled', { ip: req.ip });

    res.json({ success: true, message: '2FA has been enabled successfully.' });
  })
);

router.post(
  '/disable-2fa',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    const user = await getPostgresModels().UserPg.findByPk(req.user.id);

    if (!user.totp_secret) {
      return res.status(400).json({ success: false, message: '2FA is not enabled.' });
    }

    const valid = verifyTotpToken(user.totp_secret, token);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Invalid token. 2FA not disabled.' });
    }

    await user.update({ totp_secret: null });
    await writeAudit(user.id, 'auth.2fa_disabled', { ip: req.ip });

    res.json({ success: true, message: '2FA has been disabled.' });
  })
);

module.exports = router;
