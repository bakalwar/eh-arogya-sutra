'use strict';

/**
 * E.H. AROGYA SUTRA — SOURCE OF TRUTH (EH_Complete_Engine_Final-1.pdf STEP 2)
 * Single Node engine: Temperament + Polarity + Medicine + Lab + Electricity
 */
const { 
  syncFormulaElectricity, 
  extractLockedElectricityCode,
  applyHighBpAngiticoRule 
} = require('./potencyEngine');
const { detectAffectedOrgans, analyzeLabReports: analyzeLabReportsUtil } = require('../utils/ehOrganDetect');
const { buildComplaintLine } = require('../utils/summaryComplaintLock');
const { LAB_RANGES } = require('../data/ehAnatomyPathology');

function analyzeLabReports(report_values = {}) {
  return analyzeLabReportsUtil(report_values);
}

const MED_DB = {
  'S-1': { group: 'S', temp: 'L', anatomy: 'लसीका, रोग प्रतिरोध', action: 'रस प्रणाली शुद्धि — मुख्य आधार' },
  'S-2': { group: 'S', temp: 'L', anatomy: 'यकृत, पेट', action: 'यकृत + लसीका ग्रंथि शुद्धि' },
  'S-5': { group: 'S', temp: 'L', anatomy: 'त्वचा, जोड़', action: 'त्वचा + जोड़ लसीका शुद्धि' },
  'S-6': { group: 'S', temp: 'L', anatomy: 'गुर्दा', action: 'गुर्दा + यूरिक एसिड निकासी' },
  'S-10': { group: 'S', temp: 'L', anatomy: 'पाचन, आंत', action: 'पाचन लसीका — आधार औषधि' },
  'A-1': { group: 'A', temp: 'S', anatomy: 'हृदय बायाँ, धमनियाँ', action: 'BP + हृदय धमनी नियंत्रण' },
  'A-2': { group: 'A', temp: 'S', anatomy: 'हृदय दायाँ, शिराएँ', action: 'शिराएँ + नस जकड़न' },
  'A-3': { group: 'A', temp: 'S', anatomy: 'रक्तकोशिकाएँ', action: 'HB + रक्तकोशिका निर्माण' },
  'C-1': { group: 'C', temp: 'M', anatomy: 'सामान्य कोशिका', action: 'कोशिका + विस्फोटक शक्ति' },
  'C-2': { group: 'C', temp: 'N', anatomy: 'CNS, रीढ़', action: 'तंत्रिका + रीढ़' },
  'C-4': { group: 'C', temp: 'M', anatomy: 'हड्डी, जोड़, PTH', action: 'जोड़ + PTH संतुलन' },
  'C-5': { group: 'C', temp: 'L', anatomy: 'लसीका ग्रंथि', action: 'गांठ + लिम्फ नोड' },
  'C-6': { group: 'C', temp: 'M', anatomy: 'गुर्दा कोशिकाएँ', action: 'क्रिएटिनिन + रेनल' },
  'C-8': { group: 'C', temp: 'L', anatomy: 'यकृत, आंत', action: 'यकृत + आंत गहरी शुद्धि' },
  'C-10': { group: 'C', temp: 'M', anatomy: 'अग्न्याशय', action: 'मधुमेह + इंसुलिन' },
  'C-11': { group: 'C', temp: 'S', anatomy: 'हृदय मांसपेशी', action: 'हृदय मांसपेशी बल' },
  'C-16': { group: 'C', temp: 'L', anatomy: 'महिला जनन', action: 'PCOD + श्वेत प्रदर' },
  'F-1': { group: 'F', temp: 'N', anatomy: 'मस्तिष्क, CNS', action: 'तंत्रिका मास्टर' },
  'F-2': { group: 'F', temp: 'N', anatomy: 'बुखार', action: 'ज्वर + ताप' },
  'L-1': { group: 'L', temp: 'L', anatomy: 'प्लेटलेट, WBC', action: 'प्रतिरक्षा + प्लेटलेट' },
  'P-1': { group: 'P', temp: 'L', anatomy: 'फेफड़े ऊपर', action: 'श्वसन + खाँसी' },
  'P-3': { group: 'P', temp: 'L', anatomy: 'फेफड़े नीचे', action: 'दमा + पुरानी खाँसी' },
  'VEN-1': { group: 'V', temp: 'L', anatomy: 'वायरल', action: 'Viral + HCV सहायक' }
};

const RARE_MED_CODES = new Set(['S-7', 'S-8', 'S-9']);
const ELEC_CODE_LIST = ['B.E.', 'R.E.', 'G.E.', 'W.E.', 'Y.E.'];

/** 5 विद्युत — रोग + ध्रुवता (EH_Electricity_Formula_Cursor.docx) */
const ELECTRICITY_DB = {
  'B.E.': {
    name: 'नीली विद्युत (Blue Electricity)',
    prakriti: 'NEGATIVE (ऋणात्मक)',
    rog: 'HYPER — BP High, Heart, सूजन',
    action: 'धमनियों को संकुचित करती है। BP घटाती है। सूजन शांत करती है।',
    timing: 'ठंडे पानी में — माथे + हृदय पर 20 मिनट',
    points: 'Point 1 (माथा), Point 11 (हृदय)'
  },
  'R.E.': {
    name: 'लाल विद्युत (Red Electricity)',
    prakriti: 'POSITIVE (धनात्मक)',
    rog: 'HYPO — कमज़ोरी, Chronic, Anemia',
    action: 'निष्क्रिय कोशिकाओं को उत्तेजित करती है। ऊर्जा प्रवाह बहाल करती है।',
    timing: 'गर्म पानी में — प्रभावित अंग पर 20 मिनट',
    points: 'Point 30 (प्रभावित अंग)'
  },
  'G.E.': {
    name: 'हरी विद्युत (Green Electricity)',
    prakriti: 'NEUTRAL (संतुलन)',
    rog: 'जोड़, यूरिक, लसीका, गुर्दा',
    action: 'लसीका शुद्धि। जोड़ सूजन कम। यूरिक निकासी।',
    timing: 'प्रभावित जोड़ / गुर्दे के पास — 20 मिनट',
    points: 'Point 23, 24 (जोड़), Point 20, 21 (गुर्दा)'
  },
  'W.E.': {
    name: 'सफेद विद्युत (White Electricity)',
    prakriti: 'NEUTRAL (शांत)',
    rog: 'Anxiety, नींद, चक्कर, Nervous',
    action: 'तंत्रिका शांत। नींद। घबराहट दूर।',
    timing: 'Occiput + कनपटी — सोने से पहले 20 मिनट',
    points: 'Point 1 (Occiput), Point 2 (कनपटी)'
  },
  'Y.E.': {
    name: 'पीली विद्युत (Yellow Electricity)',
    prakriti: 'POSITIVE (उत्तेजक)',
    rog: 'बुखार, फेफड़े, श्वसन',
    action: 'बुखार उतार। फेफड़ों की लसीका शुद्धि।',
    timing: 'छाती अग्र + पश्च — 20 मिनट',
    points: 'Point 15 (छाती), Point 16 (पीठ)'
  }
};

