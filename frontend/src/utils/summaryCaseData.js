export const EH_SUMMARY_PY = 'summary_engine.py';
export const EH_API_PY = 'eh_api.py';

/** Map legacy "fastapi" labels → Python module names */
export function normalizeEngineVia(via) {
  if (!via || via === 'fastapi') return EH_SUMMARY_PY;
  return via;
}

export function formatEngineViaLabel(via) {
  const v = normalizeEngineVia(via);
  if (v.endsWith('.py')) return `9 Rule Engines · ${v}`;
  return v;
}

/** Smart Search / analyze payload → backend summary API caseData */
export function extractClinicalSummary(data = {}) {
  return (
    data.clinical_summary ||
    data.summary ||
    data.eh_analysis?.clinical_summary ||
    data.eh_analysis?.parcha ||
    data.expert?.clinical_summary ||
    ''
  );
}

export function normalizeCaseDataForSummary(raw = {}) {
  if (raw?.patient && raw?.analysis) {
    return {
      ...raw,
      expert: raw.expert || buildExpertStub(raw),
      eh_analysis: raw.eh_analysis || raw.analysis?.eh_analysis
    };
  }

  const eh = raw.eh_analysis || {};
  const name = raw.name || raw.patient_name || raw.patient?.name || 'Patient';

  return {
    patient: {
      name,
      age: raw.age ?? raw.patient?.age ?? eh.patient_intake?.age ?? 30,
      gender: raw.gender || raw.patient?.gender || 'Male',
      chiefComplaint:
        raw.chief_complaint || raw.chiefComplaint || raw.patient?.chiefComplaint || '',
      bp_systolic: raw.bp_systolic ?? raw.patient?.bp_systolic,
      bp_diastolic: raw.bp_diastolic ?? raw.patient?.bp_diastolic,
      symptoms: raw.symptoms || raw.patient?.symptoms || [],
      durationDays: raw.duration_days ?? raw.durationDays ?? raw.patient?.durationDays
    },
    analysis: {
      chief_complaint:
        raw.chief_complaint || raw.chiefComplaint || raw.patient?.chiefComplaint || '',
      polarity: eh.polarity?.polarity || raw.analysis?.polarity || raw.polarity,
      phase: eh.phase || raw.phase || raw.analysis?.phase || 'ACUTE',
      dilution: eh.potency?.potency || raw.analysis?.dilution,
      electricity: eh.electricity?.elec || raw.analysis?.electricity,
      temperament: eh.prakriti?.prakriti || raw.analysis?.temperament,
      report_values: raw.report_values || raw.analysis?.report_values || {},
      affected_organs: eh.active_systems || raw.affected_organs || raw.analysis?.affected_organs || []
    },
    expert: buildExpertStub(raw),
    eh_analysis: eh,
    medicines: raw.medicines,
    mixtures: raw.mixtures || eh.mixtures,
    clinical_summary: extractClinicalSummary(raw),
    summary: extractClinicalSummary(raw),
    faceAnalysis: raw.faceAnalysis,
    combinedReports: raw.combinedReports
  };
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

/** Minimal Hindi summary when API unreachable */
export function buildClientFallbackSummary(data = {}) {
  const eh = data.eh_analysis || {};
  const name = data.patient?.name || data.name || 'Patient';
  const pol = eh.polarity?.polarity || data.analysis?.polarity || '—';
  const prak = eh.prakriti?.prakriti || '—';
  const potency = eh.potency?.potency || data.analysis?.dilution || '—';
  const chief =
    data.chief_complaint ||
    data.chiefComplaint ||
    data.patient?.chiefComplaint ||
    data.analysis?.chief_complaint ||
    '—';
  const mixtures = (data.mixtures || eh.mixtures || [])
    .map((m, i) => {
      const label = m.label || `MIXTURE ${String.fromCharCode(65 + i)}`;
      const formula = m.formula || m.formula_obj?.full || '—';
      return `**${label}:** ${formula}`;
    })
    .join('\n');

  return (
    `## EH AROGYA SUTRA — Clinical Summary (offline fallback)\n\n` +
    `**Patient:** ${name}\n\n` +
    `**Chief complaint:** ${chief}\n\n` +
    `**Prakriti:** ${prak} | **Polarity:** ${pol} | **Potency:** ${potency}\n\n` +
    (mixtures ? `### Formulas\n${mixtures}\n\n` : '') +
    '*Server se connect nahi ho paya — formulas ऊपर analyze से। Dubara सारांश try karein ya ' +
    'local: npm run dev + Vite port (5173/5178).*'
  );
}
