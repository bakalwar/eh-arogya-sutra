const {
  sequelize,
  isPostgresEnabled,
  getDirectDatabaseUrl,
  normalizeDirectDatabaseUrl,
  connectModels
} = require('./sequelize');
const { ensurePostgresReady } = require('../../database/pgBootstrap');

/** @type {ReturnType<typeof connectModels> | {}} */
let models = {};

let pgState = {
  enabled: false,
  connected: false,
  lastError: null
};

function getPostgresModels() {
  return models;
}

function getPostgresHealth() {
  return { ...pgState };
}

async function connectPostgres() {
  if (!isPostgresEnabled() || !sequelize) {
    pgState = { enabled: false, connected: false, lastError: null };
    console.warn('[postgres] Set POSTGRES_* in .env — database is required.');
    return pgState;
  }

  pgState = { enabled: true, connected: false, lastError: null };

  const effectiveDirectUrl = normalizeDirectDatabaseUrl(getDirectDatabaseUrl());
  if (!effectiveDirectUrl && !String(process.env.POSTGRES_PASSWORD || '').trim()) {
    console.warn('[postgres] POSTGRES_PASSWORD is empty — add your pgAdmin password in .env');
  }

  try {
    await sequelize.authenticate();
    models = connectModels();
    if (process.env.NODE_ENV !== 'production' && process.env.PG_AUTO_BOOTSTRAP !== '0') {
      await ensurePostgresReady(sequelize, models);
    }
    pgState.connected = true;
    pgState.lastError = null;
    const pmax = sequelize?.config?.pool?.max;
    const modelNames = Object.keys(models);
    console.log(
      `[postgres] Connected to ${sequelize.getDatabaseName()} — ${modelNames.length} models (${modelNames.join(', ')})${pmax != null ? `, pool max ${pmax}` : ''}.`
    );
  } catch (err) {
    pgState.connected = false;
    pgState.lastError = err.message;
    console.warn('[postgres] Connection failed:', err.message);
    models = {};
  }

  return pgState;
}

async function pingPostgres() {
  if (!sequelize) return { enabled: false, connected: false, lastError: null };
  try {
    await sequelize.authenticate();
    return { enabled: true, connected: true, lastError: null };
  } catch (err) {
    return { enabled: true, connected: false, lastError: err.message };
  }
}

module.exports = {
  connectPostgres,
  getPostgresModels,
  getPostgresHealth,
  pingPostgres,
  isPostgresEnabled,
  sequelize
};
