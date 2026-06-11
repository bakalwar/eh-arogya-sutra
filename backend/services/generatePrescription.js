'use strict';

/**
 * Full automated prescription — DOCX spec + dynamicEhRules.json lock.
 * Temperament + organ + lab + symptom medicine pool; 6-timing tablet chart.
 */
const { determineUniversalClinicalRules } = require('./generateClinicalSummary');
const { NO_APPLICABLE_RULE_MESSAGE } = require('../constants/noApplicableRule');
const {
  syncFormulaElectricity,
  extractLockedElectricityCode,
  applyHighBpAngiticoRule
} = require('./potencyEngine');
const { scrubForbiddenElectricity } = require('../utils/summaryJsonCleaner');
const {
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
} = require('./prescriptionEngineData');

function normMedKey(raw) {
  return String(raw || '')
    .replace(/-/g, '')
    .replace(/\./g, '')
    .toUpperCase()
    .trim();
}

/** Display: S1 / s-1 → S-1; electricity codes unchanged */
function canonicalMedicineCode(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (isFluidCode(s)) {
    const m = s.match(/\b(RE|BE|WE|GE|YE)\b/i);
    return m ? m[1].toUpperCase() : s.toUpperCase();
  }
  const k = normMedKey(s);
  const m = k.match(/^([A-Z])(\d+)$/);
  if (m) return `${m[1]}-${m[2]}`;
  return s;
}

function addMedicineToPool(pool, med, score = 1) {
  const canon = canonicalMedicineCode(med);
  if (!canon || isFluidCode(canon)) return;
  const key = normMedKey(canon);
  pool[key] = (pool[key] || 0) + score;
}

/** Remove S-1 vs S1 duplicates; optional max count */
function dedupeMedicineList(list = [], max = 0) {
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const canon = canonicalMedicineCode(raw);
    const key = normMedKey(canon);
    if (!key || isFluidCode(canon)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(canon);
    if (max > 0 && out.length >= max) break;
  }
  return out;
}

function isFluidCode(code) {
  return FLUID_RE.test(String(code || '').trim());
}

function buildCleanFormula(medicines, potency) {
  const internal = dedupeMedicineList(medicines || []).filter((m) => m && !isFluidCode(m));
  if (!internal.length) return '--';
  const clean = internal.map((m) => String(m).replace(/-/g, '').replace(/\./g, '').trim());
  const pot = String(potency || 'D10').split('/')[0];
  return `${clean.join(' + ')} ${pot}`;
}

function getDose(age = 30) {
  return age <= 12 ? 5 : age > 60 ? 7 : 10;
}

function inferTemperament(input = {}) {
  const t = String(input.temperament || '').toUpperCase();
  if (t.includes('SANGUINE') || t.includes('रक्त')) return 'SANGUINE';
  if (t.includes('LYMPHATIC') || t.includes('रस')) return 'LYMPHATIC';
  if (t.includes('NERVOUS') || t.includes('स्नायु')) return 'NERVOUS';
  if (t.includes('MIXED') || t.includes('मिश्र')) return 'MIXED';
  const sys = Number(input.bp_systolic);
  if (Number.isFinite(sys) && sys > 130) return 'SANGUINE';
  return 'LYMPHATIC';
}

function getMedInfo(med) {
  const k = normMedKey(med);
  return MED_INFO_HI[k] || { name: med, reason: 'EH formula — temperament/organ match' };
}

function expandOrgansForPool(affected_organs = []) {
  const keys = new Set();
  for (const org of affected_organs) {
    const o = String(org || '').toLowerCase();
    keys.add(o);
    const aliases = ORGAN_ALIAS[o];
    if (aliases) aliases.forEach((a) => keys.add(a));
  }
  return [...keys];
}

function boostExpertMedicines(pool, formulas = {}) {
  ['formula_a', 'formula_b', 'formula_c', 'formula_d'].forEach((slot) => {
    const meds = formulas[slot]?.medicines;
    if (!Array.isArray(meds)) return;
    meds.forEach((m) => addMedicineToPool(pool, m, 9));
  });
}

