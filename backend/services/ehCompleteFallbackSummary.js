'use strict';

/**
 * Rule-based 800–1000+ word summary — EH_Complete_Engine_Final-1.pdf (10 sections, 4 Tablet + 2 Malam)
 */
const { MED_DB } = require('./ehSourceOfTruthClinical');

function fmt(meds, pot) {
  if (!meds?.length) return '--';
  const c = (Array.isArray(meds) ? meds : [meds])
    .map((m) => String(m).replace(/-/g, '').replace(/\./g, '').trim())
    .filter(Boolean);
  return `${c.join(' + ')} ${pot || 'D10'}`;
}

function countWords(text) {
  return String(text || '')
    .split(/\s+/)
    .filter(Boolean).length;
}

function buildCompleteFallbackSummary(input = {}, cd = {}) {
  const {
    age = 30,
    gender = 'Male',
    weight = 60,
    bp_systolic = 120,
    bp_diastolic = 80,
    pulse = 72,
    symptoms = [],
    phase = 'ACUTE'
  } = input;
  const { temperament, polData, formulas, electricity, labFindings } = cd;
  const { potency, isHyper, polarity } = polData;
  const gHi = String(gender).toLowerCase().includes('female') || gender === 'महिला' ? 'महिला' : 'पुरुष';
  const dose = age <= 12 ? 5 : age > 60 ? 7 : 10;
  const fa = formulas.formula_a;
  const fb = formulas.formula_b;
  const fc = formulas.formula_c;
  const fcPot = String(phase).toUpperCase() === 'CHRONIC' ? (isHyper ? 'D30' : 'D3') : potency;
  const faFmt = fmt(fa.medicines, potency);
  const fbFmt = fmt(fb.medicines, potency);
  const fcFmt = fmt(fc.medicines, fcPot);
  const m3meds = (formulas.all_medicines || []).filter((m) => ['S-10', 'C-8', 'F-1'].includes(m)).slice(0, 3);
  const m3fmt = m3meds.length ? fmt(m3meds, potency) : faFmt;
  const sym = symptoms.map((s) => (typeof s === 'object' ? s.name || s.hindi || '' : String(s))).filter(Boolean);
  const symT = sym.join(' ').toLowerCase();
  const elecShort = String(electricity.elec || 'B.E.').replace(/\s*\(.*\)/, '');
  const PHASE_HI = {
    ACUTE: 'तीव्र (0-14 दिन)',
    SUB_ACUTE: 'अधि-तीव्र',
    CHRONIC: 'जीर्ण (60+ दिन)',
    DEGENERATIVE: 'अपक्षय'
  };
  const L = [];
  const A = (...ls) => ls.forEach((l) => L.push(l));

  A('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  A('🌿 **E.H. AROGYA SUTRA CLINIC**');
  A('**इलेक्ट्रो-होम्योपैथी क्लिनिकल विशेषज्ञ प्रिस्क्रिप्शन**');
  A('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  A('');
  A('| विवरण | जानकारी | विवरण | जानकारी |');
  A('|-------|---------|-------|---------|');
  A(`| **आयु** | ${age} वर्ष | **लिंग** | ${gHi} |`);
  A(`| **भार** | ${weight} किग्रा | **नाड़ी** | ${pulse}/मिनट |`);
  A(`| **रक्तचाप** | ${bp_systolic}/${bp_diastolic} mmHg | **प्रकृति** | ${temperament} |`);
  A(`| **अवस्था** | ${PHASE_HI[phase] || phase} | **पोटेंसी** | ${potency} |`);
  A('');
  if (bp_systolic >= 140) {
    A('---');
    A(`## ⚠ BP ${bp_systolic}/${bp_diastolic} — नमक कम करें, नियमित नाड़ी जाँच`);
    A('---');
  }
  A('');
  A('## 🔬 CLINICAL ASSESSMENT');
  A(`**प्रकृति:** ${temperament} — ${temperament === 'Sanguine' ? 'रक्त (Blood) विकृति' : temperament === 'Lymphatic' ? 'रस (Lymph) विकृति' : 'रक्त + रस मिश्र'}`);
  A(`**EH समूह:** ${temperament === 'Sanguine' ? 'A-Group प्राथमिक' : temperament === 'Lymphatic' ? 'S-Group प्राथमिक' : 'A + S + C'}`);
  A(`**ध्रुवता:** ${polarity} → **${potency}**`);
  A('');
  A('## ━━ SECTION 1: जाँच रिपोर्ट विश्लेषण');
  if (labFindings.length) {
    A('| परीक्षण | मान | सामान्य | स्थिति | EH अर्थ |');
    A('|--------|-----|--------|--------|---------|');
    labFindings.forEach((f) =>
      A(`| ${f.test} | ${f.value} ${f.unit} | ${f.normal} | ${f.status} | ${f.eh_meaning} |`)
    );
  } else {
    A('रिपोर्ट डेटा उपलब्ध नहीं — लक्षणों से विश्लेषण।');
  }
  A('');
  A('## ━━ SECTION 2: प्रभावित अंग + Anatomy');
  const ORG = {
    uric: '**मूत्र (Urinary):** यूरिक एसिड जमाव, जोड़ों में दर्द।',
    jod: '**मांसपेशी:** उपास्थि क्षय, साइनोवियल द्रव कम।',
    bp: '**हृदय:** धमनी कठोरता, रक्त प्रवाह बाधा।',
    kabz: '**पाचन:** आंत गति कम, विषाक्त भार।',
    chakkar: '**तंत्रिका:** वेस्टिबुलर असंतुलन।',
    diabetes: '**अंतःस्रावी:** इंसुलिन प्रतिरोध।'
  };
  Object.entries(ORG).forEach(([kw, text]) => {
    if (symT.includes(kw)) A(text);
  });
  A('EH सिद्धांत: रोग रक्त या रस की विकृति से उत्पन्न होते हैं।');
  A('माटेई के अनुसार प्रत्येक औषधि का लक्ष्य विशिष्ट अंग-ऊतक तक पहुँचकर विकृति को निष्क्रिय करना है।');
  A('इलेक्ट्रो-होम्योपैथी में बाह्य विद्युत (B.E./G.E./W.E.) तथा आंतरिक टैबलेट दोनों मार्ग साथ चलते हैं।');
  A('');
  A('## ━━ SECTION 3: 💊 TABLET (4 मिश्रण)');
  A('### मिश्रण 1 — मुख्य रोग');
  A(`**✦ फॉर्मूला:** \`${faFmt}\``);
  A(`**✦ उद्देश्य:** ${temperament} प्रकृति का मुख्य उपचार`);
  (fa.medicines || []).slice(0, 4).forEach((m) => {
    const info = MED_DB[m] || { action: m };
    A(` • **${m}:** ${info.action} — ${info.anatomy || ''}`);
  });
  A('**✦ समय:** सुबह 6:00 (खाली पेट) + दोपहर 1:00 + रात 8:00');
  A('**✦ विधि:** 10 बूंदें आधे कप गुनगुने पानी में');
  A('');
  A('### मिश्रण 2 — यकृत / गुर्दा');
  A(`**✦ फॉर्मूला:** \`${fbFmt}\``);
  (fb.medicines || []).slice(0, 3).forEach((m) => {
    const info = MED_DB[m] || { action: m };
    A(` • **${m}:** ${info.action}`);
  });
  A('**✦ समय:** नाश्ते के बाद 8:00 + शाम 5:00');
  A('');
  A('### मिश्रण 3 — पाचन / गैस');
  A(`**✦ फॉर्मूला:** \`${m3fmt}\``);
  A('**✦ उद्देश्य:** पाचन लसीका + कब्ज/गैस');
  A('**✦ समय:** खाने के बाद दोपहर + रात');
  A('');
  A('### मिश्रण 4 — रात्रि');
  A(`**✦ फॉर्मूला:** \`${fcFmt}\``);
  A('**✦ उद्देश्य:** कोशिका पुनर्निर्माण');
  A('**✦ समय:** सोते समय 10:00');
  A('');
  A('## ━━ SECTION 4: 🧴 MALAM (2 मलहम)');
  const fd = formulas.formula_d || {};
  A(`### मलहम 1 — ${elecShort} (बाह्य D3)`);
  A(`**✦ फॉर्मूला:** \`${fd.formatted || `${elecShort} D3`}\``);
  A(`**✦ प्रकृति:** ${fd.prakriti || electricity.prakriti || '—'}`);
  A(`**✦ Book Point:** ${fd.points || electricity.points}`);
  A(`**✦ स्थान:** ${fd.location || electricity.loc}`);
  A(`**✦ कार्य:** ${electricity.action || '—'}`);
  A('**✦ विधि:** कपड़े में 10 बूंदें, 20 मिनट कंप्रेस, दिन में 2 बार');
  A('');
  A('### मिश्रण A में विद्युत (पीने वाली बोतल)');
  A(`**✦ आंतरिक:** मिश्रण A में \`${elecShort}\` शामिल — ${fa.note || electricity.action || ''}`);
  A('');
  A('## ━━ SECTION 5: ⏰ समय सारणी');
  A('| समय | मिश्रण | फॉर्मूला | बूंदें |');
  A('|-----|--------|---------|-------|');
  A(`| 🌅 6:00 | मिश्रण 1 | ${faFmt} | ${dose} |`);
  A(`| ☕ 8:00 | मिश्रण 2 | ${fbFmt} | ${dose} |`);
  A(`| 🌿 9:00 | मलहम 1 | ${elecShort} D3 | लगाएं |`);
  A(`| ☀ 1:00 PM | मिश्रण 1 | ${faFmt} | ${dose} |`);
  A(`| 🍽 2:00 PM | मिश्रण 3 | ${m3fmt} | ${dose} |`);
  A(`| 🌇 5:00 PM | मिश्रण 2 | ${fbFmt} | ${dose} |`);
  A(`| 🌿 6:00 PM | मलहम 1 | ${elecShort} D3 | लगाएं |`);
  A(`| 🌙 8:00 PM | मिश्रण 1 | ${faFmt} | ${dose} |`);
  A(`| 💤 10:00 PM | मिश्रण 4 | ${fcFmt} | ${dose} |`);
  A('');
  A('## ━━ SECTION 6: ⚗ दवा बनाने की विधि');
  A('1. 30 ml कांच की शीशी');
  A('2. प्रत्येक दवा 5-5 बूंदें');
  A('3. शेष Distilled Water (D.W.)');
  A('4. 100 बार मजबूत strokes');
  A('⚠ नल का पानी नहीं — केवल D.W.');
  A('');
  A('## ━━ SECTION 7: EH सिद्धांत अनुपालन');
  A('*"सभी रोग रक्त या रस की विकृति से उत्पन्न होते हैं।"* — Count Cesare Mattei');
  if (temperament === 'Sanguine') A('A-Group रक्त शुद्धि → धमनियाँ स्वस्थ → BP संतुलन');
  else if (temperament === 'Lymphatic') A('S-Group रस शुद्धि → लसीका स्वस्थ → विष निकासी');
  else A('A + S + C — रक्त + रस + कोशिका तीनों मार्ग');
  A(`**ध्रुवता:** ${isHyper ? 'HYPER → ' + potency : 'HYPO → ' + potency}`);
  A('');
  A('## ━━ SECTION 8: ✅ अपेक्षित सुधार');
  A('| अवधि | परिणाम |');
  A('|------|--------|');
  A('| 3-7 दिन | ऊर्जा, लक्षण में राहत |');
  A('| 15-30 दिन | रिपोर्ट में सुधार |');
  A('| 3 महीने | जीर्ण रोग में स्थिरता |');
  A('');
  A('## ━━ SECTION 9: 🥗 आहार');
  A('**🚫 परहेज:** नमक कम, तली चीज़, शराब बंद');
  const rv = input.report_values || {};
  if (Number(rv.uric_acid) > 7) A('- लाल मांस, बीयर — यूरिक');
  if (Number(rv.sugar_fast) > 126) A('- चीनी, सफेद चावल');
  A('**✅ लें:** हरी सब्जी, पानी 8-10 गिलास, हल्का भोजन');
  A('');
  A('## ━━ SECTION 10: ⚠ सावधानी');
  A('- तेज बुखार, सांस फूलना, बेहोशी — तुरंत चिकित्सक');
  if (Number(rv.creatinine) > 1.5) A('- 15 दिन बाद KFT दोहराएँ');
  if (Number(rv.uric_acid) > 7) A('- 30 दिन बाद यूरिक एसिड');
  A('');
  A('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  A('🌿 **E.H. AROGYA SUTRA CLINIC**');
  A(`*AI Confidence: ${Math.min(70 + labFindings.length * 4, 95)}%*`);
  A('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return L.join('\n');
}

module.exports = { buildCompleteFallbackSummary, countWords, fmt };
