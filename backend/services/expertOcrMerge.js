'use strict';

/**
 * Merge Python EH Expert OCR extract into Node reportParser output.
 */
function mergeExpertOcrIntoParsed(parsed, expert) {
  if (!parsed || !expert?.ok) return parsed;

  const out = { ...parsed };
  out.problems = [...(out.problems || [])];
  out.found_values = [...(out.found_values || [])];
  out.medicine_hints = [...(out.medicine_hints || [])];

  for (const p of expert.pathologies || []) {
    const term = p.term || p.name;
    if (!term) continue;
    if (out.problems.some((x) => (x.name || '').toLowerCase() === String(term).toLowerCase())) continue;
    out.problems.push({
      name: term,
      name_hi: term,
      source: p.source || 'expert_ocr',
      polarity: (p.polarity || 'MIXED').toUpperCase(),
      vitiation: p.polarity === 'NEGATIVE' ? 'LYMPHATIC' : 'SANGUINE',
      severity: 'moderate',
      meaning: `Medical term: ${term} → ${p.organ || 'organ'}`
    });
  }

  for (const [test, d] of Object.entries(expert.report_values || {})) {
    if (out.found_values.some((v) => (v.test_name || '').toLowerCase() === test)) continue;
    const st = String(d.status || '').toUpperCase();
    out.found_values.push({
      test_name: test,
      value: d.value,
      status: st === 'NORMAL' ? 'NORMAL' : 'ABNORMAL',
      direction: st === 'HIGH' ? 'HIGH ⬆️' : st === 'LOW' ? 'LOW ⬇️' : 'NORMAL ✅',
      polarity: (d.polarity || 'NEUTRAL').toUpperCase(),
      meaning: `Lab ${test}: ${d.value} (${d.normal || 'ref'})`
    });
  }

  for (const m of expert.medicine_hints || []) {
    if (m && !out.medicine_hints.includes(m)) out.medicine_hints.push(m);
  }

  if (expert.overall_polarity) {
    out.overall_polarity = expert.overall_polarity;
  }
  if (expert.raw_text_preview) {
    out.raw_text_preview = expert.raw_text_preview;
  }
  out.expert_ocr = {
    engine: expert.engine,
    organ_keys: expert.organ_keys || [],
    organs_affected: expert.organs_affected || []
  };

  out.positive_count = out.problems.filter((p) => p.polarity === 'POSITIVE').length;
  out.negative_count = out.problems.filter((p) => p.polarity === 'NEGATIVE').length;
  out.confidence = Math.min(95, (out.confidence || 50) + 8);

  return out;
}

module.exports = { mergeExpertOcrIntoParsed };
