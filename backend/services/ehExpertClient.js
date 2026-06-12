'use strict';

const axios = require('axios');

const EXPERT_BASE = (process.env.EH_API_URL || process.env.EH_EXPERT_ENGINE_URL || 'http://127.0.0.1:8005').replace(/\/$/, '');
const EXPERT_TIMEOUT_MS = Number(process.env.EH_EXPERT_TIMEOUT_MS) || 90000;

/** CaseInput → EH API v3 /api/v3/prescribe body (9 Rule Engines + 14k fuzzy diseases) */
function caseInputToPrescribeBody(caseInput) {
  const c = caseInput || {};
  const symptoms =
    c.symptoms_text ||
    c.chief_complaint ||
    c.chiefComplaint ||
    (Array.isArray(c.symptoms)
      ? c.symptoms.map((s) => (typeof s === 'object' ? s.name : s)).filter(Boolean).join(', ')
      : '') ||
    '';
  const phase = String(c.phase || c.nature || 'chronic').toLowerCase();
  const condition = ['acute', 'sub_acute', 'chronic', 'degenerative'].includes(phase) ? phase : 'chronic';
  return {
    patient_name: c.patient_name || c.name || 'Patient',
    age: parseInt(c.age, 10) || 30,
    gender: c.gender || 'Male',
    bp_systolic: parseInt(c.bp_systolic ?? c.bpSystolic, 10) || 120,
    bp_diastolic: parseInt(c.bp_diastolic ?? c.bpDiastolic, 10) || 80,
    symptoms,
    condition,
    disease_names: c.disease_names || []
  };
}

/**
 * POST { caseData } → Python EH API /api/summary/eh-api (14k diseases + summary_engine.py)
 * @param {Record<string, unknown>} caseData
 */
async function callEhApiSummary(caseData) {
  const timeout = Math.max(
    EXPERT_TIMEOUT_MS,
    Number(process.env.EH_SUMMARY_TIMEOUT_MS) || 120000
  );
  try {
    const { data, status } = await axios.post(
      `${EXPERT_BASE}/api/summary/eh-api`,
      { caseData },
      {
        timeout,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.EH_API_KEY || 'EH_TEST_KEY_2026'
        },
        validateStatus: () => true
      }
    );

    if (status >= 400) {
      const detail =
        typeof data?.detail === 'string'
          ? data.detail
          : data?.message || `EH API summary HTTP ${status}`;
      const err = new Error(detail);
      err.statusCode = status >= 500 ? 502 : status;
      throw err;
    }

    return {
      ok: data?.status === 'success',
      ...data
    };
  } catch (e) {
    if (e.statusCode) throw e;
    const code = e.code || '';
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
      const err = new Error(
        `EH Python API unreachable — set EH_API_URL to Railway Python service (${EXPERT_BASE})`
      );
      err.statusCode = 503;
      throw err;
    }
    throw e;
  }
}

/**
 * POST CaseInput to EH API v3 prescribe → 9 Rule Engines + English summary
 * @param {Record<string, unknown>} caseInput
 */
async function callExpertAnalyze(caseInput) {
  const payload = caseInputToPrescribeBody(caseInput);
  try {
    const { data, status } = await axios.post(`${EXPERT_BASE}/api/v3/prescribe`, payload, {
      timeout: EXPERT_TIMEOUT_MS,
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': process.env.EH_API_KEY || 'EH_TEST_KEY_2026'
      },
      validateStatus: () => true
    });

    if (status >= 400) {
      const err = new Error(
        typeof data?.detail === 'string'
          ? data.detail
          : data?.message || `Expert engine HTTP ${status}`
      );
      err.statusCode = status >= 500 ? 502 : status;
      throw err;
    }

    // Map to old format if needed, or just return
    return {
      ok: data.status === 'success',
      ...data
    };
  } catch (e) {
    if (e.statusCode) throw e;
    const code = e.code || '';
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
      const err = new Error(
        `EH Expert Engine band hai — alag terminal mein npm run expert-engine (${EXPERT_BASE})`
      );
      err.statusCode = 503;
      throw err;
    }
    throw e;
  }
}

/**
 * POST multipart face image → FaceAnalyzeResponse JSON.
 * @param {Buffer|import('stream').Readable} imageBuffer
 * @param {string} [filename]
 */
async function callExpertAnalyzeFace(imageBuffer, filename = 'face.jpg') {
  const form = new FormData();
  form.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), filename);

  try {
    // eh-api might not have a dedicated face endpoint, but we can use analyze-report or similar
    // For now, let's keep it pointing to a likely endpoint if it exists
    const res = await fetch(`${EXPERT_BASE}/api/v3/analyze-report?file_type=image`, {
      method: 'POST',
      body: form,
      headers: {
        'x-api-key': process.env.EH_API_KEY || 'EH_TEST_KEY_2026'
      },
      signal: AbortSignal.timeout(Math.min(EXPERT_TIMEOUT_MS, 60000))
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.detail || data?.error || `Expert face HTTP ${res.status}`);
      err.statusCode = res.status >= 500 ? 502 : res.status;
      throw err;
    }
    return data;
  } catch (e) {
    if (e.statusCode) throw e;
    const code = e.cause?.code || e.code || '';
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
      const err = new Error(`EH Expert Engine band hai — npm run expert-engine (${EXPERT_BASE})`);
      err.statusCode = 503;
      throw err;
    }
    throw e;
  }
}

