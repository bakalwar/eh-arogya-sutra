const { Sequelize } = require('sequelize');
const { initModels } = require('../models/postgres');

/**
 * All Sequelize models — maps 1:1 to `database/schema.sql` tables (8 tables).
 */
const SCHEMA_MODEL_NAMES = [
  'UserPg',
  'PatientPg',
  'MedicinePg',
  'SymptomPg',
  'PrescriptionPg',
  'ReportPg',
  'AuditLogPg',
  'MedicalRulePg',
  'RefreshTokenPg',
  'LoginOtpPg',
  'BloodTestValuePg',
  'TranslationCachePg'
];

/** @type {ReturnType<typeof initModels> | null} */
let models = null;

function getDirectDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SEQUELIZE_DATABASE_URL ||
    ''
  ).trim();
}

function normalizeDirectDatabaseUrl(raw) {
  const url = (raw || '').trim();
  if (!url) return '';
  const lower = url.toLowerCase();
  if (lower.startsWith('postgres://') || lower.startsWith('postgresql://')) return url;
  return '';
}

function getSplitPostgresConfig() {
  const user = (process.env.POSTGRES_USER || '').trim();
  if (!user) return null;
  const password =
    process.env.POSTGRES_PASSWORD === undefined || process.env.POSTGRES_PASSWORD === null
      ? ''
      : String(process.env.POSTGRES_PASSWORD);
  const host = (process.env.POSTGRES_HOST || '127.0.0.1').trim();
  const port = parseInt(process.env.POSTGRES_PORT || '5432', 10) || 5432;
  const database = (process.env.POSTGRES_DB || 'eh_arogyaa_sutra_db').trim();
  return { database, username: user, password, host, port };
}

function buildUriFromSplitConfig(split) {
  if (!split) return '';
  const ssl = process.env.POSTGRES_SSL === '1' ? 'require' : 'disable';
  const encUser = encodeURIComponent(split.username);
  const encPass = encodeURIComponent(split.password);
  return `postgresql://${encUser}:${encPass}@${split.host}:${split.port}/${split.database}?sslmode=${ssl}`;
}

function getDatabaseUrl() {
  const direct = normalizeDirectDatabaseUrl(getDirectDatabaseUrl());
  if (direct) return direct;
  return buildUriFromSplitConfig(getSplitPostgresConfig());
}

function urlNeedsSsl(url) {
  const u = String(url || '').toLowerCase();
  if (process.env.POSTGRES_SSL === '0') return false;
  return (
    process.env.POSTGRES_SSL === '1' ||
    u.includes('supabase') ||
    u.includes('sslmode=require')
  );
}

const poolMax = Math.min(100, Math.max(5, parseInt(process.env.PG_POOL_MAX || '30', 10) || 30));
const poolMin = Math.min(poolMax, Math.max(0, parseInt(process.env.PG_POOL_MIN || '2', 10) || 2));

const dbUrlForSsl = getDatabaseUrl();
const dialectOptions = urlNeedsSsl(dbUrlForSsl)
  ? { ssl: { require: true, rejectUnauthorized: process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED === '1' } }
  : { ssl: false };

const commonOptions = {
  dialect: 'postgres',
  logging: process.env.SEQUELIZE_LOGGING === '1' ? console.log : false,
  pool: {
    max: poolMax,
    min: poolMin,
    acquire: parseInt(process.env.PG_POOL_ACQUIRE_MS || '60000', 10) || 60000,
    idle: parseInt(process.env.PG_POOL_IDLE_MS || '10000', 10) || 10000,
    evict: parseInt(process.env.PG_POOL_EVICT_MS || '1000', 10) || 1000
  },
  dialectOptions,
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
};

const rawDirectUrl = getDirectDatabaseUrl();
const directUrl = normalizeDirectDatabaseUrl(rawDirectUrl);
if (rawDirectUrl && !directUrl) {
  console.warn(
    '[postgres] DATABASE_URL must start with postgresql:// or postgres:// — ignoring invalid value; using POSTGRES_*.'
  );
}
const split = getSplitPostgresConfig();
const splitUri = !directUrl && split ? buildUriFromSplitConfig(split) : '';

const sequelize = directUrl
  ? new Sequelize(directUrl, commonOptions)
  : splitUri
    ? new Sequelize(splitUri, commonOptions)
    : null;

function isPostgresEnabled() {
  return !!sequelize;
}

/** Register all models + associations on the shared Sequelize instance. */
function connectModels() {
  if (!sequelize) return {};
  if (models && Object.keys(models).length) return models;
  models = initModels(sequelize);
  const missing = SCHEMA_MODEL_NAMES.filter((name) => !models[name]);
  if (missing.length) {
    throw new Error(`Missing Sequelize models: ${missing.join(', ')}`);
  }
  return models;
}

function getModels() {
  return models || {};
}

module.exports = {
  sequelize,
  isPostgresEnabled,
  getDatabaseUrl,
  getDirectDatabaseUrl,
  normalizeDirectDatabaseUrl,
  buildUriFromSplitConfig,
  connectModels,
  getModels,
  SCHEMA_MODEL_NAMES
};