function isElectricityCode(m) {
  const c = String(m || '')
    .trim()
    .toUpperCase()
    .replace(/-/g, '');
  return /^(BE|RE|GE|WE|YE)$/.test(c.replace(/\./g, '')) || /^[BRGWY]\.E\.?$/.test(c);
}

function formatMedicineCode(m) {
  if (!m) return '';
  if (isElectricityCode(m)) {
    return String(m).replace(/-/g, '').replace(/\./g, '').trim();
  }
  return String(m).replace(/-/g, '').replace(/\./g, '').trim();
}

const EH_EXPERT_DOCTRINE = `
आप अनुभवी Electro-Homeopathy (EH) विशेषज्ञ हैं — Count Cesare Mattei Blood + Lymph सिद्धांत।
डॉक्टर द्वारा दी गई रोगी जानकारी (लक्षण, BP, रिपोर्ट, अंग) के अनुसार ही निर्णय — किसी एक रोग की हार्डकोड सूची नहीं।
🩸 RAKT → SANGUINE → A-Group प्राथमिक | 💧 RAS → LYMPHATIC → S-Group प्राथमिक | 🧠 NERVOUS → F-Group प्राथमिक।
विद्युत मिश्रण A में एक बार; हर मिश्रण अलग दवाएँ; S-7/S-8/S-9 सामान्य रूप से नहीं।
`.trim();

const CONCISE_SUMMARY_INSTRUCTION =
  'Provide a concise clinical summary under 500 words focusing only on Temperament, Organ-System Mapping, and Medicine Formulation.';

function symptomText(input = {}) {
  const parts = [];
  (input.symptoms || []).forEach((s) => {
    parts.push(typeof s === 'object' ? s.name || s.hindi || '' : String(s));
  });
  if (input.chief_complaint) parts.push(input.chief_complaint);
  return buildComplaintLine(parts).toLowerCase();
}

function detectTemperament(input = {}) {
  if (input.temperament) {
    const t = String(input.temperament).toLowerCase();
    if (t.includes('sang')) return 'Sanguine';
    if (t.includes('lymph') || t.includes('ras')) return 'Lymphatic';
    if (t.includes('nerv')) return 'Nervous';
    if (t.includes('mix')) return 'Mixed';
  }
  const { bp_systolic = 120, pulse = 72, symptoms = [], report_values = {} } = input;
  const sym = symptomText({ symptoms, chief_complaint: input.chief_complaint });
  const rv = report_values || {};

  let RAKT = 0;
  let RAS = 0;
  let NERV = 0;

  if (bp_systolic >= 160) RAKT += 8;
  else if (bp_systolic >= 140) RAKT += 6;
  else if (bp_systolic >= 130) RAKT += 3;
  if (pulse > 90) RAKT += 4;
  else if (pulse > 80) RAKT += 2;
  if (bp_systolic < 100) RAS += 4;
  if (pulse < 65) RAS += 3;

  const RAKT_SYM = [
    'high bp', 'hypertension', 'dhadkan', 'sar dard', 'migraine', 'headache', 'red face', 'anger', 'gussa',
    'heart', 'hriday', 'cholesterol', 'stroke', 'bp'
  ];
  const RAS_SYM = [
    'sujan', 'swelling', 'ganth', 'gland', 'pale', 'motapa', 'sluggish', 'slow', 'kabz', 'tonsil',
    'uric', 'gout', 'arthritis', 'twacha', 'thyroid', 'diabetes', 'lymph', 'pathari', 'jod', 'joint',
    'kidney', 'gurda', 'eczema', 'fatigue', 'thakan', 'skin'
  ];
  const NERV_SYM = ['chakkar', 'vertigo', 'anxiety', 'ghabrahat', 'neend', 'insomnia', 'depression', 'stress', 'tremor'];

  RAKT_SYM.forEach((w) => { if (sym.includes(w)) RAKT += 3; });
  RAS_SYM.forEach((w) => { if (sym.includes(w)) RAS += 3; });
  NERV_SYM.forEach((w) => { if (sym.includes(w)) NERV += 4; });

  if (Number(rv.cholesterol) > 200) RAKT += 4;
  if (Number(rv.uric_acid) > 7) RAS += 6;
  if (bp_systolic >= 140) RAKT += 3;
  if (Number(rv.creatinine) > 1.2) RAS += 4;
  if (Number(rv.sugar_fast) > 126) RAS += 3;
  if (Number(rv.hemoglobin) < 12) RAS += 3;
  if (Number(rv.tsh) > 4) RAS += 3;
  if (Number(rv.sgpt) > 56) RAS += 3;
  if (Number(rv.pth) > 65) RAS += 4;

  const organs = input.affected_organs || [];
  const lymphLabDominant =
    Number(rv.uric_acid) > 7 ||
    Number(rv.creatinine) > 1.2 ||
    Number(rv.pth) > 65;
  const lymphSymDominant = ['uric', 'jod', 'sujan', 'arthritis', 'gout', 'kidney', 'gurda'].some((w) =>
    sym.includes(w)
  );
  const lymphOrganDominant = organs.some((o) => ['joints', 'kidney', 'urinary', 'skin'].includes(o));
  if (lymphLabDominant || (lymphSymDominant && lymphOrganDominant)) RAS += 6;

  console.log(`[TEMP] S=${RAKT} L=${RAS} N=${NERV}`);

  if (NERV >= 8 && NERV > RAKT && NERV > RAS) return 'Nervous';
  if ((lymphLabDominant || (lymphSymDominant && RAS >= 6)) && RAS >= RAKT) return 'Lymphatic';
  if (RAKT > RAS + 3 && RAKT >= 6) return 'Sanguine';
  if (RAS > RAKT + 3 && RAS >= 6) return 'Lymphatic';
  if (RAKT >= 4 && RAS >= 4) return 'Mixed';
  if (RAKT > RAS) return 'Sanguine';
  if (RAS >= RAKT) return 'Lymphatic';
  return 'Mixed';
}

