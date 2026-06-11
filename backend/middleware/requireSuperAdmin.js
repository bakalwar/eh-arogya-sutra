const { requireAuth } = require('./requireAuth');

function requireSuperAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required.'
      });
    }
    next();
  });
}

module.exports = { requireSuperAdmin };
