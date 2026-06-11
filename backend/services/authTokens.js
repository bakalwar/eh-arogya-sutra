const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getPostgresModels } = require('../db/postgres.init');

const ACCESS_EXPIRE = process.env.JWT_ACCESS_EXPIRE || '15m';
const REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';
const ACCESS_SECRET = process.env.JWT_SECRET || 'dev-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret';

function hashToken(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

function signAccessToken(user) {
  const u = user.get ? user.get({ plain: true }) : user;
  return jwt.sign(
    { id: String(u.id), role: u.role || 'doctor', type: 'access' },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRE }
  );
}

function signRefreshToken(user) {
  const u = user.get ? user.get({ plain: true }) : user;
  return jwt.sign(
    { id: String(u.id), role: u.role || 'doctor', type: 'refresh' },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRE }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshJwt(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

async function storeRefreshToken(userId, rawRefreshToken) {
  const { RefreshTokenPg } = getPostgresModels();
  const expiresAt = new Date();
  const days = parseInt(process.env.JWT_REFRESH_DAYS || '7', 10) || 7;
  expiresAt.setDate(expiresAt.getDate() + days);

  await RefreshTokenPg.create({
    user_id: userId,
    token_hash: hashToken(rawRefreshToken),
    expires_at: expiresAt
  });
}

async function revokeRefreshToken(rawRefreshToken) {
  const { RefreshTokenPg } = getPostgresModels();
  const row = await RefreshTokenPg.findOne({
    where: { token_hash: hashToken(rawRefreshToken) }
  });
  if (row && !row.revoked_at) {
    await row.update({ revoked_at: new Date() });
  }
}

async function validateStoredRefresh(rawRefreshToken) {
  const { RefreshTokenPg, UserPg } = getPostgresModels();
  const row = await RefreshTokenPg.findOne({
    where: { token_hash: hashToken(rawRefreshToken) }
  });
  if (!row) return null;
  const plain = row.get({ plain: true });
  if (plain.revoked_at) return null;
  if (new Date(plain.expires_at) < new Date()) return null;
  const user = await UserPg.findByPk(plain.user_id);
  if (!user) return null;
  return user;
}

async function issueTokenPair(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await storeRefreshToken(user.id, refreshToken);
  return { accessToken, refreshToken };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshJwt,
  issueTokenPair,
  storeRefreshToken,
  revokeRefreshToken,
  validateStoredRefresh,
  hashToken,
  ACCESS_EXPIRE,
  REFRESH_EXPIRE
};
