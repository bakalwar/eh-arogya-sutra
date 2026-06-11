'use strict';

/** 38 medicines — EH_Book_Extraction_CursorPrompt.docx */
const ALL_MEDICINES = [
  { code: 'S-1', name: 'Scrofoloso-1', group: 'S', system: 'Lymphatic' },
  { code: 'S-2', name: 'Scrofoloso-2', group: 'S', system: 'Liver/Lymph' },
  { code: 'S-3', name: 'Scrofoloso-3', group: 'S', system: 'Reproductive' },
  { code: 'S-4', name: 'Scrofoloso-4', group: 'S', system: 'Thyroid/Endocrine' },
  { code: 'S-5', name: 'Scrofoloso-5', group: 'S', system: 'Skin/Joints' },
  { code: 'S-6', name: 'Scrofoloso-6', group: 'S', system: 'Kidney/Urinary' },
  { code: 'S-7', name: 'Scrofoloso-7', group: 'S', system: 'Lymphatic' },
  { code: 'S-8', name: 'Scrofoloso-8', group: 'S', system: 'Lymphatic' },
  { code: 'S-9', name: 'Scrofoloso-9', group: 'S', system: 'Lymphatic' },
  { code: 'S-10', name: 'Scrofoloso-10', group: 'S', system: 'Digestive' },
  { code: 'A-1', name: 'Angioitico-1', group: 'A', system: 'Heart/Arteries' },
  { code: 'A-2', name: 'Angioitico-2', group: 'A', system: 'Heart/Veins' },
  { code: 'A-3', name: 'Angioitico-3', group: 'A', system: 'Blood cells' },
  { code: 'C-1', name: 'Canceroso-1', group: 'C', system: 'General strength' },
  { code: 'C-2', name: 'Canceroso-2', group: 'C', system: 'CNS/Spine' },
  { code: 'C-3', name: 'Canceroso-3', group: 'C', system: 'Muscles/Tendons' },
  { code: 'C-4', name: 'Canceroso-4', group: 'C', system: 'Bones/Joints' },
  { code: 'C-5', name: 'Canceroso-5', group: 'C', system: 'Lymph nodes' },
  { code: 'C-6', name: 'Canceroso-6', group: 'C', system: 'Kidney cells' },
  { code: 'C-7', name: 'Canceroso-7', group: 'C', system: 'Skin deep' },
  { code: 'C-8', name: 'Canceroso-8', group: 'C', system: 'Liver/Intestine' },
  { code: 'C-9', name: 'Canceroso-9', group: 'C', system: 'Lymphatic deep' },
  { code: 'C-10', name: 'Canceroso-10', group: 'C', system: 'Pancreas/Diabetes' },
  { code: 'C-11', name: 'Canceroso-11', group: 'C', system: 'Heart muscle' },
  { code: 'C-12', name: 'Canceroso-12', group: 'C', system: 'Reproductive' },
  { code: 'C-13', name: 'Canceroso-13', group: 'C', system: 'Thyroid/Throat' },
  { code: 'C-14', name: 'Canceroso-14', group: 'C', system: 'Blood purifier' },
  { code: 'C-15', name: 'Canceroso-15', group: 'C', system: 'Colon/Intestine' },
  { code: 'C-16', name: 'Canceroso-16', group: 'C', system: 'Female reproductive' },
  { code: 'C-17', name: 'Canceroso-17', group: 'C', system: 'Kidney deep' },
  { code: 'F-1', name: 'Febrifugo-1', group: 'F', system: 'Nervous/Brain' },
  { code: 'F-2', name: 'Febrifugo-2', group: 'F', system: 'Fever' },
  { code: 'F-3', name: 'Febrifugo-3', group: 'F', system: 'Fever/Chronic' },
  { code: 'L-1', name: 'Limfatico-1', group: 'L', system: 'Platelets/Immunity' },
  { code: 'P-1', name: 'Pectorale-1', group: 'P', system: 'Lung upper' },
  { code: 'P-2', name: 'Pectorale-2', group: 'P', system: 'Lung lower' },
  { code: 'P-3', name: 'Pectorale-3', group: 'P', system: 'Asthma/Chronic cough' },
  { code: 'P-4', name: 'Pectorale-4', group: 'P', system: 'Lung/Chest' },
  { code: 'P-5', name: 'Pectorale-5', group: 'P', system: 'Lung/Chest' },
  { code: 'P-6', name: 'Pectorale-6', group: 'P', system: 'Lung/Chest' },
  { code: 'P-7', name: 'Pectorale-7', group: 'P', system: 'Lung/Chest' },
  { code: 'P-8', name: 'Pectorale-8', group: 'P', system: 'Lung/Chest' },
  { code: 'VEN-1', name: 'Venereo-1', group: 'V', system: 'Syphilis/Gonorrhoea' },
  { code: 'VEN-2', name: 'Venereo-2', group: 'V', system: 'Venereal/Chronic' },
  { code: 'VEN-3', name: 'Venereo-3', group: 'V', system: 'Venereal/Acute' },
  { code: 'VEN-4', name: 'Venereo-4', group: 'V', system: 'Venereal/Urgent' },
  { code: 'VEN-5', name: 'Venereo-5', group: 'V', system: 'Syphilis stage 2' },
  { code: 'VER-1', name: 'Vermifugo-1', group: 'VER', system: 'Intestinal worms' },
  { code: 'VER-2', name: 'Vermifugo-2', group: 'VER', system: 'External worms/Skin' }
];

