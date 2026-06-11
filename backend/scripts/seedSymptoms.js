require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize, connectModels } = require('../db/sequelize');

const SYMPTOMS = [
  { name: 'Fever', name_hi: 'बुखार', aliases: ['temperature', 'body heat', 'bukhar'] },
  { name: 'Cough', name_hi: 'खांसी', aliases: ['khansi', 'throat irritation'] },
  { name: 'Cold', name_hi: 'सर्दी', aliases: ['jukam', 'runny nose', 'sardi'] },
  { name: 'Headache', name_hi: 'सिर दर्द', aliases: ['sar dard', 'migraine'] },
  { name: 'Stomach Pain', name_hi: 'पेट दर्द', aliases: ['pet dard', 'gastric pain'] },
  { name: 'Joint Pain', name_hi: 'जोड़ों का दर्द', aliases: ['jodon ka dard', 'arthritis'] },
  { name: 'Weakness', name_hi: 'कमजोरी', aliases: ['kamzori', 'fatigue', 'tiredness'] },
  { name: 'Acidity', name_hi: 'एसिडिटी', aliases: ['gas', 'burning sensation'] },
  { name: 'Constipation', name_hi: 'कब्ज', aliases: ['kabz', 'hard stool'] },
  { name: 'Diarrhoea', name_hi: 'दस्त', aliases: ['loose motion', 'dast'] },
  { name: 'Back Pain', name_hi: 'कमर दर्द', aliases: ['kamar dard', 'backache'] },
  { name: 'Skin Rash', name_hi: 'त्वचा पर दाने', aliases: ['itching', 'khujli', 'rash'] },
  { name: 'Breathlessness', name_hi: 'सांस फूलना', aliases: ['asthma', 'dama', 'saans'] },
  { name: 'Vomiting', name_hi: 'उल्टी', aliases: ['nausea', 'ultti'] },
  { name: 'Swelling', name_hi: 'सूजन', aliases: ['edema', 'sujan'] }
];

async function seed() {
  try {
    if (!sequelize) {
      console.error('Sequelize not initialized. Check .env');
      process.exit(1);
    }
    await sequelize.authenticate();
    const models = connectModels();
    const { SymptomPg } = models;
    
    console.log('Seeding symptoms...');
    for (const s of SYMPTOMS) {
      await SymptomPg.findOrCreate({
        where: { name: s.name },
        defaults: s
      });
    }
    console.log('Symptoms seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
