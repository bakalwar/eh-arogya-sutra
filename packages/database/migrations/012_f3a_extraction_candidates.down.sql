DROP POLICY IF EXISTS clinical_evidence_extraction_candidates_tenant_isolation
  ON clinical_evidence_extraction_candidates;
DROP POLICY IF EXISTS clinical_evidence_extraction_runs_tenant_isolation
  ON clinical_evidence_extraction_runs;

ALTER TABLE clinical_evidence_extraction_candidates NO FORCE ROW LEVEL SECURITY;
ALTER TABLE clinical_evidence_extraction_runs NO FORCE ROW LEVEL SECURITY;
ALTER TABLE clinical_evidence_extraction_candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_evidence_extraction_runs DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS clinical_evidence_extraction_candidates;
DROP TABLE IF EXISTS clinical_evidence_extraction_runs;

DROP INDEX IF EXISTS clinical_evidence_jobs_extract_open_unique;

ALTER TABLE clinical_evidence_jobs
  DROP CONSTRAINT IF EXISTS clinical_evidence_jobs_job_type_check;

ALTER TABLE clinical_evidence_jobs
  ADD CONSTRAINT clinical_evidence_jobs_job_type_check
  CHECK (job_type IN ('DELETE_ORIGINAL', 'VERIFY_DELETION'));

ALTER TABLE audit_events
  DROP CONSTRAINT IF EXISTS audit_events_no_sensitive_payload;

ALTER TABLE audit_events
  ADD CONSTRAINT audit_events_no_sensitive_payload CHECK (
    NOT (metadata ? 'otp')
    AND NOT (metadata ? 'token')
    AND NOT (metadata ? 'report_bytes')
    AND NOT (metadata ? 'base64')
    AND NOT (metadata ? 'image')
    AND NOT (metadata ? 'pdf')
    AND NOT (metadata ? 'secret')
  );