/**
 * Automated medicine selection — DOCX scoring pool (no legacy electricity in pool).
 */
function selectMedicines(input = {}, rules = {}) {
  const {
    temperament: tempIn,
    affected_organs = [],
    report_values = {},
    symptoms = [],
    phase = 'ACUTE',
    age = 30,
    formulas: expertFormulas = {}
  } = input;

  const potency = rules.potency;
  const tempKey = inferTemperament({ ...input, temperament: tempIn });
  const tempInfo = TEMPERAMENT_MEDICINES[tempKey] || TEMPERAMENT_MEDICINES.MIXED;
  const pool = {};

  tempInfo.primary_medicines.forEach((m) => addMedicineToPool(pool, m, 8));

  expandOrgansForPool(affected_organs).forEach((organ) => {
    const orgInfo = ORGAN_MEDICINES[organ];
    if (!orgInfo) return;
    orgInfo.primary.forEach((m) => addMedicineToPool(pool, m, 7));
    orgInfo.support.forEach((m) => addMedicineToPool(pool, m, 4));
  });

  Object.entries(report_values).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    const num = Number(v);
    const key = String(k).toLowerCase().replace(/\s+/g, '_');
    if (LAB_HIGH[key] != null && num > LAB_HIGH[key]) {
      const rk = `${key}_high`;
      (REPORT_MEDICINES[rk] || REPORT_MEDICINES[key] || []).forEach((m) => addMedicineToPool(pool, m, 6));
    }
    if (LAB_LOW[key] != null && num < LAB_LOW[key]) {
      const rk = `${key}_low`;
      (REPORT_MEDICINES[rk] || []).forEach((m) => addMedicineToPool(pool, m, 6));
    }
  });

  const sys = Number(input.bp_systolic);
  if (Number.isFinite(sys)) {
    if (sys >= 140) {
      REPORT_MEDICINES.bp_high.forEach((m) => addMedicineToPool(pool, m, 6));
    }
    if (sys < 100) {
      REPORT_MEDICINES.bp_low.forEach((m) => addMedicineToPool(pool, m, 6));
    }
  }

  const symText = (symptoms || [])
    .map((s) => (typeof s === 'object' ? s.name || s.hindi || '' : String(s)))
    .join(' ')
    .toLowerCase();

  SYMPTOM_MEDICINES.forEach(({ keys, meds }) => {
    if (keys.some((w) => symText.includes(w))) {
      meds.forEach((m) => addMedicineToPool(pool, m, 5));
    }
  });

  boostExpertMedicines(pool, expertFormulas);

  const g = String(input.gender || '').toLowerCase();
  const isMale = g.includes('male') || g.includes('पुरुष') || g === 'm';
  const REPRODUCTIVE = new Set(['C16', 'C3', 'S3']);

  const sorted = Object.entries(pool)
    .filter(([m]) => {
      if (isFluidCode(m)) return false;
      if (isMale && REPRODUCTIVE.has(normMedKey(m))) return false;
      return true;
    })
    .sort(([, a], [, b]) => b - a)
    .map(([k]) => canonicalMedicineCode(k));

  const internal = dedupeMedicineList(
    sorted.length ? sorted : tempInfo.primary_medicines,
    16
  );
  const ph = String(phase || 'ACUTE').toUpperCase().replace(/-/g, '_');
  const fcPot =
    ph === 'CHRONIC' || ph === 'DEGENERATIVE'
      ? rules.isHyper
        ? 'D30'
        : 'D3'
      : potency;

  const elecCode = extractLockedElectricityCode(rules.masterElectricity);

  let faMeds = dedupeMedicineList(
    applyHighBpAngiticoRule(internal.slice(0, 4), input.bp_systolic),
    4
  );
  const usedA = new Set(faMeds.map(normMedKey));
  const fbPool = internal.filter((m) => !usedA.has(normMedKey(m)));
  let fbMeds = dedupeMedicineList(
    applyHighBpAngiticoRule(
      fbPool.slice(0, 3).length ? fbPool.slice(0, 3) : internal.slice(4, 7),
      input.bp_systolic
    ),
    3
  );
  const usedB = new Set([...usedA, ...fbMeds.map(normMedKey)]);
  const fcPool = internal.filter((m) => !usedB.has(normMedKey(m)));
  const fcSource =
    fcPool.length >= 2
      ? fcPool.slice(0, 4)
      : dedupeMedicineList(['S-1', 'S-10', ...internal], 4);
  let fcMeds = dedupeMedicineList(applyHighBpAngiticoRule(fcSource, input.bp_systolic), 3);
  fcMeds = fcMeds.filter((m) => !usedB.has(normMedKey(m)));
  if (!fcMeds.length) {
    fcMeds = dedupeMedicineList(
      ['S-10', 'C-8', 'F-1', ...internal].filter((m) => !usedB.has(normMedKey(m))),
      3
    );
  }

  const formulaPayload = {
    formula_a: {
      medicines: faMeds,
      potency,
      timing: 'भोजन से 30 मिनट पहले',
      dose: getDose(age),
      purpose: `${tempInfo.description} — ${tempInfo.logic}`
    },
    formula_b: {
      medicines: fbMeds,
      potency,
      timing: 'भोजन के 30 मिनट बाद',
      dose: getDose(age),
      purpose: 'सहायक उपचार — प्रभावित अंग'
    },
    formula_c: {
      medicines: fcMeds,
      potency: fcPot,
      timing: 'रात सोने से पहले',
      dose: getDose(age),
      purpose: 'रात्रि गहरी चिकित्सा'
    },
    formula_d: {
      medicines: [elecCode],
      potency: 'D3',
      timing: 'दिन में 2 बार — 20 मिनट',
      dose: 'बाह्य — पीना नहीं',
      external: true,
      location: rules.externalLocation || 'प्रभावित अंग पर',
      purpose: 'बाह्य विद्युत चिकित्सा (rule lock)'
    },
    potency,
    electricity: rules.masterElectricity,
    electricity_code: elecCode,
    electricity_location: rules.externalLocation,
    temperament_info: tempInfo,
    temperament_key: tempKey,
    confidence: Math.min(65 + Object.keys(pool).length * 2, 95),
    medicine_pool: pool
  };

  return syncFormulaElectricity(formulaPayload, elecCode);
}

