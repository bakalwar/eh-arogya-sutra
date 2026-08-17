-- F3A: source-linked extraction candidates. Not clinical authority.
-- Production extraction_status on evidence items remains NOT_AUTHORIZED.
-- Do not write unverified candidates into structured_report_findings.

ALTER TABLE clinical_evidence_jobs
  DROP CONSTRAINT IF EXISTS clinical_evidence_jobs_job_type_check;

ALTER TABLE clinical_evidence_jobs
  ADD CONSTRAINT clinical_evidence_jobs_job_type_check
  CHECK (job_type IN ('DELETE_ORIGINAL', 'VERIFY_DELETION', 'EXTRACT_CANDIDATES'));

CREATE UNIQUE INDEX clinical_evidence_jobs_extract_open_unique
  ON clinical_evidence_jobs (evidence_id)
  WHERE job_type = 'EXTRACT_CANDIDATES'
    AND status IN ('PENDING', 'LEASED', 'FAILED');

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
    AND NOT (metadata ? 'raw_text')
    AND NOT (metadata ? 'normalized_text')
    AND NOT (metadata ? 'extracted_text')
    AND NOT (metadata ? 'ocr_text')
    AND NOT (metadata ? 'candidate_text')
  );

CREATE TABLE clinical_evidence_extraction_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  consultation_id uuid NOT NULL REFERENCES consultations(id),
  evidence_item_id uuid NOT NULL REFERENCES clinical_evidence_items(id),
  job_id uuid NULL REFERENCES clinical_evidence_jobs(id),
  extractor_name text NOT NULL CHECK (char_length(extractor_name) BETWEEN 1 AND 80),
  extractor_version text NOT NULL CHECK (char_length(extractor_version) BETWEEN 1 AND 40),
  model_or_langpack_version text NOT NULL CHECK (char_length(model_or_langpack_version) BETWEEN 1 AND 80),
  method text NOT NULL CHECK (method IN ('DETERMINISTIC_FIXTURE')),
  extractor_fingerprint text NOT NULL CHECK (extractor_fingerprint ~ '^[a-f0-9]{64}$'),
  input_content_sha256 text NULL CHECK (input_content_sha256 IS NULL OR input_content_sha256 ~ '^[a-f0-9]{64}$'),
  status text NOT NULL
    CHECK (status IN ('EXTRACTED_UNVERIFIED', 'REJECTED', 'SUPERSEDED')),
  limitation_codes text[] NOT NULL DEFAULT '{}'::text[],
  candidate_count integer NOT NULL DEFAULT 0
    CHECK (candidate_count >= 0 AND candidate_count <= 80),
  superseded_by_run_id uuid NULL REFERENCES clinical_evidence_extraction_runs(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinical_evidence_extraction_runs_clinic_org_fk
    FOREIGN KEY (clinic_id, organization_id)
    REFERENCES clinics(id, organization_id),
  CONSTRAINT clinical_evidence_extraction_runs_limits_ok CHECK (
    limitation_codes <@ ARRAY[
      'SCANNER_NOT_CLEAN',
      'EXTRACTION_NOT_CONNECTED',
      'MALFORMED_DOCUMENT',
      'UNSUPPORTED_TYPE',
      'PHOTO_DIAGNOSIS_FORBIDDEN',
      'IMAGE_INTERPRETATION_FORBIDDEN',
      'TIMEOUT',
      'LOW_CONFIDENCE',
      'PARTIAL_EXTRACTION',
      'ORIGINAL_UNAVAILABLE',
      'BYTE_LIMIT',
      'PAGE_LIMIT',
      'TEXT_LIMIT',
      'DUPLICATE_RUN',
      'SUPERSEDED_BY_NEWER_EXTRACTOR',
      'SYNTHETIC_FIXTURE_ONLY',
      'NOT_AUTHORITATIVE',
      'NO_TRANSLATION',
      'UNSUPPORTED_LANGUAGE'
    ]::text[]
  )
);

CREATE UNIQUE INDEX clinical_evidence_extraction_runs_idempotent
  ON clinical_evidence_extraction_runs (evidence_item_id, extractor_fingerprint)
  WHERE status <> 'SUPERSEDED';

CREATE INDEX clinical_evidence_extraction_runs_evidence_idx
  ON clinical_evidence_extraction_runs (organization_id, clinic_id, evidence_item_id, created_at DESC);

