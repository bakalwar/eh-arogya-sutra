'use strict';

const { callExpertAnalyzeCompleteClinical } = require('./ehExpertClient');
const { analyzeReportWithClaude } = require('./claudeClinicalAnalysis');
const {
  enforceClinicalOutputMode,
  assertClinicalPythonResponse,
  CLINICAL_OUTPUT_MODE,
} = require('./searchEngine');

const NUMEROLOGY_BASE = process.env.EH_NUMEROLOGY_API_URL || 'http://127.0.0.1:8001';
const { hasUploadedBodyPhotos } = require('../utils/buildExpertCompleteFormData');
const { fetchJsonSafe } = require('../utils/fetchJsonSafe');
const { sanitizeClinicalText } = require('../utils/sanitizeClinicalText');

const { EXPERT_BASE } = require('./ehExpertClient');

const IMAGE_KEYS = ['report_files', 'report_file', 'files', 'body_photos', 'body_photo', 'face_image'];

async function fetchOrganInfo(systems) {
  if (!systems?.length) return [];
  const { ok, data } = await fetchJsonSafe(
    `${EXPERT_BASE}/api/v3/organ-info`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EH_API_KEY || 'EH_TEST_KEY_2026',
      },
      body: JSON.stringify({ systems }),
    },
    'organ-info'
  );
  if (!ok || !data) return [];
  return data.systems || [];
}

async function fetchNumerology(path, body) {
  const { ok, data } = await fetchJsonSafe(
    `${NUMEROLOGY_BASE}${path}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    `numerology${path}`
  );
  if (!ok) return null;
  return data;
}

function collectImages(req) {
  const out = [];
  for (const key of IMAGE_KEYS) {
    const batch = req.files?.[key];
    if (!Array.isArray(batch)) continue;
    for (const f of batch) {
      if (!f?.buffer?.length) continue;
      const mime = f.mimetype || 'image/jpeg';
      if (!mime.startsWith('image/')) continue;
      out.push({
        name: f.originalname || 'upload.jpg',
        mediaType: mime,
        base64: f.buffer.toString('base64'),
      });
    }
  }
  return out;
}

function extractPhotoDosha(report) {
  return (
    report.dosha_dominant ||
    (report.pitt_status?.includes('Aggravated')
      ? 'Pitta'
      : report.vat_status?.includes('Aggravated')
        ? 'Vata'
        : report.kaph_status?.includes('Aggravated')
          ? 'Kapha'
          : 'Mixed')
  );
}

function ehContextForClaude(ehReport) {
  return {
    prakriti: ehReport.prakriti,
    dosha_dominant: ehReport.dosha_dominant,
    vat_status: ehReport.vat_status,
    pitt_status: ehReport.pitt_status,
    kaph_status: ehReport.kaph_status,
    lab_findings: ehReport.lab_findings || [],
    active_systems: ehReport.active_systems || [],
    organ_systems: (ehReport.organ_systems || []).map((o) => ({
      system: o.system,
      dosha: o.dosha,
    })),
    affected_part_analysis: ehReport.affected_part_analysis,
  };
}

function buildFallbackReport(ehReport, patient) {
  return {
    prakriti: ehReport.prakriti || 'Mixed',
    prakriti_analysis: '',
    dosha_dominant: ehReport.dosha_dominant,
    vat_status: ehReport.vat_status || 'Balanced',
    pitt_status: ehReport.pitt_status || 'Balanced',
    kaph_status: ehReport.kaph_status || 'Balanced',
    dosha_analysis: ehReport.dosha_analysis || '',
    lab_findings: ehReport.lab_findings || [],
    lab_summary: ehReport.lab_summary || '',
    affected_part_analysis: ehReport.affected_part_analysis || 'Not provided',
    active_systems: ehReport.active_systems || [],
    organ_systems: [],
    severity: ehReport.severity || 'Moderate',
    overall_clinical_impression:
      ehReport.overall_clinical_impression ||
      `Clinical review for ${patient.name} — please retry analysis if this summary seems incomplete.`,
  };
}

/**
 * Full Report Analysis pipeline — runs ONLY on Analyze Report click.
 * Layer 1 (:8001) silent → EH (:8005) → Claude vision synthesis → final narrative only.
 */
async function runReportAnalysisPipeline({ req, formData, patient }) {
  enforceClinicalOutputMode(formData);

  const baseline = await fetchNumerology('/api/baseline', {
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
  });
  const layer1Context = baseline?.baseline_text || '';

  const py = assertClinicalPythonResponse(await callExpertAnalyzeCompleteClinical(formData));
  const ehReport = { ...(py.clinical_report || {}) };
  if (!ehReport.active_systems?.length && py.clinical_analysis?.active_systems) {
    ehReport.active_systems = py.clinical_analysis.active_systems;
  }
  if (!ehReport.organ_systems?.length && ehReport.active_systems?.length) {
    ehReport.organ_systems = await fetchOrganInfo(ehReport.active_systems);
  }

  const hasBody = hasUploadedBodyPhotos(req);
  let layer1ForClaude = layer1Context;
  if (hasBody) {
    const correlation = await fetchNumerology('/api/correlation', {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      photo_detected_dosha: extractPhotoDosha(ehReport),
      photo_detected_organs: [
        ...(ehReport.active_systems || []),
        ...(ehReport.organ_systems?.map((o) => o.system) || []),
      ],
    });
    if (correlation?.correlation_text) {
      layer1ForClaude = correlation.correlation_text;
    }
  }

  const images = collectImages(req);
  let clinicalReport = buildFallbackReport(ehReport, patient);

  try {
    const claude = await analyzeReportWithClaude({
      patient,
      layer1Context: layer1ForClaude,
      ehContext: ehContextForClaude(ehReport),
      images,
    });
    if (claude) {
      clinicalReport = {
        ...clinicalReport,
        ...claude,
        lab_findings: claude.lab_findings?.length ? claude.lab_findings : clinicalReport.lab_findings,
        overall_clinical_impression: sanitizeClinicalText(
          claude.overall_clinical_impression || clinicalReport.overall_clinical_impression
        ),
      };
    }
  } catch (e) {
    console.warn('[report-analysis] Claude synthesis failed, using EH fallback:', e.message);
  }

  clinicalReport.overall_clinical_impression = sanitizeClinicalText(
    clinicalReport.overall_clinical_impression
  );

  return {
    patient: {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      date: new Date().toISOString(),
    },
    clinicalReport,
    pipeline: py.pipeline || 'eh-api-claude-synthesis',
    analysis_mode: py.analysis_mode,
    output_mode: CLINICAL_OUTPUT_MODE,
    analysis_via: 'claude-vision-synthesis',
    eh_engine_online: true,
  };
}

module.exports = { runReportAnalysisPipeline };
