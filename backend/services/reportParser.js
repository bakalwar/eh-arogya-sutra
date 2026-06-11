const fs = require('fs');
const path = require('path');
const { extractPdfText } = require('./pdfExtractService');
const { callExpertOcrReport } = require('./ehExpertClient');
const { mergeExpertOcrIntoParsed } = require('./expertOcrMerge');
const {
  analyzeBloodReport,
  analyzeImagingText,
  extractBloodValuesFromText,
  analyzeReport
} = require('./reportAnalyzer');

const SONO_KEYWORDS = [
  { word: 'fatty liver', polarity: 'POSITIVE', severity: 'moderate' },
  { word: 'hepatomegaly', polarity: 'POSITIVE', severity: 'moderate' },
  { word: 'splenomegaly', polarity: 'POSITIVE', severity: 'moderate' },
  { word: 'hydronephrosis', polarity: 'POSITIVE', severity: 'moderate' },
  { word: 'ascites', polarity: 'POSITIVE', severity: 'severe' },
  { word: 'cholelithiasis', polarity: 'POSITIVE', severity: 'moderate' },
  { word: 'fibroid', polarity: 'POSITIVE', severity: 'moderate' },
  { word: 'calculi', polarity: 'POSITIVE', severity: 'moderate' },
  { word: 'gall stone', polarity: 'POSITIVE', severity: 'moderate' },
  { word: 'kidney stone', polarity: 'POSITIVE', severity: 'moderate' }
];

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function severityFromRatio(ratio) {
  if (ratio > 2) return 'severe';
  if (ratio > 1.5) return 'moderate';
  return 'mild';
}

function markerToProblem(m) {
  if (m.status === 'normal' || m.status === 'missing') return null;
  const dir = m.status === 'high' ? 'HIGH' : 'LOW';
  return {
    name: `${m.label} ${dir}`,
    name_hi: m.label,
    source: 'blood_report',
    polarity: (m.rogPolarity || 'positive').toUpperCase(),
    vitiation: m.vitiation || (m.status === 'high' ? 'SANGUINE' : 'SANGUINE'),
    severity: m.severity || 'moderate',
    direction: m.status === 'high' ? 'HIGH ⬆️' : 'LOW ⬇️',
    value: m.value,
    meaning: m.meaning || m.explanation
  };
}

function bloodAnalysisToFormat(bloodAnalysis) {
  const found_values = (bloodAnalysis.markers || []).map((m) => ({
    test_name: m.label,
    test_name_hi: m.label,
    value: m.value,
    unit: m.unit,
    min_normal: m.min_normal,
    max_normal: m.max_normal,
    status: m.status === 'normal' ? 'NORMAL' : 'ABNORMAL',
    direction:
      m.status === 'high' ? 'HIGH ⬆️' : m.status === 'low' ? 'LOW ⬇️' : 'NORMAL ✅',
    polarity: (m.rogPolarity || 'NEUTRAL').toUpperCase(),
    vitiation: m.vitiation || 'NONE',
    meaning: m.explanation || m.meaning,
    medicine_hint: m.medicine_hint || null,
    severity: m.severity || (m.status === 'normal' ? 'none' : 'moderate')
  }));

  const problems = found_values.map((_, i) => markerToProblem(bloodAnalysis.markers[i])).filter(Boolean);

  return {
    report_type: 'blood',
    found_values,
    problems,
    positive_count: bloodAnalysis.positiveCount || 0,
    negative_count: bloodAnalysis.negativeCount || 0,
    overall_polarity: (bloodAnalysis.rogPolarity || 'MIXED').toUpperCase(),
    overall_vitiation: bloodAnalysis.dominant_system || 'MIXED',
    medicine_hints: bloodAnalysis.medicine_hints || [],
    confidence: found_values.length ? Math.min(90, 50 + found_values.length * 5) : 35
  };
}

function imagingKeywordsToProblems(imaging, reportType) {
  const problems = [];
  (imaging.positiveKeywords || []).forEach((kw) => {
    problems.push({
      name: kw,
      name_hi: kw,
      source: `${reportType}_report`,
      polarity: 'POSITIVE',
      vitiation: 'SANGUINE',
      severity: 'moderate',
      direction: 'POSITIVE ⬆️',
      meaning: `${kw} — Positive Rog ka sanket`
    });
  });
  (imaging.negativeKeywords || []).forEach((kw) => {
    problems.push({
      name: kw,
      name_hi: kw,
      source: `${reportType}_report`,
      polarity: 'NEGATIVE',
      vitiation: 'LYMPHATIC',
      severity: 'moderate',
      direction: 'NEGATIVE ⬇️',
      meaning: `${kw} — Negative Rog ka sanket`
    });
  });
  return problems;
}

