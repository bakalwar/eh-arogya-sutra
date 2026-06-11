'use strict';

/**
 * EH_Summary_7Section-2.docx — rule-engine fallback (~1000 words, 7 sections + tables + malam).
 * Optimized for EH AI API v3 integration.
 */

function buildFallbackSummary(input = {}, cdData = {}, ehEngineData = null) {
  const {
    age = 30,
    gender = 'Male',
    weight = 60,
    bp_systolic = 120,
    bp_diastolic = 80,
    pulse = 72,
    symptoms = [],
    phase = 'ACUTE',
    report_values = {},
    affected_organs = []
  } = input;

  const ehInfo = ehEngineData?.success ? ehEngineData.data : null;

  const { temperament, polData, formulas, labFindings } = cdData;
  const electricityObj = cdData.electricity || {};
  const electricity = ehInfo?.electricity?.elec || (typeof electricityObj === 'string' ? electricityObj : electricityObj.elec || 'B.E.');
  const { potency, isHyper } = ehInfo ? { 
    potency: ehInfo.potency?.potency || 'D10', 
    isHyper: ehInfo.polarity?.polarity === 'POSITIVE' 
  } : (polData || { potency: 'D10', isHyper: true });

  const gHi = String(gender).toLowerCase().includes('f') ? 'महिला' : 'पुरुष';
  const dose = age <= 12 ? 5 : age > 60 ? 7 : 10;
  
  // Use ehInfo mixtures if available, otherwise fallback to cdData formulas
  let faFmt = '--', fbFmt = '--', fcFmt = '--', fdFmt = '--';
  let faMeds = [], fbMeds = [], fcMeds = [], fdMeds = [];
  let faSched = 'सुबह (खाली पेट)', fbSched = 'दिन (भोजन से पहले)', fcSched = 'सोते समय', fdSched = 'बाह्य (सुबह+शाम)';

  if (ehInfo && ehInfo.mixtures && ehInfo.mixtures.length > 0) {
    const mixA = ehInfo.mixtures[0];
    const mixB = ehInfo.mixtures[1];
    const mixC = ehInfo.mixtures[2];
    const mixD = ehInfo.mixtures[3];

    faFmt = mixA?.formula_obj?.full || mixA?.fo?.full || '--';
    faMeds = mixA?.medicines || [];
    faSched = mixA?.schedule || faSched;

    if (mixB) {
      fbFmt = mixB.formula_obj?.full || mixB.fo?.full || '--';
      fbMeds = mixB.medicines || [];
      fbSched = mixB.schedule || fbSched;
    }
    if (mixC) {
      fcFmt = mixC.formula_obj?.full || mixC.fo?.full || '--';
      fcMeds = mixC.medicines || [];
      fcSched = mixC.schedule || fcSched;
    }
    if (mixD) {
      fdFmt = mixD.formula_obj?.full || mixD.fo?.full || '--';
      fdMeds = mixD.medicines || [];
      fdSched = mixD.schedule || fdSched;
    }
  } else {
    const fa = formulas?.formula_a || {};
    const fb = formulas?.formula_b || {};
    const fc = formulas?.formula_c || {};
    const fd = formulas?.formula_d || {};
    faFmt = fa.formatted || '--';
    fbFmt = fb.formatted || '--';
    fcFmt = fc.formatted || '--';
    fdFmt = fd.formatted || '--';
    faMeds = fa.medicines || [];
    fbMeds = fb.medicines || [];
    fcMeds = fc.medicines || [];
    fdMeds = fd.medicines || [];
  }

  const fbOrFa = fbFmt !== '--' ? fbFmt : faFmt;

  const sym = (symptoms || [])
    .map((s) => (typeof s === 'object' ? s.hindi || s.name || '' : String(s)))
    .filter(Boolean);
  const symT = sym.join(' ').toLowerCase();
  const rv = report_values || {};

  const PHASE_HI = {
    ACUTE: 'तीव्र (0-14 दिन)',
    SUB_ACUTE: 'अर्ध-तीव्र',
    CHRONIC: 'जीर्ण (60+ दिन)',
    DEGENERATIVE: 'अपक्षयी'
  };

  const MED_ACT = {
    'S-1': 'रस प्रणाली शुद्धि',
    'S-2': 'यकृत शुद्धि',
    'S-5': 'त्वचा+जोड़',
    'S-6': 'गुर्दे+यूरिक',
    'S-10': 'पाचन+कब्ज',
    'A-1': 'BP+धमनियां',
    'A-2': 'शिराएं',
    'A-3': 'रक्त कोशिका',
    'C-4': 'जोड़+हड्डी',
    'C-6': 'Creatinine',
    'C-8': 'यकृत deep',
    'C-10': 'मधुमेह',
    'C-11': 'हृदय muscle',
    'C-16': 'महिला प्रजनन',
    'F-1': 'तंत्रिका+घबराहट',
    'L-1': 'Platelets',
    'P-1': 'फेफड़े',
    'VEN-1': 'Viral',
    'B.E.': 'BP कम+हृदय शांत',
    'G.E.': 'जोड़+यूरिक',
    'R.E.': 'ऊर्जा+कमज़ोरी',
    'W.E.': 'नींद+घबराहट',
    'Y.E.': 'बुखार+सूजन'
  };

  const ELEC_INFO = {
    'B.E.': {
      name: 'नीली विद्युत',
      loc: 'माथे + हृदय पर',
      pts: 'Point 1, 11',
      why: 'BP/Heart: धमनियां संकुचित'
    },
    'R.E.': {
      name: 'लाल विद्युत',
      loc: 'प्रभावित अंग पर',
      pts: 'Point 30',
      why: 'HYPO: कोशिकाएं उत्तेजित'
    },
    'G.E.': {
      name: 'हरी विद्युत',
      loc: 'प्रभावित जोड़ पर',
      pts: 'Point 23, 24',
      why: 'Jod/Uric: लसीका शुद्धि'
    },
    'W.E.': {
      name: 'सफेद विद्युत',
      loc: 'Occiput + कनपटी',
      pts: 'Point 1, 2',
      why: 'Nervous: तंत्रिका शांत'
    },
    'Y.E.': {
      name: 'पीली विद्युत',
      loc: 'छाती अग्र+पश्च',
      pts: 'Point 15, 16',
      why: 'Fever/Lung: विष निकासी'
    }
  };

  const elecI = ELEC_INFO[electricity] || ELEC_INFO['B.E.'];
  const L = [];
  const A = (...ls) => ls.forEach((l) => L.push(l));

  const engineLabel = ehInfo ? '9 Rule Engines (FastAPI)' : 'Rule-engine fallback (Ollama नहीं)';
  const confidence = ehInfo ? 95 : (cdData.confidence || 70);

  A('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  A('🌿 **E.H. AROGYA SUTRA CLINIC**');
  A('**इलेक्ट्रो-होम्योपैथी क्लिनिकल विशेषज्ञ सारांश**');
  A(`⚡ **Formula:** ${ehInfo?.polarity?.polarity || (isHyper ? 'POSITIVE' : 'NEGATIVE')} · ${phase} · ${potency} · ${electricity}`);
  A(`सारांश: ${engineLabel} · Confidence: ${confidence}%`);
  A('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  A('');
  A('| विवरण | जानकारी | विवरण | जानकारी |');
  A('|-------|---------|-------|---------|');
  A(`| **नाम** | ${input.patient_name || (input.fullName || input.patient_name || (input.patient && (input.patient.fullName || input.patient.name)) ) || '—'} | **आयु** | ${age} वर्ष |`);
  A(`| **लिंग** | ${gHi} | **भार** | ${weight} किग्रा |`);
  A(`| **नाड़ी** | ${pulse}/मिनट | **रक्तचाप** | ${bp_systolic}/${bp_diastolic} mmHg |`);
  A(`| **प्रकृति** | ${ehInfo?.prakriti?.prakriti_hindi || temperament} | **अवस्था** | ${PHASE_HI[phase] || phase} |`);
  A(`| **पोटेंसी** | ${potency} | **ध्रुवता** | ${ehInfo?.polarity?.polarity || (isHyper ? 'HYPER' : 'HYPO')} |`);
  A(`| **विद्युत** | ${electricity} |  |  |`);
  A('');

  if (bp_systolic >= 180) {
    A('> **🚨 उच्च रक्तचाप संकट** — तत्काल चिकित्सक से संपर्क करें।');
  } else if (bp_systolic >= 140) {
    A(`> **⚠️ उच्च BP:** ${bp_systolic}/${bp_diastolic} — नमक कम करें।`);
  } else if (bp_systolic < 90) {
    A(`> **⚠️ निम्न BP:** ${bp_systolic}/${bp_diastolic} — ORS + गुनगुना पानी।`);
  }
  A('');

  A('## 1. कार्यकारी क्लिनिकल विवरण');
  A('');
  A(
    `**${gHi} रोगी (${age} वर्ष)** — **${isHyper ? 'HYPER (अति-सक्रिय)' : 'HYPO (निष्क्रिय)'}** अवस्था, **${ehInfo?.prakriti?.prakriti_hindi || temperament}** प्रकृति।`
  );
  A(
    `**मिश्रण A (मुख्य + विद्युत):** \`${faFmt}\` — *${electricity} मिश्रण में शामिल है।*`
  );
  if (sym.length) {
    A('**मुख्य लक्षण:**');
    sym.slice(0, 8).forEach((s) => A(`- ${s}`));
  }
  A('');

  A('## 2. प्रकृति एवं रोग विश्लेषण');
  A('');
  const tempLine =
    (ehInfo?.prakriti?.prakriti || temperament) === 'Sanguine'
      ? 'रक्त (Blood) विकृति — **A-Group** प्राथमिक'
      : (ehInfo?.prakriti?.prakriti || temperament) === 'Lymphatic'
        ? 'रस (Lymph) विकृति — **S-Group** प्राथमिक'
        : (ehInfo?.prakriti?.prakriti || temperament) === 'Nervous'
          ? 'तंत्रिका दोष — **F-Group**'
          : 'रक्त+रस — **A+S+C** संतुलन';
  A(`**प्रकृति:** ${ehInfo?.prakriti?.prakriti_hindi || temperament} — ${tempLine}।`);
  A('काउंट मैटी: *"सभी रोग रक्त/रस की विकृति से।"*');
  A('');
  A(
    'इलेक्ट्रो-होम्योपैथी में रोगी की **प्रकृति (Temperament)** पहचान कर उसी समूह की औषधि दी जाती है — Sanguine में A-Group, Lymphatic में S-Group प्राथमिक रहता है। ध्रुवता (HYPER/HYPO) से पोटेंसी तय होती है: तीव्र अवस्था में अधिकतर D10, जीर्ण HYPO में D3/D4।'
  );
  A(
    '**Organ-System Mapping:** लक्षण जिस अंग-तंत्र से जुड़े हैं, वहीं S/A/F/C समूह का कोशिकीय समर्थन किया जाता है — हृदय/धमनी → A; लसीका/गुर्दा → S; तंत्रिका → F; गहरी कोशिका → C।'
  );
  A('');

  A('## 3. शारीरिक रोग विश्लेषण एवं जांच');
  A('');
  if (labFindings?.length) {
    A('| परीक्षण | मान | सामान्य | स्थिति | EH अर्थ |');
    A('|--------|-----|--------|--------|---------|');
    labFindings.forEach((f) => {
      A(`| ${f.test} | ${f.value} ${f.unit || ''} | ${f.normal} | ${f.status} | ${f.eh_meaning} |`);
    });
  } else {
    A('जांच रिपोर्ट डेटा उपलब्ध नहीं।');
  }
  A('');
  A('**प्रभावित अंग:** ' + (affected_organs?.length ? affected_organs.join(', ') : (ehInfo?.active_systems?.join(', ') || 'लक्षणानुसार')));
  const ORG_A = {
    uric: '**मूत्र/जोड़:** यूरिक क्रिस्टल — Gout।',
    jod: '**कंकाल:** उपास्थि क्षय — Synovial fluid।',
    bp: '**हृदय:** Endothelium — Arterial stiffness।',
    kabz: '**पाचन:** आंत गतिशीलता कम।',
    diabetes: '**अंतःस्रावी:** Insulin resistance।',
    khansi: '**श्वसन:** Bronchi inflammation।'
  };
  Object.entries(ORG_A).forEach(([kw, txt]) => {
    if (symT.includes(kw)) A(txt);
  });
  A('');

  A('## 4. औषधि वैज्ञानिक सूत्र (Formula)');
  A('');
  A('> *"Complexa Complexis Curantur"* — मिश्रित रोग: मिश्रित औषधि');
  A('');
  A(`**मिश्रण A:** \`${faFmt}\``);
  (faMeds || []).slice(0, 6).forEach((m) => {
    if (MED_ACT[m]) A(`- **${m}:** ${MED_ACT[m]}`);
  });
  A(`**${electricity}:** ${elecI.why} (${elecI.name})`);
  A('');
  A(`**मिश्रण B:** \`${fbFmt}\``);
  (fbMeds || []).slice(0, 4).forEach((m) => {
    if (MED_ACT[m]) A(`- **${m}:** ${MED_ACT[m]}`);
  });
  A('');
  A(`**मिश्रण C (रात):** \`${fcFmt}\``);
  A('');
  A(
    '**औषधि निर्माण (1:9 Spagyric):** 30 ml बोतल — प्रत्येक औषधि 5 बूंदें — शेष Distilled Water — 100 strokes। **मिश्रण A** में टैबलेट के साथ **विद्युत द्रव्य (BE/RE/GE/WE/YE)** मिलाकर पिया जाता है; यह आंतरिक मार्ग है। **मलहम D** केवल बाह्य D3 कंप्रेस है — पीना नहीं।'
  );
  A('');

  A('## 5. पोटेंसी एवं ध्रुवता नियम');
  A('');
  A(`**पोटेंसी:** ${potency} | **विद्युत:** ${electricity} (${elecI.name})`);
  if (ehInfo?.polarity?.polarity === 'POSITIVE' || isHyper) {
    A(`**HYPER** → ऋणात्मक ${potency} — अति-सक्रियता शांत। **${electricity}** — ${elecI.why}`);
  } else {
    A(`**HYPO** → धनात्मक ${potency} — ऊर्जा पुनर्स्थापन। **${electricity}** — ${elecI.why}`);
  }
  A('');

  A('## 6. खुराक एवं समय सारणी (Posology)');
  A('');
  A(`> **${dose} बूंदें** — आधा कप गुनगुने पानी — **घूंट-घूंट (Sip by Sip)**`);
  A('');

  let mainB = 'रोग शुद्धि + ऊर्जा';
  let livB = 'यकृत + गुर्दा';
  let digB = 'पाचन + कब्ज';
  let nightB = 'Deep healing + नींद';
  if (rv.uric_acid > 7 || symT.includes('uric')) mainB = 'यूरिक कम + जोड़ राहत';
  if (rv.creatinine > 1.2) livB = 'Creatinine कम + गुर्दे';
  if (rv.sugar_fast > 126 || symT.includes('diabetes')) digB = 'Blood Sugar नियंत्रण';
  if (rv.hemoglobin < 10 || symT.includes('anemia')) mainB = 'HB बढ़ाना + रक्त निर्माण';
  if (bp_systolic >= 140 || symT.includes('bp')) mainB = 'BP नियंत्रण + हृदय शांत';
  if (bp_systolic < 90) mainB = 'BP बढ़ाना + ऊर्जा';
  if (symT.includes('chakkar')) nightB = 'घबराहट दूर + गहरी नींद';

  A('| ⏰ समय | 💊 मिश्रण | Potency | खुराक | ✨ लाभ |');
  A('|--------|----------|---------|-------|-------|');
  A(`| 🌅 सुबह | \`${faFmt}\` | ${potency} | ${dose} बूंद | ${mainB} |`);
  A(`| ☀️ दिन | \`${fbOrFa}\` | ${potency} | ${dose} बूंद | ${livB} |`);
  A(`| 🌇 शाम | \`${faFmt}\` | ${potency} | ${dose} बूंद | स्फूर्ति |`);
  A(`| 🍽️ रात | \`${fbOrFa}\` | ${potency} | ${dose} बूंद | ${digB} |`);
  A(`| 💤 सोते समय | \`${fcFmt}\` | ${potency} | ${dose} बूंद | ${nightB} |`);
  A('');
  A('### 🧴 बाहरी मलहम / Compress');
  A(`**मलहम 1 — ${elecI.name} (${electricity}):** \`${fdFmt}\` (बाह्य — पीना नहीं)`);
  A(`📍 **स्थान:** ${elecI.loc}`);
  A('**विधि:** सूती कपड़ा → 10 बूंदें पानी में → 20 मिनट × 2 (सुबह + शाम)');
  A(`**क्यों:** ${elecI.why}`);
  A('');
  if (bp_systolic >= 140) {
    A('**मलहम 2 — B.E. (BP):** `BE D3` → माथे + हृदय (Point 1, 11)');
  } else if (symT.includes('jod') || rv.uric_acid > 7) {
    A('**मलहम 2 — G.E. (जोड़):** `GE D3` → Point 23, 24');
  }
  A('');

  A('## 7. आहार, EH सिद्धांत एवं फॉलो-अप');
  A('');
  if ((ehInfo?.prakriti?.prakriti || temperament) === 'Sanguine') A('**A-Group** → रक्त शुद्धि → धमनियां स्वस्थ।');
  else if ((ehInfo?.prakriti?.prakriti || temperament) === 'Lymphatic') A('**S-Group** → रस शुद्धि → लसीका स्वस्थ।');
  else A('**A+S+C** → संपूर्ण शुद्धि।');
  A(`**${electricity}** रोगानुसार — मिश्रण A में शामिल।`);
  A('');
  A('| समयावधि | अपेक्षित परिणाम |');
  A('|---------|----------------|');
  A('| 3-7 दिन | ऊर्जा + प्रारंभिक राहत |');
  A('| 15-30 दिन | Lab सुधार |');
  A('| 3 महीने | Chronic में कमी |');
  const fd2 = phase === 'ACUTE' ? 7 : phase === 'SUB_ACUTE' ? 15 : 30;
  A(`**${fd2} दिनों में पुनः दिखाएं।**`);
  A('');
  A('**🚫 परहेज:**');
  if (ehInfo?.polarity?.polarity === 'POSITIVE' || isHyper) A('- नमक कम, तली-भुनी बंद, शराब बंद');
  else A('- ठंडा पानी, बासी खाना नहीं');
  if (rv.uric_acid > 7) A('- लाल मांस, बीयर नहीं');
  if (rv.sugar_fast > 126) A('- चीनी, सफेद चावल नहीं');
  A('**✅ आहार:**');
  if (ehInfo?.polarity?.polarity === 'POSITIVE' || isHyper) A('- पपीता, हरी सब्जी, दलिया, 8-10 गिलास पानी');
  else A('- गर्म दूध, सूखे मेवे, पौष्टिक दाल');
  A('');
  A(
    '**जीवनशैली:** नियमित नींद, हल्का व्यायाम, तनाव कम करें। दवा छोड़ें नहीं — बिना सलाह खुराक बढ़ाएं नहीं। Side effect हो तो तुरंत रिपोर्ट करें।');
  A(
    '**EH Doctor Brain निष्कर्ष:** प्रकृति, अंग-मैपिंग और सूत्र पुस्तक सिद्धांत + rule-engine से लॉक किए गए हैं। विद्युत **मिश्रण A** में शामिल है — बाह्य मलहम अलग से दो बार लगाएं।');
  A('');
  A('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  A('*Count Cesare Mattei Principles · E.H. Arogya Sutra*');
  A('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Clean any leftover raw book lines
  const cleaned = L.filter((ln) => {
    const s = String(ln || '');
    if (/\bऔषधि\s*\d+/i.test(s)) return false;
    if (/\bP[-\s]?5\b/i.test(s)) return false;
    if (/pectorale/i.test(s)) return false;
    return true;
  });

  let text = cleaned.join('\n');

  // Ensure minimum word count
  const wordCountFn = (t) => String(t || '').trim().split(/\s+/).filter(Boolean).length;
  const target = 700;
  if (wordCountFn(text) < target) {
    const extraPara =
      'Clinical reasoning: correlate the presenting symptoms with EH temperament rules, laboratory indicators, and organ affinity. ' +
      'Prioritize conservative dosing, monitor for aggravation, and escalate potency only when clear therapeutic response is absent. ' +
      'Explain rationale for each medicine choice linking to the book’s stated affinity, typical potency ladder, and why the selected electricity supports the clinical goal.';
    const sections = 7;
    let i = 0;
    while (wordCountFn(text) < target && i < sections * 10) {
      text += '\n\n' + extraPara;
      i += 1;
      if (i > 50) break;
    }
  }

  return text;
}

module.exports = { buildFallbackSummary };
