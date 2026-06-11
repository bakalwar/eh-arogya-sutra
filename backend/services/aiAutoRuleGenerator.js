'use strict';

const axios = require('axios');
const { getOllamaUrlFromEnv } = require('../utils/ollamaUrl');
const { assertLocalOllamaEndpoint } = require('../utils/localPrivacyGuard');
const { buildBookRagQueryContext } = require('./bookRagContext');
const { searchBookVector, formatVectorHitsForOllama, buildLocalVectorIndex } = require('./localBookVectorRag');
const {
  appendExtractedRules,
  loadDynamicEhRules,
  normalizeRule
} = require('./dynamicEhRulesStore');
const {
  assertRuleExtractionAllowed,
  getRuleExtractGateStatus
} = require('../utils/ruleExtractGate');
const { getLocalRagStats } = require('./localBookVectorRag');

const OLLAMA_MODEL =
  process.env.EH_RULE_EXTRACT_MODEL || process.env.OLLAMA_MODEL || 'llama3.2:3b';
const EXTRACT_BATCH_CHARS = Number(process.env.EH_RULE_EXTRACT_BATCH_CHARS) || 4500;
const EXTRACT_CHUNKS_PER_BATCH = Number(process.env.EH_RULE_EXTRACT_CHUNKS_PER_BATCH) || 2;
const EXTRACT_VECTOR_TOP_K = Number(process.env.EH_RULE_EXTRACT_VECTOR_TOP_K) || 20;
const EXTRACT_NUM_PREDICT = Number(process.env.EH_RULE_EXTRACT_NUM_PREDICT) || 1024;
const EXTRACT_RULES_PER_BATCH_MAX = Number(process.env.EH_RULE_EXTRACT_RULES_PER_BATCH_MAX) || 6;

const RULE_EXTRACT_SYSTEM = `
You are an Electrohomeopathy clinical rule extractor for E.H. Arogya Sutra.
Output ONLY valid JSON — no markdown, no explanation outside JSON.
Extract IF/THEN laws: potency locks (D4/D6/D10/D30), electricity blocks (RE/BE/WE/GE/YE), BP thresholds, polarity (धनात्मक/ऋणात्मक).
Never invent rules not supported by the provided book text snippet.
`.trim();

function buildRuleExtractionPrompt(bookText, meta = {}) {
  const { batchIndex = 0, batchTotal = 1, maxRules = EXTRACT_RULES_PER_BATCH_MAX } = meta;
  const batchNote =
    batchTotal > 1
      ? `This is excerpt ${batchIndex + 1} of ${batchTotal} from the textbook. Extract only rules supported by THIS excerpt.`
      : '';

  return `
Extract electrohomeopathy IF/THEN clinical rules from this textbook content ONLY.
${batchNote}

BOOK TEXT:
---
${String(bookText || '').trim()}
---

Return JSON exactly in this shape:
{
  "rules": [
    {
      "id": "unique_snake_case_id",
      "priority": 90,
      "enabled": true,
      "if": {
        "bp_systolic_gte": 130,
        "polarity_in": ["HYPER"],
        "symptoms_any": ["उच्च रक्तचाप"],
        "phase_in": ["ACUTE"]
      },
      "then": {
        "block_electricity": ["RE", "R.E."],
        "force_electricity": "BE",
        "prefer_electricity": ["BE", "WE"],
        "force_potency": "D10",
        "note_hi": "हिंदी में एक पंक्ति कारण"
      },
      "rationale_hi": "पुस्तक के अनुसार संक्षिप्त हिंदी औचित्य"
    }
  ]
}

Allowed if keys: bp_systolic_gte, bp_systolic_gt, bp_systolic_lte, bp_systolic_lt, bp_diastolic_gte, bp_diastolic_lte, polarity_in, phase_in, symptoms_any, symptoms_all, temperament_in
Allowed then keys: block_electricity, force_electricity, prefer_electricity, force_potency, set_potency_max, set_potency_min, water_instruction_hi, note_hi
Minimum 1 rule if text supports; maximum ${maxRules} rules for this excerpt. Hindi note_hi required.
`.trim();
}

/**
 * Split large RAG context into Ollama-sized batches (~4–5k chars each).
 */
