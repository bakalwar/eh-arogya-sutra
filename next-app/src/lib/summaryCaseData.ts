export function extractClinicalSummary(data: Record<string, unknown> = {}) {
  const eh = (data.eh_analysis || {}) as Record<string, unknown>;
  return (
    (data.clinical_summary as string) ||
    (data.summary as string) ||
    (eh.clinical_summary as string) ||
    (eh.parcha as string) ||
    ((data.expert as Record<string, unknown>)?.clinical_summary as string) ||
    ''
  );
}

export function normalizeCaseDataForSummary(raw: Record<string, unknown> = {}) {
  if (raw?.patient && raw?.analysis) {
    return {
      ...raw,
      expert: raw.expert || buildExpertStub(raw),
      eh_analysis: raw.eh_analysis || (raw.analysis as Record<string, unknown>)?.eh_analysis,
    };
  }

  const eh = (raw.eh_analysis || {}) as Record<string, unknown>;
  const patient = (raw.patient || {}) as Record<string, unknown>;
  const patientIntake = (eh.patient_intake || {}) as Record<string, unknown>;
  const polarity = (eh.polarity || {}) as Record<string, unknown>;
  const prakriti = (eh.prakriti || {}) as Record<string, unknown>;
  const potency = (eh.potency || {}) as Record<string, unknown>;
  const analysis = (raw.analysis || {}) as Record<string, unknown>;

  const name = (raw.name || raw.patient_name || patient.name || 'Patient') as string;

  return {
    patient: {
      name,
      age: raw.age ?? patient.age ?? patientIntake.age ?? 30,
      gender: raw.gender || patient.gender || 'Male',
      chiefComplaint:
        raw.chief_complaint || raw.chiefComplaint || patient.chiefComplaint || '',
      bp_systolic: raw.bp_systolic ?? patient.bp_systolic,
      bp_diastolic: raw.bp_diastolic ?? patient.bp_diastolic,
      symptoms: raw.symptoms || patient.symptoms || [],
      durationDays: raw.duration_days ?? raw.durationDays ?? patient.durationDays,
    },
    analysis: {
      chief_complaint:
        raw.chief_complaint || raw.chiefComplaint || patient.chiefComplaint || '',
      polarity: polarity.polarity || analysis.polarity || raw.polarity,
      phase: eh.phase || raw.phase || analysis.phase || 'ACUTE',
      dilution: potency.potency || analysis.dilution,
      electricity: (eh.electricity as Record<string, unknown>)?.elec || analysis.electricity,
      temperament: prakriti.prakriti || analysis.temperament,
      report_values: raw.report_values || analysis.report_values || {},
      affected_organs: eh.active_systems || raw.affected_organs || analysis.affected_organs || [],
    },
    expert: buildExpertStub(raw),
    eh_analysis: eh,
    medicines: raw.medicines,
    mixtures: raw.mixtures || eh.mixtures,
    clinical_summary: extractClinicalSummary(raw),
    summary: extractClinicalSummary(raw),
  };
}

function buildExpertStub(raw: Record<string, unknown>) {
  const eh = (raw.eh_analysis || {}) as Record<string, unknown>;
  if (raw.expert) return raw.expert;
  const mixtures = eh.mixtures as unknown[] | undefined;
  const hasEngine = mixtures?.length || eh.prakriti || eh.polarity;
  const polarity = (eh.polarity || {}) as Record<string, unknown>;
  const potency = (eh.potency || {}) as Record<string, unknown>;
  const prakriti = (eh.prakriti || {}) as Record<string, unknown>;
  return {
    ok: hasEngine || Boolean(extractClinicalSummary(raw)),
    formulas: raw.medicines || {},
    overall_polarity: polarity.polarity,
    potency: potency.potency,
    temperament: prakriti.prakriti,
    phase: eh.phase,
    confidence: 95,
    clinical_summary: extractClinicalSummary(raw),
  };
}