function temperamentBloodLymphHi(temperament) {
  const map = {
    Sanguine: 'रक्त (RAKT) दोष — SANGUINE — A-Group (Angioitico) प्राथमिक',
    Lymphatic: 'रस (RAS) दोष — LYMPHATIC — S-Group (Scrofoloso) प्राथमिक',
    Nervous: 'स्नायु — NERVOUS — F-Group प्राथमिक',
    Mixed: 'रक्त + रस दोनों — MIXED — A+S+C संतुलन'
  };
  return map[temperament] || map.Mixed;
}

function formatFormula(medicines, potency) {
  if (!medicines?.length) return '--';
  const clean = medicines.filter(Boolean).map(formatMedicineCode);
  return `${clean.join(' + ')} ${String(potency || 'D10').split('/')[0]}`;
}

function detectPolarity(input = {}) {
  const { bp_systolic = 120, symptoms = [], phase = 'ACUTE', report_values = {} } = input;
  const sym = symptomText({ symptoms, chief_complaint: input.chief_complaint });
  let pos = 0;
  let neg = 0;
  if (bp_systolic >= 180) pos += 8;
  else if (bp_systolic >= 140) pos += 5;
  else if (bp_systolic < 90) neg += 6;
  ['sujan', 'fever', 'pain', 'dard', 'infection', 'uric', 'high', 'jalan', 'swelling'].forEach((w) => {
    if (sym.includes(w)) pos += 2;
  });
  ['kamzori', 'weakness', 'chakkar', 'pale', 'thakan', 'low', 'anemia', 'numbness'].forEach((w) => {
    if (sym.includes(w)) neg += 2;
  });
  Object.entries(report_values || {}).forEach(([k, v]) => {
    const r = LAB_RANGES[k];
    if (!r || v === '' || v == null) return;
    const num = Number(v);
    if (num > r.high) pos += 3;
    if (num < r.low) neg += 3;
  });
  const ph = String(phase || 'ACUTE').toUpperCase();
  if (['ACUTE', 'SUB_ACUTE'].includes(ph)) pos += 2;
  if (['CHRONIC', 'DEGENERATIVE'].includes(ph)) neg += 2;
  const isHyper = pos >= neg;
  let potency = 'D10';
  if (isHyper) potency = ph === 'CHRONIC' ? 'D30' : 'D10';
  else potency = ph === 'CHRONIC' ? 'D3' : 'D4';
  console.log(`[POL] pos=${pos} neg=${neg} → ${isHyper ? 'HYPER' : 'HYPO'} ${potency}`);
  return { isHyper, polarity: isHyper ? 'POSITIVE' : 'NEGATIVE', potency, polarityState: isHyper ? 'HYPER' : 'HYPO' };
}

function dedupeMeds(list = [], max = 4) {
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const m = String(raw || '').trim();
    if (!m) continue;
    if (isElectricityCode(m)) {
      const k = m.replace(/-/g, '').replace(/\./g, '').toUpperCase();
      if (!seen.has(k)) {
        seen.add(k);
        out.push(/\.E/i.test(m) ? m : `${m.replace(/\./g, '').charAt(0)}.E.`);
      }
      continue;
    }
    if (/\.E\./i.test(m)) continue;
    const k = m.replace(/-/g, '').replace(/\./g, '').toUpperCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(m.includes('-') ? m : m.replace(/^([A-Z])(\d+)$/i, '$1-$2'));
    if (out.length >= max) break;
  }
  return out;
}

/**
 * EH_AI_Expert_System.pdf — doctor input → scored pool → Mishran A/B/C
 * (Temperament + symptoms + organs + labs; no electricity in medicine list)
 */
