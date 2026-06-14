'use strict';

/** EH API-only clinical routes — 9 Rule Engines + 14k diseases (eh_api.py). No book/Ollama path. */
if (process.env.EH_EXPERT_FALLBACK_NODE === '1' || process.env.EH_NODE_SINGLE_ENGINE === '1') {
  console.warn(
    '[search] EH_EXPERT_FALLBACK_NODE / EH_NODE_SINGLE_ENGINE ignored — EH Python API :8005 required'
  );
  process.env.EH_EXPERT_FALLBACK_NODE = '0';
  process.env.EH_NODE_SINGLE_ENGINE = '0';
}

const express = require('express');
const multer = require('multer');
const { asyncHandler } = require('../utils/asyncHandler');
const { callExpertAnalyze, callExpertAnalyzeComplete, EXPERT_BASE } = require('../services/ehExpertClient');
const { buildExpertCompleteFormData, hasUploadedReports, hasUploadedBodyPhotos, resolveAnalysisMode } = require('../utils/buildExpertCompleteFormData');
const { multerLimits } = require('../config/uploadLimits');
const { mapCompleteAnalyzeToApp, mapEhApiV3PrescribeToApp } = require('../services/pdfExpertMapper');
const { requireAuth } = require('../middleware/requireAuth');
const { isDbReady, getPostgresModels } = require('../utils/dataSource');
const { buildPrescriptionFromSearch } = require('../utils/buildPrescriptionFromSearch');
const { searchSymptoms, searchMedicines, CLINICAL_OUTPUT_MODE } = require('../services/searchEngine');
const { runReportAnalysisPipeline } = require('../services/reportAnalysisOrchestrator');
const { synthesizeThreeLayer } = require('../services/clinicalSynthesis');

const uploadComplete = multer({
  storage: multer.memoryStorage(),
  limits: multerLimits,
}).fields([
  { name: 'report_files', maxCount: 10 },
  { name: 'report_file', maxCount: 10 },
  { name: 'files', maxCount: 10 },
  { name: 'body_photos', maxCount: 5 },
  { name: 'body_photo', maxCount: 5 },
  { name: 'face_image', maxCount: 5 },
]);

function runUploadComplete(req, res, next) {
  uploadComplete(req, res, (err) => {
    if (err) {
      const msg =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File too large — max 50 MB per file.'
          : err.message || 'Upload failed';
      return res.status(400).json({ success: false, message: msg });
    }
    next();
  });
}

const router = express.Router();