const EXTRA_FALLBACK = {
  'S-1': {
    diseases: ['lymph', 'immunity', 'ras', 'general weakness'],
    symptoms: ['sujan', 'ganth', 'infection'],
    electricity: 'G.E.',
    synergy_medicines: ['S-10', 'A-3']
  },
  'S-2': {
    diseases: ['liver', 'jaundice', 'sgpt', 'hepatitis'],
    symptoms: ['liver', 'pila', 'pet dard'],
    electricity: 'Y.E.',
    synergy_medicines: ['S-1', 'C-8']
  },
  'S-6': {
    diseases: ['uric acid', 'kidney', 'gout', 'renal', 'pathari'],
    symptoms: ['uric', 'kidney', 'jod', 'gurda'],
    electricity: 'G.E.',
    synergy_medicines: ['C-4', 'C-6']
  },
  'S-10': {
    diseases: ['constipation', 'digestion', 'kabz', 'gas'],
    symptoms: ['kabz', 'pet', 'digestion'],
    electricity: 'G.E.',
    synergy_medicines: ['S-1', 'C-8']
  },
  'A-1': {
    diseases: ['high bp', 'heart', 'arteries', 'hypertension', 'bp'],
    symptoms: ['bp', 'dhadkan', 'heart'],
    electricity: 'B.E.',
    synergy_medicines: ['A-3', 'C-11']
  },
  'A-3': {
    diseases: ['anemia', 'hemoglobin', 'blood', 'weakness'],
    symptoms: ['kamzori', 'pale', 'anemia'],
    electricity: 'R.E.',
    synergy_medicines: ['L-1', 'S-1']
  },
  'C-4': {
    diseases: ['joint', 'bone', 'arthritis', 'pth', 'jod'],
    symptoms: ['jod', 'arth', 'bone'],
    electricity: 'G.E.',
    synergy_medicines: ['S-6', 'S-5']
  },
  'C-6': {
    diseases: ['creatinine', 'kidney', 'renal'],
    symptoms: ['kidney', 'gurda'],
    electricity: 'G.E.',
    synergy_medicines: ['S-6', 'C-17']
  },
  'C-10': {
    diseases: ['diabetes', 'sugar', 'insulin', 'pancreas'],
    symptoms: ['diabetes', 'sugar', 'peshab'],
    electricity: 'B.E.',
    synergy_medicines: ['S-2', 'S-10']
  },
  'F-1': {
    diseases: ['anxiety', 'vertigo', 'nervous', 'insomnia', 'stress'],
    symptoms: ['chakkar', 'neend', 'ghabrahat', 'anxiety'],
    electricity: 'W.E.',
    synergy_medicines: ['C-2', 'S-1']
  },
  'F-2': {
    diseases: ['fever', 'bukhar', 'infection'],
    symptoms: ['bukhar', 'fever', 'jwar'],
    electricity: 'Y.E.',
    synergy_medicines: ['P-1', 'S-1']
  },
  'L-1': {
    diseases: ['anemia', 'platelet', 'immunity', 'wbc'],
    symptoms: ['kamzori', 'infection', 'bleeding'],
    electricity: 'R.E.',
    synergy_medicines: ['A-3', 'S-1']
  },
  'P-1': {
    diseases: ['cough', 'lung', 'respiratory', 'khansi'],
    symptoms: ['khansi', 'saans', 'chest'],
    electricity: 'Y.E.',
    synergy_medicines: ['P-3', 'S-1']
  }
};

