/**
 * Default clinic branding for prescriptions, reports, and PDFs.
 * Override via environment variables in production.
 */
module.exports = {
  clinicName: process.env.CLINIC_NAME || 'E.H. AROGYA SUTRA',
  clinicPhone: process.env.CLINIC_PHONE || '9098791989',
  /** Short line for letterheads / footers */
  clinicFooterLine() {
    return `${this.clinicName} · ${this.clinicPhone}`;
  }
};