function pickMedicinesFromDoctorInput(input, temperament) {
  const sym = symptomText(input);
  const orgs = input.affected_organs || [];
  const rv = input.report_values || {};
  const bp = input.bp_systolic ?? 120;
  const pool = {};

  const scoreMed = (m, sc) => {
    if (!m || ELEC_CODE_LIST.includes(m) || RARE_MED_CODES.has(m) || !MED_DB[m]) return;
    pool[m] = (pool[m] || 0) + sc;
  };

  const TEMP_MEDS = {
    Sanguine: [
      { m: 'A-1', s: 12 },
      { m: 'A-2', s: 10 },
      { m: 'A-3', s: 10 },
      { m: 'S-1', s: 4 },
      { m: 'C-11', s: 4 }
    ],
    Lymphatic: [
      { m: 'S-1', s: 12 },
      { m: 'S-10', s: 10 },
      { m: 'S-5', s: 8 },
      { m: 'C-5', s: 4 },
      { m: 'L-1', s: 4 }
    ],
    Nervous: [
      { m: 'F-1', s: 12 },
      { m: 'C-2', s: 10 },
      { m: 'S-1', s: 6 },
      { m: 'A-3', s: 4 }
    ],
    Mixed: [
      { m: 'S-1', s: 8 },
      { m: 'A-3', s: 8 },
      { m: 'C-4', s: 6 },
      { m: 'F-1', s: 4 }
    ]
  };
  (TEMP_MEDS[temperament] || TEMP_MEDS.Mixed).forEach(({ m, s }) => scoreMed(m, s));

  // P-Group STRICT: only score when lung symptoms present
  const HAS_LUNG =
    sym.includes('khansi') ||
    sym.includes('cough') ||
    sym.includes('saans') ||
    sym.includes('asthma') ||
    sym.includes('bronchitis') ||
    orgs.includes('lung');

  if (HAS_LUNG) {
    scoreMed('P-1', 8);
    scoreMed('P-3', 6);
  }

  // Symptom → medicine mapping (P-group only via HAS_LUNG above)
  const SYM_MAP = {
    uricacid: ['S-6', 'C-4'],
    uric: ['S-6', 'C-4'],
    joddard: ['C-4', 'S-5'],
    jod: ['C-4', 'S-5'],
    joint: ['C-4', 'S-5'],
    arthritis: ['C-4', 'S-5', 'S-6'],
    gout: ['S-6', 'C-4'],
    kabz: ['S-10', 'C-8'],
    constipation: ['S-10'],
    gas: ['S-10', 'F-1'],
    bloating: ['S-10'],
    bphigh: ['A-1'],
    highbp: ['A-1'],
    hypertension: ['A-1', 'A-2'],
    sardard: ['F-1', 'A-1'],
    headache: ['F-1', 'A-1'],
    migraine: ['F-1', 'A-2'],
    diabetes: ['C-10', 'S-2'],
    sugar: ['C-10'],
    thyroid: ['S-4', 'C-13'],
    hypothyroid: ['S-4'],
    chakkar: ['F-1'],
    vertigo: ['F-1', 'C-2'],
    anxiety: ['F-1', 'C-2'],
    ghabrahat: ['F-1'],
    neend: ['F-1'],
    insomnia: ['F-1', 'C-2'],
    kamzori: ['A-3', 'L-1'],
    weakness: ['A-3', 'C-1'],
    anemia: ['A-3', 'L-1'],
    // respiratory handled by HAS_LUNG scoring above
    khansi: HAS_LUNG ? ['P-1', 'P-3'] : [],
    cough: HAS_LUNG ? ['P-1'] : [],
    saans: HAS_LUNG ? ['P-1', 'P-3'] : [],
    asthma: HAS_LUNG ? ['P-3'] : [],
    twacha: ['S-5'],
    skin: ['S-5'],
    eczema: ['S-5'],
    liver: ['S-2', 'C-8'],
    jigar: ['S-2'],
    kidney: ['S-6', 'C-6'],
    gurda: ['S-6', 'C-6'],
    platelet: ['L-1'],
    dengue: ['L-1', 'A-3'],
    fever: ['F-2', 'F-1'],
    bukhar: ['F-2'],
    pcos: ['S-3', 'C-16'],
    pcod: ['S-3', 'C-16'],
    leucorrhoea: ['C-16', 'S-3'],
    sciatica: ['C-4', 'C-2'],
    scitica: ['C-4', 'C-2'],
    hcv: ['VEN-1'],
    viral: ['VEN-1'],
    sujan: ['S-5', 'S-6'],
    dhadkan: ['A-1', 'C-11'],
    heart: ['A-1', 'A-2']
  };
  // Additional direct symptom mappings (sonu requested)
  const EXTRA_SYM = {
    'kamar': ['C-4', 'C-2'],
    'kamar dard': ['C-4'],
    'pet saf': ['S-10'],
    'pet saf nahi': ['S-10'],
    'kabz': ['S-10'],
    'neend': ['F-1'],
    'nind': ['F-1'],
    'sir dard': ['F-1'],
    'bharipan': ['F-1'],
    'pairon mein': ['C-4', 'C-2'],
    'pairon mein dard': ['C-4', 'C-2'],
    'sunpan': ['C-2'],
    'numbness': ['C-2']
  };
  Object.entries(SYM_MAP).forEach(([kw, meds]) => {
    if (sym.includes(kw) && Array.isArray(meds)) meds.forEach((m) => scoreMed(m, 7));
  });

  const ORG_MAP = {
    kidney: ['S-6', 'C-6'],
    joints: ['C-4', 'S-5'],
    heart: ['A-1', 'A-2', 'C-11'],
    liver: ['S-2', 'C-8'],
    nervous: ['F-1', 'C-2'],
    digestive: ['S-10', 'C-8'],
    // lung symptoms handled via SYM_MAP to restrict P-group to symptom matches only
    skin: ['S-5'],
    blood: ['A-3', 'L-1'],
    endocrine: ['C-10', 'S-4'],
    urinary: ['S-6', 'C-17'],
    reproductive: ['S-3', 'C-16']
  };
  orgs.forEach((o) => (ORG_MAP[o] || []).forEach((m) => scoreMed(m, 8)));

  if (Number(rv.uric_acid) > 7) {
    scoreMed('S-6', 9);
    scoreMed('C-4', 7);
  }
  if (Number(rv.creatinine) > 1.2) {
    scoreMed('C-6', 9);
    scoreMed('S-6', 7);
  }
  if (Number(rv.sugar_fast) > 126) {
    scoreMed('C-10', 9);
    scoreMed('S-2', 5);
  }
  if (Number(rv.hemoglobin) < 10) {
    scoreMed('A-3', 9);
    scoreMed('L-1', 7);
  }
  if (Number(rv.pth) > 65) scoreMed('C-4', 10);
  if (Number(rv.sgpt) > 56) {
    scoreMed('S-2', 9);
    scoreMed('C-8', 5);
  }
  if (Number(rv.tsh) > 4) {
    scoreMed('S-4', 9);
    scoreMed('C-13', 5);
  }
  if (Number(rv.cholesterol) > 200) {
    scoreMed('A-1', 8);
    scoreMed('S-2', 4);
  }
  if (bp >= 140) scoreMed('A-1', 9);
  if (bp < 90) {
    scoreMed('A-3', 8);
    scoreMed('L-1', 6);
  }

  const sorted = Object.entries(pool)
    .filter(([m]) => !ELEC_CODE_LIST.includes(m) && !RARE_MED_CODES.has(m) && MED_DB[m])
    .sort(([, a], [, b]) => b - a)
    .map(([m]) => m);

  console.log('[MEDS] Top8:', sorted.slice(0, 8).join(', '));

  // Dynamic Formula A: Top 3-4 medicines
  let FA = sorted.slice(0, 4);
  const hasCreatinine = Number(rv.creatinine || 0) > 1.2;
  if (!hasCreatinine) {
    FA = FA.filter((m) => String(m).toUpperCase() !== 'C-6').slice(0, 4);
  }

  // Dynamic Formula B: Next 3 medicines
  const FB = sorted.filter(m => !FA.includes(m)).slice(0, 3);

  // Dynamic Formula C: Next 3 medicines
  const FC = sorted.filter(m => !FA.includes(m) && !FB.includes(m)).slice(0, 3);

  return { FA, FB, FC, PRIMARY: FA, ORGAN: sorted };
}

