DROP POLICY IF EXISTS audit_events_insert_tenant ON audit_events;
DROP POLICY IF EXISTS audit_events_select_tenant ON audit_events;
ALTER TABLE audit_events NO FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_events DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_events TO ehas2_app;

DROP POLICY IF EXISTS clinical_evidence_jobs_tenant_isolation ON clinical_evidence_jobs;
DROP POLICY IF EXISTS clinical_evidence_blobs_tenant_isolation ON clinical_evidence_blobs;
DROP POLICY IF EXISTS clinical_evidence_items_tenant_isolation ON clinical_evidence_items;

ALTER TABLE clinical_evidence_jobs NO FORCE ROW LEVEL SECURITY;
ALTER TABLE clinical_evidence_blobs NO FORCE ROW LEVEL SECURITY;
ALTER TABLE clinical_evidence_items NO FORCE ROW LEVEL SECURITY;
ALTER TABLE clinical_evidence_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_evidence_blobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_evidence_items DISABLE ROW LEVEL SECURITY;

ALTER TABLE structured_report_findings
  DROP CONSTRAINT IF EXISTS structured_report_findings_evidence_fk;
ALTER TABLE structured_report_findings
  DROP COLUMN IF EXISTS evidence_item_id;

DROP TABLE IF EXISTS clinical_evidence_jobs;
DROP TABLE IF EXISTS clinical_evidence_blobs;
DROP TABLE IF EXISTS clinical_evidence_items;
