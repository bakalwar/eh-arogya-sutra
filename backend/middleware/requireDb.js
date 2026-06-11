const { isDbReady } = require('../utils/dataSource');

const DB_UNAVAILABLE_MSG =
  'PostgreSQL is not ready. Check POSTGRES_* in .env, run npm run dev, then npm run db:setup if tables are missing.';

function requireDb(req, res, next) {
  if (!isDbReady()) {
    return res.status(503).json({ success: false, message: DB_UNAVAILABLE_MSG });
  }
  next();
}

module.exports = {
  requireDb,
  requirePatientsDb: requireDb,
  requireMedicinesDb: requireDb,
  requireReportsDb: requireDb,
  requirePrescriptionsDb: requireDb,
  requireAdminDb: requireDb
};
