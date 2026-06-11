'use strict';

/**
 * §4 formatting — 100% local. No external LLM/API calls.
 */

const { hintForMedicine, normMedKey } = require('../services/summaryMedHints');

/** Ollama §4 schema — two sub-sections only */
const SECTION_4_OLLAMA_SCHEMA = `
## 4. औषधि निर्माण का वैज्ञानिक कारण (Dynamic Formula Formulation Logic)

### 📋 अ. औषधि संयोजन, पोटेंसी एवं सेवन आवृत्ति (Formula, Potency & Frequency)
* **मिश्रण A (भोजन पूर्व):** [codes + electricity] | **पोटेंसी:** D# | **आवृत्ति:** दिन में 3–4 बार, भोजन से 30 मिनट पहले, 10 बूंदें हल्के गुनगुने पानी में।
* **मिश्रण B (भोजन पश्चात):** … | **पोटेंसी:** D# | **आवृत्ति:** भोजन के 30 मिनट बाद, 10 बूंदें।
* **मिश्रण C (रात्रि काल):** … (यदि लागू) | **पोटेंसी:** D# | **आवृत्ति:** सोने से पहले।
* **मिश्रण D (बाह्य प्रयोग):** … + विद्युत | **पोटेंसी:** D3/D4 | **आवृत्ति:** प्रभावित स्थान पर 20 मिनट कंप्रेस, दिन में 2 बार।

### 🩺 ब. रोग पर क्रमिक क्लिनिकल कार्यप्रणाली (Step-by-Step Clinical Action Logic)
यह मास्टर फ़ॉर्मूला रोगी के लक्षणों पर निम्न चरणों में कार्य करेगा (केवल वास्तविक औषधि कोड लिखें):

* **चरण 1: पाचन शुद्धि एवं वायु दमन:** **S-10** — …
* **चरण 2: रस प्रणाली की शुद्धि:** **S-1**, **Y.E.** — …
* **चरण 3: जीवनी शक्ति / ज्वर शमन:** **C-1**, **C-10**, **F-1** — …
* **चरण 4: तंत्रिका / जोड़ / बाह्य विद्युत:** **S-6**, **C-14**, **W.E.** — …

§4 नियम: कोई पुस्तक नाम, पृष्ठ, E.H. AROGYA SUTRA, OCR कचरा (|, \\\\, x, दितीय शक्ति का डायलुशन) नहीं। औषधि पंक्ति: **कोड**: स्वच्छ हिंदी विवरण।
`.trim();

function stripBookPageRefs(text) {
  let s = String(text || '');
  s = s.replace(/\(?\s*book\s+p\.\s*\d+(?:\s*[-–]\s*\d+)?\s*\)?/gi, '');
  s = s.replace(/\bp\.\s*\d+(?:\s*[-–]\s*\d+)?\b/gi, '');
  s = s.replace(/\bpg\.\s*\d+/gi, '');
  s = s.replace(/पृष्ठ\s*\d+/gi, '');
  s = s.replace(/Prishth\s*\d+/gi, '');
  s = s.replace(/\(पृष्ठ[^)]*\)/gi, '');
  return s.replace(/\s{2,}/g, ' ').replace(/\s+([.,;])/g, '$1').trim();
}

/** §4 — OCR / book noise removal */
function sanitizeMedicineDescription(text) {
  let s = stripBookPageRefs(text);
  s = s
    .replace(/\\/g, '')
    .replace(/\|/g, ' ')
    .replace(/\bx\b/gi, '')
    .replace(/दितीय\s*शक्ति\s*का\s*डायलुशन/gi, '')
    .replace(/डायलुशन\s*का\s*दितीय\s*शक्ति/gi, '')
    .replace(/E\.?\s*H\.?\s*AROGYA\s*SUTRA/gi, '')
    .replace(/ई\.?\s*एच\.?\s*आरोग्य\s*सूत्र/gi, '')
    .replace(/पुस्तक\s*(से|का|की|में)?/gi, '')
    .replace(/pustak/gi, '')
    .replace(/BOOK\s*RAG/gi, '')
    .replace(/book\/extracted/gi, '')
    .replace(/medicines\.json/gi, '')
    .replace(/\(book[^)]*\)/gi, '')
    .replace(/[^\u0900-\u097F\sA-Za-z0-9.,;:!?\-+()]/g, ' ')
    .replace(/^\*\*[^*]+\*\*\s*:\s*/g, '')
    .replace(/^-\s*/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (s.length < 8) return '';
  if (/^[\d\s|\\.]+$/.test(s)) return '';
  return s;
}

