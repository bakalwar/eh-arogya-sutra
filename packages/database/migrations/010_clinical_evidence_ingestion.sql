-- F1: PHI-safe clinical evidence metadata, temp blob refs, DB-canonical jobs.
-- Original bytes are never clinical authority. No OCR / interpretation.

ALTER TABLE structured_report_findings
  ADD COLUMN IF NOT EXISTS evidence_item_id uuid NULL;

CREATE TABLE clinical_evidence_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  consultation_id uuid NOT NULL REFERENCES consultations(id),
  submitted_by_actor_id uuid NOT NULL REFERENCES users(id),
  evidence_type text NOT NULL
    CHECK (evidence_type IN (
      'PATIENT_PHOTO', 'USG', 'CT', 'MRI', 'BLOOD_REPORT',
      'XRAY', 'OTHER_INVESTIGATION', 'CLINICAL_IMAGE'
    )),
  source_type text NOT NULL
    CHECK (source_type IN ('DOCTOR_UPLOAD', 'PATIENT_SUPPLIED', 'CLINIC_SCAN')),
  filename_sanitized text NOT NULL,
  unsanitized_name_discarded boolean NOT NULL DEFAULT true
    CHECK (unsanitized_name_discarded = true),
  declared_mime text NOT NULL,
  detected_mime text NULL,
  byte_size bigint NULL
    CHECK (byte_size IS NULL OR (byte_size > 0 AND byte_size <= 10485760)),
  content_sha256 text NULL
    CHECK (content_sha256 IS NULL OR content_sha256 ~ '^[a-f0-9]{64}$'),
  content_fingerprint_alg text NOT NULL DEFAULT 'sha256'
    CHECK (content_fingerprint_alg = 'sha256'),
  captured_or_issued_on date NULL,
  ingested_at timestamptz NOT NULL DEFAULT now(),
  processing_status text NOT NULL
    CHECK (processing_status IN (
      'INTAKE_CREATED', 'BYTES_RECEIVED', 'VALIDATING', 'REJECTED', 'QUARANTINED',
      'STORED_TEMP', 'MALWARE_PENDING', 'EXPIRED', 'DELETE_PENDING',
      'DELETED', 'DELETION_VERIFIED'
    )),
  extraction_status text NOT NULL DEFAULT 'NOT_AUTHORIZED'
    CHECK (extraction_status = 'NOT_AUTHORIZED'),
  confidence_posture text NOT NULL DEFAULT 'NONE'
    CHECK (confidence_posture = 'NONE'),
  clinical_authority text NOT NULL DEFAULT 'NOT_AUTHORITATIVE'
    CHECK (clinical_authority = 'NOT_AUTHORITATIVE'),
  source_audit_event_id uuid NULL REFERENCES audit_events(id),
  rejection_code text NULL,
  rejection_reason_safe text NULL,
  retention_class text NOT NULL DEFAULT 'TEMPORARY_ORIGINAL'
    CHECK (retention_class = 'TEMPORARY_ORIGINAL'),
  expires_at timestamptz NOT NULL,
  deleted_at timestamptz NULL,
  deletion_verification_status text NOT NULL DEFAULT 'PENDING'
    CHECK (deletion_verification_status IN (
      'PENDING', 'VERIFIED', 'DELETION_VERIFICATION_FAILED', 'ESCALATED'
    )),
  malware_scan_result text NOT NULL DEFAULT 'UNAVAILABLE'
    CHECK (malware_scan_result IN ('UNAVAILABLE', 'INFECTED', 'CLEAN')),
  idempotency_key text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_actor_id uuid NULL,
  updated_by_actor_id uuid NULL,
  CONSTRAINT clinical_evidence_items_clinic_org_fk
    FOREIGN KEY (clinic_id, organization_id)
    REFERENCES clinics(id, organization_id),
  CONSTRAINT clinical_evidence_items_no_clean_without_scanner CHECK (
    malware_scan_result <> 'CLEAN'
  ),
  CONSTRAINT clinical_evidence_items_fail_closed_extraction CHECK (
    extraction_status = 'NOT_AUTHORIZED'
    AND confidence_posture = 'NONE'
    AND clinical_authority = 'NOT_AUTHORITATIVE'
  )
);

