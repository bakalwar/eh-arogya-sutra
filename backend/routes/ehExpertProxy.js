'use strict';

/**
 * Proxy to eh_api.py (9 Rule Engines + summary_engine.py) on EH_API_URL / port 8005.
 */
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  callExpertAnalyzeFace,
  callExpertOcrReport,
  callExpertAnalyzeComplete,
  EXPERT_BASE
} = require('../services/ehExpertClient');
const { analyzeWithEHEngines, summaryWithEHEngines } = require('../services/ehEngineService');
const { mapEhApiV3PrescribeToApp } = require('../services/pdfExpertMapper');
const { buildExpertCompleteFormData } = require('../utils/buildExpertCompleteFormData');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 }
});

const uploadComplete = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 }
}).fields([
  { name: 'face_image', maxCount: 1 },
  { name: 'report_file', maxCount: 1 }
]);

const router = express.Router();
const EXPERT_TIMEOUT_MS = Number(process.env.EH_EXPERT_TIMEOUT_MS) || 90000;

function caseInputToPatientData(caseInput) {
  const c = caseInput || {};
  const symptoms =
    c.symptoms_text ||
    c.chief_complaint ||
    c.chiefComplaint ||
    (Array.isArray(c.symptoms) ? c.symptoms.map((s) => (typeof s === 'object' ? s.name : s)).join(', ') : '') ||
    '';
  return {
    name: c.patient_name || c.name || 'Patient',
    age: c.age,
    gender: c.gender || 'Male',
    bp_systolic: c.bp_systolic ?? c.bpSystolic,
    bp_diastolic: c.bp_diastolic ?? c.bpDiastolic,
    symptoms,
    nature: c.nature || c.condition || c.phase?.toLowerCase?.() || 'chronic'
  };
}

function caseInputToCaseData(caseInput) {
  const c = caseInput || {};
  const symptoms =
    c.symptoms_text ||
    c.chief_complaint ||
    c.chiefComplaint ||
    (Array.isArray(c.symptoms) ? c.symptoms.map((s) => (typeof s === 'object' ? s.name : s)).join(', ') : '') ||
    '';
  return {
    patient: {
      name: c.patient_name || c.name || 'Patient',
      age: c.age ?? 30,
      gender: c.gender || 'Male',
      chiefComplaint: symptoms,
      bp_systolic: c.bp_systolic ?? c.bpSystolic,
      bp_diastolic: c.bp_diastolic ?? c.bpDiastolic
    },
    analysis: {
      chief_complaint: symptoms,
      phase: c.phase || c.condition || 'chronic'
    },
    chief_complaint: symptoms
  };
}

/**
 * POST /api/expert/analyze → eh_api.py /api/v3/prescribe (9 Rule Engines)
 */
router.post(
  '/analyze',
  asyncHandler(async (req, res) => {
    const caseInput = req.body?.case ?? req.body;
    if (!caseInput || typeof caseInput !== 'object') {
      return res.status(400).json({ success: false, message: 'case object required' });
    }

    const patientData = caseInputToPatientData(caseInput);
    if (!String(patientData.symptoms || '').trim()) {
      return res.status(400).json({ success: false, message: 'symptoms or chief_complaint required' });
    }

    try {
      const result = await analyzeWithEHEngines(patientData);
      return res.json({ success: true, data: result.data, pipeline: 'eh-api-9engine-v3' });
    } catch (err) {
      return res.status(err.statusCode || 502).json({
        success: false,
        message: err.message || 'EH API analyze failed',
        expert_url: EXPERT_BASE
      });
    }
  })
);

/**
 * POST /api/expert/summary → eh_api.py /api/summary/eh-api
 */