function parseSonographyExtra(text) {
  const lower = text.toLowerCase();
  const extra = [];
  for (const item of SONO_KEYWORDS) {
    if (lower.includes(item.word)) {
      extra.push({
        name: item.word,
        source: 'sonography_report',
        polarity: item.polarity,
        vitiation: 'LYMPHATIC',
        severity: item.severity,
        meaning: `Sonography: ${item.word}`
      });
    }
  }
  return extra;
}

function imagingToFormat(imaging, reportType) {
  const problems = imagingKeywordsToProblems(imaging, reportType);
  return {
    report_type: reportType,
    problems,
    body_parts_affected: [],
    positive_count: imaging.positiveCount || problems.filter((p) => p.polarity === 'POSITIVE').length,
    negative_count: imaging.negativeCount || problems.filter((p) => p.polarity === 'NEGATIVE').length,
    overall_polarity: (imaging.rogPolarity || 'MIXED').toUpperCase(),
    overall_vitiation: 'MIXED',
    medicine_hints: [],
    confidence: problems.length ? 75 : 40
  };
}

async function extractTextFromFile(filePath, mimetype) {
  const ext = path.extname(filePath).toLowerCase().replace('.', '');
  if (ext === 'pdf' || mimetype === 'application/pdf') {
    const buffer = fs.readFileSync(filePath);
    const { text } = await extractPdfText(buffer);
    return text || '';
  }
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) {
    try {
      const Tesseract = require('tesseract.js');
      const result = await Tesseract.recognize(filePath, 'eng+hin', { logger: () => {} });
      return result.data?.text || '';
    } catch (e) {
      throw new Error(`OCR failed: ${e.message}. Install tesseract.js in backend.`);
    }
  }
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

/**
 * Parse uploaded report file → search-engine compatible structure.
 */
async function tryExpertOcrMerge(parsed, filePath, mimetype) {
  if (process.env.EH_EXPERT_OCR === '0') return parsed;
  try {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const fileType = ext === '.pdf' || mimetype === 'application/pdf' ? 'pdf' : 'image';
    const expert = await callExpertOcrReport(buffer, fileType, path.basename(filePath));
    return mergeExpertOcrIntoParsed(parsed, expert);
  } catch {
    return parsed;
  }
}

async function parseReport(filePath, reportType, mimetype) {
  const rawText = await extractTextFromFile(filePath, mimetype);
  const rt = String(reportType || 'other').toLowerCase();
  let parsed;

  if (rt === 'blood') {
    const extracted = extractBloodValuesFromText(rawText);
    const blood = await analyzeBloodReport(extracted);
    const fmt = bloodAnalysisToFormat(blood);
    parsed = { ...fmt, raw_text_length: rawText.length, raw_text_preview: rawText.slice(0, 500) };
  } else if (['ct', 'mri', 'xray', 'x-ray'].includes(rt)) {
    const imaging = analyzeImagingText(rawText);
    const fmt = imagingToFormat(imaging, rt === 'x-ray' ? 'xray' : rt);
    parsed = { ...fmt, raw_text_length: rawText.length };
  } else if (['sonography', 'ultrasound', 'sono'].includes(rt)) {
    const imaging = analyzeImagingText(rawText);
    const fmt = imagingToFormat(imaging, 'sonography');
    fmt.problems.push(...parseSonographyExtra(rawText));
    fmt.positive_count = fmt.problems.filter((p) => p.polarity === 'POSITIVE').length;
    fmt.negative_count = fmt.problems.filter((p) => p.polarity === 'NEGATIVE').length;
    parsed = { ...fmt, raw_text_length: rawText.length };
  } else {
    const extracted = extractBloodValuesFromText(rawText);
    const blood = await analyzeBloodReport(extracted);
    const imaging = analyzeImagingText(rawText);
    const bloodFmt = bloodAnalysisToFormat(blood);
    const imgFmt = imagingToFormat(imaging, 'other');
    const sonoExtra = parseSonographyExtra(rawText);
    if (sonoExtra.length) {
      imgFmt.problems.push(...sonoExtra);
      imgFmt.report_type = 'sonography';
    }
    const { combineAllReports } = require('./reportCombiner');
    parsed = combineAllReports(bloodFmt, null, imgFmt, null, rawText);
  }

  return tryExpertOcrMerge(parsed, filePath, mimetype);
}

async function parseReportText(text, reportType) {
  const rt = String(reportType || 'other').toLowerCase();
  if (rt === 'blood') {
    const extracted = extractBloodValuesFromText(text);
    return bloodAnalysisToFormat(await analyzeBloodReport(extracted));
  }
  const imaging = analyzeImagingText(text);
  return imagingToFormat(imaging, rt);
}

module.exports = {
  parseReport,
  parseReportText,
  extractTextFromFile,
  bloodAnalysisToFormat,
  imagingToFormat
};
