'use strict';

/** DOCX EH_Complete_Prescription — medicine pools (electricity NOT in pools; rule lock only) */

const TEMPERAMENT_MEDICINES = {
  SANGUINE: {
    description: 'रक्त (Blood) विकृति प्रधान',
    base_group: 'A-Group (Angitico)',
    primary_medicines: ['A-1', 'A-2', 'A-3'],
    logic: 'Rakt mein dosh → A-Group se rakt shuddhi'
  },
  LYMPHATIC: {
    description: 'रस (Lymph) विकृति प्रधान',
    base_group: 'S-Group (Scrofoloso)',
    primary_medicines: ['S-1', 'S-5', 'S-10'],
    logic: 'Ras mein dosh → S-Group se ras shuddhi'
  },
  MIXED: {
    description: 'रक्त + रस दोनों विकृत',
    base_group: 'A-Group + S-Group + C-Group',
    primary_medicines: ['S-1', 'A-3', 'C-4'],
    logic: 'Dono mein dosh → A+S+C Groups'
  },
  NERVOUS: {
    description: 'स्नायु तंत्र प्रधान',
    base_group: 'F-Group (Febrifugo)',
    primary_medicines: ['F-1', 'C-2', 'S-1'],
    logic: 'Nervous system → F-Group'
  }
};

const ORGAN_MEDICINES = {
  kidney: { primary: ['S-6', 'C-6'], support: ['S-1', 'C-17'] },
  liver: { primary: ['S-2', 'C-8'], support: ['S-1'] },
  heart: { primary: ['A-1', 'A-2'], support: ['C-11', 'A-3'] },
  joints: { primary: ['C-4', 'S-5'], support: ['S-6', 'A-3'] },
  nervous: { primary: ['F-1', 'C-2'], support: ['S-1'] },
  digestive: { primary: ['S-10', 'C-8'], support: ['S-2', 'C-15'] },
  respiratory: { primary: ['P-1', 'P-3'], support: ['S-1'] },
  skin: { primary: ['S-5', 'C-7'], support: ['S-1', 'C-14'] },
  lymphatic: { primary: ['S-1', 'C-5'], support: ['L-1'] },
  endocrine: { primary: ['S-4', 'C-10'], support: ['S-1', 'C-13'] },
  blood: { primary: ['A-3', 'L-1'], support: ['A-1'] },
  reproductive: { primary: ['S-3', 'C-16'], support: ['S-2'] },
  urinary: { primary: ['S-6', 'C-17'], support: ['S-1', 'C-6'] }
};

/** Detected organ keys → prescription pool keys */
const ORGAN_ALIAS = {
  cardiovascular: ['heart', 'blood'],
  musculoskeletal: ['joints'],
  nervous_system: ['nervous'],
  digestive: ['digestive'],
  urinary: ['urinary', 'kidney'],
  respiratory: ['respiratory'],
  skin: ['skin'],
  lymphatic_system: ['lymphatic'],
  endocrine: ['endocrine'],
  reproductive: ['reproductive']
};

const REPORT_MEDICINES = {
  uric_acid_high: ['S-6', 'C-4', 'S-1'],
  creatinine_high: ['S-6', 'C-6', 'C-17'],
  sugar_high: ['S-2', 'C-10', 'S-1'],
  sugar_fast_high: ['S-2', 'C-10', 'S-1'],
  hb_low: ['A-3', 'L-1'],
  hemoglobin_low: ['A-3', 'L-1'],
  platelet_low: ['L-1', 'A-3'],
  platelets_low: ['L-1', 'A-3'],
  pth_high: ['C-4', 'S-1'],
  sgpt_high: ['S-2', 'C-8', 'S-1'],
  cholesterol_high: ['A-1', 'S-2'],
  tsh_high: ['S-4', 'C-13'],
  bp_high: ['A-1', 'A-3'],
  bp_systolic_high: ['A-1', 'A-3'],
  bp_low: ['A-3', 'L-1']
};

const LAB_HIGH = {
  uric_acid: 7,
  creatinine: 1.2,
  sugar: 100,
  sugar_fast: 100,
  sugar_random: 140,
  pth: 65,
  sgpt: 56,
  cholesterol: 200,
  bp_systolic: 140,
  tsh: 4.5
};

const LAB_LOW = {
  hemoglobin: 12,
  hb: 12,
  platelets: 150000,
  platelet: 150000
};

