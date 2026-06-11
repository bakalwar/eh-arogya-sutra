'use strict';

const { paragraphsToBudget, whyMedicineForPatient } = require('./clinicalSectionWords');
const { deriveAnatomyPathology } = require('../utils/clinicalAnatomyPathology');
const { buildComplaintLine, dedupeSymptomList } = require('../utils/summaryComplaintLock');
const { buildStructuredSection4Blocks } = require('../utils/summarySection4');
const { analyzeLabReports, getOrganAnatomyText } = require('../utils/ehOrganDetect');

/**
 * EH Hindi Summary — DOCX spec (7 sections, ~1000 words, शुद्ध हिंदी).
 * Vitals / polarity / potency बाहर से `rules` + `potency` से आते हैं (generateClinicalSummary)।
 */

function emitSectionLines(A, num, titleHi, titleEn, paragraphs) {
  A('---');
  A(`## ▌${num}. ${titleHi}`);
  A(`*${titleEn}*`);
  A('');
  paragraphsToBudget(paragraphs, num).forEach((p) => {
    const line = String(p).trim();
    if (!line) return;
    if (line.startsWith('- ') || line.startsWith('|') || line.startsWith('###') || line.startsWith('* **')) {
      A(line);
    } else {
      A(line);
      A('');
    }
  });
}

const MED_HINT_HI = {
  S1: '**S1 (स्क्रोफोलोसो-१):** रस प्रणाली की मुख्य शुद्धि; लसीका मार्ग; प्रतिरक्षीय संतुलन।',
  S2: '**S2 (स्क्रोफोलोसो-२):** यकृत व लसीका ग्रंथियों की शुद्धि; पित्त प्रवाह सामान्य करने में सहायक।',
  S3: '**S3 (स्क्रोफोलोसो-३):** प्रजनन ग्रंथियाँ व हार्मोनल संतुलन।',
  S4: '**S4 (स्क्रोफोलोसो-४):** थायरॉइड व चयापचय नियंत्रण।',
  S5: '**S5 (स्क्रोफोलोसो-५):** त्वचा, जोड़ों का दर्द व लसीकीय सूजन।',
  S6: '**S6 (स्क्रोफोलोसो-६):** मूत्र मार्ग व यूरिक अपशिष्ट निष्कासन में सहायक।',
  S10:
    '**S10 (स्क्रोफोलोसो-१०):** पाचन तंत्र व आंतों की आधार शुद्धि करके कब्ज व गैस में राहत देना।',
  A1: '**A1 (एंजिटिको-१):** हृदय व धमनियाँ; परिसंचरण सुधार।',
  A2: '**A2 (एंजिटिको-२):** शिराएँ व नसों की जकड़न।',
  A3: '**A3 (एंजिटिको-३):** रक्त वाहिका तल; रक्तचाप संतुलन में प्रमुख भूमिका।',
  C1: '**C1 (कैंसरोसो-१):** सामान्य दुर्बलता व ऊर्जा।',
  C2: '**C2 (कैंसरोसो-२):** तंत्रिका व मस्तिष्क-रीढ़ मार्ग।',
  C3: '**C3 (कैंसरोसो-३):** मांसपेशी व स्नायु।',
  C4: '**C4 (कैंसरोसो-४):** ऊतक मरम्मत व जोड़ों का दर्द।',
  C5: '**C5 (कैंसरोसो-५):** लसीका गांठ व असामान्य वृद्धि संबंधी लक्षण।',
  C8: '**C8 (कैंसरोसो-८):** पाचन व यकृत की जीर्ण समस्याएँ।',
  C10: '**C10 (कैंसरोसो-१०):** अग्न्याशय व शर्करा संतुलन में सहयोग।',
  C16: '**C16 (कैंसरोसो-१६):** महिला प्रजनन अंग मार्ग।',
  F1:
    '**F1 (फेब्रीफुगो-१):** तंत्रिका तंत्र शांति; घबराहट, चक्कर, अनिद्रा में सहायक।',
  F2: '**F2 (फेब्रीफुगो-२):** ताप व तीव्र लक्षणों में सहयोग।',
  L1: '**L1 (लिम्फेटिको-१):** प्रतिरक्षीय घटक व प्लेटलेट मार्ग।',
  P1: '**P1 (पेक्टोरले-१):** श्वास मार्ग ऊपरी भाग।',
  YE: '**YE (पीली विद्युत):** उग्र अवस्था में बाह्य शांतिकारक संकेत।',
  RE: '**RE (लाल विद्युत):** निष्क्रिय अवस्था में ऊर्जा व संचार उत्थान।',
  BE: '**BE (नीली विद्युत):** रक्त वाहिका तल; उच्च दबाव संदर्भ में बाह्य सहयोग।',
  WE: '**WE (सफेद विद्युत):** साम्य व नसों की कोमलता; अनिद्रा व घबराहट में।',
  GE: '**GE (हरी विद्युत):** जोड़ व लसीकीय सूजन के बाह्य संकेत।'
};

