const { isPostgresEnabled, sequelize } = require('../db/sequelize');
const { getPostgresHealth, getPostgresModels } = require('../db/postgres.init');

/**
 * Route requires DATABASE_URL and live Sequelize connection (models loaded at boot).
 */
function requirePostgresApi(req, res, next) {
  if (!isPostgresEnabled() || !sequelize) {
    return res.status(503).json({
      success: false,
      message: 'PostgreSQL is not configured. Set DATABASE_URL and restart the server.'
    });
  }
  const h = getPostgresHealth();
  if (!h.connected || Object.keys(getPostgresModels()).length === 0) {
    return res.status(503).json({
      success: false,
      message: 'PostgreSQL is not connected. Check DATABASE_URL and ensure the server finished starting.'
    });
  }
  next();
}

module.exports = { requirePostgresApi, requirePostgres: requirePostgresApi };
