'use strict';

/**
 * PostgreSQL FTS symptom/medicine lookup.
 * Report Analysis clinical output enforcement — output_mode=clinical_only for Python :8005.
 */
const { Op, Sequelize } = require('sequelize');
const { getPostgresModels } = require('../db/sequelize');
const { getCache, setCache } = require('./redisService');

/** Mandatory for Report Analysis → /api/v3/analyze-report (no prescription path). */
const CLINICAL_OUTPUT_MODE = 'clinical_only';
const SUMMARY_MIN_WORDS = 500;
const SUMMARY_MAX_WORDS = 650;

const PRESCRIPTION_MARKERS = /MIXTURE\s+[A-D]|CLINICAL\s+PRESCRIPTION|formula_[abcd]|prescription_id/i;

/**
 * Force clinical_only on every multipart payload to Python EH API.
 */
function enforceClinicalOutputMode(formData) {
  if (!formData || typeof formData.set !== 'function') {
    throw new Error('Invalid FormData — cannot enforce clinical_only output_mode');
  }
  formData.set('output_mode', CLINICAL_OUTPUT_MODE);
  return formData;
}

function countWords(text) {
  return String(text || '').split(/\s+/).filter(Boolean).length;
}

/**
 * Reject prescription-mode Python responses on the Report Analysis path.
 */
function assertClinicalPythonResponse(py) {
  if (!py || py.status === 'error') {
    throw new Error(py?.message || 'EH API clinical analysis failed');
  }
  if (py.mixtures?.length || py.prescription_id) {
    const err = new Error(
      'EH API returned prescription data — output_mode=clinical_only was not honored on :8005'
    );
    err.statusCode = 502;
    throw err;
  }
  const mode = String(py.output_mode || '').toLowerCase();
  if (mode && mode !== CLINICAL_OUTPUT_MODE && !py.clinical_report) {
    const err = new Error(
      `EH API output_mode="${py.output_mode}" — expected "${CLINICAL_OUTPUT_MODE}"`
    );
    err.statusCode = 502;
    throw err;
  }
  const impression = py.clinical_report?.overall_clinical_impression || '';
  if (impression && PRESCRIPTION_MARKERS.test(impression)) {
    const err = new Error('Clinical impression contains prescription content — blocked');
    err.statusCode = 502;
    throw err;
  }
  const wc = countWords(impression);
  if (impression && wc < SUMMARY_MIN_WORDS) {
    console.warn(`[clinical-analysis] impression ${wc} words — target ${SUMMARY_MIN_WORDS}-${SUMMARY_MAX_WORDS}`);
  }
  return py;
}

/**
 * Smart Search Engine using PostgreSQL Full-Text Search (FTS)
 */
async function searchSymptoms(query) {
  const { SymptomPg } = getPostgresModels();
  if (!query) return [];

  // 0. Check Redis Cache
  const cacheKey = `search:symptoms:${query.toLowerCase()}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  // 1. PostgreSQL Full-Text Search (FTS)
  const ftsResults = await SymptomPg.findAll({
    where: Sequelize.literal(`search_document @@ plainto_tsquery('english', '${query}')`),
    order: [
      [Sequelize.literal(`ts_rank(search_document, plainto_tsquery('english', '${query}'))`), 'DESC']
    ],
    limit: 20
  });

  // 2. Fallback to Trigram / ILIKE if FTS yields few results
  if (ftsResults.length < 5) {
    const trigramResults = await SymptomPg.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { name_hi: { [Op.iLike]: `%${query}%` } }
        ]
      },
      limit: 20
    });
    
    // Merge and unique
    const seenIds = new Set(ftsResults.map(r => r.id));
    trigramResults.forEach(r => {
      if (!seenIds.has(r.id)) ftsResults.push(r);
    });
  }

  const results = ftsResults.map(r => r.get({ plain: true }));
  
  // Save to Redis Cache (TTL: 1 hour)
  await setCache(cacheKey, results, 3600);

  return results;
}

async function searchMedicines(query) {
  const { MedicinePg } = getPostgresModels();
  if (!query) return [];

  // 0. Check Redis Cache
  const cacheKey = `search:medicines:${query.toLowerCase()}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  // 1. PostgreSQL Full-Text Search (FTS)
  const ftsResults = await MedicinePg.findAll({
    where: Sequelize.literal(`search_document @@ plainto_tsquery('english', '${query}')`),
    order: [
      [Sequelize.literal(`ts_rank(search_document, plainto_tsquery('english', '${query}'))`), 'DESC']
    ],
    limit: 20
  });

  // 2. Fallback to Trigram / ILIKE
  if (ftsResults.length < 5) {
    const trigramResults = await MedicinePg.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { indications: { [Op.iLike]: `%${query}%` } },
          { medicine_group: { [Op.iLike]: `%${query}%` } }
        ]
      },
      limit: 20
    });
    
    const seenIds = new Set(ftsResults.map(r => r.id));
    trigramResults.forEach(r => {
      if (!seenIds.has(r.id)) ftsResults.push(r);
    });
  }

  const results = ftsResults.map(r => r.get({ plain: true }));
  
  // Save to Redis Cache (TTL: 1 hour)
  await setCache(cacheKey, results, 3600);

  return results;
}

module.exports = {
  searchSymptoms,
  searchMedicines,
  CLINICAL_OUTPUT_MODE,
  SUMMARY_MIN_WORDS,
  SUMMARY_MAX_WORDS,
  enforceClinicalOutputMode,
  assertClinicalPythonResponse,
  countWords,
};