function normMedKey(raw) {
  return String(raw || '')
    .replace(/-/g, '')
    .replace(/\./g, '')
    .toUpperCase()
    .trim();
}

function hintForMedicine(raw) {
  const k = normMedKey(raw);
  if (!k) return null;
  return (
    MED_HINT_HI[k] ||
    `**${k}:** यह स्पैजिरिक संयोजन का अंग है; चिकित्सक के निर्देशानुसार ही प्रयोग करें।`
  );
}

function collectAllMedicines(formulas) {
  const out = [];
  ['formula_a', 'formula_b', 'formula_c', 'formula_d'].forEach((key) => {
    const meds = formulas?.[key]?.medicines;
    if (Array.isArray(meds)) out.push(...meds);
  });
  const seen = new Set();
  return out.filter((m) => {
    const n = normMedKey(m);
    if (!n || seen.has(n)) return false;
    seen.add(n);
    return true;
  });
}

/** Table cell: avoid `… BE D10 + **BE**` when electricity is already in the mixture string. */
/** PDF demo — ✦ फॉर्मूला / खुराक cards (EH_Summary_7Section) */
function buildPdfFormulaCards(ctx) {
  const {
    faFmt,
    fbFmt,
    fcFmt,
    fdFmt,
    fd,
    potency,
    dose,
    masterElectricity,
    externalLocation,
    elecShort
  } = ctx;
  const lines = [];
  const addCard = (title, formula, extra = []) => {
    if (!formula || formula === '--') return;
    lines.push(`### 💊 ${title}`);
    lines.push(`✦ **फॉर्मूला:** \`${formula}\``);
    lines.push(`✦ **खुराक:** **${dose} बूंदें** | आधा कप गुनगुना पानी | Sip by Sip`);
    extra.forEach((e) => lines.push(e));
    lines.push('');
  };
  addCard('मिश्रण A (भोजन से 30 मिनट पहले)', faFmt, [
    `✦ **पोटेंसी:** ${potency} (rule lock)`
  ]);
  addCard('मिश्रण B (भोजन के 30 मिनट बाद)', fbFmt);
  if (fcFmt && fcFmt !== '--') {
    addCard('मिश्रण C (रात्रि — सोने से पहले)', fcFmt);
  }
  if (fdFmt && fdFmt !== '--') {
    lines.push('### 🧴 बाहरी योग (Compress / मलहम)');
    lines.push(`✦ **फॉर्मूला:** \`${fdFmt}\``);
    lines.push(`✦ **स्थान:** ${fd?.location || externalLocation || 'प्रभावित अंग'}`);
    lines.push(`✦ **विधि:** 20 मिनट कंप्रेस · दिन में 2 बार · **${masterElectricity}**`);
    lines.push(`✦ **विद्युत औचित्य:** ${elecShort} — rule lock; गलत G.E./R.E. वर्जित।`);
    lines.push('');
  }
  return lines;
}

