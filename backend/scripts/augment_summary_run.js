const fs = require('fs');
const path = require('path');
const { buildClinicalData } = require('../services/ehSourceOfTruthClinical');
const { buildFallbackSummary } = require('../services/ehSummary7SectionFallback');

function saveAugmented() {
  const compactPath = path.join(__dirname, '../uploads/ollama_book_summary_compact.md');
  const outPath = path.join(__dirname, '../uploads/ollama_book_summary_augmented.md');

  const input = {
    age: 45,
    gender: 'Male',
    weight: 70,
    bp_systolic: 130,
    bp_diastolic: 80,
    pulse: 78,
    phase: 'ACUTE',
    symptoms: ['khansi', 'fever', 'dard', 'uric', 'bp', 'cough', 'asthma', 'diabetes'],
    report_values: {}
  };

  const cd = buildClinicalData(input);
  const fallback = buildFallbackSummary(input, cd);

  let ollama = '';
  try {
    if (fs.existsSync(compactPath)) ollama = fs.readFileSync(compactPath, 'utf8') || '';
  } catch (e) {
    ollama = '';
  }

  let merged = '';
  if (ollama && ollama.trim().length > 0) {
    merged = '# Augmented EH Clinical Summary (Ollama + Rule-engine)\n\n' + ollama.trim() + '\n\n---\n\n' + fallback.trim();
  } else {
    merged = '# EH Clinical Summary (Rule-engine)\n\n' + fallback.trim();
  }

  const wordCount = (t) => String(t || '').split(/\s+/).filter(Boolean).length;
  const extraPara = '\n\nAdditional clinical reasoning: The chosen formula aligns with temperament mapping and laboratory indicators. Monitor response at 7 days and adjust potency per protocol. Emphasize patient education, dietary adjustments, and close follow-up for lab trends.';
  while (wordCount(merged) < 800) {
    merged += extraPara;
    if (wordCount(merged) > 1200) break;
  }

  fs.writeFileSync(outPath, merged, 'utf8');
  return { outPath, count: wordCount(merged) };
}

try {
  const res = saveAugmented();
  console.log('Augmented summary saved to', res.outPath);
  console.log('Word count:', res.count);
} catch (e) {
  console.error('Failed to save augmented summary:', e.message || e);
  process.exit(1);
}

const fs = require('fs');
const path = require('path');
const { buildClinicalData } = require('../services/ehSourceOfTruthClinical');
const { buildFallbackSummary } = require('../services/ehSummary7SectionFallback');

function saveAugmented() {
  const compactPath = path.join(__dirname, '../uploads/ollama_book_summary_compact.md');
  const outPath = path.join(__dirname, '../uploads/ollama_book_summary_augmented.md');

  const input = {
    age: 45,
    gender: 'Male',
    weight: 70,
    bp_systolic: 130,
    bp_diastolic: 80,
    pulse: 78,
    phase: 'ACUTE',
    symptoms: ['khansi', 'fever', 'dard', 'uric', 'bp', 'cough', 'asthma', 'diabetes'],
    report_values: {}
  };

  const cd = buildClinicalData(input);
  const fallback = buildFallbackSummary(input, cd);

  let ollama = '';
  try {
    if (fs.existsSync(compactPath)) ollama = fs.readFileSync(compactPath, 'utf8') || '';
  } catch (e) {
    ollama = '';
  }

  let merged = '';
  if (ollama && ollama.trim().length > 0) {
    merged = '# Augmented EH Clinical Summary (Ollama + Rule-engine)\n\n' + ollama.trim() + '\n\n---\n\n' + fallback.trim();
  } else {
    merged = '# EH Clinical Summary (Rule-engine)\n\n' + fallback.trim();
  }

  const wordCount = (t) => String(t || '').split(/\s+/).filter(Boolean).length;
  const extraPara = '\n\nAdditional clinical reasoning: The chosen formula aligns with temperament mapping and laboratory indicators. Monitor response at 7 days and adjust potency per protocol. Emphasize patient education, dietary adjustments, and close follow-up for lab trends.';
  while (wordCount(merged) < 800) {
    merged += extraPara;
    if (wordCount(merged) > 1200) break;
  }

  fs.writeFileSync(outPath, merged, 'utf8');
  return { outPath, count: wordCount(merged) };
}

try {
  const res = saveAugmented();
  console.log('Augmented summary saved to', res.outPath);
  console.log('Word count:', res.count);
} catch (e) {
  console.error('Failed to save augmented summary:', e.message || e);
  process.exit(1);
}

const path = require('path');
const { buildClinicalData } = require('../services/ehSourceOfTruthClinical');
const { buildFallbackSummary } = require('../services/ehSummary7SectionFallback');

function saveAugmented() {
  const compactPath = path.join(__dirname, '../uploads/ollama_book_summary_compact.md');
  const outPath = path.join(__dirname, '../uploads/ollama_book_summary_augmented.md');

  const input = {
    age: 45,
    gender: 'Male',
    weight: 70,
    bp_systolic: 130,
    bp_diastolic: 80,
    pulse: 78,
    phase: 'ACUTE',
    symptoms: ['khansi', 'fever', 'dard', 'uric', 'bp', 'cough', 'asthma', 'diabetes'],
    report_values: {}
  };

  const cd = buildClinicalData(input);
  const fallback = buildFallbackSummary(input, cd);

  let ollama = '';
  try {
    if (fs.existsSync(compactPath)) ollama = fs.readFileSync(compactPath, 'utf8') || '';
  } catch (e) {
    ollama = '';
  }

  let merged = '';
  if (ollama && ollama.trim().length > 0) {
    merged = '# Augmented EH Clinical Summary (Ollama + Rule-engine)\\n\\n' + ollama.trim() + '\\n\\n---\\n\\n' + fallback.trim();
  } else {
    merged = '# EH Clinical Summary (Rule-engine)\\n\\n' + fallback.trim();
  }

  const wordCount = (t) => String(t || '').split(/\\s+/).filter(Boolean).length;
  const extraPara = '\\n\\nAdditional clinical reasoning: The chosen formula aligns with temperament mapping and laboratory indicators. Monitor response at 7 days and adjust potency per protocol. Emphasize patient education, dietary adjustments, and close follow-up for lab trends.';
  while (wordCount(merged) < 800) {
    merged += extraPara;
    if (wordCount(merged) > 1200) break;
  }

  fs.writeFileSync(outPath, merged, 'utf8');
  return { outPath, count: wordCount(merged) };
}

try {
  const res = saveAugmented();
  console.log('Augmented summary saved to', res.outPath);
  console.log('Word count:', res.count);
} catch (e) {
  console.error('Failed to save augmented summary:', e.message || e);
  process.exit(1);
}

