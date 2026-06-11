'use strict';

/**
 * E.H. Mattei potency — ordinal शक्ति D4 से शुरू; उच्च शक्ति = D30+ ladder.
 *
 * प्रथम→D4 | द्वितीय→D5 | तृतीय→D6 | पंचम→D8 | लाइटर→D10
 * उच्च→D30 | D60 | D100 | D200 | D500 | D1000
 */
const EH_POTENCY_SCALE = [4, 5, 6, 7, 8, 10, 30, 60, 100, 200, 500, 1000];

/** Order matters: specific high D-numbers before generic उच्च */
const HINDI_POTENCY = [
  [/प्रथम\s*शक्ति|पहली\s*शक्ति|first\s*potency|1st\s*potency/i, 'D4'],
  [/द्वितीय\s*शक्ति|दूसरी\s*शक्ति|second\s*potency|2nd\s*potency/i, 'D5'],
  [/तृतीय\s*शक्ति|तीसरी\s*शक्ति|third\s*potency|3rd\s*potency/i, 'D6'],
  [/पंचम\s*शक्ति|पाँचवी\s*शक्ति|fifth\s*potency|5th\s*potency/i, 'D8'],
  [/चतुर्थ\s*शक्ति|चौथी\s*शक्ति|fourth\s*potency|4th\s*potency/i, 'D7'],
  [/लाइटर\s*डाय|लाइटर|lighter\s*dilution/i, 'D10'],
  [/\bD\s*-?\s*1000\b/i, 'D1000'],
  [/\bD\s*-?\s*500\b/i, 'D500'],
  [/\bD\s*-?\s*200\b/i, 'D200'],
  [/\bD\s*-?\s*100\b/i, 'D100'],
  [/\bD\s*-?\s*60\b/i, 'D60'],
  [/\bD\s*-?\s*30\b/i, 'D30'],
  [/अति\s*उच्च|अत्यन्त\s*उच्च|very\s*high\s*potency/i, 'D60'],
  [/उच्च\s*शक्ति|उच्च\s*डाय|high\s*potency|higher\s*potency/i, 'D30'],
  [/हल्क[ेी]|हल्का|light\s*dilution|\bind\b/i, 'D4'],
  [/जीर्ण|chronic\s*deep/i, 'D30']
];

/** Legacy wrong codes → correct E.H. book scale */
const LEGACY_MIGRATE = {
  D1: 'D4',
  D2: 'D5',
  D3: 'D6',
  D20: 'D8'
};

function snapToEhScale(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  if (EH_POTENCY_SCALE.includes(v)) return `D${v}`;
  for (const p of EH_POTENCY_SCALE) {
    if (v <= p) return `D${p}`;
  }
  return 'D1000';
}

function normalizePotency(raw) {
  if (raw == null || raw === '') return '';
  const s = String(raw).trim();

  for (const [re, code] of HINDI_POTENCY) {
    if (re.test(s)) return code;
  }

  const dm = s.match(/\bD\s*-?\s*(\d{1,4})\b/i);
  if (dm) {
    const n = parseInt(dm[1], 10);
    const code = snapToEhScale(n);
    if (code) return LEGACY_MIGRATE[code] || code;
  }

  if (/^\d{1,4}$/.test(s)) {
    return snapToEhScale(parseInt(s, 10)) || '';
  }

  const up = s.toUpperCase().replace(/\s/g, '');
  if (LEGACY_MIGRATE[up]) return LEGACY_MIGRATE[up];
  if (/^D\d+$/.test(up)) {
    return LEGACY_MIGRATE[up] || snapToEhScale(parseInt(up.slice(1), 10)) || up;
  }

  return s;
}

/** Default potency by pathology */
function defaultPotencyForPathology(pathology = 'Chronic') {
  const p = String(pathology).toLowerCase();
  if (p.includes('acute') || p.includes('tiivr') || p.includes('तीव्र')) return 'D6';
  if (p.includes('sub')) return 'D10';
  return 'D30';
}

function normalizeDilution(raw) {
  if (!raw) return '1:9';
  const s = String(raw).trim();
  const m = s.match(/1\s*:\s*(\d+)/);
  if (m) return `1:${m[1]}`;
  if (/धनात्मक|positive/i.test(s)) return '1:9';
  if (/ऋणात्मक|negative/i.test(s)) return '1:9';
  if (s.length > 12 || /[\u0900-\u097F]{8,}/.test(s)) return '1:9';
  return s || '1:9';
}

module.exports = {
  normalizePotency,
  normalizeDilution,
  defaultPotencyForPathology,
  HINDI_POTENCY,
  EH_POTENCY_SCALE,
  LEGACY_MIGRATE
};
