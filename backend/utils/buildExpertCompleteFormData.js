'use strict';

/**
 * Build FormData for Python POST /api/v3/analyze-report (dual-mode pipeline).
 */
function collectFiles(req, keys) {
  const out = [];
  for (const key of keys) {
    const batch = req.files?.[key];
    if (Array.isArray(batch)) out.push(...batch);
  }
  return out;
}

function resolveAnalysisMode(req) {
  const explicit = (req.body?.analysis_mode || req.body?.analysisMode || '').trim();
  if (explicit && explicit !== 'auto') return explicit;

  const hasReports = collectFiles(req, ['report_files', 'report_file', 'files']).length > 0;
  const hasBody = collectFiles(req, ['body_photos', 'body_photo', 'face_image']).length > 0;

  if (hasBody && !hasReports) return 'photo_temperament';
  if (hasReports && !hasBody) return 'medical_report_ocr';
  if (hasReports && hasBody) return 'combined';
  return 'auto';
}

function buildExpertCompleteFormData(req, options = {}) {
  const fd = new FormData();
  const b = req.body || {};
  const mode = resolveAnalysisMode(req);
  const clinicalOnly =
    options.clinicalOnly === true ||
    String(b.output_mode || b.outputMode || '').toLowerCase() === 'clinical_only';

  const append = (key, val) => {
    if (val !== undefined && val !== null && val !== '') fd.append(key, String(val));
  };

  append('age', b.age ?? 30);
  append('gender', b.gender || 'Male');
  append('weight', b.weight);
  append('bp_systolic', b.bp_systolic ?? b.bpSystolic);
  append('bp_diastolic', b.bp_diastolic ?? b.bpDiastolic);
  append('duration_days', b.duration_days ?? b.durationDays ?? b.duration ?? 0);
  append('chief_complaint', b.chief_complaint ?? b.chiefComplaint ?? '');
  append('patient_name', b.patient_name ?? b.patientName ?? b.name);
  append(
    'symptoms',
    typeof b.symptoms === 'string' ? b.symptoms : JSON.stringify(b.symptoms || [])
  );
  append('phase', b.phase);
  append('condition', b.condition || b.phase || 'chronic');
  append('temperament', b.temperament);
  append('pulse', b.pulse);
  append('mobile', b.mobile);
  append('blood_report', b.blood_report);
  append('mri_report', b.mri_report);
  append('sonography', b.sonography);
  append('analysis_mode', mode);
  if (clinicalOnly) {
    fd.set('output_mode', 'clinical_only');
  } else {
    append('output_mode', b.output_mode || b.outputMode || 'full');
  }

  if (b.affected_organs) {
    append(
      'affected_organs',
      typeof b.affected_organs === 'string' ? b.affected_organs : JSON.stringify(b.affected_organs)
    );
  }
  if (b.report_values) {
    append(
      'report_values',
      typeof b.report_values === 'string' ? b.report_values : JSON.stringify(b.report_values)
    );
  }

  const reports = collectFiles(req, ['report_files', 'report_file']);
  const bodies = collectFiles(req, ['body_photos', 'body_photo', 'face_image']);

  reports.forEach((f) => {
    if (f?.buffer?.length) {
      const blob = new Blob([f.buffer], { type: f.mimetype || 'application/octet-stream' });
      const name = f.originalname || 'report.pdf';
      fd.append('report_files', blob, name);
      fd.append('files', blob, name);
    }
  });

  bodies.forEach((f) => {
    if (f?.buffer?.length) {
      const blob = new Blob([f.buffer], { type: f.mimetype || 'image/jpeg' });
      const name = f.originalname || 'body-photo.jpg';
      fd.append('body_photos', blob, name);
      fd.append('face_image', blob, name);
    }
  });

  return fd;
}

function hasUploadedReports(req) {
  return collectFiles(req, ['report_files', 'report_file', 'files']).length > 0;
}

function hasUploadedBodyPhotos(req) {
  return collectFiles(req, ['body_photos', 'body_photo', 'face_image']).length > 0;
}

module.exports = {
  buildExpertCompleteFormData,
  hasUploadedReports,
  hasUploadedBodyPhotos,
  resolveAnalysisMode,
};