function displayMedicineCode(raw, row) {
  if (row?.medicine_code) return String(row.medicine_code).trim();
  const k = normMedKey(raw);
  if (!k) return String(raw || '').trim();
  const m = k.match(/^([A-Z]+)(\d+)$/);
  if (m) return `${m[1]}-${m[2]}`;
  if (/^(RE|BE|WE|GE|YE)$/.test(k)) return `${k[0]}.${k[1]}.`;
  return k;
}

function isElectricityToken(raw) {
  const k = normMedKey(raw);
  return /^(RE|BE|WE|GE|YE)$/.test(k);
}

function collectFormulaMedicines(formulas = {}) {
  const out = [];
  const seen = new Set();
  ['formula_a', 'formula_b', 'formula_c', 'formula_d'].forEach((key) => {
    const meds = formulas[key]?.medicines;
    if (!Array.isArray(meds)) return;
    meds.forEach((m) => {
      const n = normMedKey(m);
      if (!n || seen.has(n) || isElectricityToken(m)) return;
      seen.add(n);
      out.push(m);
    });
  });
  return out;
}

function getMedicineDescriptionMap(formulas) {
  const meds = collectFormulaMedicines(formulas);
  const map = new Map();

  for (const raw of meds) {
    const code = displayMedicineCode(raw, null);
    const key = normMedKey(raw);
    let desc = '';
    if (!desc || desc.length < 12) {
      const hint = hintForMedicine(raw);
      if (hint) {
        desc = sanitizeMedicineDescription(
          hint.replace(/^\*\*[^*]+\*\*\s*[:\-]?\s*/u, '').replace(/^\*\*|\*\*$/g, '')
        );
      }
    }
    if (desc) map.set(key, { code, desc });
  }
  return map;
}

function buildSection4MedicineLines(formulas = {}) {
  const map = getMedicineDescriptionMap(formulas);
  return [...map.values()].map(({ code, desc }) => `**${code}**: ${desc}`);
}

function extractElecShort(masterElectricity) {
  const m = String(masterElectricity || '').match(/\b(RE|BE|WE|GE|YE)\b/i);
  if (!m) return 'W.E.';
  const c = m[1].toUpperCase();
  return `${c[0]}.${c[1]}.`;
}

function mixtureDisplayString(formulaStr, fallbackMeds, potency, extraElec) {
  if (formulaStr && formulaStr !== '--') {
    return formulaStr.replace(/\s+/g, ' ').trim();
  }
  if (!fallbackMeds?.length) return '--';
  const parts = fallbackMeds
    .map((m) => displayMedicineCode(m, null))
    .filter(Boolean);
  if (extraElec && !parts.some((p) => /^(R|B|W|G|Y)\./i.test(p))) parts.push(extraElec);
  return `${parts.join(' + ')} ${potency}`.trim();
}

const FORMULA_SLOTS = [
  {
    key: 'formula_a',
    label: 'मिश्रण A (भोजन पूर्व)',
    potency: null,
    frequency: (dose) =>
      `दिन में 3 से 4 बार (भोजन से 30 मिनट पहले, ${dose} बूंदें हल्के गुनगुने पानी में)।`
  },
  {
    key: 'formula_b',
    label: 'मिश्रण B (भोजन पश्चात)',
    potency: null,
    frequency: (dose) => `दिन में 3 से 4 बार (भोजन के 30 मिनट बाद, ${dose} बूंदें)।`
  },
  {
    key: 'formula_c',
    label: 'मिश्रण C (रात्रि काल)',
    potency: null,
    frequency: (dose) => `रात को सोने से पहले (${dose} बूंदें)।`
  },
  {
    key: 'formula_d',
    label: 'मिश्रण D (बाह्य प्रयोग)',
    potency: 'D3',
    frequency: () => 'प्रभावित स्थान पर 20 मिनट का कंप्रेस (दिन में 2 बार)।',
    external: true
  }
];

function buildSubsectionA(formulas, ctx) {
  const {
    faFmt,
    fbFmt,
    fcFmt,
    fdFmt,
    potency,
    dose,
    masterElectricity,
    buildFormulaFn
  } = ctx;
  const elec = extractElecShort(masterElectricity);
  const lines = [
    '### 📋 अ. औषधि संयोजन, पोटेंसी एवं सेवन आवृत्ति (Formula, Potency & Frequency)'
  ];

  const fmtMap = {
    formula_a: faFmt,
    formula_b: fbFmt,
    formula_c: fcFmt,
    formula_d: fdFmt
  };

  for (const slot of FORMULA_SLOTS) {
    const card = formulas[slot.key];
    const meds = card?.medicines;
    const pot = slot.potency || potency;
    let mix = fmtMap[slot.key];

    if (slot.external) {
      if (!meds?.length && mix === '--') {
        const base = formulas.formula_a?.medicines?.slice(0, 2) || ['S-1'];
        mix = buildFormulaFn
          ? buildFormulaFn([...base, elec.replace(/\./g, '')], pot)
          : `${base.map((m) => displayMedicineCode(m, null)).join(' + ')} + ${elec} ${pot}`;
      } else if (buildFormulaFn && meds?.length) {
        mix = buildFormulaFn(meds, pot);
      }
    } else if ((!mix || mix === '--') && buildFormulaFn && meds?.length) {
      mix = buildFormulaFn(meds, pot);
    }

    if (!mix || mix === '--') {
      if (slot.key === 'formula_c' || slot.key === 'formula_d') continue;
      mix = mixtureDisplayString('--', meds, pot, slot.external ? elec : null);
    }
    if (mix === '--') continue;

    lines.push(
      `* **${slot.label}:** ${mix} | **पोटेंसी:** ${pot} | **आवृत्ति:** ${slot.frequency(dose)}`
    );
  }

  return lines;
}