function buildClinicalRationaleLines(formulas, medCtx) {
  const meds = collectAllMedicines(formulas).filter((m) => !/^(RE|BE|WE|GE|YE)$/i.test(normMedKey(m)));
  if (!meds.length) return [];
  const lines = [
    '### 📖 Clinical Rationale — प्रत्येक औषधि क्यों?',
    ''
  ];
  const organHint = {
    S10: 'पाचन / लसीका',
    S1: 'रस प्रणाली',
    S5: 'त्वचा / जोड़',
    S6: 'गुर्दा / यूरिक एसिड',
    A1: 'हृदय / धमनियाँ',
    A3: 'रक्त वाहिका तल',
    F1: 'तंत्रिका / मस्तिष्क',
    C4: 'उपास्थि / जोड़ मरम्मत',
    C1: 'सामान्य दुर्बलता'
  };
  meds.slice(0, 8).forEach((m) => {
    const k = normMedKey(m);
    const hint = hintForMedicine(m) || whyMedicineForPatient(k, medCtx);
    const target = organHint[k] || 'प्रभावित तंत्र';
    const group = k.startsWith('S')
      ? 'S-Group (Scrofoloso)'
      : k.startsWith('A')
        ? 'A-Group (Angitico)'
        : k.startsWith('F')
          ? 'F-Group (Febrifugo)'
          : k.startsWith('C')
            ? 'C-Group (Canceroso)'
            : 'EH Group';
    lines.push(`- **${k}** → ${target} → ${hint.replace(/^\*\*[^*]+\*\*:?\s*/i, '').slice(0, 120)} → *${group}*`);
  });
  lines.push('');
  return lines;
}

function chartCellMixtureWithOptionalElec(formulaStr, elecShort, { internal = false } = {}) {
  if (!formulaStr || formulaStr === '--') return '`--`';
  if (internal) return `\`${formulaStr}\``;
  const e = String(elecShort || '').toUpperCase().trim();
  if (!e) return `\`${formulaStr}\``;
  const esc = e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^|[\\s+])${esc}(\\s|$|\\+|D)`, 'i');
  if (re.test(formulaStr)) return `\`${formulaStr}\``;
  return `\`${formulaStr} + **${e}**\``;
}

/**
 * @param {object} input
 * @param {object} rules determineUniversalClinicalRules output
 * @param {object} formulas
 * @param {string} potency
 * @param {string} bookDatabaseContent
 * @param {(m: any, p: string) => string} buildFormulaFn
 */
