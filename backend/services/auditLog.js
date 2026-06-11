const { getPostgresModels } = require('../db/postgres.init');

async function writeAudit(userId, action, meta = {}) {
  try {
    const { AuditLogPg } = getPostgresModels();
    if (!AuditLogPg) return;
    await AuditLogPg.create({
      user_id: userId || null,
      action,
      meta: meta && typeof meta === 'object' ? meta : {}
    });
  } catch (e) {
    console.warn('[audit]', action, e.message);
  }
}

module.exports = { writeAudit };
