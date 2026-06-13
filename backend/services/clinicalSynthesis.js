'use strict';

const { CLAUDE_MODEL } = require('./claudeClinicalAnalysis');
const { parseJsonSafe, stripFences } = require('../utils/parseJsonSafe');

const FORBIDDEN = /\b(numerology|astrology|planet|grah|dasha)\b/i;

/**
 * Layer 3 — Claude merges Layer 1 (constitutional baseline) + Layer 2 (EH API clinical report).
 * EH API (:8005) is unchanged; this runs after EH returns.
 */
const SYNTHESIS_SYSTEM = `You are an expert Electro-Homeopathy clinical analyst synthesizing a final patient report.

You receive:
- layer1_summary: Constitutional Baseline from name-derived tendency (never mention numerology, astrology, planets, grah, or dasha)
- layer2_eh_report: OCR + temperament + 9-engine EH API clinical findings (no prescriptions)

Produce ONE integrated clinical narrative. Return ONLY valid JSON:
{
  "prakriti_analysis": "3-4 sentences weaving baseline + EH temperament",
  "dosha_analysis": "3-4 sentences",
  "affected_part_analysis": "3-4 sentences or Not provided",
  "overall_clinical_impression": "450-550 words in 5-6 paragraphs — Layer 1 baseline context first, then labs/organs/temperament from Layer 2. NO medicines, NO formulas, NO MIXTURE codes."
}

Rules:
- Never use the words: numerology, astrology, planet, grah, dasha
- Use labels "Constitutional Baseline" and "Constitutional Tendency" only when referring to Layer 1
- Clinical explanation only — no prescription content`;

async function callClaudeSynthesis({ patient, layer1_summary, clinicalReport }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: SYNTHESIS_SYSTEM,
      messages: [
        {
          role: 'user',
          content: JSON.stringify(
            {
              patient,
              layer1_summary,
              layer2_eh_report: clinicalReport,
            },
            null,
            2
          ),
        },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn('[clinical-synthesis] Claude HTTP', res.status, data?.error?.message);
    return null;
  }

  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  return parseJsonSafe(stripFences(text), 'clinical-synthesis');
}

function mergeLayer1Fallback(clinicalReport, layer1_summary) {
  const layer1 = String(layer1_summary || '').trim();
  if (!layer1 || FORBIDDEN.test(layer1)) return clinicalReport;

  const intro =
    `Constitutional Baseline: ${layer1}\n\n`;
  const impression = String(clinicalReport.overall_clinical_impression || '');
  const prakriti = String(clinicalReport.prakriti_analysis || '');

  return {
    ...clinicalReport,
    prakriti_analysis: prakriti.startsWith('Constitutional Baseline')
      ? prakriti
      : `${intro.trim()}\n\n${prakriti}`.trim(),
    overall_clinical_impression: impression.startsWith('Constitutional Baseline')
      ? impression
      : `${intro}${impression}`.trim(),
  };
}

async function synthesizeThreeLayer({ patient, layer1_summary, clinicalReport }) {
  const layer1 = String(layer1_summary || '').trim();
  if (!layer1) return clinicalReport;

  try {
    const claude = await callClaudeSynthesis({ patient, layer1_summary: layer1, clinicalReport });
    if (claude) {
      return {
        ...clinicalReport,
        prakriti_analysis: claude.prakriti_analysis || clinicalReport.prakriti_analysis,
        dosha_analysis: claude.dosha_analysis || clinicalReport.dosha_analysis,
        affected_part_analysis:
          claude.affected_part_analysis || clinicalReport.affected_part_analysis,
        overall_clinical_impression:
          claude.overall_clinical_impression || clinicalReport.overall_clinical_impression,
        synthesis_via: 'claude-3layer',
      };
    }
  } catch (e) {
    console.warn('[clinical-synthesis] Claude failed — using deterministic merge:', e.message);
  }

  return {
    ...mergeLayer1Fallback(clinicalReport, layer1),
    synthesis_via: 'layer1-merge',
  };
}

module.exports = { synthesizeThreeLayer, mergeLayer1Fallback };
