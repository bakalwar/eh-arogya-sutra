function removeDuplicateProblems(problems) {
  const seen = new Set();
  return problems.filter((p) => {
    const key = `${p.name}|${p.polarity}|${p.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getTopMedicines(hints) {
  const count = {};
  (hints || []).forEach((h) => {
    String(h || '')
      .split(/[,;\s]+/)
      .map((x) => x.trim())
      .filter((x) => /^[A-Z]-\d+$/i.test(x) || /^[A-Z]{1,3}$/i.test(x))
      .forEach((code) => {
        const c = code.toUpperCase();
        count[c] = (count[c] || 0) + 1;
      });
  });
  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([m]) => m);
}

/**
 * Combine parsed blood / scan / sono / xray reports for smart search.
 */
function combineAllReports(bloodReport, scanReport, sonoReport, xrayReport, rawText = '') {
  let totalPositive = 0;
  let totalNegative = 0;
  let allProblems = [];
  let bloodSystem = 0;
  let lymphSystem = 0;
  let allMedicineHints = [];

  const add = (rep) => {
    if (!rep) return;
    totalPositive += rep.positive_count || 0;
    totalNegative += rep.negative_count || 0;
    allProblems.push(...(rep.problems || []));
    if (rep.overall_vitiation === 'SANGUINE' || rep.dominant_system === 'SANGUINE') bloodSystem += 1;
    if (rep.overall_vitiation === 'LYMPHATIC' || rep.dominant_system === 'LYMPHATIC') lymphSystem += 1;
    if (rep.medicine_hints) allMedicineHints.push(...rep.medicine_hints);
    (rep.found_values || []).forEach((v) => {
      if (v.medicine_hint) allMedicineHints.push(...String(v.medicine_hint).split(', '));
    });
  };

  add(bloodReport);
  add(scanReport);
  add(sonoReport);
  add(xrayReport);

  const expertOcrSources = [bloodReport, scanReport, sonoReport, xrayReport].filter(
    (r) => r?.expert_ocr?.engine
  );
  const expert_ocr = expertOcrSources.length
    ? {
        engine: expertOcrSources.map((r) => r.expert_ocr.engine).join('+'),
        organ_keys: [
          ...new Set(expertOcrSources.flatMap((r) => r.expert_ocr.organ_keys || []))
        ]
      }
    : null;

  const uniqueProblems = removeDuplicateProblems(allProblems);
  const finalPolarity =
    totalPositive > totalNegative
      ? 'POSITIVE'
      : totalNegative > totalPositive
        ? 'NEGATIVE'
        : 'MIXED';

  const combinedVitiation =
    bloodSystem > lymphSystem ? 'SANGUINE (Blood)' : lymphSystem > bloodSystem ? 'LYMPHATIC (Lymph)' : 'MIXED VITIATION';

  return {
    report_type: 'combined',
    blood: bloodReport,
    ct: scanReport,
    mri: scanReport,
    sonography: sonoReport,
    xray: xrayReport,
    found_values: bloodReport?.found_values || [],
    problems: uniqueProblems,
    all_problems: uniqueProblems,
    combined_polarity: finalPolarity,
    combined_vitiation: combinedVitiation,
    overall_polarity: finalPolarity,
    overall_vitiation: combinedVitiation,
    total_positive_findings: totalPositive,
    total_negative_findings: totalNegative,
    positive_count: totalPositive,
    negative_count: totalNegative,
    recommended_medicines: getTopMedicines(allMedicineHints),
    medicine_hints: getTopMedicines(allMedicineHints),
    report_count: [bloodReport, scanReport, sonoReport, xrayReport].filter(Boolean).length,
    confidence: Math.min(92, 45 + uniqueProblems.length * 6 + (bloodReport?.found_values?.length || 0) * 3),
    raw_text_length: rawText?.length || 0,
    expert_ocr
  };
}

module.exports = { combineAllReports, removeDuplicateProblems, getTopMedicines };
