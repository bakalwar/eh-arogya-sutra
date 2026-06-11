'use strict';

function medStr(meds) {
  if (!meds) return '—';
  if (Array.isArray(meds)) return meds.join(' + ');
  return String(meds);
}

/** Build Ollama user prompt from Smart Search result */
function buildSummaryContext(caseData = {}) {
  const patient = caseData.patient || {};
  const analysis = caseData.analysis || {};
  const medicines = caseData.medicines || analysis.medicines || {};
  const symptoms = patient.symptoms || analysis.symptoms || [];
  const ehAi = caseData.ehAi || {};
  const diet = caseData.diet || {};
  const reports = caseData.combinedReports || analysis.combined_reports || {};

  let ctx = '=== ROGI ===\n';
  ctx += `Naam: ${patient.name || '—'}\n`;
  ctx += `Umra: ${patient.age ?? '—'} | Ling: ${patient.gender || '—'} | Vajan: ${patient.weight ?? '—'} kg\n`;
  ctx += `BP: ${patient.bp_systolic ?? '—'}/${patient.bp_diastolic ?? '—'}\n`;
  ctx += `Avadhi: ${analysis.duration_days ?? patient.durationLabel ?? '—'} din\n`;
  if (patient.chiefComplaint) ctx += `Shikayat: ${patient.chiefComplaint}\n`;
  ctx += '\n';

  ctx += '=== LAKSHAN ===\n';
  symptoms.forEach((s, i) => {
    ctx += `${i + 1}. ${s.name || s}${s.severity ? ` (${s.severity})` : ''}\n`;
  });
  ctx += '\n';

  const labs = [];
  (reports.found_values || []).forEach((v) => {
    if (v.status === 'ABNORMAL' || v.value) labs.push(`${v.test_name}: ${v.value} ${v.status || ''}`);
  });
  if (labs.length) {
    ctx += '=== JAANCH ===\n' + labs.join('\n') + '\n\n';
  }

  if (caseData.faceAnalysis?.findings?.length) {
    ctx += '=== CHEHRA ===\n';
    ctx += `Polarity: ${caseData.faceAnalysis.polarity}\n`;
    caseData.faceAnalysis.findings.slice(0, 4).forEach((f) => {
      ctx += `- ${f.sign}: ${f.meaning || ''}\n`;
    });
    ctx += '\n';
  }

  ctx += '=== EH ANALYSIS (CDSS) ===\n';
  ctx += `Rog: ${ehAi.disease || analysis.eh_ai_disease || '—'}\n`;
  ctx += `Polarity: ${analysis.polarity} | Phase: ${analysis.phase} | Vitiation: ${analysis.vitiation}\n`;
  ctx += `Dilution: ${analysis.dilution} | Electricity: ${analysis.electricity}\n`;
  ctx += `Confidence: ${analysis.confidence ?? caseData.confidence ?? '—'}%\n\n`;

  ctx += '=== SUGGESTED FORMULAS (develop with EH rules) ===\n';
  if (medicines.formula_a) {
    ctx += `Mukhya: ${medStr(medicines.formula_a.medicines)} (${medicines.formula_a.potency || analysis.dilution || ''})\n`;
  }
  if (medicines.formula_b) {
    ctx += `Sahayogi: ${medStr(medicines.formula_b.medicines)}\n`;
  }
  if (analysis.full_formula?.length) {
    ctx += `Full: ${analysis.full_formula.join(' + ')}\n`;
  }
  ctx += '\n';

  if (diet.do?.length || diet.dont?.length) {
    ctx += '=== AHAAR (reference) ===\n';
    ctx += `Khayen: ${(diet.do || []).slice(0, 8).join('; ')}\n`;
    ctx += `Parhej: ${(diet.dont || []).slice(0, 8).join('; ')}\n\n`;
  }

  ctx += '=== AAPKA KAAM ===\n';
  ctx += 'Upar ke case ke liye poori 1500+ shabd Hindi summary likho.\n';
  ctx += 'Har rog type par EH siddhant lagao — medicines + potency + 4 mishran + tablet chart.\n';
  ctx += 'Format system instructions ke anusaar exact rakho.\n';

  return ctx;
}

module.exports = { buildSummaryContext };
