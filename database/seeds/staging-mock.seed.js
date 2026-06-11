/**
 * Staging-only mock patients — NEVER run against production DATABASE_URL.
 * Usage: APP_ENV=staging npm run seed:staging
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });

const bcrypt = require('bcryptjs');
const { sequelize, isPostgresEnabled } = require('../../backend/db/sequelize');
const { initModels } = require('../../backend/models/postgres');
const { isStaging } = require('../../backend/config/environment');

const MOCK_PATIENTS = [
  {
    name: 'राजेश कुमार (STAGING)',
    age: 36,
    gender: 'male',
    mobile: '9000000001',
    weight: 60,
    personal_factor: 5,
    symptoms: ['sarir me khujali', 'dane dane uth rahe'],
    notes: 'Mock — urticaria / pruritus case for AI summary test'
  },
  {
    name: 'प्रिया शर्मा (STAGING)',
    age: 28,
    gender: 'female',
    mobile: '9000000002',
    weight: 52,
    personal_factor: 4,
    symptoms: ['सिरदर्द', 'थकान'],
    notes: 'Mock — headache + fatigue'
  },
  {
    name: 'अमित वर्मा (STAGING)',
    age: 45,
    gender: 'male',
    mobile: '9000000003',
    weight: 78,
    personal_factor: 6,
    symptoms: ['उच्च रक्तचाप', 'चक्कर'],
    notes: 'Mock — BP case'
  },
  {
    name: 'सुनीता देवी (STAGING)',
    age: 52,
    gender: 'female',
    mobile: '9000000004',
    weight: 65,
    personal_factor: 3,
    symptoms: ['जोड़ों में दर्द', 'सुबह अकड़न'],
    notes: 'Mock — arthritis pattern'
  },
  {
    name: 'विक्रम सिंह (STAGING)',
    age: 19,
    gender: 'male',
    mobile: '9000000005',
    weight: 55,
    personal_factor: 7,
    symptoms: ['बुखार', 'खांसी'],
    notes: 'Mock — acute fever'
  },
  {
    name: 'लक्ष्मी (STAGING)',
    age: 62,
    gender: 'female',
    mobile: '9000000006',
    weight: 58,
    personal_factor: 2,
    symptoms: ['कब्ज', 'गैस'],
    notes: 'Mock — digestive'
  },
  {
    name: 'राहुल गुप्ता (STAGING)',
    age: 33,
    gender: 'male',
    mobile: '9000000007',
    weight: 70,
    personal_factor: 5,
    symptoms: ['नींद न आना', 'तनाव'],
    notes: 'Mock — sleep / stress'
  },
  {
    name: 'अनिल यादव (STAGING)',
    age: 41,
    gender: 'male',
    mobile: '9000000008',
    weight: 72,
    personal_factor: 5,
    symptoms: ['त्वचा पर दाने', 'खुजली'],
    notes: 'Mock — skin eruption'
  }
];

async function seedStagingMock() {
  const force = process.env.EH_STAGING_SEED_FORCE === '1';
  if (!force && !isStaging() && process.env.ALLOW_STAGING_SEED !== '1') {
    console.error(`
[seed:staging] Refused — not a staging environment.

Set APP_ENV=staging (or EH_DEPLOY_ENV=staging) and use a SEPARATE staging DATABASE_URL.
To override locally: ALLOW_STAGING_SEED=1 npm run seed:staging
`);
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL || '';
  if (!force && /prod|production/i.test(dbUrl) && !/staging/i.test(dbUrl)) {
    console.error('[seed:staging] DATABASE_URL looks like production — aborting.');
    process.exit(1);
  }

  if (!isPostgresEnabled() || !sequelize) {
    console.error('[seed:staging] DATABASE_URL required');
    process.exit(1);
  }

  const models = initModels(sequelize);
  const { UserPg, PatientPg } = models;
  await sequelize.authenticate();

  const demoMobile = process.env.STAGING_DOCTOR_MOBILE || '9876543210';
  const demoPass = process.env.STAGING_DOCTOR_PASSWORD || 'demo123';
  const password_hash = bcrypt.hashSync(demoPass, 10);

  const [doctor] = await UserPg.findOrCreate({
    where: { mobile: demoMobile },
    defaults: {
      name: 'Staging Demo Doctor',
      role: 'doctor',
      password_hash,
      email: 'staging-doctor@eh-arogya.local'
    }
  });

  let created = 0;
  for (const p of MOCK_PATIENTS) {
    const [, wasCreated] = await PatientPg.findOrCreate({
      where: { doctor_id: doctor.id, mobile: p.mobile },
      defaults: { ...p, doctor_id: doctor.id }
    });
    if (wasCreated) created += 1;
  }

  console.log(`[seed:staging] Mock patients: ${created} new, ${MOCK_PATIENTS.length} total catalog`);
  console.log(`[seed:staging] Login: mobile ${demoMobile} / ${demoPass}`);
  await sequelize.close();
}

seedStagingMock().catch((e) => {
  console.error(e);
  process.exit(1);
});
