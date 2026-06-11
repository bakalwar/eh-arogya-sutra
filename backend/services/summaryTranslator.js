const crypto = require('crypto');
const { getPostgresModels } = require('../db/sequelize');
const { isDbReady } = require('../utils/dataSource');

const PRIMARY_LIBRE_URL = (process.env.LIBRETRANSLATE_URL || 'http://127.0.0.1:5001').replace(
  /\/$/,
  ''
);
const PUBLIC_LIBRE_URL = (
  process.env.LIBRETRANSLATE_PUBLIC_URL || 'https://libretranslate.argosopentech.com'
).replace(/\/$/, '');
const LIBRE_API_KEY = process.env.LIBRETRANSLATE_API_KEY || '';

function getLibreBaseUrls() {
  const urls = [PRIMARY_LIBRE_URL];
  if (process.env.LIBRETRANSLATE_USE_PUBLIC === '1') {
    urls.push(PUBLIC_LIBRE_URL);
  } else if (
    PRIMARY_LIBRE_URL.includes('127.0.0.1') ||
    PRIMARY_LIBRE_URL.includes('localhost')
  ) {
    urls.push(PUBLIC_LIBRE_URL);
  }
  return [...new Set(urls)];
}

const LANGUAGE_CODES = Object.freeze({
  en: 'en',
  hi: 'hi',
  mr: 'mr',
  gu: 'gu',
  ta: 'ta',
  te: 'te',
  kn: 'kn',
  ur: 'ur',
  bn: 'bn',
  ar: 'ar'
});

const LANGUAGE_NAMES = Object.freeze({
  en: '🇬🇧 English',
  hi: '🇮🇳 हिंदी',
  mr: '🇮🇳 मराठी',
  gu: '🇮🇳 ગુજરાતી',
  ta: '🇮🇳 தமிழ்',
  te: '🇮🇳 తెలుగు',
  kn: '🇮🇳 ಕನ್ನಡ',
  ur: '🇵🇰 اردو',
  bn: '🇧🇩 বাংলা',
  ar: '🇸🇦 العربية'
});

const PRESCRIPTION_SUMMARY_FIELDS = Object.freeze({
  hi: 'summary_hi',
  mr: 'summary_mr',
  gu: 'summary_gu',
  ta: 'summary_ta',
  te: 'summary_te',
  kn: 'summary_kn',
  ur: 'summary_ur',
  bn: 'summary_bn',
  ar: 'summary_ar'
});

const memoryCache = new Map();

function textHash(text, lang) {
  return crypto.createHash('md5').update(`${text}|${lang}`).digest('hex');
}

