'use strict';

const express = require('express');
const multer = require('multer');
const { asyncHandler } = require('../utils/asyncHandler');
const { callExpertAnalyze, callExpertAnalyzeComplete } = require('../services/ehExpertClient');
const { buildExpertCompleteFormData } = require('../utils/buildExpertCompleteFormData');
const { mapCompleteAnalyzeToApp, mapExpertToApp, mapEhApiV3PrescribeToApp } = require('../services/pdfExpertMapper');
const { enrichCaseWithSourceOfTruth, buildClinicalData } = require('../services/ehSourceOfTruthClinical');
const { requireAuth } = require('../middleware/requireAuth');
const { isDbReady, getPostgresModels } = require('../utils/dataSource');
const { buildPrescriptionFromSearch } = require('../utils/buildPrescriptionFromSearch');
const { searchSymptoms, searchMedicines } = require('../services/searchEngine');

const uploadComplete = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 }
}).fields([
  { name: 'face_image', maxCount: 1 },
  { name: 'report_file', maxCount: 1 }
]);

const router = express.Router();

/** Node rule engine v4 — no Python required (EH_AI_Expert_System.pdf) */
function buildNodeExpertFromCaseInput(caseInput) {
  const cd = buildClinicalData(caseInput);
  const elec = String(cd.electricity?.elec || cd.elecCode || 'B.E.')
    .replace(/\s*\(.*\)/, '')
    .trim();
  return {
    ok: true,
    formulas: cd.formulas,
    potency: cd.polData.potency,
    electricity: elec,
    phase: caseInput.phase || 'ACUTE',
    overall_polarity: cd.polData.polarity,
    temperament: String(cd.temperament || 'Mixed').toLowerCase(),
    confidence: Math.min(70 + (cd.labFindings?.length || 0) * 4, 95),
    reasoning_trace: ['EH Rule Engine v4 — doctor vitals/symptoms/labs (Node)'],
    eh_clinical: cd
  };
}

function useNodeEngineOnly() {
  return process.env.EH_NODE_SINGLE_ENGINE === '1';
}

/** Default OFF — only EH API (eh_api.py + 9 engines). Set EH_EXPERT_FALLBACK_NODE=1 to enable Node rule engine. */
function allowNodeExpertFallback() {
  return process.env.EH_EXPERT_FALLBACK_NODE === '1';
}

function parseJsonField(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Multipart / JSON body → engine caseInput (doctor form fields) */
function caseInputFromAnalyzeBody(b = {}, req = {}) {
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

/**
 * POST /api/search/analyze-complete — PDF §7: face + report + dynamic formula + summary
 */
router.post(
  '/analyze-complete',
  uploadComplete,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const name = (b.patient_name || b.patientName || b.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: 'patient_name is required' });
    }
    const chief = (b.chief_complaint || b.chiefComplaint || '').trim();
    const hasFace = req.files?.face_image?.[0];
    const hasReport = req.files?.report_file?.[0];
    if (!chief && !hasFace && !hasReport) {
      return res.status(400).json({
        success: false,
        message: 'chief_complaint, face_image, or report_file required'
      });
    }

    const fd = buildExpertCompleteFormData(req);
    const caseInput = caseInputFromAnalyzeBody(b, req);
    let mapped;
    if (useNodeEngineOnly()) {
      const expert = buildNodeExpertFromCaseInput(caseInput);
      let data = mapExpertToApp(expert, { name, ...caseInput });
      data = enrichCaseWithSourceOfTruth(data);
      return res.json({ success: true, data, pipeline: 'node-rule-engine-v4' });
    }
    try {
      // Text-only → 9 Rule Engines prescribe (same summary source as last session)
      if (!hasFace && !hasReport) {
        const py = await callExpertAnalyze(caseInput);
        if (py.status !== 'success' && py.ok === false) {
          throw new Error(py.detail || py.message || 'EH API prescribe failed');
        }
        let data = mapEhApiV3PrescribeToApp(py, { name, ...caseInput });
        return res.json({
          success: true,
          data,
          pipeline: 'eh-api-9engine-prescribe',
          eh_engine_online: true
        });
      }
      const py = await callExpertAnalyzeComplete(fd);
      mapped = mapCompleteAnalyzeToApp(py);
    } catch (err) {
      if (!allowNodeExpertFallback()) {
        return res.status(err.statusCode || 502).json({
          success: false,
          message: err.message || 'EH Expert engine unavailable'
        });
      }
      console.warn('[search] analyze-complete Python failed — Node fallback:', err.message);
      const caseInput = caseInputFromAnalyzeBody(b, req);
      const expert = buildNodeExpertFromCaseInput(caseInput);
      let data = mapExpertToApp(expert, { name, ...caseInput });
      data = enrichCaseWithSourceOfTruth(data);
      return res.json({
        success: true,
        data,
        pipeline: 'node-fallback',
        warning: 'Python expert offline — Node rule engine used'
      });
    }
    if (!mapped.success) {
      if (allowNodeExpertFallback()) {
        const caseInputFb = caseInputFromAnalyzeBody(b, req);
        const expert = buildNodeExpertFromCaseInput(caseInputFb);
        let data = mapExpertToApp(expert, { name, ...caseInputFb });
        data = enrichCaseWithSourceOfTruth(data);
        return res.json({
          success: true,
          data,
          pipeline: 'node-fallback',
          warning: mapped.message || 'Expert returned error — Node rule engine used'
        });
      }
      return res.status(502).json(mapped);
    }
    const pipeline = mapped.pipeline || 'eh-api-9engine-analyze-report';
    if (!String(pipeline).startsWith('eh-api-')) {
      mapped.data = enrichCaseWithSourceOfTruth(mapped.data);
    }
    res.json({
      success: true,
      data: mapped.data,
      pipeline,
      eh_engine_online: true
    });
  })
);