function buildPreparationSteps(medicines, potency, label) {
  const lines = [
    '**बनाने की विधि (1:9 Spagyric):**',
    '1. 30 ml स्वच्छ कांच की शीशी लें',
    ...medicines.filter((m) => !isFluidCode(m)).map((m, i) => `${i + 2}. **${m}** की 5 बूंदें डालें`),
    `${medicines.filter((m) => !isFluidCode(m)).length + 2}. शेष भाग Distilled Water (D.W.) से भरें`,
    `${medicines.filter((m) => !isFluidCode(m)).length + 3}. 100 बार मजबूत strokes दें → **${label} (${potency}) तैयार!**`
  ];
  return lines;
}

function buildTabletChart(dose, formulas, waterInstruction, electricityLabel, location) {
  const fa = formulas.formula_a;
  const fb = formulas.formula_b;
  const fc = formulas.formula_c;
  const rows = [
    ['🌅 **सुबह खाली पेट (6-7 बजे)**', 'मिश्रण A', String(dose), 'चयापचय सक्रिय, विश निकासी'],
    ['☕ **नाश्ते के 30 मिनट बाद**', 'मिश्रण B', String(dose), 'सोजन कम, रस शुद्धि'],
    ['☀️ **दोपहर भोजन से 30 मिनट पहले**', 'मिश्रण A', String(dose), 'Toxin control'],
    ['🍽️ **दोपहर भोजन के 30 मिनट बाद**', 'मिश्रण B', String(dose), 'गहरी चिकित्सा'],
    ['🌙 **रात भोजन से 30 मिनट पहले**', 'मिश्रण A', String(dose), 'रात्रि शुद्धि'],
    ['💤 **सोते समय**', 'मिश्रण C', String(dose), 'पुनर्निर्माण']
  ];
  const lines = [
    '## ⏰ दैनिक खुराक समय सारणी (6-Timing Tablet Chart)',
    '',
    `> **सेवन विधि:** ठीक **${dose} बूंदें** आधे कप पानी में; rule lock: ${waterInstruction}`,
    '',
    '| समय | मिश्रण | बूंदें | मुख्य लाभ |',
    '|-----|--------|-------|-----------|'
  ];
  rows.forEach((r) => lines.push(`| ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]} |`));
  lines.push(
    '',
    `| ⚡ **बाह्य विद्युत** | मिश्रण D Compress | — | **${electricityLabel}** @ ${location} |`,
    ''
  );
  return lines;
}

