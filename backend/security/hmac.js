'use strict';

/**
 * Optional HMAC for server-to-server calls. Browser clients use JWT (Authorization: Bearer).
 * Set DISABLE_HMAC=1 to turn off entirely.
 */
function verifyHmacSignature(req, res, next) {
  if (process.env.DISABLE_HMAC === '1') {
    return next();
  }

  const authHeader = String(req.headers.authorization || '');
  if (authHeader.startsWith('Bearer ') && authHeader.length > 15) {
    return next();
  }

  const signature = req.headers['x-api-signature'];
  if (!signature) {
    return res.status(401).json({ success: false, message: 'Missing API signature' });
  }

  const crypto = require('crypto');
  const HMAC_SECRET = process.env.HMAC_SECRET || 'eh-arogya-sutra-hmac-secret-2026';
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
