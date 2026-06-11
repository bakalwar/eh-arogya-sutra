'use strict';

/**
 * Build FormData for Python POST /v1/expert/analyze-complete from Express multer request.
 */
function buildExpertCompleteFormData(req) {
  const fd = new FormData();
  const b = req.body || {};

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
  append('temperament', b.temperament);
  append('pulse', b.pulse);
  append('mobile', b.mobile);
  append('blood_report', b.blood_report);
  append('mri_report', b.mri_report);
  append('sonography', b.sonography);
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
  fd.append('include_summary', 'false');

  const faceFile = req.files?.face_image?.[0] || (req.file?.fieldname === 'face_image' ? req.file : null);
  const reportFile =
    req.files?.report_file?.[0] || (req.file?.fieldname === 'report_file' ? req.file : null);

  const faces = req.files?.face_image || (faceFile ? [faceFile] : []);
  const reports = req.files?.report_file || (reportFile ? [reportFile] : []);

  faces.forEach((f) => {
    if (f?.buffer?.length) {
      fd.append(
        'face_image',
        new Blob([f.buffer], { type: f.mimetype || 'image/jpeg' }),
        f.originalname || 'face.jpg'
      );
    }
  });
  reports.forEach((f) => {
    if (f?.buffer?.length) {
      fd.append(
        'report_file',
        new Blob([f.buffer], { type: f.mimetype || 'application/octet-stream' }),
        f.originalname || 'report.pdf'
      );
    }
  });

  return fd;
}

module.exports = { buildExpertCompleteFormData };