function splitContentIntoBatches(text, maxChars = EXTRACT_BATCH_CHARS) {
  const s = String(text || '').trim();
  if (!s) return [];
  if (s.length <= maxChars) return [s];

  const sections = s.split(/\n\n---\n\n+/).filter((p) => p.trim());
  const batches = [];
  let buf = '';

  const flush = () => {
    const t = buf.trim();
    if (t) batches.push(t);
    buf = '';
  };

  for (const section of sections) {
    if (section.length > maxChars) {
      flush();
      for (let i = 0; i < section.length; i += maxChars) {
        batches.push(section.slice(i, i + maxChars));
      }
      continue;
    }
    const next = buf ? `${buf}\n\n---\n\n${section}` : section;
    if (next.length > maxChars) {
      flush();
      buf = section;
    } else {
      buf = next;
    }
  }
  flush();

  if (!batches.length) {
    for (let i = 0; i < s.length; i += maxChars) {
      batches.push(s.slice(i, i + maxChars));
    }
  }
  return batches;
}

function collectBookContentForRuleExtraction(query = '') {
  buildLocalVectorIndex();
  const q = String(query || 'रक्तचाप विद्युत पोटेंसी ध्रुवता').trim();
  const vectorHits = searchBookVector(q, { topK: 15 });
  const vectorBlock = formatVectorHitsForOllama(vectorHits, 12000);
  const rag = buildBookRagQueryContext({
    medicineCodes: [],
    symptomsText: q,
    chiefComplaint: q,
    maxChars: 8000
  });
  return [vectorBlock, rag.formattedContext].filter(Boolean).join('\n\n---\n\n');
}

/**
 * Prefer RAG index chunks (~1.2k each): N chunks per Ollama request (smaller, faster).
 */
function collectBookBatchesForRuleExtraction(query = '') {
  buildLocalVectorIndex();
  const q = String(query || 'रक्तचाप विद्युत पोटेंसी ध्रुवता').trim();
  const { chunks } = searchBookVector(q, { topK: EXTRACT_VECTOR_TOP_K });
  const batches = [];

  for (let i = 0; i < (chunks || []).length; i += EXTRACT_CHUNKS_PER_BATCH) {
    const slice = chunks.slice(i, i + EXTRACT_CHUNKS_PER_BATCH);
    const body = slice
      .map((c) => `### Block (source: ${c.source}, page ${c.pageNum || '?'})\n${c.text}`)
      .join('\n\n');
    if (body.trim()) batches.push(body.trim());
  }

  if (batches.length) {
    const rag = buildBookRagQueryContext({
      medicineCodes: [],
      symptomsText: q,
      chiefComplaint: q,
      maxChars: 1500
    });
    if (rag.formattedContext?.trim()) {
      const ragSnippet = rag.formattedContext.trim().slice(0, 1500);
      batches[0] = `${ragSnippet}\n\n---\n\n${batches[0]}`;
    }
    return batches;
  }

  return splitContentIntoBatches(collectBookContentForRuleExtraction(q), EXTRACT_BATCH_CHARS);
}

function resolveExtractionBatches(options = {}) {
  const { bookText, bookBatches, query, batchChars = EXTRACT_BATCH_CHARS } = options;
  if (Array.isArray(bookBatches) && bookBatches.length) return bookBatches;
  if (bookText) return splitContentIntoBatches(bookText, batchChars);
  return collectBookBatchesForRuleExtraction(query);
}

function parseJsonFromOllamaResponse(text) {
  const s = String(text || '').trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1].trim() : s;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Ollama response has no JSON object');
  return JSON.parse(raw.slice(start, end + 1));
}

async function callOllamaRuleBatch(host, batchText, options = {}) {
  const {
    model = OLLAMA_MODEL,
    timeoutMs = Number(process.env.EH_RULE_EXTRACT_TIMEOUT_MS) || 180000,
    batchIndex = 0,
    batchTotal = 1
  } = options;

  const response = await axios.post(
    `${host}/api/generate`,
    {
      model,
      system: RULE_EXTRACT_SYSTEM,
      prompt: buildRuleExtractionPrompt(batchText, { batchIndex, batchTotal }),
      stream: false,
      format: 'json',
      options: {
        temperature: 0.05,
        num_predict: EXTRACT_NUM_PREDICT
      }
    },
    { timeout: timeoutMs }
  );

  const parsed = parseJsonFromOllamaResponse(response.data?.response || '');
  const rawRules = Array.isArray(parsed.rules) ? parsed.rules : [];
  return rawRules.map((r, i) => normalizeRule(r, batchIndex * 100 + i));
}

/**
 * Batched extract: each chunk → Ollama → append dynamicEhRules.json immediately.
 */
