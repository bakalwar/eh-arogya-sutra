const { verifyAccessToken } = require('../services/authTokens');

function requireAuth(req, res, next) {
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