CREATE TABLE clinical_evidence_extraction_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_run_id uuid NOT NULL REFERENCES clinical_evidence_extraction_runs(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  consultation_id uuid NOT NULL REFERENCES consultations(id),
  evidence_item_id uuid NOT NULL REFERENCES clinical_evidence_items(id),
  page_number integer NOT NULL CHECK (page_number >= 1 AND page_number <= 20),
  source_locator jsonb NOT NULL,
  candidate_type text NOT NULL
    CHECK (candidate_type IN (
      'DOCUMENT_METADATA',
      'PAGE_BLOCK_TEXT',
      'REPORT_HEADING',
      'TEST_ANALYTE_LABEL',
      'TEXTUAL_VALUE',
      'UNIT',
      'REFERENCE_RANGE_TEXT',
      'DATE',
      'REPORT_SECTION',
      'WRITTEN_IMPRESSION_TEXT',
      'CONFIDENCE_OR_LIMITATION'
    )),
  raw_text text NOT NULL CHECK (char_length(raw_text) BETWEEN 1 AND 500),
  normalized_text text NULL CHECK (normalized_text IS NULL OR char_length(normalized_text) BETWEEN 1 AND 500),
  unit_text text NULL CHECK (unit_text IS NULL OR char_length(unit_text) BETWEEN 1 AND 32),
  reference_range_text text NULL
    CHECK (reference_range_text IS NULL OR char_length(reference_range_text) BETWEEN 1 AND 120),
  method text NOT NULL CHECK (method IN ('DETERMINISTIC_FIXTURE')),
  extractor_name text NOT NULL,
  extractor_version text NOT NULL,
  model_or_langpack_version text NOT NULL,
  confidence numeric NULL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  status text NOT NULL
    CHECK (status IN ('EXTRACTED_UNVERIFIED', 'REJECTED', 'SUPERSEDED')),
  limitation_codes text[] NOT NULL DEFAULT '{}'::text[],
  content_fingerprint text NOT NULL CHECK (content_fingerprint ~ '^[a-f0-9]{64}$'),
  verification_posture text NOT NULL DEFAULT 'UNVERIFIED'
    CHECK (verification_posture = 'UNVERIFIED'),
  script_hint text NOT NULL DEFAULT 'Unknown'
    CHECK (script_hint IN ('Latn', 'Deva', 'Mixed', 'Unknown')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinical_evidence_extraction_candidates_clinic_org_fk
    FOREIGN KEY (clinic_id, organization_id)
    REFERENCES clinics(id, organization_id),
  CONSTRAINT clinical_evidence_extraction_candidates_locator_ok CHECK (
    jsonb_typeof(source_locator) = 'object'
    AND (source_locator ? 'page')
    AND jsonb_typeof(source_locator->'page') = 'number'
    AND (source_locator->>'page')::int BETWEEN 1 AND 20
    AND NOT (source_locator ?| ARRAY[
      'object_key', 'objectKey', 'object_url', 'path', 'url', 'filename',
      'storage', 'bucket', 'public_url', 'presigned_url'
    ])
  ),
  CONSTRAINT clinical_evidence_extraction_candidates_heading_bound CHECK (
    candidate_type <> 'REPORT_HEADING' OR char_length(raw_text) <= 200
  ),
  CONSTRAINT clinical_evidence_extraction_candidates_limits_ok CHECK (
    limitation_codes <@ ARRAY[
      'SCANNER_NOT_CLEAN',
      'EXTRACTION_NOT_CONNECTED',
      'MALFORMED_DOCUMENT',
      'UNSUPPORTED_TYPE',
      'PHOTO_DIAGNOSIS_FORBIDDEN',
      'IMAGE_INTERPRETATION_FORBIDDEN',
      'TIMEOUT',
      'LOW_CONFIDENCE',
      'PARTIAL_EXTRACTION',
      'ORIGINAL_UNAVAILABLE',
      'BYTE_LIMIT',
      'PAGE_LIMIT',
      'TEXT_LIMIT',
      'DUPLICATE_RUN',
      'SUPERSEDED_BY_NEWER_EXTRACTOR',
      'SYNTHETIC_FIXTURE_ONLY',
      'NOT_AUTHORITATIVE',
      'NO_TRANSLATION',
      'UNSUPPORTED_LANGUAGE'
    ]::text[]
  )
);

CREATE INDEX clinical_evidence_extraction_candidates_run_idx
  ON clinical_evidence_extraction_candidates (extraction_run_id, page_number, created_at);

CREATE INDEX clinical_evidence_extraction_candidates_evidence_idx
  ON clinical_evidence_extraction_candidates (
    organization_id, clinic_id, evidence_item_id, created_at DESC
  );

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clinical_evidence_extraction_runs',
    'clinical_evidence_extraction_candidates'
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

GRANT SELECT, INSERT, UPDATE, DELETE ON clinical_evidence_extraction_runs TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON clinical_evidence_extraction_candidates TO ehas2_app;
