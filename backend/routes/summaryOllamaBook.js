'use strict';

/**
 * Optional book + Ollama summary — SEPARATE from EH API 9 Rule Engine path.
 * Admin / book RAG only. Smart Search clinical summary does NOT use this.
 */
const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/requireAuth');
const axios = require('axios');
const { checkOllama, generateEHSummary } = require('../services/ollamaService');
const { generateOllamaSummary } = require('../services/ehOllamaCompleteSummary');
const { caseDataToSummaryInput } = require('../services/summaryCaseAdapter');
const { normalizeSummaryCaseData, hasSummaryPayload } = require('../utils/normalizeSummaryCaseData');
const { TARGET_WORDS } = require('../services/expertClinicalSummaryService');

const router = express.Router();

router.get(
  '/status',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const status = await checkOllama();
    res.json({
      success: true,
      data: {
        ...status,
        targetWords: TARGET_WORDS,
        pipeline: 'ollama-book-optional',
        note: 'Book/Ollama path — NOT used for Smart Search EH API summary'
      }
    });
  })
);

router.get('/health', async (_req, res) => {
  const url = (process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
  try {
    await axios.get(`${url}/api/tags`, { timeout: 5000 });
    res.json({ success: true, ollama: 'running', pipeline: 'ollama-book-optional' });
  } catch {
    res.json({ success: true, ollama: 'offline', pipeline: 'ollama-book-optional' });
  }
});

router.post(
  '/generate',
  requireAuth,
  asyncHandler(async (req, res) => {
    const caseData = normalizeSummaryCaseData(req.body);
    if (!hasSummaryPayload(caseData)) {
      return res.status(400).json({
        success: false,
        message: 'caseData required for book/Ollama summary'
      });
    }

    const useComplete =
      process.env.EH_USE_COMPLETE_ENGINE_PDF !== '0' && process.env.EH_SUMMARY_LEGACY_GENERATE !== '1';
    const result = useComplete
      ? await generateOllamaSummary(caseDataToSummaryInput(caseData))
      : await generateEHSummary(caseData);

    res.json({
      success: true,
      data: {
        summary: result.summary,
        model: result.model || 'ollama-book',
        wordCount: result.wordCount,
        source: result.source || 'ollama-book',
        pipeline: 'ollama-book-optional',
        language: 'hi'
      }
    });
  })
);

module.exports = router;