function hasMed(allKeys, codes) {
  return codes.some((c) => allKeys.has(normMedKey(c)));
}

function buildSubsectionB(formulas, ctx) {
  const { symText = '', masterElectricity, externalLocation } = ctx;
  const descMap = getMedicineDescriptionMap(formulas);
  const allKeys = new Set([...descMap.keys()]);

  const symLine = buildComplaintLineFromCtx(ctx);
  const lines = [
    '### 🩺 ब. रोग पर क्रमिक क्लिनिकल कार्यप्रणाली (Step-by-Step Clinical Action Logic)',
    `यह मास्टर फ़ॉर्मूला रोगी के लक्षणों (${symLine}) पर निम्नलिखित चरणों में वैज्ञानिक कार्य करेगा:`
  ];

  const pick = (codes, fallback) => {
    const parts = [];
    const seenMed = new Set();
    for (const c of codes) {
      const k = normMedKey(c);
      if (!allKeys.has(k) || seenMed.has(k)) continue;
      seenMed.add(k);
      const { code, desc } = descMap.get(k);
      parts.push(`**${code}**: ${desc}`);
    }
    if (!parts.length && fallback) parts.push(fallback);
    return parts.join(' ');
  };

  const step = (num, title, body) => {
    const text = String(body || '').trim();
    if (!text) return;
    lines.push(`* **चरण ${num}: ${title}** ${text}`);
  };

  if (hasMed(allKeys, ['S10', 'S-10']) || /kabz|gas|pet|कब्ज|गैस|पाचन|apach/i.test(symText)) {
    step(
      1,
      'पाचन शुद्धि एवं वायु दमन (Digestive Reset)',
      pick(
        ['S10', 'S-10'],
        '**S-10**: आंतों की आधार शुद्धि से कब्ज और गैस में कमी; अवशोषण बढ़ेगा।'
      )
    );
  }

  if (hasMed(allKeys, ['S1', 'S-1', 'S5', 'S-5']) || /sujan|lymph|रस|सूजन/i.test(symText)) {
    step(
      2,
      'रस प्रणाली की शुद्धि एवं प्रतिरक्षण (Lymph Purifying)',
      pick(['S1', 'S-1', 'S5', 'S-5'], '**S-1**: रस मार्ग की शुद्धि से विषाक्त अपशिष्ट निष्कासन।')
    );
  }

  if (
    hasMed(allKeys, ['C1', 'C-1', 'C10', 'C-10', 'F1', 'F-1', 'F2', 'F-2']) ||
    /bukhar|fever|kamjori|weakness|कमजोरी|बुखार|ज्वर/i.test(symText)
  ) {
    step(
      3,
      'जीवनी शक्ति उत्थान एवं ज्वर शमन (Vitality & Fever Reset)',
      pick(
        ['C1', 'C-1', 'C10', 'C-10', 'F1', 'F-1'],
        '**C-1**: ऊर्जा संचार; **F-1**: तंत्रिका शांति।'
      )
    );
  }

  if (
    hasMed(allKeys, ['S6', 'S-6', 'C4', 'C-4', 'C14', 'C-14', 'C2', 'C-2']) ||
    /dard|pain|kamar|रीढ|joint|जोड़|sciatica/i.test(symText)
  ) {
    const ext = extractElecShort(masterElectricity);
    const body = [
      pick(['S6', 'S-6', 'C4', 'C-4', 'C14', 'C-14'], ''),
      `बाह्य **${ext}**: ${externalLocation || 'प्रभावित स्थान'} पर 20 मिनट कंप्रेस से नसों के खिंचाव में शमन।`
    ]
      .filter(Boolean)
      .join(' ');
    step(4, 'मस्कुलोस्केलेटल एवं तंत्रिका पुनर्बलन (Spine & Pain Relief)', body);
  }

  if (lines.length <= 2) {
    const codesFromFormulas = [...descMap.values()].map((e) => e.code).slice(0, 4);
    step(
      1,
      'संयोजित स्पैजिरिक कार्य (Master Formula)',
      pick(
        codesFromFormulas,
        'संयोजित स्पैजिरिक मिश्रण रोगी-विशेष ध्रुवता के अनुसार क्रमिक लाभ देगा।'
      )
    );
  }

  return dedupeStepByStepLines(lines);
}