async function extractRulesFromBookWithOllama(options = {}) {
  assertRuleExtractionAllowed();

  const {
    bookText,
    query,
    append = true,
    model = OLLAMA_MODEL,
    timeoutMs = Number(process.env.EH_RULE_EXTRACT_TIMEOUT_MS) || 180000,
    batchChars = EXTRACT_BATCH_CHARS,
    continueOnError = true,
    onBatchComplete
  } = options;

  const batches = resolveExtractionBatches({ bookText, bookBatches: options.bookBatches, query, batchChars });
  if (!batches.length || batches.join('').length < 200) {
    throw new Error('Insufficient book content for rule extraction');
  }
  const contentChars = batches.reduce((n, b) => n + b.length, 0);
  const host = getOllamaUrlFromEnv().replace(/\/$/, '');
  assertLocalOllamaEndpoint(host);

  let totalExtracted = 0;
  let lastSaved = loadDynamicEhRules({ force: true });
  const batchResults = [];
  const errors = [];

  for (let i = 0; i < batches.length; i += 1) {
    const batchNum = i + 1;
    try {
      const normalized = await callOllamaRuleBatch(host, batches[i], {
        model,
        timeoutMs,
        batchIndex: i,
        batchTotal: batches.length
      });

      if (normalized.length && append) {
        lastSaved = appendExtractedRules(normalized, {
          source: 'ollama-auto-rule-generator-batched',
          extractedFrom: `batch:${batchNum}/${batches.length}:${batches[i].length}chars`
        });
      }

      totalExtracted += normalized.length;
      const row = {
        batch: batchNum,
        batchTotal: batches.length,
        chars: batches[i].length,
        extracted: normalized.length,
        ok: true
      };
      batchResults.push(row);
      if (typeof onBatchComplete === 'function') {
        onBatchComplete(row, lastSaved);
      }
    } catch (e) {
      const row = {
        batch: batchNum,
        batchTotal: batches.length,
        chars: batches[i].length,
        ok: false,
        error: e.message
      };
      batchResults.push(row);
      errors.push(row);
      if (typeof onBatchComplete === 'function') {
        onBatchComplete(row, lastSaved);
      }
      if (!continueOnError) {
        const err = new Error(
          `Batch ${batchNum}/${batches.length} failed: ${e.message}. ` +
            `${totalExtracted} rule(s) saved from earlier batches.`
        );
        err.code = 'RULE_EXTRACT_BATCH_FAILED';
        err.partial = { totalExtracted, batchResults, errors };
        throw err;
      }
    }
  }

  const { RULES_PATH } = require('./dynamicEhRulesStore');

  return {
    extractedCount: totalExtracted,
    totalRules: lastSaved.rules?.length ?? lastSaved.ruleCount ?? 0,
    ruleCount: lastSaved.ruleCount,
    updatedAt: lastSaved.updatedAt,
    path: RULES_PATH,
    batches: batches.length,
    batchChars,
    contentChars,
    batchResults,
    errors,
    partialSuccess: errors.length > 0 && totalExtracted > 0,
    preview: (lastSaved.rules || []).slice(0, 5)
  };
}

async function generateDynamicRulesFromBookContent(bookContent, options = {}) {
  return extractRulesFromBookWithOllama({
    bookText: bookContent,
    ...options
  });
}

function getDynamicRulesStatus() {
  const store = loadDynamicEhRules();
  const rag = getLocalRagStats();
  const gate = getRuleExtractGateStatus();
  return {
    ruleCount: store.rules.length,
    updatedAt: store.updatedAt,
    source: store.source,
    path: require('./dynamicEhRulesStore').RULES_PATH,
    enabledCount: store.rules.filter((r) => r.enabled !== false).length,
    seedOnlyMode: !gate.extractionAllowed,
    ...gate,
    bookChunks: rag.chunkCount,
    bookPageFiles: rag.pageFiles,
    batchChars: EXTRACT_BATCH_CHARS
  };
}

module.exports = {
  extractRulesFromBookWithOllama,
  generateDynamicRulesFromBookContent,
  collectBookContentForRuleExtraction,
  collectBookBatchesForRuleExtraction,
  resolveExtractionBatches,
  splitContentIntoBatches,
  buildRuleExtractionPrompt,
  callOllamaRuleBatch,
  getDynamicRulesStatus,
  getRuleExtractGateStatus,
  parseJsonFromOllamaResponse
};
