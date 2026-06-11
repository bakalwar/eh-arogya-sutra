'use strict';

const { requireAuth } = require('./requireAuth');

function isAdminRole(role) {
  return role === 'admin' || role === 'super_admin';
}

/** JWT required + clinic admin or super admin */
function requireAdminRole(req, res, next) {
  requireAuth(req, res, () => {
    if (!isAdminRole(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required.'
      });
    }
    next();
  });
}

module.exports = { requireAdminRole, isAdminRole };