const SYMPTOM_MEDICINES = [
  { keys: ['uric', 'यूरिक'], meds: ['S-6', 'C-4'] },
  { keys: ['jod', 'joint', 'गठिया', 'रीढ', 'sciatica'], meds: ['C-4', 'S-5'] },
  { keys: ['kabz', 'कब्ज', 'gas', 'गैस'], meds: ['S-10', 'C-8'] },
  { keys: ['bp', 'रक्तचाप', 'heart', 'धड़कन'], meds: ['A-1', 'A-3'] },
  { keys: ['diabetes', 'sugar', 'मधुमेह'], meds: ['C-10', 'S-2'] },
  { keys: ['chakkar', 'चक्कर', 'vertigo'], meds: ['F-1'] },
  { keys: ['kamjori', 'kamzori', 'weakness', 'कमजोरी'], meds: ['A-3', 'L-1'] },
  {
    keys: [
      'khansi',
      'khasi',
      'cough',
      'खांसी',
      'सांस',
      'sardi',
      'sardii',
      'सर्दी',
      'jukam',
      'jukaam',
      'जुकाम',
      'gala',
      'गला',
      'nak band',
      'nak',
      'नाक',
      'thand',
      'ठंड'
    ],
    meds: ['P-1', 'P-3', 'S-1']
  },
  { keys: ['twacha', 'skin', 'त्वचा'], meds: ['S-5', 'C-7'] },
  { keys: ['neend', 'insomnia', 'नींद'], meds: ['F-1'] },
  { keys: ['liver', 'यकृत', 'jaundice'], meds: ['S-2', 'C-8'] },
  { keys: ['kidney', 'गुर्दा', 'creatinine'], meds: ['S-6', 'C-6'] }
];

const MED_INFO_HI = {
  S1: { name: 'स्क्रोफोलोसो-१', reason: 'रस प्रणाली शुद्धि — लसीका तंत्र' },
  S2: { name: 'स्क्रोफोलोसो-२', reason: 'यकृत व लसीका ग्रंथियाँ' },
  S5: { name: 'स्क्रोफोलोसो-५', reason: 'त्वचा, जोड़ों की सूजन' },
  S6: { name: 'स्क्रोफोलोसो-६', reason: 'गुर्दे, यूरिक अपशिष्ट' },
  S10: { name: 'स्क्रोफोलोसो-१०', reason: 'पाचन, कब्ज' },
  A1: { name: 'एंजिटिको-१', reason: 'हृदय, धमनियाँ' },
  A2: { name: 'एंजिटिको-२', reason: 'शिराएँ' },
  A3: { name: 'एंजिटिको-३', reason: 'रक्त कोशिकाएँ, HB' },
  C4: { name: 'कैंसरोसो-४', reason: 'हड्डी, जोड़, PTH' },
  C5: { name: 'कैंसरोसो-५', reason: 'लसीका गांठ' },
  C6: { name: 'कैंसरोसो-६', reason: 'गुर्दे, Creatinine' },
  C8: { name: 'कैंसरोसो-८', reason: 'यकृत, जीर्ण पाचन' },
  C10: { name: 'कैंसरोसो-१०', reason: 'अग्न्याशय, शर्करा' },
  C11: { name: 'कैंसरोसो-११', reason: 'हृदय मांसपेशी' },
  C16: { name: 'कैंसरोसो-१६', reason: 'प्रजनन मार्ग' },
  C17: { name: 'कैंसरोसो-१७', reason: 'मूत्र मार्ग' },
  F1: { name: 'फेब्रीफुगो-१', reason: 'तंत्रिका, चक्कर, अनिद्रा' },
  L1: { name: 'लिम्फेटिको-१', reason: 'प्लेटलेट, प्रतिरक्षा' },
  P1: { name: 'पेक्टोरले-१', reason: 'श्वास मार्ग' },
  P3: { name: 'पेक्टोरले-३', reason: 'फेफड़े' }
};

const PHASE_HI = {
  ACUTE: 'तीव्र',
  SUB_ACUTE: 'अर्ध-तीव्र',
  CHRONIC: 'जीर्ण',
  DEGENERATIVE: 'अपक्षयी'
};

const FLUID_RE = /^(RE|BE|WE|GE|YE|R\.E\.|B\.E\.|W\.E\.|G\.E\.|Y\.E\.)$/i;

module.exports = {
  TEMPERAMENT_MEDICINES,
  ORGAN_MEDICINES,
  ORGAN_ALIAS,
  REPORT_MEDICINES,
  LAB_HIGH,
  LAB_LOW,
  SYMPTOM_MEDICINES,
  MED_INFO_HI,
  PHASE_HI,
  FLUID_RE
};
