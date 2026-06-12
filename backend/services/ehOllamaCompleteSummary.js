'use strict';

/**
 * EH_Complete_Engine_Final-1.pdf STEP 3 — Ollama 1000+ words, 4 Tablet + 2 Malam, retry + fallback
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { buildClinicalData, caseToEngineInput } = require('./ehSourceOfTruthClinical');
const { countWords, fmt } = require('./ehCompleteFallbackSummary');
const { buildFallbackSummary } = require('./ehSummary7SectionFallback');
const { getOllamaUrlFromEnv } = require('../utils/ollamaUrl');
const { assertLocalOllamaEndpoint } = require('../utils/localPrivacyGuard');

const OLLAMA_URL = getOllamaUrlFromEnv().replace(/\/$/, '');
const MODEL = process.env.EH_OLLAMA_DOCTOR_MODEL || process.env.OLLAMA_MODEL || 'llama3.2:3b';
const TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT_MS || process.env.EH_OLLAMA_MAX_WAIT_MS || '600000', 10);
const NUM_CTX = parseInt(process.env.OLLAMA_NUM_CTX || '8192', 10);
const NUM_PREDICT = parseInt(process.env.OLLAMA_NUM_PREDICT || '1000', 10);
const isCompact = process.env.EH_SUMMARY_COMPACT_BOOK === '1';
const MIN_WORDS = isCompact
  ? parseInt(process.env.SUMMARY_MIN_WORDS_COMPACT || process.env.SUMMARY_MIN_WORDS || '300', 10)
  : parseInt(process.env.SUMMARY_MIN_WORDS || '800', 10);
if (isCompact) {
  console.log(`[eh-complete] Compact mode enabled — MIN_WORDS set to ${MIN_WORDS}`);
} else {
  console.log(`[eh-complete] MIN_WORDS set to ${MIN_WORDS}`);
}
const MAX_RETRIES = parseInt(process.env.SUMMARY_MAX_RETRIES || '1', 10);

const EH_SYSTEM = `
आप Expert Electro-Homeopathy Doctor AI हैं — Count Cesare Mattei Blood+Lymph।

विद्युत: BP≥140→B.E. | BP<90→R.E. | uric/jod→G.E. | nervous+BP 90-130→W.E. | W.E. कभी B.E. नहीं | electricity मिश्रण A में।

OUTPUT शुद्ध हिंदी, ${MIN_WORDS}+ शब्द, ## 1–7:
1 कार्यकारी विवरण+table 2 प्रकृति 3 जांच+अंग 4 Formula+electricity in A 5 पोटेंसी 6 timing table+2 malam 7 आहार+recovery
`.trim();

function inputFromCaseData(caseData = {}) {
  if (caseData.patient || caseData.analysis) return caseToEngineInput(caseData);
  return caseData;
}

async function generateOllamaSummary(inputOrCase = {}) {
  const input = inputFromCaseData(inputOrCase);
  const cd = buildClinicalData(input);
  const ehInfo = inputOrCase.eh_analysis?.success ? inputOrCase.eh_analysis.data : (inputOrCase.eh_analysis || null);
  
  const { temperament, polData, formulas, electricity, labFindings } = cd;
  const { potency, isHyper } = polData;
  const fa = formulas.formula_a;
  const formulaB = formulas.formula_b;
  const gHi = String(input.gender || 'Male').toLowerCase().includes('f') ? 'महिला' : 'पुरुष';
  const symList = (input.symptoms || [])
    .map((s) => (typeof s === 'object' ? s.name || '' : String(s)))
    .join(', ');
  const labText =
    labFindings.map((f) => `${f.test}: ${f.value} → ${f.status}`).join('\n') || 'रिपोर्ट उपलब्ध नहीं';

  // Use API data for prompt if available
  let apiMedsA = fa.formatted || fmt(fa.medicines, potency);
  let apiMedsB = formulaB.formatted || fmt(formulaB.medicines, potency);
  let apiMedsC = formulas.formula_c?.formatted || fmt(formulas.formula_c?.medicines, formulas.formula_c?.potency);
  let apiMedsD = formulas.formula_d?.formatted || electricity.elec + ' D3';
  let apiPotency = potency;
  let apiElectricity = electricity.elec;

  if (ehInfo && ehInfo.mixtures) {
    apiMedsA = ehInfo.mixtures[0]?.formula_obj?.full || ehInfo.mixtures[0]?.fo?.full || apiMedsA;
    apiMedsB = ehInfo.mixtures[1]?.formula_obj?.full || ehInfo.mixtures[1]?.fo?.full || apiMedsB;
    apiMedsC = ehInfo.mixtures[2]?.formula_obj?.full || ehInfo.mixtures[2]?.fo?.full || apiMedsC;
    apiMedsD = ehInfo.mixtures[3]?.formula_obj?.full || ehInfo.mixtures[3]?.fo?.full || apiMedsD;
    apiPotency = ehInfo.potency?.potency || apiPotency;
    apiElectricity = ehInfo.electricity?.elec || apiElectricity;
  }

  const userPrompt = `
रोगी: ${input.age} वर्ष, ${gHi}, ${input.weight} किग्रा
BP: ${input.bp_systolic}/${input.bp_diastolic}, नाड़ी: ${input.pulse || 72}
प्रकृति: ${ehInfo?.prakriti?.prakriti_hindi || temperament} | ${cd.bloodLymphHi || ''}
अवस्था: ${input.phase} | ध्रुवता: ${ehInfo?.polarity?.polarity || polData.polarity} | पोटेंसी: ${apiPotency}
लक्षण: ${symList}
Lab: ${labText}
अंग: ${(input.affected_organs || cd.affected_organs || ehInfo?.active_systems || []).join(', ')}
EH AI Expert (eh_api.py + summary_engine.py):
मिश्रण A (दवा + विद्युत): ${apiMedsA}
मिश्रण B: ${apiMedsB}
मिश्रण C: ${apiMedsC}
बाह्य मलहम D: ${apiMedsD}
विद्युत: ${apiElectricity}
TASK: 7 sections (## 1–7), ${MIN_WORDS}+ शब्द, 4 Tablet + electricity in A + 2 Malam + 5-row timing table।
`;

  try {
    assertLocalOllamaEndpoint(OLLAMA_URL);
    await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 8000 });
  } catch (e) {
    const fallbackMd = buildFallbackSummary(input, cd, inputOrCase.eh_analysis || null);
    return {
      summary: fallbackMd,
      source: 'rule-engine',
      wordCount: countWords(fallbackMd),
      ready: true,
      error: e.message
    };
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[eh-complete] Ollama attempt ${attempt}/${MAX_RETRIES} predict=${NUM_PREDICT}`);
      // #region agent log
      fetch('http://127.0.0.1:7642/ingest/bd0fabee-b18f-4eac-9d5d-c0ff9ebdbaf2',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-Debug-Session-Id':'97eddb'},
        body:JSON.stringify({sessionId:'97eddb',location:'ehOllamaCompleteSummary.js:attempt_start',message:'ollama_attempt_start',data:{attempt,NUM_PREDICT,NUM_CTX,MIN_WORDS},timestamp:Date.now()})
      }).catch(()=>{});
      // #endregion
      const { data } = await axios.post(
        `${OLLAMA_URL}/api/generate`,
        {
          model: MODEL,
          system: EH_SYSTEM,
          prompt: userPrompt,
          stream: false,
          options: {
            temperature: 0.12,
            num_ctx: NUM_CTX,
            num_predict: NUM_PREDICT,
            repeat_penalty: 1.15
          }
        },
        { timeout: TIMEOUT }
      );
      const text = String(data.response || '').trim();
      const wc = countWords(text);
      console.log(`[eh-complete] Ollama words: ${wc}`);
      // #region agent log
      fetch('http://127.0.0.1:7642/ingest/bd0fabee-b18f-4eac-9d5d-c0ff9ebdbaf2',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-Debug-Session-Id':'97eddb'},
        body:JSON.stringify({sessionId:'97eddb',location:'ehOllamaCompleteSummary.js:attempt_result',message:'ollama_attempt_result',data:{attempt,wc,wordThreshold:MIN_WORDS,ok: wc>=MIN_WORDS},timestamp:Date.now()})
      }).catch(()=>{});
      // #endregion
      if (wc >= MIN_WORDS) {
        return { summary: text, source: 'ollama-book', wordCount: wc, ready: true, model: MODEL };
      }
    } catch (err) {
      console.warn(`[eh-complete] attempt ${attempt}:`, err.message?.slice(0, 80));
      // #region agent log
      fetch('http://127.0.0.1:7642/ingest/bd0fabee-b18f-4eac-9d5d-c0ff9ebdbaf2',{
        method:'POST',
        headers:{'Content-Type':'application/json','X-Debug-Session-Id':'97eddb'},
        body:JSON.stringify({sessionId:'97eddb',location:'ehOllamaCompleteSummary.js:attempt_error',message:'ollama_attempt_error',data:{attempt,err:err.message?.slice(0,200)},timestamp:Date.now()})
      }).catch(()=>{});
      // #endregion
    }
  }

  const fallbackMd = buildFallbackSummary(input, cd, inputOrCase.eh_analysis || null);
  return {
    summary: fallbackMd,
    source: 'rule-engine',
    wordCount: countWords(fallbackMd),
    ready: true
  };
}

/** Adapter for expert-clinical pipeline */
async function generateCompleteEngineSummary(caseData = {}) {
  const input = caseToEngineInput(caseData);
  const result = await generateOllamaSummary(input);
  return {
    ok: true,
    markdown: result.summary,
    wordCount: result.wordCount,
    source: result.source,
    model: result.model || MODEL,
    error: result.error
  };
}

module.exports = {
  generateOllamaSummary,
  generateCompleteEngineSummary,
  MIN_WORDS,
  MAX_RETRIES
};
