'use strict';

/**
 * All clinical prompts built at invocation from dynamicEhRules.json — no static ehSystemPrompt.
 */
const { loadDynamicEhRules, clearDynamicRulesCache } = require('./dynamicEhRulesStore');
const { auditDynamicRuleMatch } = require('./applyDynamicEhRules');

const SEVEN_SECTION_HEADINGS = [
  '## 1. कार्यकारी क्लिनिकल विवरण',
  '## 2. प्रकृति विश्लेषण',
  '## 3. शारीरिक एवं रोग विश्लेषण',
  '## 4. औषधि निर्माण का वैज्ञानिक कारण',
  '## 5. पोटेंसी और ध्रुवता का नियम',
  '## 6. खुराक और सेवन विधि',
  '## 7. आहार, परहेज एवं जीवनशैली'
];

function buildRulesCatalogBlock() {
  clearDynamicRulesCache();
  const store = loadDynamicEhRules({ force: true });
  const lines = store.rules
    .filter((r) => r.enabled !== false)
    .slice(0, 40)
    .map((r) => {
      const ifs = [];
      const cond = r.if || {};
      if (cond.bp_systolic_lte != null) ifs.push(`BP≤${cond.bp_systolic_lte}`);
      if (cond.bp_systolic_gte != null) ifs.push(`BP≥${cond.bp_systolic_gte}`);
      if (cond.polarity_in?.length) ifs.push(`polarity=${cond.polarity_in.join('/')}`);
      if (cond.symptoms_any?.length) ifs.push(`symptoms∋…`);
      const then = r.then || {};
      const outs = [];
      if (then.force_electricity) outs.push(`elec=${then.force_electricity}`);
      if (then.prefer_electricity?.length) outs.push(`prefer=${then.prefer_electricity.join('/')}`);
      if (then.force_potency) outs.push(`pot=${then.force_potency}`);
      return `- [${r.id}] p${r.priority} IF(${ifs.join(', ') || 'any'}) → ${outs.join(', ') || 'note only'}`;
    });
  return [
    `### DYNAMIC RULE CATALOG (${store.rules.length} rules, source: ${store.source})`,
    ...lines,
    '**Forbidden:** 11-section template, 6-section prescription, G.E./R.E./B.E. from memory — only matched rule outputs.'
  ].join('\n');
}

/**
 * System prompt — reconstructed from live JSON every call.
 */
function buildSystemPromptFromRules(waterInstruction = '') {
  return [
    'You are a DATA-EXTRACTION engine for E.H. Arogya Sutra — NOT a creative medical writer.',
    'MODE: extraction-only. Copy values from CASE_JSON and MATCHED_RULES_JSON into the 7-section markdown skeleton.',
    'DO NOT invent medicines, electricity (G.E./R.E./B.E.), potencies, or extra sections.',
    'If a field is missing in JSON, write "—" — never hallucinate.',
    '',
    buildRulesCatalogBlock(),
    '',
    'OUTPUT: exactly 7 sections (## 1 … ## 7). Sections 8–11 FORBIDDEN.',
    SEVEN_SECTION_HEADINGS.join('\n'),
    waterInstruction ? `\nWater (from rules): ${waterInstruction}` : ''
  ].join('\n');
}

/**
 * User prompt for Ollama extraction mode (optional — default path is rule-only, no LLM).
 */
function buildExtractionPromptFromCase(caseJson = {}, matchedRulesJson = {}) {
  return [
    'Extract the following JSON into the 7-section Hindi markdown template. No other text.',
    '',
    '### CASE_JSON',
    '```json',
    JSON.stringify(caseJson, null, 2),
    '```',
    '',
    '### MATCHED_RULES_JSON',
    '```json',
    JSON.stringify(matchedRulesJson, null, 2),
    '```',
    '',
    'LOCKED OUTPUT FIELDS (must appear verbatim in sections 4–6):',
    `- potency: ${caseJson.potency ?? '—'}`,
    `- electricity: ${caseJson.electricity ?? '—'}`,
    `- formula_a: ${caseJson.formula_a ?? '—'}`,
    `- formula_b: ${caseJson.formula_b ?? '—'}`
  ].join('\n');
}

function buildPromptBundle(input = {}, rules = {}) {
  const audit = auditDynamicRuleMatch(input, rules);
  const caseJson = {
    bp_systolic: input.bp_systolic,
    bp_diastolic: input.bp_diastolic,
    phase: input.phase,
    symptoms: input.symptoms,
    potency: rules.potency,
    electricity: rules.masterElectricity || rules.electricity,
    polarity: rules.polarityState,
    water: rules.waterInstruction
  };
  const matchedRulesJson = {
    matchedIds: audit.matchedIds,
    lockedPotency: audit.lockedPotency,
    lockedElectricity: audit.lockedElectricity,
    applicable: audit.hasApplicableClinicalRule
  };
  return {
    system: buildSystemPromptFromRules(rules.waterInstruction),
    user: buildExtractionPromptFromCase(caseJson, matchedRulesJson),
    audit
  };
}

/** Legacy export name — redirects to dynamic builder */
const EH_SYSTEM_PROMPT = '[DEPRECATED] Use buildSystemPromptFromRules() — built from dynamicEhRules.json at runtime.';

module.exports = {
  EH_SYSTEM_PROMPT,
  buildSystemPromptFromRules,
  buildExtractionPromptFromCase,
  buildRulesCatalogBlock,
  buildPromptBundle,
  SEVEN_SECTION_HEADINGS
};