function buildDietSection(report_values = {}) {
  const lines = [
    '## 🥗 आहार एवं परहेज',
    '',
    '**🚫 क्या न खाएं:**',
    '- नमक कम करें, तली-भुनी चीजें बंद',
    '- शराब, तंबाकू, शीतल पेय बंद'
  ];
  const uric = Number(report_values.uric_acid);
  const sugar = Number(report_values.sugar_fast ?? report_values.sugar);
  if (uric > 7) lines.push('- **लाल मांस, बीयर, दाल अधिक** — यूरिक एसिड');
  if (sugar > 126) lines.push('- **चीनी, गुड़, सफेद चावल** — मधुमेह');
  lines.push(
    '',
    '**✅ क्या खाएं:**',
    '- ताजा हरी सब्जियां, पपीता, खीरा',
    '- 8-10 गिलास पानी प्रतिदिन',
    '- दलिया, खिचड़ी — हल्का भोजन',
    ''
  );
  return lines;
}

function buildPrescriptionMarkdown(input, rules, formulas) {
  const {
    age = 30,
    gender = 'Male',
    weight = 60,
    bp_systolic = 120,
    bp_diastolic = 80,
    pulse = 72,
    phase = 'ACUTE',
    symptoms = [],
    report_values = {}
  } = input;

  const dose = getDose(age);
  const gHi = gender === 'Male' || gender === 'पुरुष' ? 'पुरुष' : 'महिला';
  const phKey = String(phase).toUpperCase().replace(/-/g, '_');
  const potency = rules.potency;
  const tempKey = formulas.temperament_key;
  const tempInfo = formulas.temperament_info;
  const fa = formulas.formula_a;
  const fb = formulas.formula_b;
  const fc = formulas.formula_c;
  const fd = formulas.formula_d;

  const faStr = buildCleanFormula(fa.medicines, fa.potency);
  const fbStr = buildCleanFormula(fb.medicines, fb.potency);
  const fcStr = buildCleanFormula(fc.medicines, fc.potency);
  const symLine = (symptoms || [])
    .map((s) => (typeof s === 'object' ? s.name || s.hindi : String(s)))
    .filter(Boolean)
    .slice(0, 5)
    .join(', ');

  const L = [];
  const A = (...ls) => ls.forEach((l) => L.push(l));

  A('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  A('      🌿 E.H. AROGYA SUTRA CLINIC');
  A('   इलेक्ट्रो-होम्योपैथी प्रिस्क्रिप्शन (100% Automated)');
  A('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  A('');
  A('| रोगी विवरण | जानकारी | रोगी विवरण | जानकारी |');
  A('|------------|---------|------------|---------|');
  A(`| **आयु** | ${age} वर्ष | **लिंग** | ${gHi} |`);
  A(`| **भार** | ${weight} किग्रा | **नाड़ी** | ${pulse}/मिनट |`);
  A(`| **रक्तचाप** | ${bp_systolic}/${bp_diastolic} mmHg | **प्रकृति** | ${tempKey} |`);
  A(`| **अवस्था** | ${PHASE_HI[phKey] || phase} | **पोटेंसी** | **${potency}** (rule lock) |`);
  A(`| **विद्युत** | **${rules.masterElectricity}** | **Rules** | ${(rules.dynamicRulesApplied || []).map((r) => r.id).join(', ')} |`);
  A('');

  if (Number(bp_systolic) >= 180) {
    A(`> 🚨 **अत्यंत उच्च रक्तचाप:** ${bp_systolic}/${bp_diastolic} — तत्काल ध्यान!`);
    A('');
  }

  A('---');
  A('## 🔬 प्रकृति (Temperament) विश्लेषण');
  A('');
  A(`**${tempKey}:** ${tempInfo.description}`);
  A(`**आधार समूह:** ${tempInfo.base_group}`);
  A(`**चिकित्सा तर्क:** ${tempInfo.logic}`);
  if (symLine) A(`**मुख्य लक्षण:** ${symLine}`);
  A('');

  A('---');
  A('## 💊 मिश्रण A — मुख्य चिकित्सा (भोजन से पहले)');
  A('');
  A(`**फॉर्मूला:** \`${faStr}\``);
  A(`**उद्देश्य:** ${fa.purpose}`);
  A('');
  A('**औषधि कारण:**');
  fa.medicines.filter((m) => !isFluidCode(m)).forEach((med, i) => {
    const info = getMedInfo(med);
    A(`${i + 1}. **${info.name}** — ${info.reason}`);
  });
  A('');
  buildPreparationSteps(fa.medicines, fa.potency, 'मिश्रण A').forEach((ln) => A(ln));
  A('');

  A('---');
  A('## 💊 मिश्रण B — सहायक (भोजन के बाद)');
  A('');
  A(`**फॉर्मूला:** \`${fbStr}\``);
  A(`**उद्देश्य:** ${fb.purpose}`);
  buildPreparationSteps(fb.medicines, fb.potency, 'मिश्रण B').forEach((ln) => A(ln));
  A('');

  A('---');
  A('## 💊 मिश्रण C — रात्रि गहरी चिकित्सा');
  A('');
  A(`**फॉर्मूला:** \`${fcStr}\``);
  A(`**उद्देश्य:** ${fc.purpose}`);
  A('');

  A('---');
  A('## ⚡ मिश्रण D — बाह्य विद्युत (Compress)');
  A('');
  A(`**विद्युत (rule lock):** ${rules.masterElectricity}`);
  A(`**स्थान:** ${fd.location || formulas.electricity_location}`);
  A('');
  A('**विधि:**');
  A('1. सूती कपड़ा या रुई लें');
  A(`2. विद्युत **${formulas.electricity_code}** की 10 बूंदें थोड़े पानी में मिलाएं`);
  A('3. कपड़े को भिगोकर स्थान पर 20 मिनट रखें — दिन में 2 बार');
  A('');

  buildTabletChart(
    dose,
    formulas,
    rules.waterInstruction,
    rules.masterElectricity,
    fd.location || formulas.electricity_location
  ).forEach((ln) => A(ln));

  A('---');
  A('## 📖 EH सिद्धांत अनुपालन');
  A('');
  A('**काउंट मैटेई:** सभी रोग रक्त या रस के दोष से — temperament + organ pool से औषधि; **विद्युत/पोटेंसी केवल dynamicEhRules.json**।');
  A('');

  A('---');
  A('## ✅ अपेक्षित सुधार');
  A('');
  A('| समयावधि | अपेक्षित सुधार |');
  A('|---------|---------------|');
  A('| **3-7 दिन** | ऊर्जा, प्रारंभिक लक्षण राहत |');
  A('| **15-30 दिन** | सूजन/Lab में सुधार |');
  A('| **3 महीने** | जीर्ण में कमी |');
  A('');

  buildDietSection(report_values).forEach((ln) => A(ln));

  const followDays = phKey === 'ACUTE' ? 7 : phKey === 'SUB_ACUTE' ? 15 : 30;
  A('---');
  A('## 📋 अगली जांच');
  A('');
  A(`**${followDays} दिनों में पुनर्मूल्यांकन।** तुरंत दिखाएं यदि BP 180+, तेज बुखार, सांस कठिनाई।`);
  A('');
  A('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  A(`🌿 E.H. AROGYA SUTRA · Confidence ${formulas.confidence}% · Automated`);
  A('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return L.join('\n');
}

/**
 * @param {object} input — summaryCaseAdapter shape
 * @param {object} [summaryResult]
 */
function generatePrescription(input = {}, summaryResult = {}) {
  const rules = determineUniversalClinicalRules(input);

  if (rules.noApplicableRule || !rules.hasApplicableClinicalRule) {
    return {
      prescription_text: NO_APPLICABLE_RULE_MESSAGE,
      ok: false,
      no_applicable_rule: true,
      rules,
      tablet_chart: []
    };
  }

  const formulas = selectMedicines(
    { ...input, formulas: input.formulas || {} },
    rules
  );

  const rawMarkdown = buildPrescriptionMarkdown(input, rules, formulas);
  const elecCode = extractLockedElectricityCode(rules.masterElectricity);
  const markdown = scrubForbiddenElectricity(rawMarkdown, elecCode, { preserveLayout: true });
  const json = {
    version: 'prescription-v1',
    potency: rules.potency,
    electricity: elecCode,
    matchedRuleIds: (rules.dynamicRulesApplied || []).map((r) => r.id),
    temperament: formulas.temperament_key,
    sectionCount: (markdown.match(/^##\s/gm) || []).length
  };

  const dose = getDose(input.age);
  const tablet_chart = [
    { time: '06:00', mixture: 'A', drops: dose, note: 'खाली पेट' },
    { time: '08:30', mixture: 'B', drops: dose, note: 'नाश्ते के बाद' },
    { time: '12:30', mixture: 'A', drops: dose, note: 'दोपहर पूर्व' },
    { time: '14:30', mixture: 'B', drops: dose, note: 'दोपहर बाद' },
    { time: '19:30', mixture: 'A', drops: dose, note: 'रात पूर्व' },
    { time: '22:00', mixture: 'C', drops: dose, note: 'सोते समय' },
    {
      time: '10:00/18:00',
      mixture: 'D',
      drops: 0,
      note: `बाह्य ${elecCode} — ${formulas.electricity_location}`
    }
  ];

  return {
    ok: true,
    prescription_text: markdown,
    prescription_json: json,
    formulas: {
      formula_a: { ...formulas.formula_a, formatted: buildCleanFormula(formulas.formula_a.medicines, formulas.formula_a.potency) },
      formula_b: { ...formulas.formula_b, formatted: buildCleanFormula(formulas.formula_b.medicines, formulas.formula_b.potency) },
      formula_c: { ...formulas.formula_c, formatted: buildCleanFormula(formulas.formula_c.medicines, formulas.formula_c.potency) },
      formula_d: { ...formulas.formula_d, formatted: `${formulas.electricity_code} D3` }
    },
    tablet_chart,
    potency: rules.potency,
    electricity: rules.masterElectricity,
    electricity_code: elecCode,
    temperament: formulas.temperament_key,
    confidence: formulas.confidence,
    rules_applied: rules.dynamicRulesApplied,
    medicine_pool_size: Object.keys(formulas.medicine_pool || {}).length,
    source: 'generatePrescription.js+docx-automated'
  };
}

module.exports = {
  generatePrescription,
  selectMedicines,
  buildCleanFormula,
  inferTemperament,
  buildTabletChart,
  getMedInfo,
  normMedKey,
  canonicalMedicineCode,
  dedupeMedicineList
};
