'use strict';

// =========================================================================
// E.H. AROGYA SUTRA — UNIVERSAL CLINICAL RULE ENGINE (DYNAMIC)
// Doctor Input → Polarity/Potency/Electricity → 38 Meds DB → Ollama / Fallback
// =========================================================================

const axios = require('axios');
const { buildFallbackSummarySeven } = require('./clinicalFallbackSeven');
const { cleanSummaryForRender } = require('../utils/summaryJsonCleaner');
const { buildSystemPromptFromRules, buildExtractionPromptFromCase } = require('./buildDynamicClinicalPrompt');
const { NO_APPLICABLE_RULE_MESSAGE } = require('../constants/noApplicableRule');
const { getOllamaUrlFromEnv } = require('../utils/ollamaUrl');
const { assertLocalOllamaEndpoint } = require('../utils/localPrivacyGuard');
  // Temporarily disable dynamic rule application to avoid old rules overriding new logic
const { applyDynamicEhRules } = require('./applyDynamicEhRules');
const {
  isValidCompleteEngineSummary,
  countSummaryWords,
  enforceSevenSectionLayout
} = require('../constants/clinicalSummaryVersion');
const { cleanPrimaryComplaint, buildComplaintLine } = require('../utils/summaryComplaintLock');
const {
  SECTION_4_OLLAMA_SCHEMA,
  sanitizeSection4InSummary,
  stripBookPageRefs
} = require('../utils/summarySection4');

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const OLLAMA_ENABLED = process.env.OLLAMA_ENABLED !== '0';
const OLLAMA_NUM_CTX = Number(process.env.OLLAMA_NUM_CTX) || 32768;

// =========================================================================
// 📚 OLLAMA DYNAMIC BOOK-TEXT LEARNING & REMEDY SELECTION RULE
// =========================================================================
const OLLAMA_BOOK_DYNAMIC_LEARNING = `
📚 DYNAMIC BOOK-TEXT LEARNING (MANDATORY FOR <BOOK_KNOWLEDGE_BASE>):
1. **Read & Store:** Direct text blocks from the E.H. Arogya Sutra textbook (local vector RAG) are your absolute source of truth for remedy mapping.
2. **Dynamic Diagnosis:** When the doctor's complaint appears in PATIENT VITAL INPUTS, scan <BOOK_KNOWLEDGE_BASE> for the exact matching disease or symptom in Hindi/English.
3. **Strict Filter:** Do NOT use general web knowledge, ChatGPT memory, or OpenAI. Select ONLY EH remedies (S-Group, C-Group, Angitico, Pectorale, etc.), potencies (D4, D6, D10, D30), and drop counts specified in this text for that disease.
4. **Section 4 Output:** After selecting medicines from this text, present them in the locked 2-part professional layout (अ. औषधि संयोजन + ब. क्रमिक क्लिनिकल कार्यप्रणाली). Remove page numbers, slashes, duplicate loops, and raw OCR symbols.
5. **Privacy:** All processing is local — never reference cloud APIs or external medical databases.
`.trim();

