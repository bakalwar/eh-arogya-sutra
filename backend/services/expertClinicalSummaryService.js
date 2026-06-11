'use strict';

/**
 * Smart Search — PRIMARY: Ollama EH Doctor + book RAG + dynamicEhRules.json.
 * Template engine (clinicalFallbackSeven) OFF unless EH_ALLOW_TEMPLATE_FALLBACK=1.
 */
const { determineUniversalClinicalRules } = require('./generateClinicalSummary');
const { caseDataToSummaryInput } = require('./summaryCaseAdapter');
const { clearDynamicRulesCache } = require('./dynamicEhRulesStore');
const { auditDynamicRuleMatch } = require('./applyDynamicEhRules');
const { cleanSummaryForRender } = require('../utils/summaryJsonCleaner');
const { generateCompleteEngineSummary } = require('./ehOllamaCompleteSummary');
const {
  enrichCaseWithSourceOfTruth,
  formatDoctrineForOllama
} = require('./ehSourceOfTruthClinical');
const { buildFallbackSummary } = require('./ehSummary7SectionFallback');
const { buildClinicalData } = require('./ehSourceOfTruthClinical');
const {
  SUMMARY_ENGINE_VERSION,
  SUMMARY_SECTION_COUNT
} = require('../constants/clinicalSummaryVersion');

const MODEL_PREF = 'ollama-book-eh-doctor';
const { getSummaryWordTargets } = require('../config/environment');
const TARGET_WORDS = getSummaryWordTargets().targetWords;

function wordCount(text) {
  return (text || '').split(/\s+/).filter(Boolean).length;
}

function ollamaUnavailableMessage(err = '') {
  return (
    '# ⚠️ Ollama + पुस्तक सारांश आवश्यक\n\n' +
    'अभी **टेम्पलेट दवा सूची बंद** है — सारांश केवल **Ollama + ingest की पुस्तक + dynamicEhRules.json** से बनेगा।\n\n' +
    '1. `ollama serve` चलाएं\n' +
    '2. `.env` में `EH_SUMMARY_MODE=ollama-book` (डिफ़ॉल्ट)\n' +
    '3. `npm run ingest:book-status` — chunks > 0 हो\n' +
    '4. Backend restart: `npm run dev`\n' +
    '5. Dubara Analyze → सारांश\n\n' +
    (err ? `*त्रुटि: ${err}*` : '')
  );
}

function logPipeline(lockedRules, audit, mode) {
  console.log('\n========== [EH SUMMARY] Ollama Book Doctor ==========');
  console.log(`  Mode: ${mode}`);
  console.log(`  Rules matched: ${audit.matchedCount} → [${audit.matchedIds.join(', ') || 'NONE'}]`);
  console.log(`  Lock: ${lockedRules.potency} | ${lockedRules.masterElectricity}`);
  console.log(`  Engine: ${SUMMARY_ENGINE_VERSION}`);
  console.log('===================================================\n');
}

async function buildOllamaPrimaryResult(caseData) {
  try {
    return await buildOllamaPrimaryResultInner(caseData);
  } catch (err) {
    console.error('[EH SUMMARY] buildOllamaPrimaryResult crash:', err.message);
    return {
      summary: ollamaUnavailableMessage(err.message),
      summary_json: { crash: true },
      model: MODEL_PREF,
      wordCount: 0,
      targetWords: TARGET_WORDS,
      source: 'summary-crash-guard',
      no_applicable_rule: false,
      seven_sections: false,
      summary_engine: 'ehOllamaCompleteSummary.js',
      summary_engine_version: SUMMARY_ENGINE_VERSION,
      ollama_error: err.message
    };
  }
}

