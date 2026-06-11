'use strict';

/** Bump when summary format/engine changes — frontend invalidates sessionStorage cache */
const SUMMARY_ENGINE_VERSION = 'dynamic-engine-v22-complete-pdf';

/** Permanent layout — 7-section Clinical Fallback Seven only (never 11-section) */
const SUMMARY_LAYOUT_SEVEN_LOCKED = true;
const SUMMARY_SECTION_COUNT = 7;

const { getSummaryWordTargets } = require('../config/environment');
const _targets = getSummaryWordTargets();

/** लक्ष्य: concise ~500 शब्द (default) */
const MIN_SUMMARY_WORDS = _targets.minWordsValidate;

function countSummaryWords(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** 6-खंड प्रिस्क्रिप्शन (Ollama userPrompt matrix) */
function isValidSixSectionPrescription(text) {
  const s = String(text || '');
  if (countSummaryWords(s) < MIN_SUMMARY_WORDS && s.length < 2800) return false;
  if (/\bp\.\s*\d+/i.test(s)) return false;
  const headerOk = /इलेक्ट्रो[-\s]?होम्योपैथी.*क्लिनिकल\s*विशेषज्ञ\s*प्रिस्क्रिप्शन/i.test(s);
  const has1 = /##\s*1[.।\:]?\s*[^\n]*प्रकृति|जीवनी/i.test(s);
  const has2 = /##\s*2[.।\:]?\s*[^\n]*संरचना|Anatomy|Pathology/i.test(s);
  const has3 = /##\s*3[.।\:]?\s*[^\n]*आंतरिक|औषधि|मिश्रण/i.test(s);
  const has4 = /##\s*4[.।\:]?\s*[^\n]*बाह्य|विद्युत/i.test(s);
  const has5 = /##\s*5[.।\:]?\s*[^\n]*खुराक|समय\s*सारणी|Posology/i.test(s);
  const has6 = /##\s*6[.।\:]?\s*[^\n]*आहार|परहेज|जीवनशैली/i.test(s);
  return headerOk && has1 && has2 && has3 && has4 && has5 && has6;
}

/** Strip obsolete 8–11 section headers from Ollama hallucination */
function enforceSevenSectionLayout(text) {
  let s = String(text || '');
  s = s.replace(/\n##\s*(?:8|9|10|11|\u096E|\u096F|\u0970|\u0971)[^\n]*/gi, '');
  s = s.replace(/\n##\s*[^\n]*(?:अतिरिक्त|Extra|Supplement|Appendix)[^\n]*/gi, '');
  if (/इलेक्ट्रो[-\s]?होम्योपैथी.*क्लिनिकल\s*विशेषज्ञ\s*प्रिस्क्रिप्शन/i.test(s)) {
    s = s.replace(
      /इलेक्ट्रो[-\s]?होम्योपैथी.*क्लिनिकल\s*विशेषज्ञ\s*प्रिस्क्रिप्शन/gi,
      'इलेक्ट्रो-होम्योपैथी क्लिनिकल विशेषज्ञ सारांश'
    );
  }
  return s.trim();
}

/** 7 खंड क्लिनिकल विशेषज्ञ सारांश (DOCX) — never accept 6/11-section templates */
function isValidCompleteEngineSummary(text) {
  const s = enforceSevenSectionLayout(String(text || ''));
  const minChars = getSummaryWordTargets().minCharsValidate;
  if (countSummaryWords(s) < MIN_SUMMARY_WORDS && s.length < minChars) return false;
  if (/\bp\.\s*\d+/i.test(s)) return false;

  const NUM = {
    1: '(?:1|\u0967)',
    2: '(?:2|\u0968)',
    3: '(?:3|\u0969)',
    4: '(?:4|\u096A)',
    5: '(?:5|\u096B)',
    6: '(?:6|\u096C)',
    7: '(?:7|\u096D)'
  };
  const sec = (n, keys) => {
    const re = new RegExp(`##\\s*(?:▌)?${NUM[n]}[.।\\:]?\\s*[^\\n]{0,160}(${keys})`, 'i');
    return re.test(s);
  };

  const has1 = sec(1, 'कार्यकारी|क्लिनिकल विवरण|Executive');
  const has2 = sec(2, 'प्रकृति|Temperament');
  const has3 = sec(3, 'शारीरिक|रोग विश्लेषण|Pathological');
  const has4 = sec(4, 'औषधि|वैज्ञानिक|Formula');
  const has5 = sec(5, 'पोटेंसी|ध्रुवता|Polarity');
  const has6 = sec(6, 'खुराक|सेवन|Posology');
  const has7 = sec(7, 'आहार|जीवन|Lifestyle');

  const headerOk =
    /इलेक्ट्रो[-\s]?होम्योपैथी.*विशेषज्ञ\s*सारांश/i.test(s) ||
    /इलेक्ट्रो[-\s]?होम्योपैथी.*क्लिनिकल/i.test(s) ||
    /AI\s*ऑफलाइन\s*EH/i.test(s);

  return headerOk && has1 && has2 && has3 && has4 && has5 && has6 && has7;
}

/** Dense ~400-word mode — 5+ sections (## or ###) and enough Hindi body */
function isValidDenseEngineSummary(text) {
  const s = enforceSevenSectionLayout(String(text || ''));
  const wc = countSummaryWords(s);
  if (wc < 90 && s.length < 700) return false;
  const sectionHits = (s.match(/^#{2,3}\s*(?:▌)?(?:[1-7]|[\u0967-\u096D])/gm) || []).length;
  if (sectionHits < 3 && wc < 200) return false;
  return /इलेक्ट्रो|क्लिनिकल|विशेषज्ञ|माटेई|होम्योपैथी/i.test(s);
}

module.exports = {
  SUMMARY_ENGINE_VERSION,
  SUMMARY_LAYOUT_SEVEN_LOCKED,
  SUMMARY_SECTION_COUNT,
  isValidCompleteEngineSummary,
  isValidDenseEngineSummary,
  isValidSixSectionPrescription,
  enforceSevenSectionLayout,
  MIN_SUMMARY_WORDS,
  countSummaryWords
};
