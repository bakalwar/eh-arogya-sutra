/**
 * EH symptom keyword lexicon (EN + HI transliterations) for rule-based CDSS.
 * Optimized for high-performance clinical pattern matching.
 */

const POSITIVE_SYMPTOM_PATTERNS = [
  /\bfever\b/i, /\bbukhar\b/i, /\btap\b/i, /\bpyrexia\b/i, /\bhyperthermia\b/i,
  /\bswelling\b/i, /\bsujan\b/i, /\bedema\b/i, /\boedema\b/i, /\binflammation\b/i,
  /\bpain\b/i, /\bdard\b/i, /\bacute\s*pain\b/i, /\bsharp\s*pain\b/i,
  /\bhigh\s*bp\b/i, /\bhypertension\b/i, /\bbp\s*high\b/i,
  /\bredness\b/i, /\brash\b/i, /\beruptive\b/i,
  /\bheat\b/i, /\burning\b/i, /\bhot\b/i,
  /\btachycardia\b/i, /\bpalpitat/i, /\brapid\s*pulse\b/i,
  /\bcongestion\b/i, /\bengorgement\b/i,
  /\bhemorrhage\b/i, /\bbleeding\b/i, /\bactive\s*bleeding\b/i
];

const NEGATIVE_SYMPTOM_PATTERNS = [
  /\bweakness\b/i, /\bkamzori\b/i, /\bfatigue\b/i, /\bthakan\b/i, /\bexhaust/i,
  /\bparalysis\b/i, /\blakwa\b/i, /\bparalys/i, /\bparesis\b/i,
  /\blow\s*bp\b/i, /\bhypotension\b/i, /\bbp\s*low\b/i,
  /\bnumbness\b/i, /\bsunpan\b/i, /\btingling\b/i, /\bparesthesia\b/i,
  /\bcachexia\b/i, /\bweight\s*loss\b/i, /\bemaciation\b/i,
  /\banemia\b/i, /\banaemia\b/i, /\bpallor\b/i, /\bpale\b/i,
  /\bcold\s*extremit/i, /\bcoldness\b/i, /\bchills\b/i,
  /\bbradycardia\b/i, /\bslow\s*pulse\b/i,
  /\batrophy\b/i, /\bdegeneration\b/i, /\bchronic\s*weakness\b/i
];

const BLOOD_VITIATION_PATTERNS = [
  /\bblood\b/i, /\brakt\b/i, /\bsanguine\b/i, /\bangiotico\b/i,
  /\bheart\b/i, /\bdil\b/i, /\bcardiac\b/i, /\bmyocard/i,
  /\bcirculat/i, /\bvessel\b/i, /\barter/i, /\bvein\b/i,
  /\bhypertens/i, /\bhigh\s*bp\b/i, /\bhypotens/i, /\blow\s*bp\b/i,
  /\btachycard/i, /\bbradycard/i, /\bpalpitat/i,
  /\bhemorrh/i, /\bhaemorrh/i, /\bbleeding\b/i, /\bthromb/i,
  /\bangina\b/i, /\bchest\s*pain\b/i, /\bischem/i
];

const LYMPH_VITIATION_PATTERNS = [
  /\blymph\b/i, /\blimf\b/i, /\blympat/i, /\bscrofoloso\b/i,
  /\bgland\b/i, /\bganth\b/i, /\bnodal\b/i, /\bnode\b/i,
  /\bskin\b/i, /\btwacha\b/i, /\bdermat/i, /\beczema\b/i, /\bpsoriasis\b/i,
  /\bimmun/i, /\bautoimmun/i, /\ballergy\b/i, /\ballergic\b/i,
  /\bswelling\b/i, /\bsujan\b/i, /\boedema\b/i,
  /\bmucus\b/i, /\bphlegm\b/i, /\bcatarrh\b/i,
  /\bdigestive\b/i, /\bstomach\b/i, /\bgastric\b/i
];

const DEGENERATIVE_PATTERNS = [
  /\bcancer\b/i, /\btumor\b/i, /\btumour\b/i, /\bneoplasm\b/i,
  /\bmalignan/i, /\bcarcinoma\b/i, /\bsarcoma\b/i, /\bmetastas/i,
  /\bchemo\b/i, /\bradiation\s*therapy\b/i,
  /\bulcer\b/i, /\bnecrosis\b/i, /\bgangrene\b/i,
  /\bsclerosis\b/i, /\bfibrosis\b/i, /\bcirrhosis\b/i
];

function symptomText(s) {
  if (typeof s === 'string') return s.trim();
  if (s && typeof s === 'object') {
    return [s.name, s.name_hi, s.label, s.keywords, s.text]
      .filter(Boolean)
      .join(' ')
      .trim();
  }
  return '';
}

function countPatternHits(symptoms, patterns) {
  let hits = 0;
  const matched = [];
  for (const s of symptoms) {
    const text = symptomText(s);
    if (!text) continue;
    for (const re of patterns) {
      if (re.test(text)) {
        // Weighting based on severity (1-10 scale)
        const severity = Number(s.severity) || 5;
        hits += 1 + Math.min(2, Math.floor(severity / 4));
        matched.push(text.slice(0, 80));
        break;
      }
    }
  }
  return { hits, matched };
}

function hasDegenerativeSignal(symptoms) {
  return countPatternHits(symptoms, DEGENERATIVE_PATTERNS).hits > 0;
}

module.exports = {
  POSITIVE_SYMPTOM_PATTERNS,
  NEGATIVE_SYMPTOM_PATTERNS,
  BLOOD_VITIATION_PATTERNS,
  LYMPH_VITIATION_PATTERNS,
  DEGENERATIVE_PATTERNS,
  symptomText,
  countPatternHits,
  hasDegenerativeSignal
};
