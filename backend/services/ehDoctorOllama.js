'use strict';

/**
 * EH Doctor — Ollama clinical reasoning when dynamicEhRules.json has no potency/electricity lock.
 * Output feeds clinicalFallbackSeven.js (same 7-section PDF format).
 */
const axios = require('axios');
const { getOllamaUrlFromEnv } = require('../utils/ollamaUrl');
const { buildComplaintLine } = require('../utils/summaryComplaintLock');
const { ELECTRICITY_LABELS } = require('./applyDynamicEhRules');

const MODEL = process.env.EH_OLLAMA_DOCTOR_MODEL || process.env.OLLAMA_MODEL || 'llama3.2:3b';
const TIMEOUT_MS = Number(process.env.EH_OLLAMA_DOCTOR_TIMEOUT_MS) || 120000;

const EH_DOCTOR_SYSTEM = `आप Count Cesare Mattei के इलेक्ट्रो-होम्योपैथी (EH) के विशेषज्ञ चिकित्सक हैं — AI search engine नहीं।

नियम:
1. शुद्ध देवनागरी हिंदी — Hinglish नहीं।
2. धनात्मक (HYPER/उग्र) रोग → ऋणात्मक (तनु) मात्रा D10/D30; ऋणात्मक (HYPO) रोग → धनात्मक मात्रा D3/D4/D6।
3. उच्च BP → BE या WE बाह्य/आंतरिक; निम्न BP → WE, GE ब्लॉक; जोड़/सूजन → GE बाह्य जब आवश्यक।
4. केवल JSON उत्तर दें — कोई अतिरिक्त पाठ नहीं।

JSON schema:
{
  "potency": "D10",
  "electricity_code": "BE",
  "polarity_label": "HYPER (अति-सक्रिय)",
  "water_instruction_hi": "10 बूंदें गुनगुने पानी में घूँट-घूँट",
  "external_location_hi": "प्रभावित अंग पर",
  "clinical_reasoning_hi": "2-3 वाक्य — क्यों यह पोटेंसी और विद्युत"
}`;

function extractJsonBlock(text) {
  const raw = String(text || '').trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1].trim() : raw;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

function jsonToLockedRules(input, parsed, baseRules = {}) {
  const code = String(parsed.electricity_code || 'WE')
    .match(/\b(RE|BE|WE|GE|YE)\b/i)?.[1]
    ?.toUpperCase() || 'WE';
  const potency = String(parsed.potency || baseRules.potency || 'D10').trim();
  const masterElectricity = ELECTRICITY_LABELS[code] || `WE (सफेद विद्युत)`;

  return {
    ...baseRules,
    polarityState: parsed.polarity_label || baseRules.polarityState || 'MIXED',
    calculatedPotency: potency,
    potency,
    masterElectricity,
    electricity: masterElectricity,
    waterInstruction: parsed.water_instruction_hi || baseRules.waterInstruction,
    externalLocation: parsed.external_location_hi || baseRules.externalLocation,
    hasApplicableClinicalRule: true,
    noApplicableRule: false,
    ollamaDoctorLock: true,
    dynamicRulesApplied: [
      ...(baseRules.dynamicRulesApplied || []),
      {
        id: 'ollama_eh_doctor',
        priority: 200,
        note_hi: parsed.clinical_reasoning_hi || 'Ollama EH Doctor clinical lock'
      }
    ]
  };
}

/**
 * @returns {Promise<{ ok: boolean, rules?: object, error?: string }>}
 */
async function consultEhDoctorOllama(input = {}, baseRules = {}) {
  if (process.env.EH_OLLAMA_DOCTOR === '0') {
    return { ok: false, error: 'EH_OLLAMA_DOCTOR=0' };
  }

  const symptoms = input.symptoms || [];
  const symLine = buildComplaintLine(symptoms);
  const userPayload = {
    age: input.age,
    gender: input.gender,
    weight: input.weight,
    bp_systolic: input.bp_systolic,
    bp_diastolic: input.bp_diastolic,
    phase: input.phase,
    temperament: input.temperament,
    symptoms: symLine,
    formulas: input.formulas,
    vitals_suggestion: {
      potency: baseRules.potency,
      electricity: baseRules.masterElectricity,
      polarity: baseRules.polarityState
    }
  };

  const host = getOllamaUrlFromEnv().replace(/\/$/, '');

  try {
    const { data } = await axios.post(
      `${host}/api/generate`,
      {
        model: MODEL,
        system: EH_DOCTOR_SYSTEM,
        prompt: `रोगी डेटा:\n${JSON.stringify(userPayload, null, 2)}\n\nउपरोक्त केस के लिए JSON clinical lock दें।`,
        stream: false,
        options: { temperature: 0.15, num_predict: 800, num_ctx: 8192 }
      },
      { timeout: TIMEOUT_MS }
    );

    const parsed = extractJsonBlock(data.response || '');
    if (!parsed?.potency || !parsed?.electricity_code) {
      return { ok: false, error: 'Ollama doctor JSON incomplete' };
    }

    return {
      ok: true,
      rules: jsonToLockedRules(input, parsed, baseRules),
      raw: parsed
    };
  } catch (e) {
    return { ok: false, error: e.message || 'Ollama unreachable' };
  }
}

module.exports = { consultEhDoctorOllama, EH_DOCTOR_SYSTEM };
