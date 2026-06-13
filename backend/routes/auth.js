const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { asyncHandler } = require('../utils/asyncHandler');
const { normalizeMobile } = require('../utils/mobile');
const { isDbReady, getPostgresModels } = require('../utils/dataSource');
const { writeAudit } = require('../services/auditLog');
const { requireAuth } = require('../middleware/requireAuth');
const {
  issueTokenPair,
  revokeRefreshToken,
  validateStoredRefresh,
  verifyRefreshJwt,
  signAccessToken
} = require('../services/authTokens');

const router = express.Router();

const MAX_FAILED = parseInt(process.env.AUTH_MAX_FAILED_ATTEMPTS || '5', 10) || 5;
const LOCK_MINUTES = parseInt(process.env.AUTH_LOCK_MINUTES || '15', 10) || 15;

function userResponse(userDoc) {
  const u = userDoc.get({ plain: true });
  return {
    id: String(u.id),
    name: u.name,
    mobile: u.mobile,
    email: u.email || undefined,
    role: u.role,
    mustChangePassword: !!u.must_change_password
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

async function completeLogin(user, ip) {
  await clearLoginFailures(user);
  await user.update({ last_login_at: new Date() });
  await user.reload();
  const { accessToken, refreshToken } = await issueTokenPair(user);
  await writeAudit(user.id, 'login.success', { ip, method: 'password' });
  return { accessToken, refreshToken };
}

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { mobile, password } = req.body || {};
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

    const { UserPg } = getPostgresModels();
    const user = await UserPg.findOne({ where: mobileLookupWhere(mobileNorm) });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number or password'
      });
    }

    if (user.get('is_suspended')) {
      return res.status(403).json({ success: false, message: 'Account is blocked. Contact admin.' });
    }

    if (isLocked(user)) {
      await writeAudit(user.id, 'login.blocked_locked', { ip });
      return res.status(423).json({
        success: false,
        message: `Account locked after ${MAX_FAILED} failed attempts. Try again in ${LOCK_MINUTES} minutes.`
      });
    }

    const row = user.get({ plain: true });
    if (!row.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Password not set. Contact admin for a reset.'
      });
    }

    const ok = await bcrypt.compare(pwd, row.password_hash);
    if (!ok) {
      await recordPasswordFailure(user, ip);
      const attemptsAfter = (row.failed_login_attempts || 0) + 1;
      if (attemptsAfter >= MAX_FAILED) {
        return res.status(423).json({
          success: false,
          message: `Account locked for ${LOCK_MINUTES} minutes after too many failed attempts.`
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid mobile number or password'
      });
    }

    const { accessToken, refreshToken } = await completeLogin(user, ip);
    const u = userResponse(user);

    return res.json({
      success: true,
      message: u.mustChangePassword ? 'Please set a new password to continue.' : 'Login successful',
      user: u,
      token: accessToken,
      accessToken,
      refreshToken,
      mustChangePassword: u.mustChangePassword,
      expiresIn: process.env.JWT_ACCESS_EXPIRE || '24h'
    });
  })
);

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const { mobile, full_name, fullName, password, confirmPassword } = req.body || {};
    const mobileNorm = normalizeMobile(mobile);
    const name = String(full_name || fullName || '').trim();
    const pwd = password != null ? String(password) : '';
    const confirm = confirmPassword != null ? String(confirmPassword) : '';
    const ip = req.ip;

    if (!mobileNorm || mobileNorm.length !== 10) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit mobile number.' });
    }
    if (!name) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (!pwd || pwd.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (pwd !== confirm) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    if (!isDbReady()) {
      return res.status(503).json({
        success: false,
        message: 'PostgreSQL is not ready. Run npm run db:setup and restart the server.'
      });
    }

    const { UserPg } = getPostgresModels();
    const existing = await UserPg.findOne({ where: mobileLookupWhere(mobileNorm) });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This mobile number is already registered. Please login.'
      });
    }

    const password_hash = await bcrypt.hash(pwd, 10);
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 14);

    const user = await UserPg.create({
      name,
      full_name: name,
      mobile: mobileNorm,
      role: 'doctor',
      password_hash,
      must_change_password: false,
      subscription_status: 'trial',
      trial_ends_at: trialEnds,
      profile_completed: false
    });

    const { accessToken, refreshToken } = await completeLogin(user, ip);
    await writeAudit(user.id, 'signup.success', { ip, method: 'password' });
    const u = userResponse(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: u,
      token: accessToken,
      accessToken,
      refreshToken,
      mustChangePassword: false,
      expiresIn: process.env.JWT_ACCESS_EXPIRE || '24h'
    });
  })
);

router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    const pwd = String(newPassword || '');
    if (pwd.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const { UserPg } = getPostgresModels();
    const user = await UserPg.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const row = user.get({ plain: true });
    if (!row.must_change_password) {
      const cur = String(currentPassword || '');
      if (!cur) {
        return res.status(400).json({ success: false, message: 'Current password is required.' });
      }
      const ok = await bcrypt.compare(cur, row.password_hash);
      if (!ok) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
    }

    const password_hash = await bcrypt.hash(pwd, 10);
    await user.update({ password_hash, must_change_password: false });
    await writeAudit(user.id, 'auth.password_changed', { ip: req.ip });

    return res.json({
      success: true,
      message: 'Password updated successfully.',
      user: userResponse(user)
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
      expiresIn: process.env.JWT_ACCESS_EXPIRE || '24h'
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

module.exports = router;
