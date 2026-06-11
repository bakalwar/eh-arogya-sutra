'use strict';

/**
 * Proxy to Python EH Expert Engine (FastAPI on EH_EXPERT_ENGINE_URL).
 * POST body = Python CaseInput (see eh-expert-engine/app/schemas.py).
 */
const express = require('express');
const axios = require('axios');
const multer = require('multer');
const { asyncHandler } = require('../utils/asyncHandler');
const { callExpertAnalyzeFace, callExpertOcrReport, callExpertAnalyzeComplete } = require('../services/ehExpertClient');
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

const { analyzeWithEHEngines } = require('../services/ehEngineService');

const router = express.Router();

const EXPERT_BASE = (process.env.EH_EXPERT_ENGINE_URL || 'http://127.0.0.1:8005').replace(/\/$/, '');
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

function mapEhApiToExpertUi(rawData) {
  const prakriti = rawData.prakriti?.prakriti || 'Mixed';
  return {
    ...rawData,
    temperament: prakriti,
    reasoning_trace: [
      `EH API v3 — ${prakriti} temperament`,
      `Polarity: ${rawData.polarity?.polarity || 'MIXED'}`,
      `Potency: ${rawData.potency?.potency || 'D10'}`,
      `Systems: ${(rawData.active_systems || []).join(', ') || 'GENERAL'}`
    ],
    potency: rawData.potency?.potency || 'D10',
    parcha: rawData.parcha || rawData.clinical_summary || '',
    clinical_summary: rawData.clinical_summary || rawData.parcha || '',
    pipeline: 'eh-api-9engine-v3'
  };
}

/**
 * POST /api/expert/analyze
 * Body: full CaseInput OR { case: CaseInput }
 * Routes to Python EH API /api/v3/prescribe (port 8005)
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

    const result = await analyzeWithEHEngines(patientData);
    if (!result.success) {
      const code = result.fallback ? 503 : 502;
      return res.status(code).json({
        success: false,
        message: result.error || 'EH API analyze failed',
        expert_url: EXPERT_BASE
      });
    }

    return res.json({ success: true, data: mapEhApiToExpertUi(result.data) });
  })
);

/**
 * POST /api/expert/summary
 * Body: { case: CaseInput, language?: "hi"|"en"|"both" }
 */
router.post(
  '/summary',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    if (!body.case) {
      return res.status(400).json({ success: false, message: 'case required' });
    }

    try {
      const payload = {
        case: body.case,
        language: body.language || 'hi'
      };
      const { data, status } = await axios.post(`${EXPERT_BASE}/v1/expert/summary`, payload, {
        timeout: Math.max(EXPERT_TIMEOUT_MS, 120000),
        headers: { 'Content-Type': 'application/json' },
        validateStatus: () => true
      });

      if (status >= 400) {
        return res.status(502).json({
          success: false,
          message: data?.detail || `Expert summary HTTP ${status}`,
          data
        });
      }

      return res.json({ success: data?.ok !== false, data });
    } catch (err) {
      const code = err.code || '';
      const msg =
        code === 'ECONNREFUSED' || code === 'ENOTFOUND'
          ? `EH Expert Engine band hai — npm run expert-engine (${EXPERT_BASE})`
          : err.message || 'Expert summary proxy error';
      return res.status(503).json({ success: false, message: msg });
    }
  })
);

/**
 * POST /api/expert/analyze-face — multipart image → MediaPipe face analysis
 */
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

/**
 * POST /api/expert/ocr-report — PDF/image → pathologies + labs + organs
 */
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

/**
 * POST /api/expert/analyze-complete — face + report + formula + 11-section summary (one shot)
 */
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

/**
 * GET /api/expert/health — pass-through to Python /health
 */
router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    try {
      const { data } = await axios.get(`${EXPERT_BASE}/health`, { timeout: 5000 });
      return res.json({ success: true, expert_url: EXPERT_BASE, upstream: data });
    } catch (err) {
      return res.status(503).json({
        success: false,
        message: err.code === 'ECONNREFUSED' ? 'Expert engine not running' : err.message,
        expert_url: EXPERT_BASE
      });
    }
  })
);

module.exports = router;
