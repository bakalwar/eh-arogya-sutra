const crypto = require('crypto');

const HMAC_SECRET = process.env.HMAC_SECRET || 'eh-arogya-sutra-hmac-secret-2026';

/**
 * Middleware to verify HMAC signature of the request.
 * Header: x-api-signature
 */
function verifyHmacSignature(req, res, next) {
  // Skip HMAC check in development if disabled
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_HMAC === '1') {
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