function buildFallbackSummarySeven(
  input,
  rules,
  formulas,
  potency,
  bookDatabaseContent,
  buildFormulaFn,
  ehEngineData = null
) {
  const {
    age = 30,
    gender = 'Male',
    weight = 60,
    bp_systolic: sysRaw,
    bp_diastolic: diaRaw,
    symptoms = [],
    phase = 'ACUTE',
    report_values = {},
    affected_organs = [],
    temperament = 'Mixed'
  } = input;

  const ehInfo = ehEngineData?.success ? ehEngineData.data : null;

  const sysNum = sysRaw === undefined || sysRaw === null || sysRaw === '' ? NaN : Number(sysRaw);
  const diaNum = diaRaw === undefined || diaRaw === null || diaRaw === '' ? NaN : Number(diaRaw);
  const bp_systolic = Number.isFinite(sysNum) ? sysNum : 120;
  const bp_diastolic = Number.isFinite(diaNum) ? diaNum : 80;

  const {
    polarityState,
    masterElectricity,
    externalLocation,
    waterInstruction,
    isHyper
  } = rules;

  const gHi = gender === 'Male' ? 'पुरुष' : 'महिला';
  const dose = age <= 12 ? 5 : age > 60 ? 7 : 10;
  const fa = formulas?.formula_a || {};
  const fb = formulas?.formula_b || {};
  const faFmt = buildFormulaFn(fa.medicines, potency);
  const fbFmt = buildFormulaFn(fb.medicines, potency);
  const fc = formulas?.formula_c || {};
  const fd = formulas?.formula_d || {};
  const fcFmt = buildFormulaFn(fc.medicines, potency);
  const fdFmt = buildFormulaFn(fd.medicines, potency === 'D3' ? potency : 'D3');
  const fbUse = fbFmt !== '--' ? fbFmt : faFmt;

  const symNames = dedupeSymptomList(
    symptoms.map((s) => (typeof s === 'object' ? s.hindi || s.name || '' : String(s)))
  );
  const symLine = buildComplaintLine(symptoms);
  const symText = symNames.join(' ').toLowerCase();

  const PHASE_HI = {
    ACUTE: 'तीव्र (लगभग चौदह दिनों के भीतर)',
    SUB_ACUTE: 'अर्ध-तीव्र (चौदह से साठ दिन)',
    CHRONIC: 'जीर्ण (साठ दिन से अधिक)',
    DEGENERATIVE: 'अपक्षयी'
  };
  const phKey = String(phase).toUpperCase().replace(/-/g, '_');

  const elecShort =
    String(masterElectricity).match(/\b(RE|BE|WE|GE|YE)\b/i)?.[1]?.toUpperCase() ||
    (rules.vitalsHypo || !isHyper ? 'WE' : 'BE');

  const stateHi = isHyper ? 'अति-सक्रिय (उग्र/HYPER संबंधी अभिव्यक्ति)' : 'निष्क्रिय (शिथिल/HYPO संबंधी अभिव्यक्ति)';

  const hasSanguine =
    bp_systolic > 130 ||
    ['heart', 'धड़कन', 'sar dard', 'headache', 'रक्तचाप', 'bp'].some((w) => symText.includes(w));
  const hasLymphatic = ['sujan', 'uric', 'kabz', 'gas', 'सूजन', 'कब्ज'].some((w) =>
    symText.includes(w)
  );
  const hasNervous = ['chakkar', 'neend', 'ghabrahat', 'anxiety', 'चक्कर', 'घबराहट', 'नींद'].some(
    (w) => symText.includes(w)
  );

  let prakruti = 'मिश्रित प्रकृति — कई मार्ग एक साथ प्रभावित';
  if (hasSanguine && hasNervous) prakruti = 'मिश्रित — रक्त प्रधान व तंत्रिका तनाव लक्षण';
  else if (hasSanguine && hasLymphatic) prakruti = 'मिश्रित — रक्त व रस मार्ग';
  else if (hasSanguine) prakruti = 'रक्त प्रधान (उच्च परिसंचरण दबाव के संकेत)';
  else if (hasLymphatic) prakruti = 'रस प्रधान (पाचन व उत्सर्जन मंदता के संकेत)';
  else if (hasNervous) prakruti = 'तंत्रिका प्रधान (चक्कर, घबराहट, नींद)';

  const tempLabel =
    temperament && temperament !== 'Mixed' ? String(temperament) : prakruti.slice(0, 48);

  const benefitMorning = isHyper
    ? 'तीव्रता में कमी, रक्तचाप व तनाव पर नियंत्रण की दिशा'
    : 'जीवनी शक्ति उत्थान व परिसंचरण सुधार';
  const benefitDay = isHyper
    ? 'दाह व सूजन में क्रमिक शमन'
    : 'पाचन मार्ग कोमल उत्तेजना व अवशोषण';
  const benefitNight = isHyper
    ? 'रात्रि विश्राम व अनिद्रा में सुधार'
    : 'विश्राम में पुनर्बलन';

  const confidence = input.confidence ?? formulas?.confidence ?? 88;

  const L = [];
  const A = (...ls) => ls.forEach((l) => L.push(l));

  A('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  A('# 🏥 इलेक्ट्रो-होम्योपैथी क्लिनिकल विशेषज्ञ सारांश');
  A('### ⚕ E.H. AROGYA SUTRA CLINIC ⚕');
  A('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  A('');
  A('**काउंट सेज़र मैटेई के स्पैजिरिक सिद्धांतों पर आधारित — Dynamic Rule Engine**');
  A('');
  A('| विवरण | जानकारी |');
  A('| :--- | :--- |');
  A(`| **आयु व लिंग** | ${age} वर्ष; ${gHi} |`);
  A(`| **शारीरिक भार** | ${weight} किग्रा |`);
  A(`| **रक्तचाप माप** | **${bp_systolic} प्रति ${bp_diastolic} मि.मी. पारा** |`);
  A(`| **रोग अवधि व चरण** | ${PHASE_HI[phKey] || String(phase)} |`);
  A(`| **क्लिनिकल ध्रुवता (नियामवली)** | **${polarityState}** |`);
  A(`| **पोटेंसी व विद्युत (लॉक)** | **${potency}** · **${masterElectricity}** |`);
  A(`| **मुख्य शिकायतें** | ${symLine} |`);
  A('');
  A(
    `**संक्षेप:** आयु **${age}** वर्ष · रक्तचाप **${bp_systolic}/${bp_diastolic}** mmHg · प्रकृति **${tempLabel}** · पोटेंसी **${potency}** · विद्युत **${masterElectricity}**`
  );
  A('');

  if (bp_systolic >= 180) {
    A('---');
    A('## 🚨 चिकित्सा चेतावनी: उच्च रक्तचाप संकट');
    A(`> **रक्तचाप ${bp_systolic}/${bp_diastolic} मि.मी. पारा — तत्काल विश्राम व निरंतर निगरानी अनिवार्य।**`);
    A('---');
  } else if (bp_systolic >= 140) {
    A('---');
    A('## 🚨 चिकित्सा चेतावनी: उच्च रक्तचाप');
    A(`> **${bp_systolic}/${bp_diastolic} मि.मी. पारा — लवण व तनाव सीमित रखें।**`);
    A('---');
  }
  if (
    (Number.isFinite(sysNum) && sysNum < 100) ||
    (Number.isFinite(diaNum) && diaNum < 55) ||
    (Number.isFinite(sysNum) && Number.isFinite(diaNum) && sysNum < 110 && diaNum < 60)
  ) {
    A('---');
    A('## ⚠ चिकित्सा चेतावनी: निम्न रक्तचाप');
    A(
      `> **${bp_systolic}/${bp_diastolic} मि.मी. पारा — गुनगुने पोषक द्रव्य; अचानक न उठें; नियामवली HYPO मार्ग (${potency}, ${masterElectricity}) अविचल।**`
    );
    A('---');
  }

  const medCtx = { isHyper, hasLymphatic, hasNervous, hasSanguine, bp_systolic };

  const sec1 = [
    `${gHi} रोगी, आयु **${age} वर्ष**, वर्तमान में **${stateHi}** के साथ **${polarityState}** ध्रुवता पर नियामवली आधारित उपचार मार्ग में हैं। इलेक्ट्रो-होम्योपैथी दृष्टि से जीवनी शक्ति (Vital Force) का संतुलन अंग-विशेष उत्तेजना या ऊर्जा की मंदी से भंग हुआ प्रतीत होता है।`,
    `**मुख्य शिकायतें:** ${symLine} — ये संकेत **${PHASE_HI[phKey] || phase}** चरण के एकीकृत रोग-चित्र को दर्शाते हैं।`,
    `रक्तचाप **${bp_systolic}/${bp_diastolic}** मि.मी. पारा, भार **${weight} किग्रा** — वाइटल्स के अनुसार चुनी गई पोटेंसी **${potency}** व विद्युत **${masterElectricity}** दोष निचोड़ व पुनर्संतुलन के अनुरूप हैं।`,
    isHyper
      ? '**HYPER / उग्र अवस्था:** उच्च डायल्युशन से सूक्ष्म शमन; बाह्य विद्युत तल पर शांति व संकुचन संतुलन लक्षित।'
      : '**HYPO / निष्क्रिय अवस्था:** मध्यम डायल्युशन से क्रमिक उत्तेजना; गुनगुना जल व धीमी सेवन विधि जीवनी शक्ति के उत्थान में सहायक।',
    'रोगी से साप्ताहिक पुनर्मूल्यांकन पर लक्षण भार, नींद, भोजन व वाइटल्स अद्यतन रखने होंगे — अंतिम निदान चिकित्सक पर निर्भर रहता है।'
  ];
  emitSectionLines(A, 1, 'कार्यकारी क्लिनिकल विवरण', 'Executive Clinical Overview', sec1);

  const sec2 = [
    `**प्रकृति निर्णय:** ${prakruti}`,
    'यह प्रकृति स्क्रोफोलोसो (S), एंजिटिको (A), फेब्रीफुगो (F) व कैंसरोसो (C) समूहों के तर्क से मेल खाती है — रक्त में दोष या रस में अवरोध, कारण सहित।',
    hasSanguine
      ? '**रक्त प्रधान:** परिसंचरण दबाव व धमनीय तनाव — एंजिटिको श्रेणी प्राथमिकता में।'
      : 'रक्त मार्ग में प्रमुख दबाव के संकेत सीमित — रस/तंत्रिका पर अधिक ध्यान।',
    hasLymphatic
      ? '**रस प्रधान:** कब्ज, गैस, सूजन — स्क्रोफोलोसो शुद्धि प्राथमिक।'
      : 'रस मार्ग सामान्य रूप से सक्रिय; फिर भी S-समूह संतुलन हेतु जोड़ा गया।',
    hasNervous
      ? '**तंत्रिका प्रधान:** चक्कर, घबराहट, नींद — फेब्रीफुगो शांति हेतु।'
      : 'तंत्रिका तनाव सीमित; फिर भी F-समूह सुरक्षा हेतु।',
    '**निष्कर्ष:** समग्र चित्र में बहु-समूह स्पैजिरिक संयोजन औचित्यपूर्ण — एकल औषधि की अपेक्षा सहकारी मिश्रण अपेक्षित लाभ देता है।'
  ];
  emitSectionLines(A, 2, 'प्रकृति विश्लेषण', 'Temperament Analysis', sec2);

  const { anatomy, pathology } = deriveAnatomyPathology(symText, bp_systolic, bp_diastolic);
  const organAnatomy =
    Array.isArray(affected_organs) && affected_organs.length
      ? getOrganAnatomyText(affected_organs, { lockedElectricityLabel: masterElectricity })
      : '';
  const labFindings = analyzeLabReports(report_values);

  const sec3 = [
    `**प्रभावित अंग (Anatomy):** ${anatomy}`,
    `**रोग की स्थिति (Pathology):** ${pathology}`,
    'निम्न शारीरिक प्रणालियाँ प्रभावित प्रतीत होती हैं — प्रत्येक में क्या हो रहा है, संक्षेप में:',
    bp_systolic > 130 || symText.includes('रक्तचाप')
      ? `**हृदय व परिसंचरण:** रक्तचाप ${bp_systolic}/${bp_diastolic} — धमनीय तनाव, नियमित निगरानी अनिवार्य।`
      : '**हृदय:** वर्तमान वाइटल्स सीमित तनाव — फिर भी एंजिटिको समूह सुरक्षा हेतु।',
    hasNervous
      ? '**तंत्रिका:** चक्कर, घबराहट — अधिसक्रियता या थकावट से जुड़ा संतुलन भंग।'
      : '**तंत्रिका:** प्रमुख तंत्रिका लक्षण सीमित।',
    hasLymphatic
      ? '**पाचन व उत्सर्जन:** कब्ज, गैस — आंतों की मंद गति व अपशिष्ट जमाव की संभावना।'
      : '**पाचन:** सामान्य रूप से स्थिर; S10 आंत शुद्धि हेतु।',
    Number(report_values.uric_acid) > 7
      ? `**प्रयोगशाला:** यूरिक एसिड ${report_values.uric_acid} — पुरीन परहेज व जल।`
      : 'प्रयोगशाला मान अनुकूल या अनिर्दिष्ट — आवश्यकतानुसार पुनः जाँच।'
  ];
  if (organAnatomy) {
    sec3.push('**काउंट मैटेई — प्रभावित तंत्र (पुस्तक Anatomy DB):**');
    sec3.push(organAnatomy);
  }
  if (labFindings.length) {
    sec3.push('**प्रयोगशाला परीक्षण (Lab — EH अर्थ):**');
    sec3.push('| परीक्षण | मान | सामान्य | स्थिति | EH अर्थ |');
    sec3.push('| :--- | :--- | :--- | :--- | :--- |');
    labFindings.forEach((f) => {
      sec3.push(
        `| ${f.test} | ${f.value} ${f.unit} | ${f.normal} | ${f.status} | ${f.eh_meaning} |`
      );
    });
  }
  if (symNames.length) {
    sec3.push('**लक्षण मानचित्र:**');
    symNames.slice(0, 6).forEach((s) => {
      sec3.push(`- **${s}** — संबंधित अंग पर निगरानी व प्रतिक्रिया दर्शाएँ।`);
    });
  }
  if (temperament && temperament !== 'Mixed') {
    sec3.push(
      `**कृति (Temperament):** ${temperament} — ${
        temperament === 'Sanguine'
          ? 'रक्त प्रधान; A-समूह प्राथमिकता'
          : temperament === 'Lymphatic'
            ? 'रस प्रधान; S-समूह प्राथमिकता'
            : 'मिश्रित प्रकृति'
      }`
    );
  }
  emitSectionLines(A, 3, 'शारीरिक एवं रोग विश्लेषण', 'Anatomical & Pathological Evaluation', sec3);

  const sec4Core = buildStructuredSection4Blocks({
    formulas,
    bookDatabaseContent,
    faFmt,
    fbFmt,
    fcFmt,
    fdFmt,
    potency,
    dose,
    masterElectricity,
    externalLocation,
    symText,
    symLine,
    buildFormulaFn
  });
  const rationale = buildClinicalRationaleLines(formulas, medCtx);
  emitSectionLines(A, 4, 'औषधि निर्माण का वैज्ञानिक कारण', 'Dynamic Formula Formulation Logic', [
    ...sec4Core,
    ...rationale
  ]);

  const potencyLawNote =
    potency === 'D6'
      ? `बीपी ≤130 / सामान्य-निम्न पर **D6 लॉक** — एआई द्वारा D10 नहीं बदला जाएगा।`
      : potency === 'D4'
        ? `गंभीर HYPO / निम्न बीपी पर **D4 लॉक** — क्रमिक उत्तेजना।`
        : potency === 'D10' || potency === 'D30'
          ? `HYPER / उच्च बीपी पर **${potency}** — सूक्ष्म शमन।`
          : `वाइटल्स-लॉक **${potency}** अविचल।`;

  const sec5 = [
    `**नियुक्त पोटेंसी:** **${potency}** — **${polarityState}** व वाइटल्स-लॉक के अनुरूप।`,
    potencyLawNote,
    `**इस केस में ${potency} सही क्यों?** रक्तचाप **${bp_systolic}/${bp_diastolic}** और लक्षणों से नियामवली ने पोटेंसी व विद्युत लॉक की — परिवर्तन मना।`,
    `**विद्युत (rule lock):** ${masterElectricity} — केवल यही कोड आंतरिक/बाह्य मिश्रण में; GE निम्न बीपी पर ब्लॉक (dynamicEhRules.json)।`,
    '**सुरक्षा:** खुराक परिवर्तन केवल चिकित्सक की देखरेख में; छाती दबाव, उल्टी, चक्कर बढ़ने पर तुरंत सहायता।'
  ];
  emitSectionLines(A, 5, 'पोटेंसी और ध्रुवता का नियम', 'Potency & The Law of Polarity', sec5);

  const sec6 = [
    '**A. आंतरिक औषधि:**',
    `- तैयारी: **${potency}** फॉर्मूला की **${dose} बूंदें** 30 ml साफ पानी में।`,
    bp_systolic >= 160
      ? '- खुराक: दिन में **4–5 बार** (3–4 घंटे अंतराल); घबराहट पर घूँट-घूँट (Sip by sip)।'
      : '- खुराक: दिन में **3–4 बार** (भोजन से 30 मिनट पहले/बाद)।',
    `**B. बाह्य:** ${externalLocation}`,
    `> **सर्वोच्च सेवन विधि:** ${waterInstruction}`,
    '**⏰ दैनिक खुराक समय सारणी (6-Timing Tablet Chart):**',
    '| समय | मिश्रण | बूंदें | मुख्य लाभ |',
    '| :--- | :--- | :---: | :--- |',
    `| 🌅 **सुबह (खाली पेट)** | ${chartCellMixtureWithOptionalElec(faFmt, elecShort, { internal: true })} | ${dose} | ${benefitMorning} |`,
    `| ☕ **नाश्ते के बाद** | \`${fbUse}\` | ${dose} | ${benefitDay} |`,
    `| ☀️ **दोपहर (पहले)** | ${chartCellMixtureWithOptionalElec(faFmt, elecShort, { internal: true })} | ${dose} | दोष निचोड़ |`,
    `| 🍽️ **दोपहर (बाद)** | \`${fbUse}\` | ${dose} | ${benefitDay} |`,
    `| 🌙 **रात (पहले)** | ${chartCellMixtureWithOptionalElec(faFmt, elecShort, { internal: true })} | ${dose} | संचार शुद्धि |`,
    `| 💤 **सोते समय** | \`${fcFmt !== '--' ? fcFmt : fbUse}\` | ${dose} | ${benefitNight} |`,
    '**नोट:** मिश्रण B रिक्त हो तो केवल A क्रम रखें; छूटी खुराक दोगुनी न करें।'
  ];
  emitSectionLines(A, 6, 'खुराक और सेवन विधि', 'Posology & Dosage Instructions', sec6);

  const sec7 = ['**🚫 सख्त परहेज:**'];
  if (isHyper) {
    sec7.push('- नमक आधा; तली-भुनी, चाय-कॉफी बंद');
    sec7.push('- भारी गरिष्ठ भोजन, शराब, तंबाकू');
  } else {
    sec7.push('- ठंडा पानी, आइसक्रीम, बासी भोजन');
  }
  const rv = report_values || {};
  if (Number(rv.uric_acid) > 7) sec7.push('- लाल मांस, बीयर, अधिक दाल — यूरिक एसिड');
  if (Number(rv.sugar) > 150) sec7.push('- चीनी, गुड़, सफेद चावल');
  sec7.push('**✅ अनुशंसित:**');
  if (isHyper) {
    sec7.push('- पपीता, हरी सब्जी, दलिया, 8–10 गिलास पानी');
    sec7.push('- खिचड़ी, लौकी; अदरक-तुलसी चाय');
  } else {
    sec7.push('- गर्म दूध-हल्दी, मेवे, दाल-चावल-रोटी');
  }
  sec7.push('**जीवनशैली:**');
  if (bp_systolic >= 160) {
    sec7.push('- पूर्ण आराम; तनाव से दूर; 24 घंटे BP निगरानी');
  } else {
    sec7.push('- हल्का व्यायाम; 7–8 घंटे नींद');
  }
  const followDays = phKey === 'ACUTE' ? '7' : phKey === 'SUB_ACUTE' ? '15' : '30';
  sec7.push(
    `**Clinical Prognosis:** ${isHyper ? 'उग्र' : 'निष्क्रिय'} ध्रुवता में स्पैजिरिक औषधि क्रमिक संतुलन देगी। **${followDays} दिनों में पुनर्मूल्यांकन।**`
  );
  emitSectionLines(A, 7, 'आहार और जीवन शैली', 'Dietary & Lifestyle Adjuvants', sec7);

  A('---');
  A('## 💡 AI प्रणाली कार्यप्रवाह');
  A('');
  if (bp_systolic >= 160) {
    A(
      `- **गंभीर चेतावनी:** AI ने पहचाना कि BP ${bp_systolic}/${bp_diastolic} Medical Emergency संदर्भ है।`
    );
  }
  A(
    '- **गतिशील तर्क (Dynamic Logic):** AI ने EH सिद्धांत "Complexa Complexis Curantur" का पालन करते हुए Master Formula बनाया।'
  );
  A(
    `- **सुरक्षा (Potency):** AI ने ${potency} (${isHyper ? 'ऋणात्मक' : 'धनात्मक'} डोज़) चुना — ${polarityState} के अनुरूप।`
  );
  A('');
  A('---');
  A('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  A('🌿 **E.H. AROGYA SUTRA CLINIC** | Count Cesare Mattei Principles');

  // EH data add karo agar available hai
  if (ehInfo) {
    A('');
    A('═══════════════════════════════════════');
    A('EH AI CLINICAL ANALYSIS (9 Rule Engines)');
    A('═══════════════════════════════════════');
    A(`Prakriti   : ${ehInfo.prakriti?.prakriti_hindi || '—'}`);
    A(`Rog Prakriti: ${ehInfo.polarity?.polarity_hindi || '—'}`);
    A(`Potency    : ${ehInfo.potency?.potency || '—'} — ${ehInfo.potency?.matra_name || ''}`);
    A(`Safety     : ${ehInfo.safety?.overall_status || '—'}`);
    A('');

    if (ehInfo.mixtures && ehInfo.mixtures.length > 0) {
      ehInfo.mixtures.forEach((m, i) => {
        A(`MIXTURE ${String.fromCharCode(65 + i)}: ${m.formula_obj?.full || m.fo?.full || '—'}`);
        A(`Samay: ${m.schedule || '—'}`);
        A('');
      });
    }

    A('Aggravation Antidote: Nimbu-Sirka (1 chamach nimbu + 1 chamach sirka)');
  }

  A(`*AI विश्वास: **${confidence}%** | स्रोत: Dynamic Rule Engine + Organ Medicine Pool*`);
  A('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return L.join('\n');
}

module.exports = { buildFallbackSummarySeven, MED_HINT_HI };