function parseJsonField(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Multipart / JSON body → EH API caseInput */
function caseInputFromAnalyzeBody(b = {}) {
  const symptoms = parseJsonField(b.symptoms, []);
  const reportValues = parseJsonField(b.report_values, {});
  const affectedOrgans = parseJsonField(b.affected_organs, []);
  const chief = (b.chief_complaint || b.chiefComplaint || '').trim();
  const reportParts = [b.blood_report, b.mri_report, b.sonography].filter(Boolean);

  return {
    patient_name: (b.patient_name || b.patientName || b.name || '').trim(),
    age: Number(b.age) || 30,
    gender: b.gender || 'Male',
    weight: b.weight != null ? Number(b.weight) : undefined,
    chief_complaint: chief,
    symptoms: Array.isArray(symptoms) ? symptoms : [],
    bp_systolic: b.bp_systolic != null ? Number(b.bp_systolic) : undefined,
    bp_diastolic: b.bp_diastolic != null ? Number(b.bp_diastolic) : undefined,
    pulse: b.pulse != null ? Number(b.pulse) : undefined,
    duration_days: Number(b.duration_days || b.durationDays || 7),
    phase: b.phase || 'ACUTE',
    temperament: b.temperament || null,
    affected_organs: Array.isArray(affectedOrgans) ? affectedOrgans : [],
    report_values: reportValues,
    report_text: reportParts.join('\n\n'),
    blood_report: b.blood_report || '',
    mri_report: b.mri_report || '',
    sonography: b.sonography || '',
    face_analysis: b.face_analysis || b.faceAnalysis || null,
    face_image_base64: b.face_image_base64 || b.faceImageBase64 || null
  };
}

function ehApiUnavailable(err) {
  return {
    success: false,
    message:
      err?.message ||
      `EH API offline — start Python on :8005 (${EXPERT_BASE}/api/v3/prescribe)`,
    pipeline: 'eh-api-required',
    eh_engine_online: false
  };
}

/**
 * POST /api/search/clinical-analysis
 * Report Analysis page — clinical findings ONLY (no prescription / formulas / medicines).
 * Node :5000 → Python :8005 (OCR + 9 Rule Engines + 14k diseases, clinical_only).
 */
router.post(
  '/clinical-analysis',
  runUploadComplete,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const name = (b.patient_name || b.patientName || b.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'patient_name is required' });
    }
    const hasFace = hasUploadedBodyPhotos(req);
    const hasReport = hasUploadedReports(req);
    if (!hasFace && !hasReport) {
      return res.status(400).json({
        success: false,
        message: 'Upload report_files, body_photos, or both',
      });
    }

    const fd = buildExpertCompleteFormData(req, { clinicalOnly: true });

    const patient = {
      name,
      age: Number(b.age) || 40,
      gender: b.gender || 'Male',
      bp_systolic: Number(b.bp_systolic ?? b.bpSystolic) || 120,
      bp_diastolic: Number(b.bp_diastolic ?? b.bpDiastolic) || 80,
      chief_complaint: (b.chief_complaint || b.chiefComplaint || b.notes || '').trim(),
    };

    try {
      const data = await runReportAnalysisPipeline({
        req,
        formData: fd,
        patient,
      });
      return res.json({
        success: true,
        data,
        pipeline: data.pipeline || 'eh-api-claude-synthesis',
        analysis_mode: data.analysis_mode,
        output_mode: CLINICAL_OUTPUT_MODE,
        eh_engine_online: true,
      });
    } catch (err) {
      console.error('[clinical-analysis]', err);
      return res.status(err.statusCode || 502).json({
        success: false,
        message: err?.message || 'Analysis failed — please try again.',
        eh_engine_online: false,
      });
    }
  })
);

/**
 * POST /api/search/clinical-synthesis
 * Layer 3 — merge layer1_summary (Constitutional Baseline) + EH clinical report via Claude (optional).
 * EH API (:8005) already ran; this does not call eh-api again.
 */
router.post(
  '/clinical-synthesis',
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const layer1 = String(b.layer1_summary || b.layer1Summary || '').trim();
    const clinicalReport = b.clinicalReport || b.clinical_report;
    const patient = b.patient;

    if (!layer1) {
      return res.status(400).json({ success: false, message: 'layer1_summary is required' });
    }
    if (!clinicalReport || typeof clinicalReport !== 'object') {
      return res.status(400).json({ success: false, message: 'clinicalReport is required' });
    }

    const merged = await synthesizeThreeLayer({
      patient: patient || {},
      layer1_summary: layer1,
      clinicalReport,
    });

    return res.json({
      success: true,
      data: { clinicalReport: merged },
      synthesis_via: merged.synthesis_via || 'layer1-merge',
    });
  })
);

/**
 * POST /api/search/analyze-complete
 * Node :5000 → Python :8005 /api/v3/analyze-report (dual-mode + 9 Rule Engines)
 */