function selectMedicinesByTemperament(input, temperament) {
  const { FA, FB, FC, PRIMARY, ORGAN } = pickMedicinesFromDoctorInput(input, temperament);
  const fa_meds = dedupeMeds(FA, 4);
  const fb_meds = dedupeMeds(FB, 3);
  const fc_meds = dedupeMeds(FC, 3);
  console.log('Mishran A:', fa_meds.join('+'));
  console.log('Mishran B:', fb_meds.join('+'));
  console.log('Mishran C:', fc_meds.join('+'));
  return { fa_meds, fb_meds, fc_meds, PRIMARY, ORGAN };
}

function selectMedicines(input, temperament, polData) {
  const { phase = 'ACUTE' } = input;
  const pot = polData.potency;
  const fcPot = String(phase).toUpperCase() === 'CHRONIC' ? (polData.isHyper ? 'D30' : 'D3') : pot;
  const { fa_meds, fb_meds, fc_meds, PRIMARY, ORGAN } = selectMedicinesByTemperament(input, temperament);

  return {
    formula_a: {
      medicines: fa_meds,
      formatted: formatFormula(fa_meds, pot),
      potency: pot,
      timing: 'भोजन से 30 मिनट पहले',
      dose: 10,
      purpose: `${temperament} — ${temperamentBloodLymphHi(temperament)}`
    },
    formula_b: {
      medicines: fb_meds,
      formatted: formatFormula(fb_meds, pot),
      potency: pot,
      timing: 'भोजन के 30 मिनट बाद',
      dose: 10,
      purpose: 'यकृत + गुर्दा सहायक'
    },
    formula_c: {
      medicines: fc_meds,
      formatted: formatFormula(fc_meds, fcPot),
      potency: fcPot,
      timing: 'रात सोने से पहले',
      dose: 10,
      purpose: 'रात्रि गहरी चिकित्सा'
    },
    formula_d: {
      medicines: [],
      potency: 'D3',
      timing: 'बाह्य कंप्रेस 20 मिनट',
      external: true,
      purpose: 'मलहम D3'
    },
    all_medicines: dedupeMeds([...fa_meds, ...fb_meds, ...fc_meds], 12),
    PRIMARY,
    ORGAN
  };
}

/** Rog + polarity → B.E./R.E./G.E./W.E./Y.E. (formula A में शामिल) */
function selectElectricityForFormula(input = {}, isHyper = true) {
  const {
    bp_systolic = 120,
    bp_diastolic = 80,
    symptoms = [],
    affected_organs = [],
    report_values = {}
  } = input;
  const sym = symptomText({ symptoms, chief_complaint: input.chief_complaint });
  const orgs = affected_organs || [];
  const rv = report_values || {};

  if (bp_systolic < 90 || bp_diastolic < 60) {
    console.log('Electricity: R.E. (BP LOW)');
    return 'R.E.';
  }

  const lymphElecCase =
    (rv.uric_acid != null && Number(rv.uric_acid) > 7) ||
    (rv.creatinine != null && Number(rv.creatinine) > 1.2) ||
    (rv.pth != null && Number(rv.pth) > 65) ||
    orgs.includes('joints') ||
    orgs.includes('kidney') ||
    orgs.includes('urinary') ||
    sym.includes('jod') ||
    sym.includes('uric') ||
    sym.includes('sujan') ||
    sym.includes('arthritis') ||
    sym.includes('gout');

  if (lymphElecCase) {
    console.log('Electricity: G.E. (JOINT/KIDNEY/URIC — doctor input)');
    return 'G.E.';
  }

  if (
    bp_systolic >= 140 ||
    orgs.includes('heart') ||
    sym.includes('bp') ||
    sym.includes('dhadkan') ||
    sym.includes('hypertension') ||
    sym.includes('heart') ||
    (rv.cholesterol != null && Number(rv.cholesterol) > 220)
  ) {
    console.log('Electricity: B.E. (BP HIGH/HEART)');
    return 'B.E.';
  }

  if (
    bp_systolic >= 90 &&
    bp_systolic < 130 &&
    (orgs.includes('nervous') ||
      sym.includes('chakkar') ||
      sym.includes('neend') ||
      sym.includes('anxiety') ||
      sym.includes('ghabrahat'))
  ) {
    console.log('Electricity: W.E. (NERVOUS, BP normal)');
    return 'W.E.';
  }

  if (
    orgs.includes('lung') ||
    sym.includes('bukhar') ||
    sym.includes('fever') ||
    sym.includes('khansi')
  ) {
    console.log('Electricity: Y.E. (LUNG/FEVER)');
    return 'Y.E.';
  }

  if (orgs.includes('skin') || sym.includes('twacha')) return 'B.E.';

  if (
    !isHyper ||
    sym.includes('kamzori') ||
    sym.includes('weakness') ||
    sym.includes('thakan') ||
    sym.includes('anemia') ||
    (rv.hemoglobin != null && Number(rv.hemoglobin) < 10)
  ) {
    console.log('Electricity: R.E. (HYPO)');
    return 'R.E.';
  }

  const def = isHyper ? 'B.E.' : 'R.E.';
  console.log(`Electricity: ${def} (DEFAULT)`);
  return def;
}