/**
 * POST /api/search/analyze — JSON intake (notes / vitals); optional summary via Python complete form
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
      temperament:
        body.temperament || hasFace?.temperament || hasFace?.vitiation || null,
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

    let expert;
    if (useNodeEngineOnly()) {
      expert = buildNodeExpertFromCaseInput(caseInput);
    } else {
      try {
        expert = await callExpertAnalyze(caseInput);
      } catch (err) {
        if (!allowNodeExpertFallback()) {
          return res.status(err.statusCode || 502).json({
            success: false,
            message: err.message || 'EH Expert engine unavailable — npm run expert-engine'
          });
        }
        console.warn('[search] analyze Python failed — Node fallback:', err.message);
        expert = buildNodeExpertFromCaseInput(caseInput);
      }
    }

    const isEhApi =
      expert.status === 'success' || expert.ok || expert.clinical_analysis;
    if (!isEhApi && !useNodeEngineOnly()) {
      return res.status(502).json({
        success: false,
        message:
          expert.detail ||
          expert.message ||
          'EH API (9 Rule Engines) failed — npm run expert-engine chalayein'
      });
    }

    const data = isEhApi
      ? mapEhApiV3PrescribeToApp(expert, {
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
        })
      : enrichCaseWithSourceOfTruth(
          mapExpertToApp(expert, {
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
          })
        );

    res.json({
      success: true,
      data,
      eh_engine_online: isEhApi,
      pipeline: isEhApi ? 'eh-api-9engine-prescribe' : 'node-rule-engine-v4'
    });
  })
);

/**
 * POST /api/search/save-prescription — persist PDF analysis + summary (PostgreSQL)
 * Body: { caseData, patientId? }
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

    // EH Engine data add karo agar body mein hai
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

/** GET /api/search/symptoms — list all symptoms for autocomplete */
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

/** GET /api/search/medicines — smart medicine search */
router.get(
  '/medicines',
  asyncHandler(async (req, res) => {
    const q = req.query.query || '';
    const data = await searchMedicines(q);
    res.json({ success: true, data });
  })
);

/** GET /api/search/health — Expert + Ollama stack */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const axios = require('axios');
    const EXPERT_BASE = (process.env.EH_EXPERT_ENGINE_URL || 'http://127.0.0.1:8005').replace(
      /\/$/,
      ''
    );
    let expert_ok = false;
    let detail = {};
    try {
      const { data } = await axios.get(`${EXPERT_BASE}/api/health`, { timeout: 5000 });
      expert_ok = !!data?.status;
      detail = data;
    } catch {
      expert_ok = false;
    }
    let ollama = 'offline';
    try {
      const { checkOllama } = require('../services/ollamaService');
      const st = await checkOllama();
      ollama = st.running ? 'running' : 'offline';
    } catch {
      /* ignore */
    }
    res.json({
      success: true,
      data: {
        expert_ok,
        expert_url: EXPERT_BASE,
        ollama,
        blueprint: 'EH_AI_Expert_Complete_Cursor.pdf',
        label: expert_ok
          ? 'EH Expert PDF pipeline ready'
          : 'Start: npm run expert-engine (port 8005)'
      },
      detail
    });
  })
);

module.exports = router;