router.post(
  '/summary',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const caseInput = body.case || body.caseData || body;
    if (!caseInput || typeof caseInput !== 'object') {
      return res.status(400).json({ success: false, message: 'case or caseData required' });
    }

    try {
      const caseData = body.caseData ? caseInput : caseInputToCaseData(caseInput);
      const result = await summaryWithEHEngines(caseData);
      const mapped = mapEhApiV3PrescribeToApp(
        {
          status: 'success',
          clinical_summary: result.data.clinical_summary,
          clinical_analysis: {
            prakriti: result.data.prakriti?.prakriti,
            polarity: result.data.polarity?.polarity,
            potency: result.data.potency?.potency,
            active_systems: result.data.active_systems
          },
          mixtures: result.data.mixtures,
          engine_result: result.data.engine_result
        },
        caseData.patient || {}
      );
      return res.json({
        success: true,
        data: {
          ...result.data,
          summary: mapped.summary || result.data.clinical_summary,
          pipeline: 'eh-api-14k-diseases-9-rule-engines'
        }
      });
    } catch (err) {
      return res.status(err.statusCode || 502).json({
        success: false,
        message: err.message || 'EH API summary failed',
        expert_url: `${EXPERT_BASE}/api/summary/eh-api`
      });
    }
  })
);

router.post(
  '/analyze-face',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file?.buffer?.length) {
      return res.status(400).json({ success: false, message: 'image file required (field: file)' });
    }
    try {
      const data = await callExpertAnalyzeFace(req.file.buffer, req.file.originalname || 'face.jpg');
      return res.json({ success: data?.ok !== false, data });
    } catch (err) {
      const code = err.statusCode || (err.code === 'ECONNREFUSED' ? 503 : 502);
      return res.status(code).json({
        success: false,
        message: err.message || 'Face analysis failed',
        expert_url: EXPERT_BASE
      });
    }
  })
);

router.post(
  '/ocr-report',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file?.buffer?.length) {
      return res.status(400).json({ success: false, message: 'file required (field: file)' });
    }
    const name = (req.file.originalname || '').toLowerCase();
    let fileType = (req.body.file_type || req.body.fileType || '').toLowerCase();
    if (!fileType) fileType = name.endsWith('.pdf') ? 'pdf' : 'image';
    try {
      const data = await callExpertOcrReport(req.file.buffer, fileType, req.file.originalname || 'report');
      return res.json({ success: data?.ok !== false, data });
    } catch (err) {
      const code = err.statusCode || (err.code === 'ECONNREFUSED' ? 503 : 502);
      return res.status(code).json({
        success: false,
        message: err.message || 'OCR report failed',
        expert_url: EXPERT_BASE
      });
    }
  })
);

router.post(
  '/analyze-complete',
  uploadComplete,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const hasFace = req.files?.face_image?.[0];
    const hasReport = req.files?.report_file?.[0];
    const chief = (b.chief_complaint || b.chiefComplaint || '').trim();
    if (!chief && !hasFace && !hasReport) {
      return res.status(400).json({
        success: false,
        message: 'chief_complaint, face_image, or report_file required'
      });
    }
    try {
      const fd = buildExpertCompleteFormData(req);
      const data = await callExpertAnalyzeComplete(fd);
      return res.json({ success: data?.success !== false, data });
    } catch (err) {
      const code = err.statusCode || (err.code === 'ECONNREFUSED' ? 503 : 502);
      return res.status(code).json({
        success: false,
        message: err.message || 'Complete analyze failed',
        expert_url: EXPERT_BASE
      });
    }
  })
);

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    try {
      const { data } = await axios.get(`${EXPERT_BASE}/health`, { timeout: 5000 });
      return res.json({
        success: true,
        expert_url: EXPERT_BASE,
        summary_route: `${EXPERT_BASE}/api/summary/eh-api`,
        upstream: data
      });
    } catch (err) {
      return res.status(503).json({
        success: false,
        message: err.code === 'ECONNREFUSED' ? 'EH API not running — npm run expert-engine' : err.message,
        expert_url: EXPERT_BASE
      });
    }
  })
);

module.exports = router;