function electricityMeta(code) {
  const info = ELECTRICITY_DB[code] || ELECTRICITY_DB['B.E.'];
  return {
    elec: code,
    loc: info.timing,
    points: info.points,
    prakriti: info.prakriti,
    name: info.name,
    action: info.action,
    rog: info.rog
  };
}

function selectElectricity(affected_organs = [], symText = '', isHyper = true, bp = 120, input = {}) {
  const code = selectElectricityForFormula(
    {
      ...input,
      affected_organs,
      bp_systolic: input.bp_systolic ?? bp,
      symptoms: input.symptoms?.length ? input.symptoms : symText ? [{ name: symText }] : []
    },
    isHyper
  );
  return electricityMeta(code);
}

/** Book knowledge.json → formulas (EH_Book_Extraction doc) */
function buildFormulasFromKnowledge(kr, input, temperament, polData) {
  const elecCode = selectElectricityForFormula(input, polData.isHyper);
  const elecInfo = ELECTRICITY_DB[elecCode] || ELECTRICITY_DB['B.E.'];
  const potency = kr.mainPotency || polData.potency;
  const fcPot =
    String(input.phase || 'ACUTE').toUpperCase() === 'CHRONIC'
      ? polData.isHyper
        ? 'D30'
        : 'D3'
      : potency;
  const FA = (kr.FA || []).filter((m) => !isElectricityCode(m));
  const FA_with_elec = dedupeMeds([...FA, elecCode], 5);
  console.log('Electricity:', elecCode);
  console.log('FA before elec:', FA);
  console.log('FA with elec:', FA_with_elec);
  const fa_meds = FA_with_elec;
  const fb_meds = dedupeMeds(kr.FB || [], 3);
  const fc_meds = dedupeMeds(kr.FC || [], 3);

  return {
    elecCode,
    elecInfo,
    electricity: electricityMeta(elecCode),
    formula_a: {
      medicines: fa_meds,
      formatted: formatFormula(fa_meds, potency),
      potency,
      timing: 'भोजन से 30 मिनट पहले',
      dose: 10,
      purpose: `${temperament} — मुख्य रोग + ${elecInfo.name}`,
      reasons: (kr.FA || []).map((c) => kr.medReasons?.[c]?.action || c),
      note: `${elecCode} — ${elecInfo.action}`,
      source: kr.source
    },
    formula_b: {
      medicines: fb_meds,
      formatted: formatFormula(fb_meds, potency),
      potency,
      timing: 'भोजन के 30 मिनट बाद',
      dose: 10,
      purpose: 'यकृत + गुर्दा सहायक',
      reasons: (kr.FB || []).map((c) => kr.medReasons?.[c]?.action || c)
    },
    formula_c: {
      medicines: fc_meds,
      formatted: formatFormula(fc_meds, fcPot),
      potency: fcPot,
      timing: 'रात सोने से पहले',
      dose: 10,
      purpose: 'रात्रि गहरी चिकित्सा',
      reasons: (kr.FC || []).map((c) => kr.medReasons?.[c]?.action || c)
    },
    formula_d: {
      medicines: [elecCode],
      formatted: `${formatMedicineCode(elecCode)} D3`,
      potency: 'D3 (बाहरी)',
      purpose: `बाहरी विद्युत — ${elecInfo.name}`,
      timing: 'सुबह + शाम 20 मिनट',
      location: elecInfo.timing,
      points: elecInfo.points,
      prakriti: elecInfo.prakriti,
      external: true,
      dose: 'बाह्य — पीना नहीं'
    },
    all_medicines: dedupeMeds([...fa_meds, ...fb_meds, ...fc_meds], 12),
    medReasons: kr.medReasons || {},
    top_scored: kr.top_scored || [],
    PRIMARY: kr.FA,
    ORGAN: []
  };
}

/** मिश्रण A में विद्युत + B/C/D अलग (internal + external malam) */
function buildFormulasWithElectricity(input, temperament, polData) {
  const medPack = selectMedicines(input, temperament, polData);
  const electricity = selectElectricityForFormula(input, polData.isHyper);
  const elecInfo = ELECTRICITY_DB[electricity] || ELECTRICITY_DB['B.E.'];
  const FA = (medPack.formula_a.medicines || []).filter((m) => !isElectricityCode(m));
  const FA_with_elec = dedupeMeds([...FA, electricity], 5);
  console.log('Electricity:', electricity);
  console.log('FA before elec:', FA);
  console.log('FA with elec:', FA_with_elec);
  const fa_meds = FA_with_elec;
  const elecCode = electricity;

  return {
    elecCode,
    elecInfo,
    electricity: electricityMeta(elecCode),
    formula_a: {
      ...medPack.formula_a,
      medicines: fa_meds,
      formatted: formatFormula(fa_meds, polData.potency),
      note: `${elecCode} — ${elecInfo.action}`,
      purpose: `${temperament} — मुख्य रोग + ${elecInfo.name}`
    },
    formula_b: medPack.formula_b,
    formula_c: medPack.formula_c,
    formula_d: {
      medicines: [elecCode],
      formatted: `${formatMedicineCode(elecCode)} D3`,
      potency: 'D3 (बाहरी)',
      purpose: `बाहरी विद्युत — ${elecInfo.name}`,
      timing: 'सुबह + शाम 20 मिनट',
      location: elecInfo.timing,
      points: elecInfo.points,
      prakriti: elecInfo.prakriti,
      external: true,
      dose: 'बाह्य — पीना नहीं'
    },
    all_medicines: medPack.all_medicines,
    PRIMARY: medPack.PRIMARY,
    ORGAN: medPack.ORGAN
  };
}

