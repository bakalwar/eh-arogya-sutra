const { verifyAccessToken } = require('../services/authTokens');

function resolveProxySecret() {
  return String(process.env.EH_INTERNAL_PROXY_SECRET || process.env.JWT_SECRET || '').trim();
}

/** Vercel Next.js validates JWT locally, then forwards trusted user headers. */
function tryTrustedProxyAuth(req) {
  const secret = resolveProxySecret();
  const incoming = String(req.headers['x-eh-proxy-secret'] || '').trim();
  const userId = String(req.headers['x-eh-user-id'] || '').trim();
  const userRole = String(req.headers['x-eh-user-role'] || 'doctor').trim();
  if (!secret || !incoming || incoming !== secret || !userId) return null;
  return { id: userId, role: userRole || 'doctor' };
}

function requireAuth(req, res, next) {
  const proxied = tryTrustedProxyAuth(req);
  if (proxied) {
    req.user = proxied;
    return next();
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  try {
    const payload = verifyAccessToken(token);
    if (payload.type && payload.type !== 'access') {
      return res.status(401).json({ success: false, message: 'Invalid token type.' });
    }
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (e) {
    const expired = e.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      message: expired ? 'Session expired. Please sign in again.' : 'Invalid token.',
      code: expired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID'
    });
  }
}

module.exports = { requireAuth };
