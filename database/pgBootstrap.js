/**
 * Ensure PostgreSQL has schema + demo doctor (dev-friendly).
 * Used by apply-schema.js and backend connectPostgres().
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const SQL_FILES = [
  path.join(__dirname, 'schema.sql'),
  path.join(__dirname, 'migrations', '001_patients_cdss_columns.sql'),
  path.join(__dirname, 'migrations', '002_eh_library_symptoms.sql'),
  path.join(__dirname, 'migrations', '003_auth_jwt_otp.sql'),
  path.join(__dirname, 'migrations', '004_blood_test_values.sql'),
  path.join(__dirname, 'migrations', '005_eh_books.sql'),
  path.join(__dirname, 'migrations', '006_books_library.sql'),
  path.join(__dirname, 'migrations', '007_smart_search_prescriptions.sql'),
  path.join(__dirname, 'migrations', '008_blood_test_extended.sql'),
  path.join(__dirname, 'migrations', '009_translation_cache.sql'),
  path.join(__dirname, 'migrations', '010_doctor_clinic_profile.sql'),
  path.join(__dirname, 'migrations', '011_super_admin_platform.sql'),
  path.join(__dirname, 'migrations', '012_demo_doctor_admin.sql'),
  path.join(__dirname, 'migrations', '013_eh_expert_knowledge_graph.sql'),
  path.join(__dirname, 'migrations', '014_eh_materia_medica.sql'),
  path.join(__dirname, 'migrations', '015_demo_doctor_role_doctor.sql'),
  path.join(__dirname, 'migrations', '016_subscription_referral_columns.sql')
];

async function usersTableExists(sequelize) {
  const [rows] = await sequelize.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users' LIMIT 1`
  );
  return rows.length > 0;
}

async function applySchemaFiles(sequelize) {
  for (const file of SQL_FILES) {
    if (!fs.existsSync(file)) continue;
    const sql = fs.readFileSync(file, 'utf8');
    await sequelize.query(sql);
  }
}

async function ensureDemoDoctor(sequelize, models) {
  const { UserPg } = models;
  if (!UserPg) return;

  const demoMobile = process.env.DEMO_DOCTOR_MOBILE || '9876543210';
  const demoPass = process.env.DEMO_DOCTOR_PASSWORD || 'demo123';
  const demoName = process.env.DEMO_DOCTOR_NAME || 'Demo Doctor';
  const demoRole = 'doctor';
  const password_hash = bcrypt.hashSync(demoPass, 10);

  const demoEmail = (
    process.env.DEMO_DOCTOR_EMAIL ||
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    'doctor@eh-arogya.local'
  ).trim();
  const [user, created] = await UserPg.findOrCreate({
    where: { mobile: demoMobile },
    defaults: {
      name: demoName,
      role: demoRole,
      password_hash,
      email: demoEmail,
      failed_login_attempts: 0,
      locked_until: null
    }
  });

  if (!created) {
    await user.update({
      name: demoName,
      role: demoRole,
      password_hash,
      email: demoEmail,
      failed_login_attempts: 0,
      locked_until: null
    });
  }
}

/**
 * @param {import('sequelize').Sequelize} sequelize
 * @param {ReturnType<import('../backend/models/postgres').initModels>} models
 */
async function ensurePostgresReady(sequelize, models) {
  const hasUsers = await usersTableExists(sequelize);
  if (!hasUsers) {
    console.log('[postgres] users table missing — applying schema.sql (+ migrations)...');
    await applySchemaFiles(sequelize);
    if (!(await usersTableExists(sequelize))) {
      throw new Error('users table still missing after schema apply');
    }
    console.log('[postgres] Schema applied.');
  }

  await ensureDemoDoctor(sequelize, models);
}

module.exports = { ensurePostgresReady, usersTableExists, applySchemaFiles };