CREATE UNIQUE INDEX clinical_evidence_items_sha_unique
  ON clinical_evidence_items (organization_id, clinic_id, consultation_id, content_sha256)
  WHERE content_sha256 IS NOT NULL AND processing_status NOT IN ('REJECTED');

CREATE UNIQUE INDEX clinical_evidence_items_idempotency_unique
  ON clinical_evidence_items (
    organization_id, clinic_id, submitted_by_actor_id, idempotency_key
  )
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX clinical_evidence_items_consultation_idx
  ON clinical_evidence_items (organization_id, clinic_id, consultation_id, ingested_at DESC);

CREATE INDEX clinical_evidence_items_expiry_idx
  ON clinical_evidence_items (expires_at)
  WHERE processing_status IN ('STORED_TEMP', 'MALWARE_PENDING', 'DELETE_PENDING');

ALTER TABLE structured_report_findings
  ADD CONSTRAINT structured_report_findings_evidence_fk
  FOREIGN KEY (evidence_item_id) REFERENCES clinical_evidence_items(id);

CREATE TABLE clinical_evidence_blobs (
  evidence_id uuid PRIMARY KEY REFERENCES clinical_evidence_items(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  storage_provider text NOT NULL DEFAULT 'memory_fake'
    CHECK (storage_provider IN ('memory_fake')),
  object_key text NOT NULL,
  encryption_mode text NOT NULL DEFAULT 'NOT_PRODUCTION'
    CHECK (encryption_mode IN ('NOT_PRODUCTION')),
  public_url_forbidden boolean NOT NULL DEFAULT true CHECK (public_url_forbidden),
  bytes_present boolean NOT NULL DEFAULT false,
  last_verified_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinical_evidence_blobs_key_no_traversal CHECK (
    object_key NOT LIKE '%..%'
    AND object_key NOT LIKE '%/%/%/%/%/%/%/%'
    AND object_key ~ '^ehas2/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}/[a-f0-9]{64}$'
  ),
  CONSTRAINT clinical_evidence_blobs_clinic_org_fk
    FOREIGN KEY (clinic_id, organization_id)
    REFERENCES clinics(id, organization_id)
);

CREATE TABLE clinical_evidence_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id uuid NOT NULL REFERENCES clinical_evidence_items(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  job_type text NOT NULL
    CHECK (job_type IN ('DELETE_ORIGINAL', 'VERIFY_DELETION')),
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'LEASED', 'SUCCEEDED', 'FAILED', 'DEAD')),
  attempt integer NOT NULL DEFAULT 0 CHECK (attempt >= 0),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts >= 1),
  lease_expires_at timestamptz NULL,
  locked_by text NULL,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  last_error_code text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinical_evidence_jobs_clinic_org_fk
    FOREIGN KEY (clinic_id, organization_id)
    REFERENCES clinics(id, organization_id)
);

CREATE INDEX clinical_evidence_jobs_claim_idx
  ON clinical_evidence_jobs (status, next_run_at)
  WHERE status IN ('PENDING', 'FAILED');

-- Tenant RLS + FORCE RLS on new tables
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clinical_evidence_items',
    'clinical_evidence_blobs',
    'clinical_evidence_jobs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tenant_isolation', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (ehas2_tenant_ok(organization_id, clinic_id)) WITH CHECK (ehas2_tenant_ok(organization_id, clinic_id))',
      t || '_tenant_isolation',
      t
    );
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON clinical_evidence_items TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON clinical_evidence_blobs TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON clinical_evidence_jobs TO ehas2_app;

-- Append-only audit: no UPDATE/DELETE for the application role
REVOKE UPDATE, DELETE ON audit_events FROM ehas2_app;
GRANT SELECT, INSERT ON audit_events TO ehas2_app;

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_events_select_tenant ON audit_events;
DROP POLICY IF EXISTS audit_events_insert_tenant ON audit_events;
CREATE POLICY audit_events_select_tenant ON audit_events
  FOR SELECT
  USING (ehas2_tenant_ok(organization_id, clinic_id));
CREATE POLICY audit_events_insert_tenant ON audit_events
  FOR INSERT
  WITH CHECK (ehas2_tenant_ok(organization_id, clinic_id));
-- Intentionally no UPDATE/DELETE policies.
