/**
 * Seed PostgreSQL (Sequelize) — demo doctor + default medicines + symptom catalog.
 * Requires DATABASE_URL and applied database/schema.sql (+ migrations/002 if upgrading).
 *
 * Usage: npm run seed:postgres
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });
const bcrypt = require('bcryptjs');
const { sequelize, isPostgresEnabled } = require('../../backend/db/sequelize');
const { initModels } = require('../../backend/models/postgres');

/** Mix of EH library samples + legacy Ayurveda/Homeopathy rows */
const defaultMedicines = [
  {
    name: 'S1 Scrofoloso',
    system: 'Electro-Homeopathy',
    polarity_hint: 'POSITIVE',
    medicine_group: 'Scrofoloso',
    dilution: '1:9',
    indications: 'Lymphatic congestion, glandular swelling, chronic suppuration tendency'
  },
  {
    name: 'C5 Canceroso',
    system: 'Electro-Homeopathy',
    polarity_hint: 'NEGATIVE',
    medicine_group: 'Canceroso',
    dilution: '1:47',
    indications: 'Cellular toxicity, tumour diathesis support, metabolic acidosis tendency'
  },
  {
    name: 'A2 Angiotico',
    system: 'Electro-Homeopathy',
    polarity_hint: 'MIXED',
    medicine_group: 'Angiotico',
    dilution: '1:9',
    indications: 'Circulatory imbalance, capillary fragility, varicose congestion'
  },
  { name: 'Ashwagandha', system: 'Ayurveda', polarity_hint: null, medicine_group: null, dilution: null, indications: 'Adaptogen, stress, fatigue' },
  { name: 'Triphala', system: 'Ayurveda', polarity_hint: null, medicine_group: null, dilution: null, indications: 'Digestive cleanse, mild laxative' },
  { name: 'Arnica', system: 'Homeopathy', polarity_hint: null, medicine_group: null, dilution: null, indications: 'Trauma, bruising, soreness' },
  { name: 'Nux vomica', system: 'Homeopathy', polarity_hint: null, medicine_group: null, dilution: null, indications: 'Overwork, stimulants, dyspepsia' }
];

const defaultSymptoms = [
  { name: 'Fever', name_hi: 'बुखार', aliases: ['pyrexia', 'high temperature'] },
  { name: 'Headache', name_hi: 'सिरदर्द', aliases: ['cephalgia', 'migraine'] },
  { name: 'Cough', name_hi: 'खांसी', aliases: ['dry cough', 'productive cough'] },
  { name: 'Fatigue', name_hi: 'थकान', aliases: ['tiredness', 'weakness'] },
  { name: 'Glandular swelling', name_hi: 'ग्रंथि सूजन', aliases: ['lymph nodes enlarged', 'adenopathy'] },
  { name: 'Circulatory congestion', name_hi: 'रक्त संचार अवरोध', aliases: ['heavy legs', 'venous stasis'] }
];

async function refreshSearchDocuments() {
  await sequelize.query(`
    UPDATE medicines
    SET search_document = to_tsvector('simple',
      coalesce(name, '') || ' ' || coalesce(system, '') || ' ' ||
      coalesce(medicine_group, '') || ' ' || coalesce(dilution, '') || ' ' || coalesce(indications, '')
    )
  `);
  await sequelize.query(`
    UPDATE symptoms
    SET search_document = to_tsvector('simple',
      coalesce(name, '') || ' ' || coalesce(name_hi, '') || ' ' || coalesce(array_to_string(aliases, ' '), '')
    )
  `);
}

async function seedPostgres() {
  if (!isPostgresEnabled() || !sequelize) {
    console.error(`
[seed:postgres] DATABASE_URL is missing or empty.

Fix:
  1. Copy .env.example to .env (or merge the PostgreSQL block).
  2. Set DATABASE_URL, for example:
     postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/eh_arogya_sutra
  3. Create DB:  CREATE DATABASE eh_arogya_sutra;
  4. Apply:      psql -U postgres -d eh_arogya_sutra -f database/schema.sql
  5. If upgrading an older DB:  psql ... -f database/migrations/002_eh_library_symptoms.sql

See .env.example for full notes.
`);
    process.exit(1);
  }

  const models = initModels(sequelize);
  const { UserPg, MedicinePg, SymptomPg } = models;

  await sequelize.authenticate();
  console.log('Connected to PostgreSQL (Sequelize)');

  const medCount = await MedicinePg.count();
  if (medCount === 0) {
    await MedicinePg.bulkCreate(defaultMedicines);
    console.log(`Seeded ${defaultMedicines.length} medicines`);
  } else {
    console.log(`Medicines already present (${medCount}), skipping medicine insert`);
  }

  const symCount = await SymptomPg.count();
  if (symCount === 0) {
    await SymptomPg.bulkCreate(defaultSymptoms);
    console.log(`Seeded ${defaultSymptoms.length} symptoms`);
  } else {
    console.log(`Symptoms already present (${symCount}), skipping symptom insert`);
  }

  try {
    await refreshSearchDocuments();
    console.log('Updated search_document for medicines + symptoms (FTS)');
  } catch (e) {
    console.warn('Could not refresh search_document:', e.message);
  }

  const demoMobile = process.env.DEMO_DOCTOR_MOBILE || '9876543210';
  const demoPass = process.env.DEMO_DOCTOR_PASSWORD || 'demo123';
  const demoEmail = (
    process.env.DEMO_DOCTOR_EMAIL ||
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    'doctor@eh-arogya.local'
  ).trim();
  const password_hash = bcrypt.hashSync(demoPass, 10);
  const demoName = process.env.DEMO_DOCTOR_NAME || 'Demo Doctor';
  const demoRole = 'doctor';

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

  if (created) {
    console.log(`Seeded demo doctor — mobile ${demoMobile}, password ${demoPass}, email ${demoEmail}`);
  } else {
    await user.update({
      name: demoName,
      role: demoRole,
      password_hash,
      email: demoEmail,
      failed_login_attempts: 0,
      locked_until: null
    });
    console.log(`Updated demo doctor (${demoMobile}) — password reset, email ${demoEmail}`);
  }

  const adminMobile = process.env.ADMIN_MOBILE || '9999999999';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@eh-arogya.local').trim();
  const adminHash = bcrypt.hashSync(adminPass, 10);

  const [adminUser, adminCreated] = await UserPg.findOrCreate({
    where: { mobile: adminMobile },
    defaults: {
      name: 'Platform Admin',
      full_name: 'E.H. Arogya Admin',
      role: 'admin',
      password_hash: adminHash,
      email: adminEmail,
      subscription_status: 'active',
      plan: 'pro',
      profile_completed: true
    }
  });

  if (adminCreated) {
    console.log(`Seeded admin — mobile ${adminMobile}, password ${adminPass}`);
  } else {
    await adminUser.update({
      role: 'admin',
      password_hash: adminHash,
      email: adminEmail,
      failed_login_attempts: 0,
      locked_until: null
    });
    console.log(`Updated admin (${adminMobile}) — password reset`);
  }

  await sequelize.close();
  console.log('PostgreSQL seed done');
}

seedPostgres().catch((err) => {
  console.error(err);
  process.exit(1);
});