function normalizeFormulaSpacing(formulaStr) {
  if (!formulaStr) return '--';
  return String(formulaStr)
    .replace(/(S\d+|A\d+|C\d+|F\d+|L\d+|P\d+|V\d+|W\d+)(D\d+)/gi, '$1 $2')
    .replace(/(RE|BE|YE|WE|GE)(D\d+)/gi, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildFormula(medicines, potency) {
  if (!medicines || medicines.length === 0) return '--';
  const arr = Array.isArray(medicines)
    ? medicines
    : String(medicines)
        .split('+')
        .map((x) => x.trim());
  const clean = arr
    .map((m) => String(m).replace(/-/g, '').replace(/\./g, '').trim())
    .filter(Boolean);
  const pot = String(potency || 'D10').split('/')[0].trim();
  return normalizeFormulaSpacing(`${clean.join(' + ')} ${pot}`);
}

const formatFormula = buildFormula;

const ELECTRICITY_LABELS = {
  RE: 'RE (लाल विद्युत)',
  BE: 'BE (नीली विद्युत)',
  WE: 'WE (सफेद विद्युत)',
  GE: 'GE (हरी विद्युत)',
  YE: 'YE (पीली विद्युत)'
};

function normalizePolarityKey(polarityState) {
  const p = String(polarityState || '');
  if (/HYPO|निष्क्रिय|शिथिल/i.test(p)) return 'HYPO';
  if (/HYPER|अति-सक्रिय|उग्र/i.test(p)) return 'HYPER';
  if (/POSITIVE|सकारात्मक/i.test(p)) return 'POSITIVE';
  return 'POSITIVE';
}

/** नियम 3: डबल विद्युत स्ट्रिंग (RE+WE, G.E.+B.E.) साफ — पहला वैध कोड */
function cleanMasterElectricity(raw) {
  let s = String(raw || '').trim();
  if (!s) return ELECTRICITY_LABELS.WE;
  if (s.includes('+')) {
    s = s.split('+')[0].trim();
  }
  const codes = [...s.matchAll(/\b(RE|BE|WE|GE|YE)\b/gi)].map((m) => m[1].toUpperCase());
  if (codes.length > 1) {
    return ELECTRICITY_LABELS[codes[0]] || s;
  }
  if (codes.length === 1) {
    return ELECTRICITY_LABELS[codes[0]] || s;
  }
  if (/G\.?\s*E\.?/i.test(s)) return ELECTRICITY_LABELS.GE;
  if (/W\.?\s*E\.?/i.test(s)) return ELECTRICITY_LABELS.WE;
  if (/B\.?\s*E\.?/i.test(s)) return ELECTRICITY_LABELS.BE;
  if (/R\.?\s*E\.?/i.test(s)) return ELECTRICITY_LABELS.RE;
  const firstToken = s.split(/\s+/)[0];
  return firstToken || ELECTRICITY_LABELS.WE;
}

// =========================================================================
// 🌿 CONSTANT LAW OF POLARITY & ELECTRICITY CLEANER
// =========================================================================
function applyConstantLawOfPolarityElectricity(rules, bp_systolic) {
  const sysRaw = bp_systolic === undefined || bp_systolic === null || bp_systolic === '' ? 120 : Number(bp_systolic);
  const sysN = Number.isFinite(sysRaw) ? sysRaw : 120;

  let calculatedPotency = rules.calculatedPotency || rules.potency || 'D6';
  let masterElectricity = rules.masterElectricity || rules.electricity || ELECTRICITY_LABELS.WE;
  const polarityKey = normalizePolarityKey(rules.polarityState);

  // नियम 1: लो/नॉर्मल बीपी (≤130) + POSITIVE या HYPO → D4 या D6 (डिफ़ॉल्ट D6; गंभीर निम्न बीपी पर D4)
  if (sysN <= 130 && (polarityKey === 'POSITIVE' || polarityKey === 'HYPO')) {
    calculatedPotency = sysN < 100 && polarityKey === 'HYPO' ? 'D4' : 'D6';
  }

  // नियम 3: डबल इलेक्ट्रिसिटी कचरा साफ
  masterElectricity = cleanMasterElectricity(masterElectricity);

  return {
    ...rules,
    calculatedPotency,
    potency: calculatedPotency,
    masterElectricity,
    electricity: masterElectricity
  };
}

/** Source-of-truth engine electricity wins over dynamic-rule default (WE) */
function applySourceOfTruthElectricityLock(rules, input = {}) {
  const sotElec = input.electricity || input.masterElectricity;
  if (!sotElec || process.env.EH_USE_SOURCE_OF_TRUTH === '0') return rules;
  const locked = cleanMasterElectricity(sotElec);
  return { ...rules, masterElectricity: locked, electricity: locked };
}

/** Symptom-based external location only — never overrides dynamic electricity lock */
function inferExternalLocationFromSymptoms(fullInputText, sysOk, sys) {
  const forLocationSys = sysOk ? sys : 120;
  if (
    ['sardi', 'cold', 'jukam', 'jukaam', 'cough', 'खांसी', 'सर्दी', 'जुकाम', 'नाक', 'गला', 'balgam', 'श्वसन'].some(
      (w) => fullInputText.includes(w)
    )
  ) {
    return 'छाती (वक्षस्थल), गले के सामने और नाक के आस-पास सूती कपड़े की पट्टी — श्वसन मार्ग पर हल्का बाह्य प्रयोग।';
  }
  if (
    fullInputText.includes('sciatica') ||
    fullInputText.includes('saitica') ||
    fullInputText.includes('रीढ')
  ) {
    return 'रीढ़ की हड्डी के निचले हिस्से (L4-S1 मनके) से लेकर प्रभावित पैर के नीचे टखने तक, जहाँ-जहाँ दर्द का मार्ग है।';
  }
  if (['chakkar', 'sir dard', 'headache', 'घबराहट', 'चक्कर', 'sir'].some((w) => fullInputText.includes(w))) {
    return 'सिर के पिछले भाग (Occiput केंद्र) और दोनों कनपटी पर हल्के हाथ से बाह्य प्रयोग करें।';
  }
  if (['safed pani', 'leukorrhea', 'uterus', 'श्वेत', 'प्रदर'].some((w) => fullInputText.includes(w))) {
    return 'पेड़ू (Lower Abdomen/Pelvic region) के हिस्से पर सूती कपड़े की पट्टी (Compress) के रूप में लगाएं।';
  }
  if (forLocationSys >= 140) {
    return 'माथे पर और हृदय के पास (बाईं छाती पर) ठंडे पानी में भीगा कपड़ा 20 मिनट।';
  }
  return 'प्रभावित अंगों एवं संबंधित तंत्रिका केंद्रों (Nerve Centers) पर लगाएं।';
}

/**
 * Universal EH rules — dynamicEhRules.json is PRIMARY; legacy preset electricity removed.
 * Vitals set polarity/potency/water only; electricity comes from Admin dynamic rules.
 */
function determineUniversalClinicalRules(input) {
  const {
    bp_systolic: sysIn,
    bp_diastolic: diaIn,
    symptoms = [],
    phase = 'ACUTE',
    report_text = '',
    report_values = {}
  } = input;

  const sys = sysIn === undefined || sysIn === null || sysIn === '' ? NaN : Number(sysIn);
  const dia = diaIn === undefined || diaIn === null || diaIn === '' ? NaN : Number(diaIn);
  const sysOk = Number.isFinite(sys);
  const diaOk = Number.isFinite(dia);

  const rawSymptoms = symptoms.map((s) =>
    typeof s === 'object' ? s.name || s.hindi || '' : String(s)
  );
  const fullInputText = rawSymptoms.join(' ').toLowerCase();
  const ph = String(phase || 'ACUTE').toUpperCase().replace(/-/g, '_');

  let polarityState = 'MIXED (मिश्रित अवस्था)';
  let calculatedPotency = ph === 'CHRONIC' || ph === 'DEGENERATIVE' ? 'D3' : 'D10';
  let masterElectricity =
    input.masterElectricity || input.electricity
      ? cleanMasterElectricity(input.masterElectricity || input.electricity)
      : ELECTRICITY_LABELS.WE;
  let waterInstruction =
    'ठीक 10 बूंदें आधे कप सामान्य पानी में मिलाकर छोटे-छोटे घूँटों से धीरे-धीरे पिएं।';
  let isHyper = false;

  const vitalsHypo =
    (sysOk && sys < 100) ||
    (diaOk && dia < 55) ||
    (sysOk && diaOk && sys < 110 && dia < 60);

  const vitalsHyper = sysOk && sys >= 140;

  const textLabHyper =
    ['pathri', 'stone', 'tumor', 'sujan', 'inflammation', 'severe pain', 'सूजन'].some((w) =>
      fullInputText.includes(w)
    ) ||
    Object.entries(report_values).some(([k, v]) => {
      const ranges = { uric_acid: [3.5, 7], sugar: [70, 100], creatinine: [0.6, 1.2] };
      const r = ranges[k];
      return r && Number(v) > r[1];
    });

  const textHyperBPPhrase =
    fullInputText.includes('उच्च') && fullInputText.includes('रक्तचाप');
  const hyperFromText = textLabHyper || (textHyperBPPhrase && !vitalsHypo);

  const hypoMatchText = [
    'kamjori',
    'weakness',
    'chakkar',
    'giddiness',
    'paralysis',
    'numbness',
    'ulti',
    'vomit',
    'कमजोरी',
    'चक्कर',
    'सुन्न',
    'उल्टी'
  ].some((w) => fullInputText.includes(w));

  const hypoMatch = vitalsHypo || (!vitalsHyper && hypoMatchText);
  const hyperMatch = vitalsHyper || (!vitalsHypo && hyperFromText);

  if (vitalsHypo || (hypoMatch && !hyperMatch)) {
    isHyper = false;
    polarityState = 'HYPO (निष्क्रिय / शिथिल अवस्था)';
    calculatedPotency = ph === 'CHRONIC' || ph === 'DEGENERATIVE' ? 'D3' : 'D4';
    waterInstruction =
      'ठीक 10 बूंदें आधे कप हल्के गुनगुने पानी में मिलाकर निर्धारित समय पर छोटे-छोटे घूँटों से धीरे-धीरे पिएं।';
  } else if (hyperMatch) {
    isHyper = true;
    polarityState = 'HYPER (अति-सक्रिय / उग्र अवस्था)';
    calculatedPotency = ph === 'CHRONIC' || ph === 'DEGENERATIVE' ? 'D30' : 'D10';
    const uriCold = /सर्दी|जुकाम|गला|नाक|खाँसी|श्वसन|sardi|jukam|gala|nak|khansi|respiratory/i.test(
      fullInputText
    );
    const severeBp = sysOk && sys >= 160;
    if (severeBp && !uriCold) {
      waterInstruction =
        'दवा की 10 बूंदें एक बड़े गिलास सामान्य या ठंडे पानी में मिलाकर एक बार में सीधे पी लें। (गंभीर उच्च बीपी — गुनगुना घूँट-घूँट वर्जित।)';
    } else {
      waterInstruction =
        'ठीक 10 बूंदें आधे कप हल्के गुनगुने पानी में मिलाकर छोटे-छोटे घूँटों से धीरे-धीरे पिएं।';
    }
  }

  const externalLocation = inferExternalLocationFromSymptoms(fullInputText, sysOk, sys);

  const baseRules = {
    fullInputText,
    polarityState,
    potency: calculatedPotency,
    calculatedPotency,
    electricity: masterElectricity,
    masterElectricity,
    location: externalLocation,
    externalLocation,
    waterInstruction,
    isHyper,
    vitalsHypo,
    vitalsHyper,
    polarity: isHyper ? 'POSITIVE' : hypoMatch ? 'NEGATIVE' : 'MIXED'
  };

  const withDynamic = applyDynamicEhRules(baseRules, input);
  if (withDynamic.noApplicableRule) {
    return applySourceOfTruthElectricityLock(withDynamic, input);
  }
  if (process.env.EH_NUCLEAR_RULE_ONLY === '0') {
    return applySourceOfTruthElectricityLock(
      applyConstantLawOfPolarityElectricity(withDynamic, sysOk ? sys : 120),
      input
    );
  }
  return applySourceOfTruthElectricityLock(withDynamic, input);
}

function determinePolarity(input) {
  const r = determineUniversalClinicalRules(input);
  return {
    isHyper: r.isHyper,
    polarity: r.polarity,
    polarityState: r.polarityState,
    potency: r.potency,
    posScore: 0,
    negScore: 0
  };
}

function determineElectricity(symText, isHyper, bp_systolic, bp_diastolic) {
  const r = determineUniversalClinicalRules({
    bp_systolic,
    bp_diastolic,
    symptoms: [{ name: symText }],
    phase: 'ACUTE'
  });
  return { electricity: r.electricity, location: r.location };
}

function buildSystemPrompt(waterInstruction) {
  return buildOllamaSystemPrompt(waterInstruction);
}

/** Ollama — Temperament-First + book RAG; vitals bypass forbidden */
function buildOllamaSystemPrompt(waterInstruction) {
  return `
आप E.H. Arogya Sutra के हिंदी क्लिनिकल लेखक हैं — Count Cesare Mattei का **Temperament-First** सिद्धांत अनिवार्य है।

🩸 TEMPERAMENT-FIRST (सबसे पहले — खंड 2):
1. पहले रक्त प्रधान / रस प्रधान / मिश्रित निर्धारित करें (vitals + लक्षण)।
2. फिर <BOOK_KNOWLEDGE_BASE> से **केवल उसी प्रकृति** के अनुसार औषधि, पोटेंसी, खुराक चुनें।
3. Rule-engine lock (user prompt में दिया potency/विद्युत/मिश्रण) कभी न बदलें।

📖 BOOK RAG LOCK (अनिवार्य — local vector index):
1. user prompt में **<BOOK_KNOWLEDGE_BASE>** = clinic server पर सहेजा page-by-page पाठ + medicines.json — **एकमात्र स्रोत**।
${OLLAMA_BOOK_DYNAMIC_LEARNING}
2. इस RAG के बाहर से कोई English medicine name, Angiotico, OCR garbage, या manmarzi electricity (G.E.+B.E.) **नहीं** लिखें।
3. औषधि विवरण: केवल RAG की action_hindi / page OCR पंक्तियाँ — अपनी कल्पना नहीं।
4. Anatomy/Pathology §3: Temperament lock के बाद RAG anatomy + symptom map — generic English anatomy नहीं।
5. बाह्य विद्युत: rule-engine lock ${waterInstruction ? '+ सेवन विधि' : ''} + RAG electricity chart; GE low BP par block (prompt में दिया lock)।
6. "डेटा नहीं बताया" / खाली bracket — वर्जित। vitals prompt में दिए आंकड़े हर खंड में।
7. **केवल 7-खंड** सार (~900+ शब्द) — ## 1 से ## 7 तक ही। **8–11 खंड, 6-खंड प्रिस्क्रिप्शन, पुराना टेम्पलेट पूरी तरह वर्जित।** शुद्ध देवनागरी हिंदी।
8. **dynamicEhRules.json** (user prompt में DYNAMIC RULE ENGINE ब्लॉक) = विद्युत/पोटेंसी का एकमात्र स्रोत — अपनी याद/पुराना RE/BE पैटर्न नहीं।
9. **खंड 4 (औषधि):** प्रत्येक दवा केवल एक पंक्ति — \`**कोड\`: विवरण\` (जैसे **S-10**: रस शुद्धि…)। पुस्तक, पृष्ठ, E.H. AROGYA SUTRA, p.###, Prishth — **कभी न लिखें**।

खंड 5 में सेवन विधि शब्दशः:
"${waterInstruction}"

अनिवार्य हेडिंग क्रम (structure lock):
# 🏥 इलेक्ट्रो-होम्योपैथी क्लिनिकल विशेषज्ञ सारांश
## 1. कार्यकारी क्लिनिकल विवरण
## 2. प्रकृति विश्लेषण
## 3. शारीरिक एवं रोग विश्लेषण
## 4. औषधि निर्माण का वैज्ञानिक कारण
## 5. पोटेंसी और ध्रुवता का नियम
## 6. खुराक और सेवन विधि
## 7. आहार, परहेज एवं जीवनशैली
🌿 E.H. AROGYA SUTRA CLINIC
`;
}

const { deriveAnatomyPathology } = require('../utils/clinicalAnatomyPathology');
const { primaryOrganElectricity } = require('../utils/ehOrganDetect');

function isBlankOllamaSummary(text) {
  const s = String(text || '').trim();
  if (s.length < 400) return true;
  if (/नहीं\s*बताया|डेटा\s*उपलब्ध\s*नहीं|जानकारी\s*नहीं\s*मिली|not\s*provided|no\s*data/i.test(s)) {
    return true;
  }
  if ((s.match(/\[यहाँ/gi) || []).length >= 2) return true;
  return false;
}

function ollamaMatchesClinicalLock(text, lock) {
  const s = String(text || '');
  if (!s.includes(String(lock.age))) return false;
  if (!s.includes(`${lock.sysDisp}/${lock.diaDisp}`) && !s.includes(`${lock.sysDisp} / ${lock.diaDisp}`)) {
    return false;
  }
  if (!s.includes(lock.calculatedPotency)) return false;
  if (lock.symptomsLine && lock.symptomsLine !== '—') {
    const tokens = lock.symptomsLine.split(/[,،\s]+/).filter((t) => t.length > 3);
    if (tokens.length && !tokens.some((t) => s.includes(t.slice(0, Math.min(12, t.length))))) {
      return false;
    }
  }
  return true;
}

// =========================================================================
// 🔒 DYNAMIC PATIENT STATE SYNC & BOOK RAG MAPPER (FINAL TOUCH)
// =========================================================================
function primaryActiveComplaint(complaints) {
  const s = cleanPrimaryComplaint(complaints);
  return s || 'लक्षण विवरण उपलब्ध नहीं';
}

function lockElectricityShort(masterElectricity) {
  const cleaned = cleanMasterElectricity(masterElectricity);
  const code = cleaned.match(/\b(RE|BE|WE|GE|YE)\b/i)?.[1]?.toUpperCase() || 'WE';
  const short = { RE: 'R.E.', BE: 'B.E.', WE: 'W.E.', GE: 'G.E.', YE: 'Y.E.' };
  return { code, short: short[code] || 'W.E.', full: cleaned };
}

function mapCtxToPatientData(ctx) {
  const complaints =
    buildComplaintLine(
      (ctx.rawSymList || []).map((s) => ({ name: String(s).trim() })).filter((x) => x.name)
    ) || '—';
  const elec = lockElectricityShort(ctx.masterElectricity);
  const bpSys = ctx.sysDisp ?? ctx.bp_systolic ?? 120;
  const bpDia = ctx.diaDisp ?? ctx.bp_diastolic ?? 80;
  const base = {
    complaints,
    bp_systolic: bpSys,
    bp_diastolic: bpDia,
    calculatedPotency: ctx.calculatedPotency || 'D10',
    masterElectricity: elec.full,
    masterElectricityShort: elec.short,
    polarityState: ctx.polarityState || 'POSITIVE',
    age: ctx.age,
    genderHi: ctx.genderHi,
    weight: ctx.weight,
    faFmt: ctx.faFmt,
    fbForPrompt: ctx.fbForPrompt,
    externalLocation: ctx.externalLocation,
    waterInstruction: ctx.waterInstruction,
    dosePrompt: ctx.dosePrompt,
    phaseAcute: ctx.phaseAcute,
    temperament: ctx.temperament
  };
  base.temperamentLock = inferTemperamentFromVitals(base);
  return base;
}

// =========================================================================
// 🩸 TEMPERAMENT-FIRST MEDICINE & POTENCY SELECTION LOGIC FOR OLLAMA
// =========================================================================
function inferTemperamentFromVitals(patientData = {}) {
  const sys = Number(patientData.bp_systolic) || 120;
  const sym = String(patientData.complaints || '').toLowerCase();
  const explicit = String(patientData.temperament || '').trim();

  if (/sanguine|रक्त\s*प्रधान/i.test(explicit)) {
    return {
      key: 'Sanguine',
      hindi: 'रक्त प्रधान (Sanguine)',
      group: 'A-Group (Angitico)',
      reason: 'चिकित्सक/फेस विश्लेषण — रक्त प्रधान'
    };
  }
  if (/lymphatic|रस\s*प्रधान/i.test(explicit)) {
    return {
      key: 'Lymphatic',
      hindi: 'रस प्रधान (Lymphatic)',
      group: 'S-Group (Scrofoloso)',
      reason: 'चिकित्सक/फेस विश्लेषण — रस प्रधान'
    };
  }

  const sanguineSignals =
    sys > 130 ||
    ['उच्च रक्तचाप', 'रक्तचाप', 'congestion', 'धड़कन', 'hypertension', 'सीने', 'bp high'].some(
      (w) => sym.includes(w)
    );
  const lymphaticSignals = [
    'kamjori',
    'weakness',
    'कमजोरी',
    'kabz',
    'gas',
    'सूजन',
    'sujan',
    'fluid',
    'सर्दी',
    'जुकाम',
    'cough',
    'खांसी'
  ].some((w) => sym.includes(w));

  if (sanguineSignals && !lymphaticSignals) {
    return {
      key: 'Sanguine',
      hindi: 'रक्त प्रधान (Sanguine)',
      group: 'A-Group (Angitico)',
      reason: `बीपी ${sys} mmHg / संक्रमण-उच्च दबाव संकेत — रक्त मार्ग प्रधान`
    };
  }
  if (lymphaticSignals && sys <= 130) {
    return {
      key: 'Lymphatic',
      hindi: 'रस प्रधान (Lymphatic)',
      group: 'S-Group (Scrofoloso)',
      reason: 'द्रव/कब्ज/श्वसन-रस लक्षण — रस मार्ग प्रधान'
    };
  }
  if (sanguineSignals && lymphaticSignals) {
    return {
      key: 'Mixed',
      hindi: 'मिश्रित (Mixed — A+S)',
      group: 'A-Group + S-Group',
      reason: 'रक्त व रस दोनों मार्ग सक्रिय — मिश्रित प्रकृति'
    };
  }
  return {
    key: sys > 130 ? 'Sanguine' : 'Lymphatic',
    hindi: sys > 130 ? 'रक्त प्रधान (Sanguine)' : 'रस प्रधान (Lymphatic)',
    group: sys > 130 ? 'A-Group (Angitico)' : 'S-Group (Scrofoloso)',
    reason: sys > 130 ? `बीपी ${sys} > 130` : `बीपी ${sys} सामान्य/निम्न — रस प्रधान`
  };
}

function generateTemperamentFirstPrompt(patientData, bookContent, dynamicRulesBlock = '') {
  const cleanSymptoms = patientData.complaints
    ? cleanPrimaryComplaint(patientData.complaints)
    : 'No symptoms';
  const bpString = `${patientData.bp_systolic || 120}/${patientData.bp_diastolic || 80}`;
  const tLock = patientData.temperamentLock || inferTemperamentFromVitals(patientData);
  const bookBlock = String(bookContent || '').trim() || '(Book RAG unavailable — use rule-engine locks only)';

  const sys = Number(patientData.bp_systolic) || 120;
  const elec = lockElectricityShort(patientData.masterElectricity);
  const potencyLock = patientData.calculatedPotency || 'D10';

  return `
You are the "E.H. AROGYA SUTRA ENGINE". You must strictly follow the Temperament-First rule of Count Cesare Mattei.

### PATIENT VITAL INPUTS:
- **Symptoms:** ${cleanSymptoms}
- **BP:** ${bpString} mmHg
- **Weight:** ${patientData.weight || 60} kg
- **Age / Gender:** ${patientData.age || 30} years · ${patientData.genderHi || 'पुरुष'}
- **Rule-engine polarity:** ${patientData.polarityState || 'POSITIVE'}
- **Pre-computed Temperament hint:** ${tLock.hindi} — ${tLock.reason}

### <BOOK_KNOWLEDGE_BASE>
${bookBlock}
### </BOOK_KNOWLEDGE_BASE>

${OLLAMA_BOOK_DYNAMIC_LEARNING}

⚠️ STRICT STEP-BY-STEP EXECUTION RULES FOR OLLAMA:

STEP 1: DETERMINING TEMPERAMENT (FIRST PRIORITY)
- Analyze the patient data. If BP is High (>130 mmHg) or there is active congestion, lock the Temperament as **रक्त प्रधान (Sanguine)**. If symptoms show fluid retention, low vitality, or normal/low BP, lock it as **रस प्रधान (Lymphatic)**. Otherwise **मिश्रित (Mixed)**.
- Write this locked temperament clearly in **Section 2 (प्रकृति विश्लेषण)** before any medicine text.
- For this case, align with: **${tLock.hindi}** (${tLock.group}).

STEP 2: TEMPERAMENT-BASED MEDICINE SELECTION
- Based on the locked Temperament from Step 1, query the <BOOK_KNOWLEDGE_BASE>:
  - For **रक्त प्रधान**, give priority to **A-Group (Angitico)** or specific blood-purifying remedies listed in the book for "${cleanSymptoms}".
  - For **रस प्रधान**, give priority to **S-Group (Scrofoloso)** or lymph-active remedies from the book.
  - For **मिश्रित**, combine A+S per book — still filter by <BOOK_KNOWLEDGE_BASE> only.

STEP 3: POTENCY & ELECTRICITY LOCK (dynamicEhRules.json — NON-NEGOTIABLE)
- Use ONLY: potency **${potencyLock}**, electricity **${elec.full}** (${elec.short}) — from Dynamic Rule Engine below.
- Do NOT substitute R.E., B.E., G.E., Y.E. from memory or old 11-section templates.
- Low BP / HYPO → typically WE; High BP → typically BE per matched rules — follow the DYNAMIC RULE ENGINE block exactly.

${dynamicRulesBlock || ''}

### RULE-ENGINE FORMULA STRIP (NON-NEGOTIABLE — Section 4 must respect):
- **Mixture A:** ${patientData.faFmt || '--'}
- **Mixture B:** ${patientData.fbForPrompt || '--'}
- **External:** ${patientData.externalLocation || 'प्रभावित अंगों पर'}
- **Dose (drops):** ${patientData.dosePrompt || 10} · **Water:** ${patientData.waterInstruction || '10 बूंदें आधे कप पानी में'}

### OUTPUT FORMAT (7 SECTIONS ONLY):
Print ## 1 through ## 7 only. **Section 4 MUST follow this exact two-part structure:**

${SECTION_4_OLLAMA_SCHEMA}

Use the RULE-ENGINE formula strip above for subsection अ (A/B/C/D). Subsection ब must be 2–4 clinical steps with **Code**: clean Hindi only — no OCR noise, no book names, no page numbers.

Required headings:
# 🏥 इलेक्ट्रो-होम्योपैथी क्लिनिकल विशेषज्ञ सारांश
## 1. कार्यकारी क्लिनिकल विवरण
## 2. प्रकृति विश्लेषण
## 3. शारीरिक एवं रोग विश्लेषण
## 4. औषधि निर्माण का वैज्ञानिक कारण
## 5. पोटेंसी और ध्रुवता का नियम
## 6. खुराक और सेवन विधि
## 7. आहार, परहेज एवं जीवनशैली
🌿 E.H. AROGYA SUTRA CLINIC
`.trim();
}

function buildOllamaUserPrompt(patientDataOrCtx, extractedBookText, dynamicRulesBlock = '') {
  let patientData;
  let bookText;

  if (
    extractedBookText !== undefined &&
    patientDataOrCtx &&
    (patientDataOrCtx.complaints != null ||
      patientDataOrCtx.bp_systolic != null ||
      patientDataOrCtx.sysDisp != null)
  ) {
    patientData =
      patientDataOrCtx.complaints != null
        ? patientDataOrCtx
        : mapCtxToPatientData(patientDataOrCtx);
    bookText = String(extractedBookText || '').trim();
  } else {
    const ctx = patientDataOrCtx || {};
    patientData = mapCtxToPatientData(ctx);
    bookText = String(ctx.bookRagContext || extractedBookText || '').trim();
  }

  if (!patientData.temperamentLock) {
    patientData.temperamentLock = inferTemperamentFromVitals(patientData);
  }

  return generateTemperamentFirstPrompt(patientData, bookText, dynamicRulesBlock);
}

function finalizeSevenSectionSummary(text) {
  const cleaned = enforceSevenSectionLayout(
    sanitizeSection4InSummary(stripBookPageRefs(String(text || '')))
  );
  return cleaned;
}

function buildFallbackSummary(input, rules, formulas, potency, ehEngineData = null) {
  if (rules.noApplicableRule || !rules.hasApplicableClinicalRule) {
    return NO_APPLICABLE_RULE_MESSAGE;
  }
  const raw = buildFallbackSummarySeven(input, rules, formulas, potency, '', buildFormula, ehEngineData);
  const elecCode =
    String(rules.masterElectricity || '').match(/\b(RE|BE|WE|GE|YE)\b/i)?.[1] || 'WE';
  const { markdown } = cleanSummaryForRender(raw, {
    allowedElectricity: elecCode,
    allowedPotency: rules.potency,
    matchedRuleIds: (rules.dynamicRulesApplied || []).map((r) => r.id)
  });
  return finalizeSevenSectionSummary(markdown);
}

function collectMedicineCodes(formulas = {}) {
  const codes = [];
  ['formula_a', 'formula_b', 'formula_c', 'formula_d'].forEach((k) => {
    const meds = formulas[k]?.medicines;
    if (Array.isArray(meds)) codes.push(...meds);
  });
  return codes;
}

/**
 * @param {object} input
 * @param {{ useOllama?: boolean }} [options]
 */
async function generateClinicalSummary(input, options = {}) {
  const {
    age = 30,
    gender = 'Male',
    weight = 60,
    bp_systolic,
    bp_diastolic,
    symptoms = [],
    phase = 'ACUTE',
    report_text = '',
    report_values = {},
    temperament,
    formulas = {}
  } = input;

  let rules = determineUniversalClinicalRules({
    bp_systolic,
    bp_diastolic,
    symptoms,
    phase,
    report_text,
    report_values
  });

  if (rules.noApplicableRule || !rules.hasApplicableClinicalRule) {
    return {
      summary: NO_APPLICABLE_RULE_MESSAGE,
      summary_json: { noApplicableRule: true },
      source: 'dynamic-rule-engine-no-match',
      potency: null,
      electricity: null,
      ready: false
    };
  }

  if (Array.isArray(input.affected_organs) && input.affected_organs.length) {
    const orgElec = primaryOrganElectricity(input.affected_organs, rules.isHyper);
    const organPatch = {
      externalLocation: orgElec.location || rules.externalLocation,
      location: orgElec.location || rules.location
    };
    if (!rules.electricityLockedByDynamic && orgElec.electricity) {
      organPatch.masterElectricity = cleanMasterElectricity(orgElec.electricity);
      organPatch.electricity = organPatch.masterElectricity;
    }
    rules = { ...rules, ...organPatch };
    rules = applyConstantLawOfPolarityElectricity(rules, bp_systolic ?? 120);
    rules = applyDynamicEhRules(rules, input);
  }

  /** Universal engine potency/electricity — expert फॉर्मूला पोटेंसी इसे कभी ओवरराइड नहीं करती (सुरक्षा) */
  const potency = rules.potency;

  const genderHi = gender === 'Male' ? 'पुरुष' : 'महिला';
  const fa = formulas?.formula_a || {};
  const fb = formulas?.formula_b || {};
  const faFmt = buildFormula(fa.medicines, potency);
  const fbFmt = buildFormula(fb.medicines, potency);

  const rawSymList = symptoms
    .map((s) => (typeof s === 'object' ? s.name || s.hindi || '' : String(s)))
    .map((s) => String(s).trim())
    .filter(Boolean);

  const selectedMedicines = collectMedicineCodes(formulas);
  const freshSymptomsQuery = rawSymList.join(' ');
  const bookDatabaseContent = '';

  const sysDisp =
    bp_systolic === undefined || bp_systolic === null || bp_systolic === ''
      ? 120
      : Number(bp_systolic);
  const diaDisp =
    bp_diastolic === undefined || bp_diastolic === null || bp_diastolic === ''
      ? 80
      : Number(bp_diastolic);

  const sysN = Number(bp_systolic);
  const diaN = Number(bp_diastolic);

  const phKeyUser = String(phase).toUpperCase().replace(/-/g, '_');
  const PHASE_LABEL_USER = {
    ACUTE: 'तीव्र अवस्था (लगभग चौदह दिनों के भीतर)',
    SUB_ACUTE: 'अर्ध-तीव्र अवस्था',
    CHRONIC: 'जीर्ण अवस्था',
    DEGENERATIVE: 'अपक्षयी अवस्था'
  };
  const phaseHi = PHASE_LABEL_USER[phKeyUser] || 'क्लिनिकल चरण';

  const fbForPrompt =
    fbFmt !== '--'
      ? fbFmt
      : '— मिश्रण B उपलब्ध नहीं — चिकित्सक के मार्गदर्शन में मिश्रण A का निर्धारित क्रम बनाए रखें';

  const dosePrompt = age <= 12 ? 5 : age > 60 ? 7 : 10;

  const showHypoPrompt =
    rules.vitalsHypo ||
    (Number.isFinite(sysN) && sysN < 100) ||
    (Number.isFinite(diaN) && diaN < 55) ||
    (Number.isFinite(sysN) && Number.isFinite(diaN) && sysN < 110 && diaN < 60);

  const showHyperPrompt = Number.isFinite(sysN) && sysN >= 140;

  const phKeySimple = String(phase).toUpperCase().replace(/-/g, '_');
  const phaseTableLabel =
    phKeySimple === 'CHRONIC' || phKeySimple === 'DEGENERATIVE'
      ? 'जीर्ण (Chronic)'
      : 'तीव्र (Acute 0-14 दिन)';

  const polarityState = rules.polarityState;
  const calculatedPotency = potency;
  const masterElectricity = rules.masterElectricity;
  const externalLocation = rules.externalLocation;
  const waterInstruction = rules.waterInstruction;

  console.log('INPUT:', JSON.stringify({
    name: input.patient_name || input.patient?.fullName || input.patient?.name || null,
    bp: input.bp_systolic,
    symptoms: (input.symptoms || []).length,
    labs: Object.keys(input.report_values || {})
  }));
  const rawSummary = buildFallbackSummary(input, rules, formulas, potency, options.ehEngineData);
  const { markdown: cleanedSummary, json: summaryJson } = cleanSummaryForRender(rawSummary, {
    allowedElectricity: String(rules.masterElectricity).match(/\b(RE|BE|WE|GE|YE)\b/i)?.[1] || 'WE',
    allowedPotency: potency,
    matchedRuleIds: (rules.dynamicRulesApplied || []).map((r) => r.id)
  });

  const fallbackResult = {
    summary: finalizeSevenSectionSummary(cleanedSummary),
    summary_json: summaryJson,
    source: 'dynamic-rule-engine-v9-nuclear',
    potency,
    electricity: rules.masterElectricity,
    ready: true
  };

  /** Nuclear: Ollama creative generation disabled — extraction-only if explicitly enabled */
  const useOllama =
    process.env.EH_ALLOW_OLLAMA_SUMMARY === '1' &&
    options.useOllama === true &&
    OLLAMA_ENABLED &&
    (process.env.EH_EXPERT_SUMMARY_MODE || 'rule') === 'ollama' &&
    process.env.EH_FORCE_OLLAMA_SUMMARY === '1';

  if (!useOllama) {
    return fallbackResult;
  }

  const phaseAcute = phKeySimple === 'ACUTE' || phKeySimple === 'SUB_ACUTE';
  const activeComplaints = buildComplaintLine(symptoms) || '—';
  const symptomsLine = primaryActiveComplaint(activeComplaints);
  const patientData = mapCtxToPatientData({
    complaints: activeComplaints,
    sysDisp,
    diaDisp,
    calculatedPotency,
    masterElectricity,
    polarityState,
    age,
    genderHi,
    weight,
    temperament: input.temperament,
    faFmt,
    fbForPrompt,
    externalLocation,
    waterInstruction,
    dosePrompt,
    phaseAcute
  });
  const clinicalLock = { age, sysDisp, diaDisp, calculatedPotency, symptomsLine };
  const systemPrompt = buildSystemPromptFromRules(rules.waterInstruction);
  const userPrompt = buildExtractionPromptFromCase(
    {
      bp_systolic: sysDisp,
      bp_diastolic: diaDisp,
      phase,
      symptoms: rawSymList,
      potency,
      electricity: rules.masterElectricity,
      formula_a: faFmt,
      formula_b: fbForPrompt
    },
    { matchedIds: rules.dynamicRulesApplied?.map((r) => r.id), lockedPotency: potency, lockedElectricity: rules.masterElectricity }
  );

  const host = getOllamaUrlFromEnv().replace(/\/$/, '');
  assertLocalOllamaEndpoint(host);

  try {
    const ollamaResponse = await axios.post(
      `${host}/api/generate`,
      {
        model: OLLAMA_MODEL,
        system: systemPrompt,
        prompt: userPrompt,
        stream: false,
        keep_alive: 0,
        options: {
          temperature: 0,
          num_predict: Number(process.env.OLLAMA_EXPERT_NUM_PREDICT) || 2048,
          num_ctx: OLLAMA_NUM_CTX,
          top_p: 0.1,
          repeat_penalty: 1.2
        }
      },
      {
        timeout: Math.min(
          Number(process.env.OLLAMA_EXPERT_CLINICAL_TIMEOUT_MS) || 90000,
          120000
        )
      }
    );

    let beautifulSummary = normalizeFormulaSpacing(
      String(ollamaResponse.data?.response || '').trim()
    );

    if (isBlankOllamaSummary(beautifulSummary)) {
      console.warn('[summary] Ollama blank / placeholder output — rule-engine fallback');
      throw new Error('Ollama blank summary');
    }

    if (!ollamaMatchesClinicalLock(beautifulSummary, clinicalLock)) {
      console.warn(
        `[summary] Ollama skipped vitals lock (age=${age} BP=${sysDisp}/${diaDisp} ${calculatedPotency}) — rule-engine fallback`
      );
      throw new Error('Ollama clinical lock mismatch');
    }

    if (beautifulSummary.length > 400 && isValidCompleteEngineSummary(beautifulSummary)) {
      const wc = countSummaryWords(beautifulSummary);
      const ollamaMin = Number(process.env.EH_SUMMARY_MIN_WORDS_OLLAMA) || 650;
      if (wc < ollamaMin) {
        console.warn(`[summary] Ollama output only ${wc} words (min ${ollamaMin}) — using rule-engine fallback`);
        throw new Error('Ollama too brief');
      }
      return {
        summary: finalizeSevenSectionSummary(beautifulSummary),
        source: 'local-universal-rule-engine-ollama',
        potency,
        electricity: rules.masterElectricity,
        ready: true
      };
    }
    if (beautifulSummary.length > 400) {
      console.warn('[summary] Ollama failed section validation — rule-engine fallback');
    }
    throw new Error('Ollama invalid or too short');
  } catch (error) {
    console.error('Ollama Universal Engine:', error.message);
    return fallbackResult;
  }
}

function getPotency(phase, polarity) {
  return determineUniversalClinicalRules({ phase, polarity, symptoms: [] }).potency;
}

const MATTEI_SYSTEM_PROMPT = buildSystemPrompt(
  'ठीक 10 बूंदें आधे कप सामान्य पानी में मिलाकर छोटे-छोटे घूँटों से धीरे-धीरे पिएं।'
);

module.exports = {
  generateClinicalSummary,
  determinePolarity,
  determineUniversalClinicalRules,
  determineElectricity,
  applyConstantLawOfPolarityElectricity,
  cleanMasterElectricity,
  buildFormula,
  formatFormula,
  getPotency,
  buildFallbackSummary,
  normalizeFormulaSpacing,
  MATTEI_SYSTEM_PROMPT
};
