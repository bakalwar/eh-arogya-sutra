/**
 * Apply database/schema.sql (+ migrations) to PostgreSQL from .env POSTGRES_*.
 * Usage: npm run db:schema
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });

const { sequelize, isPostgresEnabled } = require('../backend/db/sequelize');
const { initModels } = require('../backend/models/postgres');
const { ensurePostgresReady, applySchemaFiles, usersTableExists } = require('./pgBootstrap');

async function main() {
  if (!isPostgresEnabled() || !sequelize) {
    console.error('PostgreSQL not configured. Set POSTGRES_* in .env and ensure the server is running.');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    console.log(`Connected to database: ${sequelize.getDatabaseName()}`);
    await applySchemaFiles(sequelize);
    if (!(await usersTableExists(sequelize))) {
      throw new Error('users table still missing after schema apply');
    }
    const models = initModels(sequelize);
    await ensurePostgresReady(sequelize, models);
    console.log('\nSchema + demo doctor ready. Optional: npm run seed:postgres (full medicines seed)');
    process.exit(0);
  } catch (err) {
    console.error('\nSchema apply failed:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
