const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { requireReportsDb } = require('../middleware/requireDb');
const { asyncHandler } = require('../utils/asyncHandler');
const { getPostgresModels, isDbReady } = require('../utils/dataSource');
const { analyzeReport, loadBloodCatalog } = require('../services/reportAnalyzer');
const { parseReport } = require('../services/reportParser');
const { combineAllReports } = require('../services/reportCombiner');
const branding = require('../config/branding');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../../uploads/reports');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get(
  '/blood-catalog',
  requireReportsDb,
  asyncHandler(async (_req, res) => {
    const catalog = await loadBloodCatalog();
    res.json({ success: true, data: catalog });
  })
);

router.get(
  '/blood-test-values',
  requireReportsDb,
  asyncHandler(async (_req, res) => {
    const catalog = await loadBloodCatalog();
    res.json({ success: true, data: catalog });
  })
);

router.post(
  '/combine',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const combined = combineAllReports(
      body.blood || body.bloodReport,
      body.ct || body.scan || body.scanReport,
      body.sonography || body.sono,
      body.xray || body.xrayReport
    );
    res.json({ success: true, data: combined });
  })
);

router.post(
  '/upload-parse',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const reportType = req.body.reportType || req.body.report_type || 'other';
    let parsed;
    try {
      parsed = await parseReport(req.file.path, reportType, req.file.mimetype);
    } catch (e) {
      return res.status(422).json({ success: false, message: e.message || 'Parse failed' });
    }

    const relUrl = `/uploads/reports/${req.file.filename}`;
    let reportId = null;
    if (isDbReady()) {
      try {
        const { ReportPg } = getPostgresModels();
        const rawPatient = req.body.patientId;
        const patientId =
          rawPatient && String(rawPatient).trim() ? String(rawPatient).trim() : undefined;
        const report = await ReportPg.create({
          patient_id: patientId || null,
          file_url: relUrl,
          analysis: null,
          report_type: reportType,
          analysis_json: parsed
        });
        reportId = String(report.id);
      } catch {
        /* optional save */
      }
    }

    res.json({
      success: true,
      message: 'Report parsed',
      reportId,
      fileUrl: relUrl,
      reportType,
      data: parsed
    });
  })
);

router.post(
  '/analyze',
  requireReportsDb,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const analysis = await analyzeReport({
      bloodValues: body.bloodValues || body.blood_values,
      imagingText: body.imagingText || body.imaging_text,
      rawText: body.rawText || body.raw_text,
      reportType: body.reportType || body.report_type || 'combined'
    });
    res.json({ success: true, data: analysis });
  })
);

router.post(
  '/upload',
  requireReportsDb,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const relUrl = `/uploads/reports/${req.file.filename}`;
    const rawPatient = req.body.patientId;
    const patientId =
      rawPatient && String(rawPatient).trim() ? String(rawPatient).trim() : undefined;

    const { ReportPg } = getPostgresModels();
    const report = await ReportPg.create({
      patient_id: patientId || null,
      file_url: relUrl,
      analysis: null,
      report_type: req.body.reportType || null
    });
    res.json({
      success: true,
      message: 'Report saved',
      reportId: String(report.id),
      fileUrl: relUrl
    });
  })
);

router.post(
  '/:id/analyze',
  requireReportsDb,
  asyncHandler(async (req, res) => {
    const { ReportPg } = getPostgresModels();
    const report = await ReportPg.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const body = req.body || {};
    const analysis = await analyzeReport({
      bloodValues: body.bloodValues || body.blood_values,
      imagingText: body.imagingText || body.imaging_text,
      rawText: body.rawText || body.raw_text,
      reportType: body.reportType || body.report_type || report.report_type || 'combined'
    });

    const summaryText = analysis.summary || 'Report analyzed.';
    await report.update({
      analysis: summaryText,
      analysis_json: analysis,
      report_type: analysis.reportType
    });

    res.json({
      success: true,
      reportId: String(report.id),
      data: analysis
    });
  })
);

router.get(
  '/:id/analysis',
  requireReportsDb,
  asyncHandler(async (req, res) => {
    const { ReportPg } = getPostgresModels();
    const report = await ReportPg.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    const u = report.get({ plain: true });
    res.json({
      success: true,
      reportId: String(u.id),
      analysis: u.analysis_json || u.analysis || 'Report on file. Run POST /api/reports/:id/analyze.',
      analysisText: u.analysis,
      reportType: u.report_type,
      fileUrl: u.file_url,
      clinic: {
        name: branding.clinicName,
        phone: branding.clinicPhone,
        footerLine: branding.clinicFooterLine()
      }
    });
  })
);

module.exports = router;
