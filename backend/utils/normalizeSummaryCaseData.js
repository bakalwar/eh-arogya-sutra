'use strict';

/**
 * Flat smart-search / sessionStorage payload → summary API caseData.
 * EH API path (eh_api.py + summary_engine.py) — not book/Ollama.
 */
function extractClinicalSummary(data = {}) {
  return String(
    data.clinical_summary ||
      data.summary ||
      data.eh_analysis?.clinical_summary ||
      data.eh_analysis?.parcha ||
      data.expert?.clinical_summary ||
      ''
  ).trim();
}

function buildExpertStub(raw) {
  const eh = raw.eh_analysis || {};
  if (raw.expert) return raw.expert;
  const hasEngine = eh.mixtures?.length || eh.prakriti || eh.polarity;
  return {
    ok: hasEngine || Boolean(extractClinicalSummary(raw)),
    formulas: raw.medicines || {},
    overall_polarity: eh.polarity?.polarity,
    potency: eh.potency?.potency,
    temperament: eh.prakriti?.prakriti,
    phase: eh.phase,
    confidence: 95,
    clinical_summary: extractClinicalSummary(raw)
  };
}

function normalizeSummaryCaseData(raw = {}) {
  let body = raw;
  if (body?.caseData && typeof body.caseData === 'object') {
    body = body.caseData;
  }

  if (body?.patient && body?.analysis) {
    return {
      ...body,
      expert: body.expert || buildExpertStub(body),
      eh_analysis: body.eh_analysis || body.analysis?.eh_analysis || body.eh_analysis
    };
  }

  const eh = body.eh_analysis || {};
  const name = body.name || body.patient_name || body.patient?.name || 'Patient';
  const chief =
    body.chief_complaint ||
    body.chiefComplaint ||
    body.patient?.chiefComplaint ||
    body.analysis?.chief_complaint ||
    '';

  return {
    patient: {
      name,
      age: body.age ?? body.patient?.age ?? eh.patient_intake?.age ?? 30,
      gender: body.gender || body.patient?.gender || 'Male',
      chiefComplaint: chief,
      bp_systolic: body.bp_systolic ?? body.patient?.bp_systolic,
      bp_diastolic: body.bp_diastolic ?? body.patient?.bp_diastolic,
      symptoms: body.symptoms || body.patient?.symptoms || [],
      durationDays: body.duration_days ?? body.durationDays ?? body.patient?.durationDays
    },
    analysis: {
      chief_complaint: chief,
      polarity: eh.polarity?.polarity || body.analysis?.polarity || body.polarity,
      phase: eh.phase || body.phase || body.analysis?.phase || 'ACUTE',
      dilution: eh.potency?.potency || body.analysis?.dilution,
      electricity: eh.electricity?.elec || body.analysis?.electricity,
      temperament: eh.prakriti?.prakriti || body.analysis?.temperament,
      report_values: body.report_values || body.analysis?.report_values || {},
      affected_organs: eh.active_systems || body.affected_organs || body.analysis?.affected_organs || []
    },
    expert: buildExpertStub(body),
    eh_analysis: eh,
    medicines: body.medicines,
    mixtures: body.mixtures || eh.mixtures,
    clinical_summary: extractClinicalSummary(body),
    summary: extractClinicalSummary(body),
    faceAnalysis: body.faceAnalysis,
    combinedReports: body.combinedReports
  };
}

function hasSummaryPayload(data = {}) {
  if (!data || typeof data !== 'object') return false;
  if (data.patient || data.analysis) return true;
  if (data.eh_analysis && Object.keys(data.eh_analysis).length) return true;
  if (extractClinicalSummary(data)) return true;
  if (data.chief_complaint || data.chiefComplaint) return true;
  if (Array.isArray(data.mixtures) && data.mixtures.length) return true;
  if (data.patient_name || data.name) return true;
  return false;
}

module.exports = {
  normalizeSummaryCaseData,
  hasSummaryPayload,
  extractClinicalSummary
};
