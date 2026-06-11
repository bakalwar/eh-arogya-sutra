const { getPostgresHealth, getPostgresModels } = require('../db/postgres.init');

/** True when Sequelize is configured and authenticated. */
function postgresLayerReady() {
  const h = getPostgresHealth();
  return !!(h.enabled && h.connected);
}

/** All API routes use PostgreSQL — no feature flags. */
function isDbReady() {
  if (!postgresLayerReady()) return false;
  const m = getPostgresModels();
  return !!(m.UserPg && m.PatientPg && m.MedicinePg);
}

module.exports = {
  postgresLayerReady,
  isDbReady,
  getPostgresModels
};
