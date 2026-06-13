'use strict';

const axios = require('axios');
const { resolveEhPythonApiBase } = require('../config/resolveEhApiBase');

const EXPERT_BASE = resolveEhPythonApiBase();
const EXPERT_TIMEOUT_MS = Number(process.env.EH_EXPERT_TIMEOUT_MS) || 90000;

function ehApiHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-api-key': process.env.EH_API_KEY || 'EH_TEST_KEY_2026'
  };
}

/** Multipart / FormData — never set Content-Type (fetch adds boundary). */
function ehApiMultipartHeaders() {
  return {
    'x-api-key': process.env.EH_API_KEY || 'EH_TEST_KEY_2026'
  };
}

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

function caseDataToPrescribeBody(caseData = {}) {
  const patient = caseData.patient || {};
  const analysis = caseData.analysis || {};
  const parts = [];
  if (patient.chiefComplaint) parts.push(patient.chiefComplaint);
  if (analysis.chief_complaint) parts.push(analysis.chief_complaint);
  if (caseData.chief_complaint) parts.push(caseData.chief_complaint);
  if (caseData.chiefComplaint) parts.push(caseData.chiefComplaint);
  (patient.symptoms || []).forEach((s) => {
    if (s) parts.push(typeof s === 'object' ? s.name || s.hindi || '' : String(s));
  });
  const symptomsText = parts.filter(Boolean).join(', ');
  const phase = String(analysis.phase || patient.condition || caseData.phase || 'chronic')
    .toLowerCase()
    .replace(/-/g, '_');
  const condition = ['acute', 'sub_acute', 'chronic', 'degenerative'].includes(phase) ? phase : 'chronic';
  return {
    patient_name: patient.name || caseData.name || caseData.patient_name || 'Patient',
    age: patient.age ?? caseData.age ?? 30,
    gender: patient.gender || caseData.gender || 'Male',
    bp_systolic: patient.bp_systolic ?? caseData.bp_systolic ?? 120,
    bp_diastolic: patient.bp_diastolic ?? caseData.bp_diastolic ?? 80,
    symptoms: symptomsText,
    condition,
    disease_names: caseData.disease_names || []
  };
}

async function postEhApi(path, body, timeoutMs) {
  const { data, status } = await axios.post(`${EXPERT_BASE}${path}`, body, {
    timeout: timeoutMs,
    headers: ehApiHeaders(),
    validateStatus: () => true
  });

  if (status >= 400) {
    const detail =
      typeof data?.detail === 'string'
        ? data.detail
        : data?.message || `EH API HTTP ${status} ${path}`;
    const err = new Error(detail);
    err.statusCode = status;
    throw err;
  }

  return {
    ok: data?.status === 'success',
    ...data
  };
}

/**
 * POST { caseData } → Python /api/summary/eh-api (preferred)
 */
async function callEhApiSummary(caseData) {
  const timeout = Math.max(
    EXPERT_TIMEOUT_MS,
    Number(process.env.EH_SUMMARY_TIMEOUT_MS) || 120000
  );
  try {
    return await postEhApi('/api/summary/eh-api', { caseData }, timeout);
  } catch (e) {
    if (e.statusCode) throw e;
    const code = e.code || '';
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
      const err = new Error(
        `EH Python API unreachable at ${EXPERT_BASE} — set EH_API_URL / EH_PYTHON_API_URL on Railway`
      );
      err.statusCode = 503;
      throw err;
    }
    throw e;
  }
}

/**
 * POST → /api/v3/prescribe (same 9-engine pipeline; used if summary path missing on Python)
 */
async function callExpertAnalyze(caseInput) {
  const payload = caseInputToPrescribeBody(caseInput);
  try {
    return await postEhApi('/api/v3/prescribe', payload, EXPERT_TIMEOUT_MS);
  } catch (e) {
    if (e.statusCode) throw e;
    const code = e.code || '';
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
      const err = new Error(
        `EH Expert Engine band hai — npm run expert-engine (${EXPERT_BASE})`
      );
      err.statusCode = 503;
      throw err;
    }
    throw e;
  }
}

/**
 * Summary: try /api/summary/eh-api, then /api/v3/prescribe (same engines + summary_engine)
 */
async function callEhApiSummaryWithPrescribeFallback(caseData) {
  try {
    return await callEhApiSummary(caseData);
  } catch (e) {
    if (e.statusCode === 404) {
      console.warn('[EH API] /api/summary/eh-api 404 — fallback /api/v3/prescribe');
      const body = caseDataToPrescribeBody(caseData);
      return await callExpertAnalyze(body);
    }
    throw e;
  }
}

async function callExpertAnalyzeFace(imageBuffer, filename = 'face.jpg') {
  const form = new FormData();
  form.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), filename);

  try {
    const res = await fetch(`${EXPERT_BASE}/api/v3/analyze-report?file_type=image`, {
      method: 'POST',
      body: form,
      headers: ehApiMultipartHeaders(),
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
      headers: ehApiMultipartHeaders(),
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

async function callExpertAnalyzeComplete(formData, options = {}) {
  const timeout = Math.max(EXPERT_TIMEOUT_MS, 300000);
  const clinicalOnly = options.clinicalOnly === true;
  if (clinicalOnly) {
    formData.set('output_mode', 'clinical_only');
  }
  const url = new URL(`${EXPERT_BASE}/api/v3/analyze-report`);
  if (clinicalOnly) {
    url.searchParams.set('output_mode', 'clinical_only');
  }
  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      body: formData,
      headers: ehApiMultipartHeaders(),
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

async function callExpertAnalyzeCompleteClinical(formData) {
  formData.set('output_mode', 'clinical_only');
  return callExpertAnalyzeComplete(formData, { clinicalOnly: true });
}

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
    const py = await postEhApi('/api/v3/prescribe', payload, timeout);
    if (!py?.clinical_summary || !String(py.clinical_summary || '').trim()) {
      const err = new Error(py?.error || 'Expert summary empty');
      err.statusCode = 502;
      throw err;
    }
    return { ok: true, summary: py.clinical_summary };
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
  callEhApiSummaryWithPrescribeFallback,
  callExpertAnalyze,
  callExpertAnalyzeFace,
  callExpertOcrReport,
  callExpertAnalyzeComplete,
  callExpertAnalyzeCompleteClinical,
  callExpertSummary,
  ehApiHeaders,
  ehApiMultipartHeaders,
  caseInputToPrescribeBody,
  caseDataToPrescribeBody,
  EXPERT_BASE,
  EXPERT_TIMEOUT_MS
};
