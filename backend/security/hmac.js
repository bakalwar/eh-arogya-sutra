const crypto = require('crypto');
const { verifyAccessToken } = require('../services/authTokens');

const HMAC_SECRET = process.env.HMAC_SECRET || 'eh-arogya-sutra-hmac-secret-2026';

/**
 * Middleware to verify HMAC signature of the request.
 * Header: x-api-signature
 *
 * Browser clients use JWT (Authorization: Bearer) — HMAC is for server-to-server only.
 */
function verifyHmacSignature(req, res, next) {
  if (process.env.DISABLE_HMAC === '1') {
    return next();
  }

  const authHeader = String(req.headers.authorization || '');
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      const payload = verifyAccessToken(token);
      if (!payload.type || payload.type === 'access') {
        req.user = req.user || { id: payload.id, role: payload.role };
        return next();
      }
    } catch {
      /* fall through to HMAC or 401 below */
    }
  }

  const signature = req.headers['x-api-signature'];
  if (!signature) {
    return res.status(401).json({ success: false, message: 'Missing API signature' });
  }

  const payload = JSON.stringify(req.body || {});
  const expectedSignature = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ success: false, message: 'Invalid API signature' });
  }

  next();
}

module.exports = {
  verifyHmacSignature
};
