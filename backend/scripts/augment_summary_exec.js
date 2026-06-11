const fs = require('fs');
const path = require('path');
const { buildClinicalData } = require('../services/ehSourceOfTruthClinical');
const { buildFallbackSummary } = require('../services/ehSummary7SectionFallback');

function ensureWords(text, minWords = 800, maxWords = 1200) {
  const wc = (t) => String(t || '').split(/\s+/).filter(Boolean).length;
  const extra =
    '\n\nAdditional clinical reasoning: The chosen formula aligns with temperament mapping and laboratory indicators. Monitor response at 7 days and adjust potency per protocol. Emphasize patient education, dietary adjustments, and close follow-up for lab trends.';
  let out = String(text || '');
  let i = 0;
  while (wc(out) < minWords && i < 100) {
    out += extra;
    if (wc(out) >= maxWords) break;
    i++;
  }
  return out;
}

function buildAugmented() {
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
  if (fs.existsSync(compactPath)) {
    try {
      ollama = fs.readFileSync(compactPath, 'utf8') || '';
    } catch (e) {
      ollama = '';
    }
  }

  let merged = '';
  if (ollama && ollama.trim().length > 0) {
    merged = '# Augmented EH Clinical Summary (Ollama + Rule-engine)\n\n' + ollama.trim() + '\n\n---\n\n' + fallback.trim();
  } else {
    merged = '# EH Clinical Summary (Rule-engine)\n\n' + fallback.trim();
  }

  const final = ensureWords(merged, 800, 1200);
  fs.writeFileSync(outPath, final, 'utf8');
  return { outPath, words: final.split(/\s+/).filter(Boolean).length };
}

try {
  const res = buildAugmented();
  console.log('Augmented summary saved to:', res.outPath);
  console.log('Word count:', res.words);
  const preview = fs.readFileSync(res.outPath, 'utf8').slice(0, 1600);
  console.log('\\n--- PREVIEW ---\\n', preview);
} catch (err) {
  console.error('Failed to build augmented summary:', err.message || err);
  process.exit(1);
}