/**
 * POST report file → structured OCR (pathologies, labs, organs).
 * @param {Buffer} fileBuffer
 * @param {'pdf'|'image'} fileType
 * @param {string} [filename]
 */
async function callExpertOcrReport(fileBuffer, fileType = 'image', filename = 'report.jpg') {
  const form = new FormData();
  const mime = fileType === 'pdf' ? 'application/pdf' : 'image/jpeg';
  form.append('file', new Blob([fileBuffer], { type: mime }), filename);

  try {
    const url = new URL(`${EXPERT_BASE}/api/v3/analyze-report`);
    url.searchParams.set('file_type', fileType);
    const res = await fetch(url.toString(), {
      method: 'POST',
      body: form,
      headers: {
        'x-api-key': process.env.EH_API_KEY || 'EH_TEST_KEY_2026'
      },
      signal: AbortSignal.timeout(Math.min(EXPERT_TIMEOUT_MS, 120000))
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.detail || data?.error || `Expert OCR HTTP ${res.status}`);
      err.statusCode = res.status >= 500 ? 502 : res.status;
      throw err;
    }
    return data;
  } catch (e) {
    if (e.statusCode) throw e;
    const code = e.cause?.code || e.code || '';
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
      const err = new Error(`EH Expert Engine band hai — npm run expert-engine (${EXPERT_BASE})`);
      err.statusCode = 503;
      throw err;
    }
    throw e;
  }
}

/**
 * Multipart complete analyze — face + report + formula + summary.
 * @param {FormData} formData — built by route (fields + files)
 */
async function callExpertAnalyzeComplete(formData) {
  const timeout = Math.max(EXPERT_TIMEOUT_MS, 300000);
  try {
    // eh-api uses /api/v3/prescribe for complete analysis if data is passed
    // but for multipart, we might need a specific endpoint or use analyze-report
    const res = await fetch(`${EXPERT_BASE}/api/v3/analyze-report`, {
      method: 'POST',
      body: formData,
      headers: {
        'x-api-key': process.env.EH_API_KEY || 'EH_TEST_KEY_2026'
      },
      signal: AbortSignal.timeout(timeout)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.detail || data?.error || `Expert complete HTTP ${res.status}`);
      err.statusCode = res.status >= 500 ? 502 : res.status;
      throw err;
    }
    return data;
  } catch (e) {
    if (e.statusCode) throw e;
    const code = e.cause?.code || e.code || '';
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
      const err = new Error(`EH Expert Engine band hai — npm run expert-engine (${EXPERT_BASE})`);
      err.statusCode = 503;
      throw err;
    }
    throw e;
  }
}

/**
 * POST CaseInput → 11-section clinical summary (Python llm_engine / Ollama).
 * @param {Record<string, unknown>} caseInput
 * @param {{ prompt_style?: string, use_multistep_summary?: boolean }} [opts]
 */
async function callExpertSummary(caseInput, opts = {}) {
  const timeout = Math.max(
    EXPERT_TIMEOUT_MS,
    Number(process.env.OLLAMA_EXPERT_CLINICAL_TIMEOUT_MS) || 400000
  );
  const payload = {
    ...caseInput,
    language: 'hi',
    prompt_style: opts.prompt_style || 'eleven_section',
    use_multistep_summary: !!opts.use_multistep_summary
  };
  try {
    const { data, status } = await axios.post(`${EXPERT_BASE}/api/v3/prescribe`, payload, {
      timeout,
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': process.env.EH_API_KEY || 'EH_TEST_KEY_2026'
      },
      validateStatus: () => true
    });
    if (status >= 400) {
      const err = new Error(data?.detail || data?.error || `Expert summary HTTP ${status}`);
      err.statusCode = status >= 500 ? 502 : status;
      throw err;
    }
    if (!data?.clinical_summary || !String(data.clinical_summary || '').trim()) {
      const err = new Error(data?.error || 'Expert summary empty');
      err.statusCode = 502;
      throw err;
    }
    return {
      ok: true,
      summary: data.clinical_summary
    };
  } catch (e) {
    if (e.statusCode) throw e;
    const code = e.code || '';
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
      const err = new Error(`EH Expert Engine band hai — npm run expert-engine (${EXPERT_BASE})`);
      err.statusCode = 503;
      throw err;
    }
    throw e;
  }
}

module.exports = {
  callEhApiSummary,
  callExpertAnalyze,
  callExpertAnalyzeFace,
  callExpertOcrReport,
  callExpertAnalyzeComplete,
  callExpertSummary,
  caseInputToPrescribeBody,
  EXPERT_BASE,
  EXPERT_TIMEOUT_MS
};
