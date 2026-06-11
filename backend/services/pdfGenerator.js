const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { drawAnatomyDiagram } = require('./anatomyPdfZones');
const { resolveUploadPath } = require('./doctorProfile');

/**
 * Build prescription PDF buffer (pdfkit interim; Puppeteer later).
 */
async function prescriptionToPdfBuffer(payload = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 48 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const p = payload.profile || {};
      const clinic = p.headerName || payload.clinicName || p.clinicName || 'E.H. AROGYA SUTRA';
      const phone = p.clinicPhone || payload.clinicPhone || '';
      const address = p.address || payload.clinicAddress || '';
      const patient = payload.patientName || 'Patient';
      const doctor = p.doctorName || payload.doctorName || 'Doctor';
      const summary = payload.summary || payload.clinical_summary || '';

      // Header
      doc.fontSize(18).fillColor('#2d6a35').text(clinic, { align: 'center' });
      if (phone) doc.fontSize(10).fillColor('#666').text(`Tel: ${phone}`, { align: 'center' });
      if (address) doc.fontSize(9).fillColor('#666').text(address, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(14).fillColor('#000').text('Clinical Prescription', { align: 'center', underline: true });
      doc.moveDown(1);

      // Patient Info
      doc.fontSize(11).fillColor('#333');
      doc.text(`Patient: ${patient}`);
      if (doctor) doc.text(`Doctor: ${doctor}`);
      doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
      doc.moveDown(1);

      // Professional Summary Section
      if (summary) {
        doc.fontSize(14).fillColor('#2d6a35').text('Clinical Analysis & Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#000').text(summary, {
          lineGap: 2,
          paragraphGap: 4,
          align: 'left',
          font: 'Courier' // Use a monospaced font for the ASCII boxes
        });
        doc.moveDown(1);
      }

      // Medicines Section (if not already in summary)
      const items = Array.isArray(payload.items) ? payload.items : [];
      if (items.length && !summary.includes('MIXTURE')) {
        doc.fontSize(14).fillColor('#2d6a35').text('Recommended Medicines', { underline: true });
        doc.moveDown(0.5);
        items.forEach((it, i) => {
          const line = typeof it === 'string' ? it : `${it.code || it.name || 'Medicine'}${it.dilution ? ` (${it.dilution})` : ''}`;
          doc.fontSize(11).fillColor('#000').text(`${i + 1}. ${line}`);
        });
        doc.moveDown(1);
      }

      // Footer
      const footerY = doc.page.height - 60;
      doc.fontSize(8).fillColor('#999').text(
        'Electro Homoeopathy · E.H. Arogya Sutra CDSS',
        48,
        footerY,
        { align: 'center', width: doc.page.width - 96 }
      );

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { prescriptionToPdfBuffer };

module.exports = { prescriptionToPdfBuffer };
