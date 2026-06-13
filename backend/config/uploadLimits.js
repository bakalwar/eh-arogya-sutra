'use strict';

/** Shared multipart limits — PDFs, MRI exports, high-res clinical photos */
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

module.exports = {
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB: 50,
  multerLimits: { fileSize: MAX_UPLOAD_BYTES, files: 20 },
  reportFieldNames: ['report_files', 'report_file', 'files'],
  bodyFieldNames: ['body_photos', 'body_photo', 'face_image'],
};