function buildComplaintLineFromCtx(ctx) {
  if (ctx.symLine) return ctx.symLine;
  return 'वर्तमान लक्षण';
}

/** Normalize step line for duplicate detection (medicine codes + body text) */
function stepLineDedupeKey(line) {
  const t = String(line || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  const codes = [...t.matchAll(/\b([a-z]+-?\d+)\b/gi)].map((m) => m[1].replace(/-/g, ''));
  const title = (t.match(/चरण\s*\d+:\s*([^*]+)/i) || [])[1] || '';
  return `${codes.sort().join('|')}|${title.slice(0, 80)}|${t.slice(0, 120)}`;
}

/** Remove duplicate strings in §4 subsection ब (Step-by-Step) */
function dedupeStepByStepLines(lines = []) {
  const seen = new Set();
  const out = [];
  let inSubB = false;

  for (const ln of lines) {
    const trimmed = String(ln || '').trim();
    if (/^###\s*🩺\s*ब\./.test(trimmed)) {
      inSubB = true;
      out.push(ln);
      continue;
    }
    if (inSubB && /^###\s/.test(trimmed) && !/^###\s*🩺\s*ब\./.test(trimmed)) {
      inSubB = false;
    }
    if (!inSubB) {
      out.push(ln);
      continue;
    }
    if (!/^\*\s*\*\*चरण\s*\d+:/i.test(trimmed)) {
      out.push(ln);
      continue;
    }
    const key = stepLineDedupeKey(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ln);
  }
  return out;
}

/**
 * Rule-engine + shared schema for §4 (two sub-sections).
 */
function buildStructuredSection4Blocks(options = {}) {
  const {
    formulas = {},
    faFmt,
    fbFmt,
    fcFmt,
    fdFmt,
    potency,
    dose = 10,
    masterElectricity,
    externalLocation,
    symText,
    symLine,
    buildFormulaFn
  } = options;

  const ctx = {
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
  };

  const intro = [
    'AI रूल इंजन ने **Complexa Complexis Curantur** सिद्धांत से रोगी-विशेष **Master Formula** तैयार किया।'
  ];

  const block = [
    ...intro,
    ...buildSubsectionA(formulas, ctx),
    '',
    ...buildSubsectionB(formulas, ctx)
  ];
  return dedupeStepByStepLines(block);
}

function sanitizeSection4InSummary(fullText) {
  const s = String(fullText || '');
  const sec4Match = s.match(
    /(##\s*(?:4|\u096A)[.।\:]?\s*[^\n]*औषधि[\s\S]*?)(?=\n##\s*(?:5|\u096B)|\n---\n##\s*(?:5|\u096B)|$)/i
  );
  if (!sec4Match) return s;

  let block = sec4Match[1];
  block = block
    .replace(/E\.?\s*H\.?\s*AROGYA\s*SUTRA[^.\n]*/gi, '')
    .replace(/पुस्तक[^.\n]*/gi, '')
    .replace(/\(पृष्ठ[^)]*\)/gi, '')
    .replace(/\bp\.\s*\d+/gi, '')
    .replace(/pustak/gi, '')
    .replace(/\\/g, '')
    .replace(/दितीय\s*शक्ति\s*का\s*डायलुशन/gi, '');

  const lines = block.split('\n').map((ln) => {
    const t = ln.trim();
    if (!t) return ln;
    const m = t.match(/^\*\*([A-Z]+-\d+|[A-Z]+\d+)\*\*\s*[:\-]?\s*(.+)$/i);
    if (m) return `**${m[1]}**: ${sanitizeMedicineDescription(m[2])}`;
    const m2 = t.match(/^-\s*\*\*([^*]+)\*\*\s*[:\-]?\s*(.+)$/);
    if (m2) return `**${m2[1].trim()}**: ${sanitizeMedicineDescription(m2[2])}`;
    if (/^\*\*[A-Z]+-\d+\*\*:/.test(t)) {
      const p = t.split(':');
      return `**${p[0].replace(/\*/g, '')}**: ${sanitizeMedicineDescription(p.slice(1).join(':'))}`;
    }
    return ln;
  });

  const deduped = dedupeStepByStepLines(lines);
  return s.replace(sec4Match[1], deduped.join('\n'));
}

module.exports = {
  SECTION_4_OLLAMA_SCHEMA,
  buildSection4MedicineLines,
  buildStructuredSection4Blocks,
  sanitizeMedicineDescription,
  sanitizeSection4InSummary,
  stripBookPageRefs,
  dedupeStepByStepLines
};
