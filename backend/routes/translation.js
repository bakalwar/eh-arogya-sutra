const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  translateSummary,
  translateAllLanguages,
  getPrescriptionSummary,
  getCachedTranslation,
  checkLibreTranslateHealth,
  LANGUAGE_CODES,
  LANGUAGE_NAMES,
  PRIMARY_LIBRE_URL
} = require('../services/summaryTranslator');

const router = express.Router();

const backgroundJobs = new Map();

router.get('/health', asyncHandler(async (_req, res) => {
  const health = await checkLibreTranslateHealth();
  res.json({
    success: health.ok,
    data: {
      ...health,
      configured_url: PRIMARY_LIBRE_URL
    }
  });
}));

router.get('/languages', (_req, res) => {
  res.json({
    success: true,
    data: Object.entries(LANGUAGE_CODES).map(([code, value]) => ({
      code,
      value,
      name: LANGUAGE_NAMES[code]
    }))
  });
});

router.post(
  '/summary',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const summaryText = body.summary_text || body.summaryText || '';
    const targetLang = String(body.target_lang || body.targetLang || 'hi').toLowerCase();
    const prescriptionId = body.prescription_id || body.prescriptionId || null;
    const preTranslatedHi = body.summary_hi || body.summaryHi || null;

    if (!summaryText.trim()) {
      return res.status(400).json({ success: false, message: 'summary_text is required' });
    }
    if (!LANGUAGE_CODES[targetLang]) {
      return res.status(400).json({ success: false, message: 'Unsupported target_lang' });
    }

    const translated_text = await translateSummary(summaryText, targetLang, {
      prescriptionId,
      preTranslatedHi
    });

    res.json({
      success: true,
      data: {
        translated_text,
        target_lang: targetLang,
        language_name: LANGUAGE_NAMES[targetLang]
      }
    });
  })
);

router.post(
  '/all-languages',
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const summaryText = body.summary_text || body.summaryText || '';
    const prescriptionId = body.prescription_id || body.prescriptionId || null;
    const jobKey = prescriptionId || `job-${Date.now()}`;

    if (!summaryText.trim()) {
      return res.status(400).json({ success: false, message: 'summary_text is required' });
    }

    backgroundJobs.set(jobKey, { status: 'translating', ready: [], startedAt: Date.now() });

    setImmediate(async () => {
      try {
        const results = await translateAllLanguages(summaryText, prescriptionId, {
          preTranslatedHi: body.summary_hi || body.summaryHi
        });
        backgroundJobs.set(jobKey, {
          status: 'done',
          ready: Object.keys(results),
          results,
          finishedAt: Date.now()
        });
      } catch (e) {
        backgroundJobs.set(jobKey, { status: 'error', message: e.message });
      }
    });

    res.json({
      success: true,
      data: {
        status: 'translating',
        job_key: jobKey,
        languages: Object.keys(LANGUAGE_CODES).filter((c) => c !== 'en')
      }
    });
  })
);

router.get(
  '/job/:jobKey',
  asyncHandler(async (req, res) => {
    const job = backgroundJobs.get(req.params.jobKey);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, data: job });
  })
);

router.get(
  '/cached/:prescriptionId/:lang',
  asyncHandler(async (req, res) => {
    const lang = String(req.params.lang || 'en').toLowerCase();
    const prescriptionId = req.params.prescriptionId;

    if (!LANGUAGE_CODES[lang]) {
      return res.status(400).json({ success: false, message: 'Unsupported language' });
    }

    const fromRx = await getPrescriptionSummary(prescriptionId, lang);
    if (fromRx) {
      return res.json({ success: true, data: { text: fromRx, source: 'prescription' } });
    }

    const summaryText = req.query.summary_text || req.query.summaryText;
    if (summaryText) {
      const cached = await getCachedTranslation(summaryText, lang);
      if (cached) {
        return res.json({ success: true, data: { text: cached, source: 'cache' } });
      }
    }

    return res.status(404).json({ success: false, message: 'Translation not cached yet' });
  })
);

module.exports = router;