function buildClinicalData(input = {}) {
  const blob = symptomText(input);
  const affected_organs =
    input.affected_organs?.length > 0
      ? input.affected_organs
      : detectAffectedOrgans(blob, input.report_values || {});
  const enriched = { ...input, affected_organs };
  const temperament = detectTemperament(enriched);
  const polData = detectPolarity(enriched);
  
  // Rule engine v4 (Doctor input based)
  console.log('[RULES] Using rule engine');
  const built = buildFormulasWithElectricity(enriched, temperament, polData);
  
  const formulas = {
    formula_a: built.formula_a,
    formula_b: built.formula_b,
    formula_c: built.formula_c,
    formula_d: built.formula_d,
    all_medicines: built.all_medicines,
    electricity: built.elecCode
  };
  const labFindings = analyzeLabReports(input.report_values || {});
  const bloodLymphHi = temperamentBloodLymphHi(temperament);
  console.log('='.repeat(45));
  console.log(`Temperament : ${temperament} | ${bloodLymphHi}`);
  console.log(`Polarity : ${polData.polarity} | Potency : ${polData.potency}`);
  console.log(`Electricity : ${built.elecCode} (${built.elecInfo.prakriti})`);
  console.log(`Formula A : ${built.formula_a.formatted}`);
  console.log(`Formula B : ${built.formula_b.formatted}`);
  console.log(`Formula C : ${built.formula_c.formatted}`);
  console.log(`Malam D : ${built.formula_d.formatted}`);
  console.log('='.repeat(45));
  return {
    temperament,
    polData,
    formulas,
    elecCode: built.elecCode,
    electricity: built.electricity,
    elecInfo: built.elecInfo,
    labFindings,
    affected_organs,
    bloodLymphHi,
    medReasons: built.medReasons || {},
    selection_source: built.formula_a?.source || 'rule-engine'
  };
}

function caseToEngineInput(caseData = {}) {
  const patient = caseData.patient || {};
  const analysis = caseData.analysis || {};
  const symptoms = [];
  if (patient.chiefComplaint) symptoms.push({ name: patient.chiefComplaint });
  if (analysis.chief_complaint) symptoms.push({ name: analysis.chief_complaint });
  (patient.symptoms || []).forEach((s) => symptoms.push(typeof s === 'object' ? s : { name: String(s) }));
  const blob = buildComplaintLine(symptoms.map((s) => s.name || ''));
  return {
    age: patient.age ?? 30,
    gender: patient.gender || 'Male',
    weight: patient.weight ?? 60,
    bp_systolic: patient.bp_systolic ?? 120,
    bp_diastolic: patient.bp_diastolic ?? 80,
    pulse: patient.pulse ?? 72,
    phase: analysis.phase || caseData.expert?.phase || 'ACUTE',
    temperament: analysis.temperament,
    symptoms,
    chief_complaint: analysis.chief_complaint || patient.chiefComplaint || '',
    report_values: analysis.report_values || {},
    blood_report: analysis.report_text || '',
    affected_organs: detectAffectedOrgans(blob, analysis.report_values || {})
  };
}

