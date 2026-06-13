const crypto = require('crypto');

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

  // Browser / JWT clients — HMAC not used; requireAuth validates downstream.
  const authHeader = String(req.headers.authorization || '');
  if (authHeader.startsWith('Bearer ') && authHeader.length > 15) {
    return next();
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
