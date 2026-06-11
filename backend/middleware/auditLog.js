const { writeAudit } = require('../services/auditLog');

/**
 * Middleware to automatically log sensitive API actions to the audit log.
 */
function auditMiddleware(action) {
  return async (req, res, next) => {
    const userId = req.user?.id || null;
    const meta = {
      ip: req.ip,
      method: req.method,
      path: req.path,
      userAgent: req.get('user-agent'),
      body: { ...req.body }
    };

    // Remove sensitive fields from log
    if (meta.body.password) meta.body.password = '***';
    if (meta.body.token) meta.body.token = '***';
    if (meta.body.otp) meta.body.otp = '***';

    try {
      await writeAudit(userId, action, meta);
    } catch (err) {
      console.warn('[audit-middleware] failed:', err.message);
    }
    
    next();
  };
}

module.exports = {
  auditMiddleware
};