function splitIntoChunks(text, maxLength = 1000) {
  const sentences = String(text).split(/(?<=[.!?])\s+/);
  const chunks = [];
  let currentChunk = '';
  sentences.forEach((sentence) => {
    const next = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    if (next.length < maxLength) {
      currentChunk = next;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  });
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks.length ? chunks : [String(text)];
}

async function postTranslate(baseUrl, chunk, target) {
  const payload = { q: chunk, source: 'en', target, format: 'text' };
  if (LIBRE_API_KEY) payload.api_key = LIBRE_API_KEY;

  const url = `${baseUrl}/translate`;
  const body = JSON.stringify(payload);

  if (typeof fetch === 'function') {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(45000)
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${errText.slice(0, 120)}`);
    }
    const data = await res.json();
    return data.translatedText || chunk;
  }

  const axios = require('axios');
  const { data } = await axios.post(url, payload, {
    timeout: 45000,
    headers: { 'Content-Type': 'application/json' }
  });
  return data.translatedText || chunk;
}

async function libreTranslateChunk(chunk, targetLang) {
  const target = LANGUAGE_CODES[targetLang] || targetLang;
  const bases = getLibreBaseUrls();
  let lastErr = null;

  for (const base of bases) {
    try {
      return await postTranslate(base, chunk, target);
    } catch (e) {
      lastErr = e;
      console.log(`[translate] ${base} failed:`, e.message);
    }
  }

  throw lastErr || new Error('LibreTranslate unavailable');
}

async function checkLibreTranslateHealth() {
  const bases = getLibreBaseUrls();
  for (const base of bases) {
    try {
      const url = `${base}/languages`;
      if (typeof fetch === 'function') {
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (res.ok) return { ok: true, url: base };
      }
    } catch {
      /* try next */
    }
  }
  return { ok: false, url: null, hint: 'Run: npm run libretranslate:install then npm run libretranslate:start' };
}

async function getCachedTranslation(text, lang) {
  const hash = textHash(text, lang);
  if (memoryCache.has(hash)) return memoryCache.get(hash);

  if (!isDbReady()) return null;
  try {
    const { TranslationCachePg } = getPostgresModels();
    const row = await TranslationCachePg.findOne({ where: { hash } });
    if (row?.translated_text) {
      memoryCache.set(hash, row.translated_text);
      return row.translated_text;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function saveCacheTranslation(original, lang, translated, prescriptionId = null) {
  const hash = textHash(original, lang);
  memoryCache.set(hash, translated);

  if (!isDbReady()) return;
  try {
    const { TranslationCachePg } = getPostgresModels();
    await TranslationCachePg.upsert(
      {
        hash,
        original_text: String(original).substring(0, 200),
        language: lang,
        translated_text: translated,
        prescription_id: prescriptionId || null
      },
      { conflictFields: ['hash'] }
    );
  } catch {
    /* ignore */
  }
}

async function getPrescriptionSummary(prescriptionId, lang) {
  if (!prescriptionId || !isDbReady()) return null;
  const field = PRESCRIPTION_SUMMARY_FIELDS[lang];
  if (!field) return null;
  try {
    const { PrescriptionPg } = getPostgresModels();
    const row = await PrescriptionPg.findByPk(prescriptionId, { attributes: ['summary_en', ...Object.values(PRESCRIPTION_SUMMARY_FIELDS)] });
    if (!row) return null;
    const plain = row.get({ plain: true });
    if (lang === 'en') return plain.summary_en || null;
    return plain[field] || null;
  } catch {
    return null;
  }
}

async function savePrescriptionSummary(prescriptionId, lang, text) {
  if (!prescriptionId || !isDbReady() || lang === 'en') return;
  const field = PRESCRIPTION_SUMMARY_FIELDS[lang];
  if (!field) return;
  try {
    const { PrescriptionPg } = getPostgresModels();
    await PrescriptionPg.update({ [field]: text }, { where: { id: prescriptionId } });
  } catch {
    /* ignore */
  }
}

async function translateSummary(text, targetLang, options = {}) {
  const lang = String(targetLang || 'en').toLowerCase();
  const source = String(text || '').trim();
  if (!source) return '';
  if (lang === 'en') return source;

  const { prescriptionId, preTranslatedHi } = options;
  if (lang === 'hi' && preTranslatedHi) {
    await saveCacheTranslation(source, lang, preTranslatedHi, prescriptionId);
    if (prescriptionId) await savePrescriptionSummary(prescriptionId, lang, preTranslatedHi);
    return preTranslatedHi;
  }

  const fromRx = await getPrescriptionSummary(prescriptionId, lang);
  if (fromRx) return fromRx;

  const cached = await getCachedTranslation(source, lang);
  if (cached) return cached;

  try {
    const chunks = splitIntoChunks(source, 1000);
    const translatedChunks = [];
    for (const chunk of chunks) {
      translatedChunks.push(await libreTranslateChunk(chunk, lang));
    }
    const fullTranslation = translatedChunks.join(' ');
    await saveCacheTranslation(source, lang, fullTranslation, prescriptionId);
    if (prescriptionId) await savePrescriptionSummary(prescriptionId, lang, fullTranslation);
    return fullTranslation;
  } catch (error) {
    console.log('[translate] LibreTranslate failed:', error.message);
    return source;
  }
}

async function translateAllLanguages(text, prescriptionId = null, options = {}) {
  const langs = Object.keys(LANGUAGE_CODES).filter((c) => c !== 'en');
  const results = {};
  for (const lang of langs) {
    try {
      results[lang] = await translateSummary(text, lang, {
        prescriptionId,
        preTranslatedHi: lang === 'hi' ? options.preTranslatedHi : undefined
      });
    } catch {
      results[lang] = text;
    }
  }
  return results;
}

module.exports = {
  PRIMARY_LIBRE_URL,
  PUBLIC_LIBRE_URL,
  LANGUAGE_CODES,
  LANGUAGE_NAMES,
  PRESCRIPTION_SUMMARY_FIELDS,
  textHash,
  splitIntoChunks,
  translateSummary,
  translateAllLanguages,
  getCachedTranslation,
  getPrescriptionSummary,
  savePrescriptionSummary,
  checkLibreTranslateHealth
};
