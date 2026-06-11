const { REPORT_RULE, POLARITY_LAW } = require('./ehMatteiPrinciples');
const { getPostgresModels } = require('../db/sequelize');
const { isDbReady } = require('../utils/dataSource');

/** In-memory catalog (matches blood_test_values seed). */
const BLOOD_TEST_CATALOG = Object.freeze([
  { test_key: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', min_normal: 12, max_normal: 17 },
  { test_key: 'wbc', label: 'WBC', unit: '/µL', min_normal: 4000, max_normal: 11000 },
  { test_key: 'platelets', label: 'Platelets', unit: '/µL', min_normal: 150000, max_normal: 400000 },
  { test_key: 'glucose', label: 'Sugar / Glucose', unit: 'mg/dL', min_normal: 70, max_normal: 100 },
  { test_key: 'creatinine', label: 'Creatinine', unit: 'mg/dL', min_normal: 0.6, max_normal: 1.2 },
  { test_key: 'uric_acid', label: 'Uric Acid', unit: 'mg/dL', min_normal: 3.5, max_normal: 7.2 },
  { test_key: 'esr', label: 'ESR', unit: 'mm/hr', min_normal: 0, max_normal: 20 },
  { test_key: 'crp', label: 'CRP', unit: 'mg/L', min_normal: 0, max_normal: 5 },
  { test_key: 'bp_systolic', label: 'BP Systolic', unit: 'mmHg', min_normal: 90, max_normal: 120 },
  { test_key: 'vitamin_d', label: 'Vitamin D', unit: 'ng/mL', min_normal: 30, max_normal: 100 },
  { test_key: 'hemoglobin_a1c', label: 'Hemoglobin A1c', unit: '%', min_normal: 4, max_normal: 5.6 }
]);

const BLOOD_KEY_ALIASES = Object.freeze({
  hemoglobin: ['hemoglobin', 'hb', 'hgb', 'haemoglobin'],
  wbc: ['wbc', 'white blood cell', 'white blood cells', 'leukocyte'],
  platelets: ['platelets', 'plt', 'platelet count'],
  glucose: ['glucose', 'sugar', 'blood sugar', 'fasting glucose', 'fbs', 'rbs'],
  creatinine: ['creatinine', 'serum creatinine'],
  uric_acid: ['uric acid', 'uric_acid', 'urate'],
  esr: ['esr', 'erythrocyte sedimentation'],
  crp: ['crp', 'c-reactive protein', 'c reactive protein'],
  bp_systolic: ['bp systolic', 'systolic', 'systolic bp', 'systolic blood pressure'],
  vitamin_d: ['vitamin d', 'vit d', '25-oh vitamin d', '25ohd'],
  hemoglobin_a1c: ['hemoglobin a1c', 'hba1c', 'hb a1c', 'glycated hemoglobin', 'a1c']
});

const IMAGING_POSITIVE_PATTERNS = [
  /\bswelling\b/i,
  /\bedema\b/i,
  /\binflammation\b/i,
  /\binflammatory\b/i,
  /\benlarged\b/i,
  /\bhypertroph/i,
  /\bmass\b/i,
  /\btumor\b/i,
  /\btumour\b/i,
  /\bneoplasm\b/i,
  /\bcalcification\b/i,
  /\bcalcified\b/i,
  /\bincreased\s+density\b/i,
  /\bhyperdense\b/i,
  /\bthickening\b/i,
  /\bthickened\b/i,
  /\bcontrast\s+enhancement\b/i,
  /\bfluid\s+collection\b/i,
  /\babscess\b/i,
  /\bhepatomegaly\b/i,
  /\bsplenomegaly\b/i,
  /\blymphadenopathy\b/i
];

const IMAGING_NEGATIVE_PATTERNS = [
  /\batrophy\b/i,
  /\batrophic\b/i,
  /\bdegeneration\b/i,
  /\bdegenerative\b/i,
  /\bshrinkage\b/i,
  /\bshrunken\b/i,
  /\bbone\s+loss\b/i,
  /\bosteopenia\b/i,
  /\bosteoporosis\b/i,
  /\bosteoporotic\b/i,
  /\breduced\s+density\b/i,
  /\bhypodense\b/i,
  /\bhypointense\b/i,
  /\bvolume\s+loss\b/i,
  /\bwasting\b/i,
  /\bmuscle\s+wasting\b/i,
  /\bthinning\b/i,
  /\bthinned\b/i,
  /\bcortical\s+thinning\b/i,
  /\bdisc\s+space\s+narrowing\b/i,
  /\bmalacia\b/i,
  /\binsufficiency\s+fracture\b/i
];

function normalizeTestKey(raw) {
  const s = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  for (const [key, aliases] of Object.entries(BLOOD_KEY_ALIASES)) {
    if (key === s) return key;
    for (const a of aliases) {
      const norm = a.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (s === norm || s.includes(norm) || norm.includes(s)) return key;
    }
  }
  return s;
}

function toNumber(v) {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

/**
 * Classify one lab value vs catalog range.
 * HIGH (badhna) → Positive rog · LOW (ghatna) → Negative rog
 */
function classifyBloodValue(value, catalogRow) {
  const num = toNumber(value);
  const min = Number(catalogRow.min_normal);
  const max = Number(catalogRow.max_normal);
  if (num == null) {
    return {
      test_key: catalogRow.test_key,
      label: catalogRow.label,
      value: null,
      unit: catalogRow.unit,
      status: 'missing',
      trend: null,
      rogPolarity: null,
      explanation: 'No numeric value supplied.'
    };
  }

  let trend = 'normal';
  let rogPolarity = null;
  let status = 'normal';
  if (num > max) {
    trend = 'high';
    rogPolarity = catalogRow.high_rog_polarity || REPORT_RULE.high.rogPolarity;
    status = 'high';
  } else if (num < min) {
    trend = 'low';
    rogPolarity = catalogRow.low_rog_polarity || REPORT_RULE.low.rogPolarity;
    status = 'low';
  }

  const ratio =
    status === 'high' && max > 0
      ? num / max
      : status === 'low' && min > 0
        ? min / num
        : 1;
  const severity = status === 'normal' ? 'none' : ratio > 2 ? 'severe' : ratio > 1.5 ? 'moderate' : 'mild';

  const vitiation =
    status === 'high'
      ? catalogRow.high_vitiation || 'SANGUINE'
      : status === 'low'
        ? catalogRow.low_vitiation || 'SANGUINE'
        : null;
  const medicine_hint =
    status === 'high'
      ? catalogRow.high_medicine_hint
      : status === 'low'
        ? catalogRow.low_medicine_hint
        : null;
  const meaning =
    status === 'high'
      ? catalogRow.high_meaning
      : status === 'low'
        ? catalogRow.low_meaning
        : null;

  const explanation =
    meaning ||
    (status === 'high'
      ? `${catalogRow.label} ${num} ${catalogRow.unit || ''} — HIGH (badhna) → Positive rog.`
      : status === 'low'
        ? `${catalogRow.label} ${num} ${catalogRow.unit || ''} — LOW (ghatna) → Negative rog.`
        : `${catalogRow.label} ${num} — within normal (${min}–${max}).`);

  return {
    test_key: catalogRow.test_key,
    label: catalogRow.label,
    value: num,
    unit: catalogRow.unit,
    min_normal: min,
    max_normal: max,
    status,
    trend,
    rogPolarity,
    vitiation,
    medicine_hint,
    severity,
    meaning: explanation,
    explanation
  };
}

async function loadBloodCatalog() {
  if (!isDbReady()) return BLOOD_TEST_CATALOG.map((r) => ({ ...r }));
  try {
    const { BloodTestValuePg } = getPostgresModels();
    const rows = await BloodTestValuePg.findAll({ order: [['sort_order', 'ASC']] });
    if (!rows.length) return BLOOD_TEST_CATALOG.map((r) => ({ ...r }));
    return rows.map((r) => r.get({ plain: true }));
  } catch {
    return BLOOD_TEST_CATALOG.map((r) => ({ ...r }));
  }
}

/**
 * @param {Record<string, number|string>} bloodValues — keys like hemoglobin, wbc, …
 */
async function analyzeBloodReport(bloodValues = {}) {
  const catalog = await loadBloodCatalog();
  const byKey = Object.fromEntries(catalog.map((r) => [r.test_key, r]));
  const markers = [];
  let positiveCount = 0;
  let negativeCount = 0;

  const inputEntries =
    bloodValues && typeof bloodValues === 'object' && !Array.isArray(bloodValues)
      ? Object.entries(bloodValues)
      : [];

  for (const [rawKey, rawVal] of inputEntries) {
    const key = normalizeTestKey(rawKey);
    const row = byKey[key];
    if (!row) continue;
    const marker = classifyBloodValue(rawVal, row);
    markers.push(marker);
    if (marker.rogPolarity === 'positive') positiveCount += 1;
    if (marker.rogPolarity === 'negative') negativeCount += 1;
  }

  let overallTrend = null;
  let rogPolarity = 'unknown';
  if (positiveCount > negativeCount) {
    overallTrend = 'high';
    rogPolarity = 'positive';
  } else if (negativeCount > positiveCount) {
    overallTrend = 'low';
    rogPolarity = 'negative';
  } else if (positiveCount > 0) {
    overallTrend = 'mixed';
    rogPolarity = 'positive';
  }

  const medicineType =
    rogPolarity === 'positive'
      ? POLARITY_LAW.positiveRog.medicineType
      : rogPolarity === 'negative'
        ? POLARITY_LAW.negativeRog.medicineType
        : null;

  const medicine_hints = markers
    .filter((m) => m.medicine_hint)
    .flatMap((m) => String(m.medicine_hint).split(/,\s*/));
  const sanguineN = markers.filter((m) => m.vitiation === 'SANGUINE' && m.status !== 'normal').length;
  const lymphN = markers.filter((m) => m.vitiation === 'LYMPHATIC' && m.status !== 'normal').length;
  const dominant_system =
    sanguineN > lymphN ? 'SANGUINE' : lymphN > sanguineN ? 'LYMPHATIC' : 'MIXED';

  return {
    type: 'blood',
    markers,
    positiveCount,
    negativeCount,
    normalCount: markers.filter((m) => m.status === 'normal').length,
    overallTrend,
    rogPolarity,
    dominant_system,
    medicine_hints,
    rogLabel:
      rogPolarity === 'positive'
        ? 'POSITIVE ROG'
        : rogPolarity === 'negative'
          ? 'NEGATIVE ROG'
          : 'Pending',
    medicineType,
    electricity:
      rogPolarity === 'positive'
        ? POLARITY_LAW.positiveRog.electricity
        : rogPolarity === 'negative'
          ? POLARITY_LAW.negativeRog.electricity
          : null,
    summary:
      markers.length === 0
        ? 'No recognized blood parameters in input.'
        : `${markers.length} parameter(s) analyzed — ${positiveCount} high (positive rog), ${negativeCount} low (negative rog).`
  };
}

function scanImagingPatterns(text, patterns) {
  const hits = [];
  const seen = new Set();
  for (const re of patterns) {
    const m = text.match(re);
    if (m && !seen.has(m[0].toLowerCase())) {
      seen.add(m[0].toLowerCase());
      hits.push(m[0]);
    }
  }
  return hits;
}

/**
 * MRI / CT / X-ray narrative keyword analysis.
 */
function analyzeImagingText(imagingText = '') {
  const text = String(imagingText || '').trim();
  if (!text) {
    return {
      type: 'imaging',
      positiveKeywords: [],
      negativeKeywords: [],
      positiveCount: 0,
      negativeCount: 0,
      rogPolarity: 'unknown',
      overallTrend: null,
      summary: 'No imaging text supplied.'
    };
  }

  const positiveKeywords = scanImagingPatterns(text, IMAGING_POSITIVE_PATTERNS);
  const negativeKeywords = scanImagingPatterns(text, IMAGING_NEGATIVE_PATTERNS);
  const positiveCount = positiveKeywords.length;
  const negativeCount = negativeKeywords.length;

  let rogPolarity = 'unknown';
  let overallTrend = null;
  if (positiveCount > negativeCount) {
    rogPolarity = 'positive';
    overallTrend = 'high';
  } else if (negativeCount > positiveCount) {
    rogPolarity = 'negative';
    overallTrend = 'low';
  } else if (positiveCount > 0) {
    rogPolarity = 'positive';
    overallTrend = 'mixed';
  }

  return {
    type: 'imaging',
    positiveKeywords,
    negativeKeywords,
    positiveCount,
    negativeCount,
    rogPolarity,
    rogLabel:
      rogPolarity === 'positive'
        ? 'POSITIVE ROG'
        : rogPolarity === 'negative'
          ? 'NEGATIVE ROG'
          : 'Pending',
    overallTrend,
    medicineType:
      rogPolarity === 'positive'
        ? POLARITY_LAW.positiveRog.medicineType
        : rogPolarity === 'negative'
          ? POLARITY_LAW.negativeRog.medicineType
          : null,
    electricity:
      rogPolarity === 'positive'
        ? POLARITY_LAW.positiveRog.electricity
        : rogPolarity === 'negative'
          ? POLARITY_LAW.negativeRog.electricity
          : null,
    summary: `Imaging text: ${positiveCount} positive signal(s), ${negativeCount} negative signal(s).`
  };
}

/**
 * Extract rough numeric pairs from OCR/PDF text (best-effort).
 */
function extractBloodValuesFromText(text) {
  const out = {};
  const blob = String(text || '');
  const patterns = [
    [/hemoglobin|haemoglobin|hgb|\bhb\b/i, /([\d.]+)\s*(?:g\/dl|gm\/dl)?/i],
    [/\bwbc\b|white\s+blood/i, /([\d,.]+)\s*(?:\/|per)?\s*(?:µl|ul|mcL)?/i],
    [/platelet/i, /([\d,.]+)/i],
    [/glucose|blood\s+sugar|fbs|rbs/i, /([\d.]+)\s*(?:mg\/dl)?/i],
    [/creatinine/i, /([\d.]+)/i],
    [/uric\s+acid/i, /([\d.]+)/i],
    [/\besr\b/i, /([\d.]+)/i],
    [/\bcrp\b|c-reactive/i, /([\d.]+)/i],
    [/systolic/i, /([\d.]+)\s*(?:mmhg)?/i],
    [/vitamin\s*d|25\s*\(?oh\)?\s*d/i, /([\d.]+)/i],
    [/hba1c|hemoglobin\s*a1c|a1c/i, /([\d.]+)\s*%?/i]
  ];
  const keys = [
    'hemoglobin',
    'wbc',
    'platelets',
    'glucose',
    'creatinine',
    'uric_acid',
    'esr',
    'crp',
    'bp_systolic',
    'vitamin_d',
    'hemoglobin_a1c'
  ];
  patterns.forEach(([reLabel, reVal], i) => {
    const labelIdx = blob.search(reLabel);
    if (labelIdx < 0) return;
    const slice = blob.slice(labelIdx, labelIdx + 120);
    const vm = slice.match(reVal);
    if (vm) out[keys[i]] = vm[1];
  });
  return out;
}

/**
 * Full report analysis pipeline.
 * @param {object} input
 * @param {Record<string, number|string>} [input.bloodValues]
 * @param {string} [input.imagingText]
 * @param {string} [input.rawText] — OCR/PDF text (blood extract + imaging)
 * @param {'blood'|'imaging'|'combined'} [input.reportType]
 */
async function analyzeReport(input = {}) {
  const reportType = (input.reportType || 'combined').toLowerCase();
  let bloodValues = input.bloodValues || {};
  let imagingText = input.imagingText || '';

  if (input.rawText) {
    const extracted = extractBloodValuesFromText(input.rawText);
    bloodValues = { ...extract, ...bloodValues };
    if (!imagingText) imagingText = input.rawText;
  }

  const parts = {};
  if (reportType === 'blood' || reportType === 'combined') {
    parts.blood = await analyzeBloodReport(bloodValues);
  }
  if (reportType === 'imaging' || reportType === 'combined') {
    parts.imaging = analyzeImagingText(imagingText);
  }

  const pos =
    (parts.blood?.positiveCount || 0) + (parts.imaging?.positiveCount || 0);
  const neg =
    (parts.blood?.negativeCount || 0) + (parts.imaging?.negativeCount || 0);

  let rogPolarity = 'unknown';
  let reportTrend = null;
  if (pos > neg) {
    rogPolarity = 'positive';
    reportTrend = 'high';
  } else if (neg > pos) {
    rogPolarity = 'negative';
    reportTrend = 'low';
  } else if (pos > 0) {
    rogPolarity = 'positive';
    reportTrend = 'high';
  }

  return {
    reportType,
    blood: parts.blood || null,
    imaging: parts.imaging || null,
    rogPolarity,
    reportTrend,
    reportTrendLabel:
      reportTrend === 'high' ? 'badhna (HIGH)' : reportTrend === 'low' ? 'ghatna (LOW)' : null,
    summary: [parts.blood?.summary, parts.imaging?.summary].filter(Boolean).join(' '),
    analyzedAt: new Date().toISOString()
  };
}

module.exports = {
  BLOOD_TEST_CATALOG,
  BLOOD_KEY_ALIASES,
  IMAGING_POSITIVE_PATTERNS,
  IMAGING_NEGATIVE_PATTERNS,
  normalizeTestKey,
  classifyBloodValue,
  loadBloodCatalog,
  analyzeBloodReport,
  analyzeImagingText,
  extractBloodValuesFromText,
  analyzeReport
};