router.post(
  '/analyze-complete',
  runUploadComplete,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const name = (b.patient_name || b.patientName || b.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'patient_name is required' });
    }
    const chief = (b.chief_complaint || b.chiefComplaint || '').trim();
    const hasFace = hasUploadedBodyPhotos(req);
    const hasReport = hasUploadedReports(req);
    if (!chief && !hasFace && !hasReport) {
      return res.status(400).json({
        success: false,
        message: 'Upload report_files, body_photos, or enter clinical notes',
      });
    }

    const fd = buildExpertCompleteFormData(req);
    const analysisMode = resolveAnalysisMode(req);
    const caseInput = caseInputFromAnalyzeBody(b);

    try {
      if (!hasFace && !hasReport) {
        const py = await callExpertAnalyze(caseInput);
        if (py.status !== 'success' && py.ok === false) {
          throw new Error(py.detail || py.message || 'EH API prescribe failed');
        }
        const data = mapEhApiV3PrescribeToApp(py, { name, ...caseInput });
        return res.json({
          success: true,
          data,
          pipeline: 'eh-api-9engine-prescribe',
          analysis_mode: 'symptoms_only',
          eh_engine_online: true
        });
      }

      const pyResponse = await callExpertAnalyzeComplete(fd);
      if (pyResponse?.status === 'error') {
        throw new Error(pyResponse.message || 'EH API analyze-report failed');
      }

      const mapped = mapCompleteAnalyzeToApp(pyResponse);
      if (!mapped.success) {
        return res.status(502).json({
          success: false,
          message: mapped.message || 'EH API analyze-report failed',
          analysis_mode: analysisMode,
          eh_engine_online: false
        });
      }

      const pipeline =
        mapped.pipeline ||
        pyResponse?.pipeline ||
        (analysisMode === 'photo_temperament'
          ? 'eh-api-temperament-9engine'
          : analysisMode === 'medical_report_ocr'
            ? 'eh-api-9engine-analyze-report'
            : 'eh-api-combined-9engine');

      return res.json({
        success: true,
        data: mapped.data,
        pipeline,
        analysis_mode: analysisMode,
        eh_engine_online: true
      });
    } catch (err) {
      return res.status(err.statusCode || 502).json({
        ...ehApiUnavailable(err),
        analysis_mode: analysisMode
      });
    }
  })
);

/**
 * POST /api/search/analyze — JSON intake → EH API /api/v3/prescribe (9 Rule Engines)
 */
router.post(
  '/analyze',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const patient = body.patient || {};
    const name = (patient.name || body.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'Patient name is required' });
    }

    const chief = (body.chief_complaint || body.chiefComplaint || patient.chiefComplaint || '').trim();
    const hasFace = body.face_analysis || body.faceAnalysis;
    const hasReports = body.combined_reports || body.combinedReports;

    if (!chief.trim() && !hasFace && !hasReports) {
      return res.status(400).json({
        success: false,
        message: 'Enter clinical notes OR upload medical report / face photo.'
      });
    }

    const symptoms = [];
    if (chief) symptoms.push({ name: chief, severity: 'moderate' });
    (patient.symptoms || []).forEach((s) => {
      if (s) symptoms.push(typeof s === 'object' ? s : { name: String(s), severity: 'moderate' });
    });

    let reportValues = body.report_values || patient.report_values || {};
    if (typeof reportValues === 'string') {
      try {
        reportValues = JSON.parse(reportValues);
      } catch {
        reportValues = {};
      }
    }

    const reportParts = [
      body.blood_report,
      body.mri_report,
      body.sonography,
      hasReports?.raw_text,
      hasReports?.ocr_text
    ].filter(Boolean);

    let affectedOrgans = body.affected_organs || patient.affected_organs || [];
    if (typeof affectedOrgans === 'string') {
      try {
        affectedOrgans = JSON.parse(affectedOrgans);
      } catch {
        affectedOrgans = [];
      }
    }

    const caseInput = {
      patient_name: name,
      age: patient.age ?? body.age ?? 30,
      gender: patient.gender || body.gender || 'Male',
      weight: patient.weight ?? body.weight,
      mobile: patient.mobile || body.mobile,
      chief_complaint: chief,
      symptoms,
      symptoms_text: chief,
      bp_systolic: patient.bp_systolic ?? patient.bpSystolic ?? body.bp_systolic,
      bp_diastolic: patient.bp_diastolic ?? patient.bpDiastolic ?? body.bp_diastolic,
      pulse: patient.pulse ?? body.pulse,
      duration_days: body.duration_days ?? body.durationDays ?? body.duration ?? 7,
      phase: body.phase || 'ACUTE',
      temperament: body.temperament || hasFace?.temperament || hasFace?.vitiation || null,
      polarity_hint: hasFace?.polarity,
      affected_organs: Array.isArray(affectedOrgans) ? affectedOrgans : [],
      report_values: reportValues,
      report_text: reportParts.join('\n\n'),
      blood_report: body.blood_report || '',
      mri_report: body.mri_report || '',
      sonography: body.sonography || ''
    };

    if (body.face_image_base64 || body.faceImageBase64) {
      caseInput.face_image_base64 = body.face_image_base64 || body.faceImageBase64;
    }

    try {
      const expert = await callExpertAnalyze(caseInput);
      if (expert.status !== 'success' && expert.ok === false && !expert.clinical_analysis) {
        throw new Error(expert.detail || expert.message || 'EH API (9 Rule Engines) failed');
      }

      const data = mapEhApiV3PrescribeToApp(expert, {
        name,
        ...caseInput,
        faceAnalysis: body.face_analysis || body.faceAnalysis,
        combinedReports:
          body.combined_reports ||
          body.combinedReports ||
          (reportParts.length
            ? {
                raw_text: reportParts.join('\n\n'),
                found_values: Object.entries(reportValues).map(([k, v]) => ({ test_key: k, value: v }))
              }
            : null)
      });

      return res.json({
        success: true,
        data,
        eh_engine_online: true,
        pipeline: 'eh-api-9engine-prescribe'
      });
    } catch (err) {
      return res.status(err.statusCode || 502).json(ehApiUnavailable(err));
    }
  })
);