async function buildOllamaPrimaryResultInner(caseData) {
  clearDynamicRulesCache();

  // ── PRIMARY: EH API v3 English summary (9 Rule Engines) — no book RAG / Ollama override ──
  const fastApiSummary =
    caseData.eh_analysis?.clinical_summary ||
    caseData.eh_analysis?.parcha ||
    caseData.clinical_summary ||
    caseData.summary ||
    '';
  if (fastApiSummary && fastApiSummary.includes('EH AROGYA SUTRA')) {
    console.log('[EH SUMMARY] Using EH API 9-Rule-Engine summary (summary_engine.py)');
    return {
      summary: fastApiSummary,
      summary_json: null,
      engine_result: caseData.eh_analysis?.engine_result || null,
      model: 'eh-api-9engine-v3',
      wordCount: wordCount(fastApiSummary),
      targetWords: 1000,
      source: 'eh-api-9engine-v3',
      potency: caseData.eh_analysis?.potency?.potency || caseData.analysis?.dilution,
      electricity: caseData.eh_analysis?.electricity?.elec || caseData.analysis?.electricity,
      confidence: 95,
      no_applicable_rule: false,
      seven_sections: true,
      summary_via: 'fastapi'
    };
  }

  caseData = enrichCaseWithSourceOfTruth(caseData);
  const summaryInput = caseDataToSummaryInput(caseData);
  let lockedRules = determineUniversalClinicalRules(summaryInput);
  const sotElec =
    caseData.expert?.eh_clinical?.elecCode ||
    caseData.electricity ||
    caseData.expert?.electricity;
  if (sotElec && process.env.EH_USE_SOURCE_OF_TRUTH !== '0') {
    lockedRules = {
      ...lockedRules,
      masterElectricity: sotElec,
      electricity: sotElec
    };
  }
  const audit = auditDynamicRuleMatch(summaryInput, {
    polarityState: lockedRules.polarityState,
    calculatedPotency: lockedRules.potency,
    masterElectricity: lockedRules.masterElectricity
  });

  logPipeline(lockedRules, audit, 'ollama-book');

  const t0 = Date.now();
  const doctrineBlock = formatDoctrineForOllama(
    caseData.eh_doctrine || {},
    lockedRules,
    summaryInput.formulas
  );
  // #region agent log
  fetch('http://127.0.0.1:7642/ingest/bd0fabee-b18f-4eac-9d5d-c0ff9ebdbaf2',{
    method:'POST',
    headers:{'Content-Type':'application/json','X-Debug-Session-Id':'97eddb'},
    body:JSON.stringify({sessionId:'97eddb',location:'expertClinicalSummaryService.js:before_generate',message:'invoke_generateCompleteEngineSummary',data:{lockedRules:{potency:lockedRules.potency,masterElectricity:lockedRules.masterElectricity}},timestamp:Date.now()})
  }).catch(()=>{});
  // #endregion
  const ollama = await generateCompleteEngineSummary({
    ...caseData,
    eh_doctrine_block: doctrineBlock
  });
  const ollamaSeconds = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[EH SUMMARY] Ollama finished in ${ollamaSeconds}s ok=${ollama.ok} err=${ollama.error || '—'}`);
  // #region agent log
  fetch('http://127.0.0.1:7642/ingest/bd0fabee-b18f-4eac-9d5d-c0ff9ebdbaf2',{
    method:'POST',
    headers:{'Content-Type':'application/json','X-Debug-Session-Id':'97eddb'},
    body:JSON.stringify({sessionId:'97eddb',location:'expertClinicalSummaryService.js:after_generate',message:'generateCompleteEngineSummary_done',data:{ok:ollama.ok,wordCount:ollama.wordCount,error:ollama.error,seconds:ollamaSeconds},timestamp:Date.now()})
  }).catch(()=>{});
  // #endregion

  if (ollama.ok && ollama.markdown) {
    const elecCode =
      String(lockedRules.masterElectricity || '').match(/\b(RE|BE|WE|GE|YE)\b/i)?.[1] || 'WE';
    const { markdown, json } = cleanSummaryForRender(ollama.markdown, {
      allowedElectricity: elecCode,
      allowedPotency: lockedRules.potency,
      matchedRuleIds: audit.matchedIds,
      preserveLayout: true
    });

    return {
      summary: markdown,
      summary_json: json,
      model: ollama.model || MODEL_PREF,
      wordCount: ollama.wordCount || wordCount(markdown),
      targetWords: TARGET_WORDS,
      source: ollama.source || 'eh-complete-engine',
      potency: lockedRules.potency,
      electricity: lockedRules.masterElectricity,
      confidence: caseData.expert?.confidence ?? null,
      no_applicable_rule: false,
      seven_sections: true,
      summary_layout: 'seven_section_ollama_book',
      summary_section_count: SUMMARY_SECTION_COUNT,
      summary_engine: 'ehOllamaCompleteSummary.js',
      summary_engine_version: SUMMARY_ENGINE_VERSION,
      dynamic_rules_matched: audit.matchedIds,
      dynamic_rules_total: audit.totalRules,
      book_rag_chars: ollama.bookChars,
      has_applicable_clinical_rule: true,
      summary_via: ollama.source === 'ollama-book' ? 'ollama' : 'rule-engine-complete',
      ollama_seconds: Number(ollamaSeconds),
      ollama_error: null
    };
  }

  const useTemplateFallback = process.env.EH_SUMMARY_TEMPLATE_ON_OLLAMA_FAIL !== '0';

  if (useTemplateFallback) {
    console.warn(`[EH] Ollama failed (${ollama.error}) — rule-engine 7-section fallback`);
    const cd = buildClinicalData(summaryInput);
    const raw = buildFallbackSummary(summaryInput, cd, caseData.eh_analysis || null);
    const elecCode =
      String(lockedRules.masterElectricity || '').match(/\b(RE|BE|WE|GE|YE)\b/i)?.[1] || 'WE';
    const { markdown, json } = cleanSummaryForRender(raw, {
      allowedElectricity: elecCode,
      allowedPotency: lockedRules.potency,
      matchedRuleIds: audit.matchedIds
    });
    return {
      summary:
        `> *Ollama समय सीमा/ऑफ़लाइन — नीचे rule-engine सार (तुरंत)। Ollama के लिए: \`ollama serve\` फिर Dubara।*\n\n${markdown}`,
      summary_json: json,
      model: 'template-fallback',
      wordCount: wordCount(markdown),
      targetWords: TARGET_WORDS,
      source: 'clinicalFallbackSeven-fallback-only',
      summary_engine: 'clinicalFallbackSeven.js',
      summary_engine_version: SUMMARY_ENGINE_VERSION,
      seven_sections: true,
      no_applicable_rule: false,
      ollama_error: ollama.error,
      summary_via: 'template-fallback',
      ollama_seconds: Number(ollamaSeconds)
    };
  }

  return {
    summary: ollamaUnavailableMessage(ollama.error),
    summary_json: { ollamaFailed: true },
    model: MODEL_PREF,
    wordCount: 0,
    targetWords: TARGET_WORDS,
    source: 'ollama-unavailable',
    no_applicable_rule: false,
    seven_sections: false,
    summary_engine: 'ollamaBookDoctorSummary.js',
    summary_engine_version: SUMMARY_ENGINE_VERSION,
    ollama_error: ollama.error,
    summary_via: 'unavailable',
    ollama_seconds: Number(ollamaSeconds)
  };
}

async function generateExpertClinicalSummary(caseData) {
  if (!caseData?.expert || caseData.expert.ok === false) {
    const err = new Error(
      caseData?.expert?.expert_error ||
        caseData?.expert?.error ||
        'Valid EH Expert result required — Smart Search से पहले Analyze करें'
    );
    err.statusCode = 400;
    throw err;
  }
  return buildOllamaPrimaryResult(caseData);
}

async function buildClinicalSummaryForCase(caseData) {
  return buildOllamaPrimaryResult(caseData);
}

module.exports = {
  generateExpertClinicalSummary,
  buildClinicalSummaryForCase,
  MODEL_PREF,
  TARGET_WORDS,
  SUMMARY_ENGINE_VERSION
};
