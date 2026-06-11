'use strict';

/** Urdu/Arabic + ASCII semicolon — primary complaint = first segment only */
const COMPLAINT_SPLIT_RE = /[;؛]+/;

function cleanPrimaryComplaint(text) {
  const s = String(text || '').trim();
  if (!s || s === '—') return '';
  return s.split(COMPLAINT_SPLIT_RE)[0].trim() || s.split(',')[0]?.trim() || s;
}

function dedupeSymptomList(items = []) {
  const seen = new Set();
  const out = [];
  for (const raw of items) {
    const primary = cleanPrimaryComplaint(raw);
    if (!primary) continue;
    const key = primary.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(primary);
  }
  return out;
}

const ROMAN_SYMPTOM_HI = [
  [/gale\s*me\s*dard\s*ho\s*raha\s*hai/gi, 'गले में दर्द'],
  [/gale\s*me\s*dard|gale\s*dard|sore\s*throat/gi, 'गले में दर्द'],
  [/sardi\s*hai|sardi|sardii/gi, 'सर्दी'],
  [/nak\s*band\s*hai|nak\s*band|blocked\s*nose/gi, 'नाक बंद'],
  [/shir\s*me\s*bharipan\s*hai|shir\s*me\s*bharipan|sir\s*me\s*bharipan/gi, 'सिर में भारीपन'],
  [/thand\s*lag\s*rahi\s*hai|thand\s*lag/gi, 'ठंड लगना'],
  [/khansi|khasi|cough/gi, 'खाँसी'],
  [/jod\s*dard|joint\s*pain/gi, 'जोड़ों में दर्द'],
  [/kabz|constipation/gi, 'कब्ज'],
  [/chakkar|giddiness/gi, 'चक्कर'],
  [/kamjori|weakness/gi, 'कमजोरी'],
  [/khujali|khujli|itch|urticaria|dane|daane|चुभन|खुजली/gi, 'खुजली / दाने'],
  [/sarir|body/gi, 'शरीर'],
  [/pathari|gallstone|pith|pet saf|kamjori/gi, 'पित्त/पथरी, पेट साफ न होना, कमजोरी']
];

function toDevanagariComplaint(text) {
  let s = String(text || '').trim();
  if (!s) return s;
  const romanOnly = !/[\u0900-\u097F]/.test(s);
  if (!romanOnly && /[\u0900-\u097F]/.test(s) && /[a-z]{3,}/i.test(s)) {
    for (const [re, hi] of ROMAN_SYMPTOM_HI) s = s.replace(re, hi);
    s = s.replace(/\b(ho|raha|hai|rah|rahi|me|ki|ke|ko)\b/gi, ' ');
    return s.replace(/\s+/g, ' ').trim();
  }
  if (romanOnly) {
    for (const [re, hi] of ROMAN_SYMPTOM_HI) s = s.replace(re, hi);
    s = s.replace(/\b(ho|raha|hai|rah|rahi)\b/gi, ' ');
    return s.replace(/\s+/g, ' ').trim();
  }
  return s;
}

function buildComplaintLine(symptoms = []) {
  const list = dedupeSymptomList(
    (symptoms || []).map((s) => {
      const raw = typeof s === 'object' ? s.hindi || s.name || '' : String(s);
      return toDevanagariComplaint(raw);
    })
  );
  if (!list.length) return 'विवरण में दर्ज मुख्य शिकायतें';
  if (list.length === 1) return list[0];
  const primary = list[0];
  const rest = list.slice(1).filter((x) => !primary.includes(x) && !x.includes(primary));
  return rest.length ? `${primary} (${rest.join(', ')})` : primary;
}

module.exports = {
  COMPLAINT_SPLIT_RE,
  cleanPrimaryComplaint,
  dedupeSymptomList,
  buildComplaintLine
};