/**
 * POST /api/search/save-prescription — persist analysis + summary (PostgreSQL)
 */
router.post(
  '/save-prescription',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const caseData = body.caseData || body.data;
    if (!caseData || typeof caseData !== 'object') {
      return res.status(400).json({ success: false, message: 'caseData is required' });
    }
    const patientId = body.patientId || body.patient_id || caseData.patientId;
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId required — patient register karein, phir New Case → Search se aayein'
      });
    }
    if (!isDbReady()) {
      return res.status(503).json({
        success: false,
        message: 'PostgreSQL not ready — DATABASE_URL + npm run db:setup'
      });
    }

    const { PrescriptionPg, PatientPg } = getPostgresModels();
    const patient = await PatientPg.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const row = buildPrescriptionFromSearch(caseData, {
      patientId,
      doctorId: req.user?.id || req.user?._id
    });

    if (body.eh_analysis) {
      const eh = body.eh_analysis;
      row.eh_prakriti = eh.prakriti?.prakriti || null;
      row.eh_polarity = eh.polarity?.polarity || null;
      row.eh_potency = eh.potency?.potency || null;
      row.eh_formula_a = JSON.stringify(eh.mixtures?.[0] || {});
      row.eh_formula_b = JSON.stringify(eh.mixtures?.[1] || {});
      row.eh_systems = JSON.stringify(eh.active_systems || []);
      row.eh_safety = eh.safety?.overall_status || 'UNKNOWN';
      row.eh_parcha = eh.parcha || null;
      row.eh_engine_used = true;
    }

    const prescription = await PrescriptionPg.create(row);
    const plain = prescription.get({ plain: true });

    res.status(201).json({
      success: true,
      message: 'Prescription saved',
      data: {
        id: String(plain.id),
        patientId: String(plain.patient_id),
        createdAt: plain.created_at
      }
    });
  })
);

/** GET /api/search/symptoms — PostgreSQL FTS autocomplete */
router.get(
  '/symptoms',
  asyncHandler(async (req, res) => {
    if (!isDbReady()) {
      return res.json({ success: true, data: [] });
    }
    const q = req.query.query || '';
    if (q) {
      const data = await searchSymptoms(q);
      return res.json({ success: true, data });
    }
    const { SymptomPg } = getPostgresModels();
    const rows = await SymptomPg.findAll({
      attributes: ['name', 'name_hi'],
      order: [['name', 'ASC']],
      limit: 100
    });
    res.json({ success: true, data: rows });
  })
);

/** GET /api/search/medicines — PostgreSQL FTS */
router.get(
  '/medicines',
  asyncHandler(async (req, res) => {
    const q = req.query.query || '';
    const data = await searchMedicines(q);
    res.json({ success: true, data });
  })
);

/** GET /api/search/health — EH Python API only */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const axios = require('axios');
    let expert_ok = false;
    let detail = {};
    try {
      const { data } = await axios.get(`${EXPERT_BASE}/api/health`, { timeout: 5000 });
      expert_ok = !!data?.status;
      detail = data;
    } catch {
      expert_ok = false;
    }
    res.json({
      success: true,
      data: {
        expert_ok,
        expert_url: EXPERT_BASE,
        pipeline: 'eh-api-14k-diseases-9-rule-engines',
        label: expert_ok
          ? 'EH API ✓ · 14k diseases + 9 Rule Engines'
          : 'Start Python EH API — npm run dev (port 8005)'
      },
      detail
    });
  })
);

module.exports = router;