function enrichCaseWithSourceOfTruth(caseData = {}) {
  if (process.env.EH_USE_SOURCE_OF_TRUTH === '0') return caseData;
  
  // If API analysis is already present, prioritize it
  const ehInfo = caseData.eh_analysis?.success ? caseData.eh_analysis.data : (caseData.eh_analysis || null);
  
  const input = caseToEngineInput(caseData);
  const cd = buildClinicalData(input);
  const elecCode = ehInfo?.electricity?.elec || cd.electricity.elec.replace(/\s*\(.*\)/, '').trim();
  
  const baseConf = 70;
  const labBoost = cd.labFindings.length * 4;
  const topScore = cd.top_scored?.[0]?.score || 0;
  const scoreBoost = Math.floor(topScore / 10);
  
  // Formulas from API or Node engine
  let formulas;
  let engineName = 'Node Rule Engine v4';
  let finalConfidence = Math.min(baseConf + labBoost + scoreBoost, 98);

  if (ehInfo && ehInfo.mixtures) {
    engineName = 'EH AI Expert (FastAPI)';
    finalConfidence = 95;
    formulas = {
      formula_a: {
        medicines: ehInfo.mixtures[0]?.medicines || [],
        formatted: ehInfo.mixtures[0]?.formula_obj?.full || ehInfo.mixtures[0]?.fo?.full || '--',
        potency: ehInfo.potency?.potency || 'D10',
        timing: ehInfo.mixtures[0]?.schedule || 'भोजन से पहले',
        purpose: ehInfo.mixtures[0]?.purpose || 'मुख्य रोग'
      },
      formula_b: {
        medicines: ehInfo.mixtures[1]?.medicines || [],
        formatted: ehInfo.mixtures[1]?.formula_obj?.full || ehInfo.mixtures[1]?.fo?.full || '--',
        potency: ehInfo.potency?.potency || 'D10',
        timing: ehInfo.mixtures[1]?.schedule || 'भोजन के बाद',
        purpose: ehInfo.mixtures[1]?.purpose || 'सहायक'
      },
      formula_c: {
        medicines: ehInfo.mixtures[2]?.medicines || [],
        formatted: ehInfo.mixtures[2]?.formula_obj?.full || ehInfo.mixtures[2]?.fo?.full || '--',
        potency: ehInfo.potency?.potency || 'D10',
        timing: ehInfo.mixtures[2]?.schedule || 'सोते समय',
        purpose: ehInfo.mixtures[2]?.purpose || 'रात्रि चिकित्सा'
      },
      formula_d: {
        medicines: ehInfo.mixtures[3]?.medicines || [],
        formatted: ehInfo.mixtures[3]?.formula_obj?.full || ehInfo.mixtures[3]?.fo?.full || '--',
        potency: 'D3',
        timing: 'बाह्य',
        external: true,
        purpose: 'मलहम'
      },
      potency: ehInfo.potency?.potency || 'D10',
      electricity_code: elecCode,
      confidence: finalConfidence
    };
  } else {
    formulas = syncFormulaElectricity(
      {
        formula_a: {
          ...cd.formulas.formula_a,
          medicines: applyHighBpAngiticoRule(cd.formulas.formula_a.medicines, input.bp_systolic)
        },
        formula_b: {
          ...cd.formulas.formula_b,
          medicines: applyHighBpAngiticoRule(cd.formulas.formula_b.medicines, input.bp_systolic)
        },
        formula_c: {
          ...cd.formulas.formula_c,
          medicines: applyHighBpAngiticoRule(cd.formulas.formula_c.medicines, input.bp_systolic)
        },
        formula_d: {
          ...cd.formulas.formula_d,
          medicines: [elecCode]
        },
        potency: cd.polData.potency,
        electricity_code: extractLockedElectricityCode(elecCode),
        temperament_key: cd.temperament,
        confidence: finalConfidence
      },
      elecCode
    );
  }

  return {
    ...caseData,
    medicines: formulas,
    confidence: finalConfidence,
    expert: {
      ...(caseData.expert || {}),
      ok: true,
      formulas,
      formula_medicines: formulas.formula_a?.medicines || [],
      potency: ehInfo?.potency?.potency || cd.polData.potency,
      electricity: elecCode,
      phase: input.phase,
      overall_polarity: ehInfo?.polarity?.polarity || cd.polData.polarity,
      temperament: (ehInfo?.prakriti?.prakriti || cd.temperament).toLowerCase(),
      eh_clinical: cd,
      confidence: finalConfidence,
      engine: engineName,
      reasoning_trace: ehInfo ? [
        'EH AI Expert (FastAPI) Analysis:',
        `प्रकृति: ${ehInfo.prakriti?.prakriti_hindi || '—'}`,
        `ध्रुवता: ${ehInfo.polarity?.polarity || '—'} → ${ehInfo.potency?.potency || '—'}`,
        `अंग: ${ehInfo.active_systems?.join(', ') || '—'}`,
        `A: ${formulas.formula_a?.formatted}`,
        `विद्युत: ${ehInfo.electricity?.elec || elecCode}`,
        'Source: 9 Rule Engines API'
      ] : [
        'EH Complete Engine (PDF Final):',
        `प्रकृति: ${cd.temperament}`,
        `ध्रुवता: ${cd.polData.polarity} → ${cd.polData.potency}`,
        `अंग: ${cd.affected_organs.join(', ') || '—'}`,
        `Lab: ${cd.labFindings.length} मिले`,
        `A: ${formulas.formula_a?.formatted || (formulas.formula_a?.medicines || []).join(' + ')}`,
        `विद्युत: ${cd.elecInfo?.name || elecCode} (${cd.elecInfo?.prakriti || ''}) — ${cd.formulas?.formula_a?.note || ''}`,
        `Source: ${cd.selection_source || 'rule-engine'}`
      ]
    },
    potency: ehInfo?.potency?.potency || cd.polData.potency,
    electricity: elecCode,
    analysis: {
      ...(caseData.analysis || {}),
      temperament: ehInfo?.prakriti?.prakriti || cd.temperament,
      eh_groups: (ehInfo?.prakriti?.prakriti || cd.temperament) === 'Sanguine' ? 'A' : (ehInfo?.prakriti?.prakriti || cd.temperament) === 'Lymphatic' ? 'S' : 'A+S+C',
      report_values: input.report_values,
      affected_organs: ehInfo?.active_systems || cd.affected_organs
    },
    clinical_summary: caseData.clinical_summary || caseData.summary || ehInfo?.clinical_summary || ehInfo?.summary || ehInfo?.parcha || cd.parcha || '',
    summary: caseData.summary || caseData.clinical_summary || ehInfo?.summary || ehInfo?.clinical_summary || ehInfo?.parcha || cd.parcha || ''
  };
}

function formatDoctrineForOllama(doctrine = {}, rules = {}, formulas = {}) {
  const fa = (formulas.formula_a?.medicines || []).join(' + ');
  return [
    '### EH SOURCE OF TRUTH',
    `प्रकृति: ${doctrine.temperament || '—'}`,
    `पोटेंसी: ${rules.potency || doctrine.potency}`,
    `विद्युत: ${rules.masterElectricity || doctrine.electricity}`,
    `मिश्रण A: ${fa}`,
    CONCISE_SUMMARY_INSTRUCTION
  ].join('\n');
}

module.exports = {
  EH_EXPERT_DOCTRINE,
  CONCISE_SUMMARY_INSTRUCTION,
  MED_DB,
  ELECTRICITY_DB,
  isElectricityCode,
  buildClinicalData,
  detectTemperament,
  detectPolarity,
  selectMedicines,
  selectMedicinesByTemperament,
  pickMedicinesFromDoctorInput,
  buildFormulasWithElectricity,
  selectElectricityForFormula,
  temperamentBloodLymphHi,
  selectElectricity,
  analyzeLabReports,
  enrichCaseWithSourceOfTruth,
  caseToEngineInput,
  formatDoctrineForOllama
};
