'use strict';

const { parseJsonSafe, stripFences } = require('../utils/parseJsonSafe');

const CLAUDE_MODEL = process.env.ANTHROPIC_CLINICAL_MODEL || 'claude-sonnet-4-20250514';

const REPORT_SYNTHESIS_SYSTEM = `You are an expert Electro-Homeopathy clinical analyst.
Write an original 500-600 word clinical analysis. Return ONLY valid JSON (no markdown fences).

Schema:
{
  "prakriti": "Lymphatic|Sanguine|Bilious|Nervous",
  "dosha_dominant": "Vat|Pitt|Kaph",
  "vat_status": "Balanced|Mildly Aggravated|Severely Aggravated",
  "pitt_status": "Balanced|Mildly Aggravated|Severely Aggravated",
  "kaph_status": "Balanced|Mildly Aggravated|Severely Aggravated",
  "lab_findings": [{"parameter":"","value":"","status":"HIGH|NORMAL|LOW","eh_meaning":""}],
  "severity": "Mild|Moderate|Severe",
  "overall_clinical_impression": "500-600 words, 5-7 paragraphs — the ONLY narrative shown to the doctor"
}

Rules:
- Refer to the patient BY NAME
- State which dosha is elevated and WHY based on what you see in uploads
- Describe SPECIFIC observed problems — never invent, never use generic placeholder phrases
- NEVER quote or repeat layer1 constitutional context verbatim
- NEVER mention Type N, numerology, astrology, planet, grah, dasha, or "any patient/adult"
- NO medicines, formulas, prescriptions, or MIXTURE codes
- If a photo/report type is missing, mention once naturally without fabricating findings`;

const SYSTEM_PROMPT = `You are an expert Electro-Homeopathy clinical analyst. Apply Count Cesare Mattei's principles, the four temperaments (Lymphatic, Sanguine, Bilious, Nervous), and the EH dosha framework (Vat/Pitt/Kaph).

Analyze all provided images/reports and the patient data below.
Output 500-600 words total across fields, in English only.
NO medicines, NO formulas, NO prescriptions, NO dilutions, NO mixture codes — only clinical findings and explanation that helps the doctor understand and explain the patient's condition.

Return ONLY valid JSON with this schema:
{
  "prakriti": "Lymphatic|Sanguine|Bilious|Nervous",
  "prakriti_analysis": "3-4 sentences",
  "dosha_dominant": "Vat|Pitt|Kaph",
  "vat_status": "Balanced|Mildly Aggravated|Severely Aggravated",
  "pitt_status": "Balanced|Mildly Aggravated|Severely Aggravated",
  "kaph_status": "Balanced|Mildly Aggravated|Severely Aggravated",
  "dosha_analysis": "3-4 sentences",
  "lab_findings": [{"parameter":"","value":"","status":"HIGH|NORMAL|LOW","eh_meaning":""}],
  "lab_summary": "2-3 sentences",
  "affected_part_analysis": "3-4 sentences or Not provided",
  "active_systems": ["SYSTEM1","SYSTEM2"],
  "severity": "Mild|Moderate|Severe",
  "no_face": true,
  "no_ang": true,
  "no_blood": true,
  "no_scan": true,
  "overall_clinical_impression": "300-350 words, 5-6 paragraphs"
}`;

function mimeForFile(name, fallback = 'image/jpeg') {
  const n = String(name || '').toLowerCase();
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.gif')) return 'image/gif';
  return fallback;
}

function buildUserContent({ patient, ehContext, images }) {
  const blocks = [
    {
      type: 'text',
      text: `Patient: ${patient.name}, Age ${patient.age}, ${patient.gender}, BP ${patient.bp_systolic}/${patient.bp_diastolic} mmHg.
Chief complaint / notes: ${patient.chief_complaint || 'Not provided'}

EH engine context (OCR + organ systems — use to refine, do not prescribe):
${JSON.stringify(ehContext, null, 2)}`,
    },
  ];

  for (const img of images || []) {
    if (!img?.base64) continue;
    blocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType || mimeForFile(img.name),
        data: img.base64,
      },
    });
  }

  return blocks;
}

function parseJsonFromText(text) {
  const parsed = parseJsonSafe(text, 'claude-response');
  if (!parsed) throw new Error('Claude did not return valid JSON');
  return parsed;
}

function buildReportSynthesisContent({ patient, layer1Context, ehContext, images }) {
  const layer1Block = layer1Context
    ? `Background constitutional context (reference only — do NOT quote verbatim, do NOT mention internal labels):\n${layer1Context}\n\n`
    : '';

  const blocks = [
    {
      type: 'text',
      text: `${layer1Block}Patient: ${patient.name}, Age ${patient.age}, ${patient.gender}, BP ${patient.bp_systolic}/${patient.bp_diastolic} mmHg.
Chief complaint / notes: ${patient.chief_complaint || 'Not provided'}

EH engine context (OCR + organ systems — use to inform your synthesis, do not copy verbatim):
${JSON.stringify(ehContext, null, 2)}

Analyze the uploaded photo(s) and report(s). Write a completely NEW original clinical analysis for ${patient.name}.`,
    },
  ];

  for (const img of images || []) {
    if (!img?.base64) continue;
    blocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType || mimeForFile(img.name),
        data: img.base64,
      },
    });
  }

  return blocks;
}

async function analyzeReportWithClaude({ patient, layer1Context, ehContext, images }) {
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
      max_tokens: 4500,
      system: REPORT_SYNTHESIS_SYSTEM,
      messages: [
        {
          role: 'user',
          content: buildReportSynthesisContent({ patient, layer1Context, ehContext, images }),
        },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn('[claude-report] HTTP', res.status, data?.error?.message);
    return null;
  }

  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  return parseJsonSafe(stripFences(text), 'claude-report-synthesis');
}

async function analyzeWithClaude({ patient, ehContext, images }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error('ANTHROPIC_API_KEY not set — clinical analysis requires Claude Vision');
    err.statusCode = 503;
    throw err;
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserContent({ patient, ehContext, images }) }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `Claude API HTTP ${res.status}`);
    err.statusCode = res.status >= 500 ? 502 : res.status;
    throw err;
  }

  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  return parseJsonFromText(text);
}

module.exports = { analyzeWithClaude, analyzeReportWithClaude, CLAUDE_MODEL };
