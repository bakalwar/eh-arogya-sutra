# PHASE 3B AUDIT EVENT MAP

| Action | event_type | metadata (allowed) |
|--------|------------|--------------------|
| Patient create | patient_created | status |
| Patient update | patient_updated | fields[] |
| Patient archive | patient_archived | status |
| Consultation create | consultation_created | status |
| Consultation update | consultation_updated | status |
| Consultation transition | consultation_state_changed | from,to |
| Findings add | structured_findings_added | count |
| Summary revision | clinical_summary_revision_created | consultationId, contentHash |
| Prescription revision | prescription_revision_created | consultationId, versionNumber, contentHash |
| Clinician review | clinician_review_recorded | from,to |

Forbidden audit keys: otp, token, report_bytes, base64, image, pdf, secret