const GROUP_TEMP = {
  S: ['Lymphatic'],
  A: ['Sanguine'],
  F: ['Nervous'],
  C: ['Mixed'],
  L: ['Lymphatic'],
  P: ['Lymphatic'],
  V: ['Mixed']
};

const GROUP_ELEC = {
  S: 'G.E.',
  A: 'B.E.',
  F: 'W.E.',
  C: 'G.E.',
  L: 'R.E.',
  P: 'Y.E.',
  V: 'G.E.'
};

const SYSTEM_HINTS = {
  'Lymphatic': { diseases: ['lymph', 'ras', 'sujan'], symptoms: ['sujan', 'ganth'] },
  'Liver/Lymph': { diseases: ['liver', 'jaundice'], symptoms: ['liver', 'sgpt'] },
  'Kidney/Urinary': { diseases: ['kidney', 'uric', 'gout'], symptoms: ['uric', 'kidney'] },
  'Digestive': { diseases: ['digestion', 'kabz'], symptoms: ['kabz', 'pet'] },
  'Heart/Arteries': { diseases: ['bp', 'heart', 'arteries'], symptoms: ['bp', 'dhadkan'] },
  'Heart/Veins': { diseases: ['veins', 'varicose'], symptoms: ['swelling leg'] },
  'Blood cells': { diseases: ['anemia', 'blood'], symptoms: ['pale', 'weakness'] },
  'Bones/Joints': { diseases: ['joint', 'bone', 'arthritis'], symptoms: ['jod', 'dard'] },
  'Nervous/Brain': { diseases: ['anxiety', 'vertigo', 'nervous'], symptoms: ['chakkar', 'neend'] },
  'Fever': { diseases: ['fever', 'bukhar'], symptoms: ['fever', 'heat'] },
  'Pancreas/Diabetes': { diseases: ['diabetes', 'sugar'], symptoms: ['thirst', 'sugar'] },
  'Lung upper': { diseases: ['cough', 'lung'], symptoms: ['khansi'] }
};

function buildFallbackKnowledge(med) {
  const extra = EXTRA_FALLBACK[med.code] || {};
  const hints = SYSTEM_HINTS[med.system] || { diseases: [med.system.toLowerCase()], symptoms: [] };
  return {
    code: med.code,
    name: `${med.name} (${med.code})`,
    group: med.group,
    system: med.system,
    temperament: extra.temperament || GROUP_TEMP[med.group] || ['Mixed'],
    diseases: extra.diseases || hints.diseases,
    symptoms: extra.symptoms || hints.symptoms,
    potency: { acute: 'D10', sub_acute: 'D10', chronic: 'D30', hypo: 'D4' },
    synergy_medicines: extra.synergy_medicines || ['S-1', 'A-3'],
    electricity: extra.electricity || GROUP_ELEC[med.group] || 'G.E.',
    target_anatomy: med.system,
    action_hindi: `${med.name} — ${med.system} प्रणाली`,
    when_to_use: extra.diseases || hints.diseases,
    do_not_use: [],
    confidence: 55,
    source: 'catalog-fallback',
    learned_at: new Date().toISOString()
  };
}

function buildAllFallbackKnowledge() {
  const out = {};
  ALL_MEDICINES.forEach((med) => {
    out[med.code] = buildFallbackKnowledge(med);
  });
  return out;
}

module.exports = { ALL_MEDICINES, buildFallbackKnowledge, buildAllFallbackKnowledge, EXTRA_FALLBACK };
