-- F3D-1: append-only source-linked structured fact candidates.
-- Not clinical verification. Not Rules 1–9 / AnalyzeComplete / Rx.
-- FACT_NORMALIZED_SOURCE_LINKED is reserved and must not be written in F3D-1.

CREATE TABLE clinical_fact_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  consultation_id uuid NOT NULL REFERENCES consultations(id),
  source_channel text NOT NULL CHECK (source_channel IN (
    'DOCTOR_DECLARED',
    'STRUCTURED_INTAKE',
    'REVIEWED_REPORT_TEXT'
  )),
  fact_category text NOT NULL CHECK (fact_category IN (
    'SYMPTOM',
    'SIGN',
    'VITAL',
    'LAB_OBSERVATION',
    'IMAGING_REPORT_STATEMENT',
    'SOURCE_STATED_DIAGNOSIS',
    'MEDICATION_HISTORY_STATEMENT',
    'ALLERGY_STATEMENT',
    'NEGATED_FINDING'
  )),
  source_field text NOT NULL CHECK (source_field IN (
    'CHIEF_COMPLAINT',
    'SYMPTOM_ROW',
    'DOCTOR_OBSERVATIONS',
    'HISTORY_NOTES',
    'VITAL_BP_SYSTOLIC',
    'VITAL_BP_DIASTOLIC',
    'VITAL_PULSE',
    'VITAL_TEMPERATURE',
    'VITAL_SPO2',
    'VITAL_WEIGHT',
    'VITAL_HEIGHT',
    'REVIEWED_EXTRACTION_CANDIDATE'
  )),
  intake_symptom_id uuid NULL,
  evidence_item_id uuid NULL REFERENCES clinical_evidence_items(id),
  extraction_run_id uuid NULL REFERENCES clinical_evidence_extraction_runs(id),
  extraction_candidate_id uuid NULL REFERENCES clinical_evidence_extraction_candidates(id),
  review_event_id uuid NULL REFERENCES clinical_evidence_extraction_candidate_reviews(id),
  original_source_span text NOT NULL CHECK (char_length(original_source_span) BETWEEN 1 AND 500),
  asserted_text text NULL
    CHECK (asserted_text IS NULL OR char_length(asserted_text) BETWEEN 1 AND 500),
  asserted_value text NULL
    CHECK (asserted_value IS NULL OR char_length(asserted_value) BETWEEN 1 AND 64),
  unit_text text NULL
    CHECK (unit_text IS NULL OR char_length(unit_text) BETWEEN 1 AND 32),
  unit_posture text NOT NULL CHECK (unit_posture IN (
    'NOT_APPLICABLE',
    'EXACT_AS_SOURCE',
    'UNRESOLVED_UNIT'
  )),
  negated boolean NOT NULL DEFAULT false,
  duration_text text NULL
    CHECK (duration_text IS NULL OR char_length(duration_text) BETWEEN 1 AND 120),
  onset_text text NULL
    CHECK (onset_text IS NULL OR char_length(onset_text) BETWEEN 1 AND 120),
  source_locator jsonb NULL,
  source_identity_fingerprint text NOT NULL CHECK (source_identity_fingerprint ~ '^[a-f0-9]{64}$'),
  content_fingerprint text NOT NULL CHECK (content_fingerprint ~ '^[a-f0-9]{64}$'),
  limitation_codes text[] NOT NULL DEFAULT '{}'::text[],
  confidence numeric NULL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  normalization_method text NOT NULL DEFAULT 'NONE' CHECK (normalization_method = 'NONE'),
  normalization_version text NOT NULL DEFAULT 'none' CHECK (normalization_version = 'none'),
  normalization_fingerprint text NOT NULL CHECK (
    normalization_fingerprint = '793676c471de3ea0d266c258cea95db43195c82702c8642269d17cc2b57dad7a'
  ),
  authority_status text NOT NULL DEFAULT 'FACT_CANDIDATE_UNVERIFIED'
    CHECK (authority_status IN (
      'FACT_CANDIDATE_UNVERIFIED',
      'FACT_NORMALIZED_SOURCE_LINKED'
    )),
  decision_status text NOT NULL CHECK (decision_status IN ('ACTIVE', 'SUPERSEDED')),
  supersedes_fact_id uuid NULL REFERENCES clinical_fact_candidates(id),
  clinically_used boolean NOT NULL DEFAULT false CHECK (clinically_used = false),
  actor_id uuid NOT NULL,
  actor_role text NOT NULL CHECK (actor_role IN ('Doctor', 'ClinicAdmin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinical_fact_candidates_clinic_org_fk
    FOREIGN KEY (clinic_id, organization_id)
    REFERENCES clinics(id, organization_id),
  CONSTRAINT clinical_fact_candidates_f3d1_authority_unverified CHECK (
    authority_status = 'FACT_CANDIDATE_UNVERIFIED'
  ),
  CONSTRAINT clinical_fact_candidates_unit_posture_ok CHECK (
    (
      unit_posture = 'NOT_APPLICABLE'
      AND unit_text IS NULL
    )
    OR (
      unit_posture = 'EXACT_AS_SOURCE'
      AND unit_text IS NOT NULL
    )
    OR (
      unit_posture = 'UNRESOLVED_UNIT'
      AND unit_text IS NULL
    )
  ),
  CONSTRAINT clinical_fact_candidates_channel_shape_ok CHECK (
    (
      source_channel = 'REVIEWED_REPORT_TEXT'
      AND source_field = 'REVIEWED_EXTRACTION_CANDIDATE'
      AND evidence_item_id IS NOT NULL
      AND extraction_run_id IS NOT NULL
      AND extraction_candidate_id IS NOT NULL
      AND review_event_id IS NOT NULL
      AND source_locator IS NOT NULL
      AND intake_symptom_id IS NULL
    )
    OR (
      source_channel IN ('DOCTOR_DECLARED', 'STRUCTURED_INTAKE')
      AND source_field <> 'REVIEWED_EXTRACTION_CANDIDATE'
      AND evidence_item_id IS NULL
      AND extraction_run_id IS NULL
      AND extraction_candidate_id IS NULL
      AND review_event_id IS NULL
      AND source_locator IS NULL
    )
  ),
  CONSTRAINT clinical_fact_candidates_symptom_row_ok CHECK (
    (source_field = 'SYMPTOM_ROW' AND intake_symptom_id IS NOT NULL)
    OR (source_field <> 'SYMPTOM_ROW' AND intake_symptom_id IS NULL)
  ),
  CONSTRAINT clinical_fact_candidates_negated_category_ok CHECK (
    (fact_category = 'NEGATED_FINDING' AND negated = true)
    OR (fact_category <> 'NEGATED_FINDING' AND negated = false)
  ),
  CONSTRAINT clinical_fact_candidates_locator_ok CHECK (
    source_locator IS NULL
    OR (
      jsonb_typeof(source_locator) = 'object'
      AND source_locator <> '{}'::jsonb
      AND (source_locator ? 'page')
      AND jsonb_typeof(source_locator->'page') = 'number'
      AND (source_locator->>'page')::int BETWEEN 1 AND 20
      AND NOT (source_locator ?| ARRAY[
        'object_key', 'objectKey', 'object_url', 'path', 'url', 'filename',
        'storage', 'bucket', 'public_url', 'presigned_url', 'original_filename',
        'credential', 'secret', 'key'
      ])
      AND (
        NOT (source_locator ? 'blockIndex')
        OR (
          jsonb_typeof(source_locator->'blockIndex') = 'number'
          AND (source_locator->>'blockIndex')::int BETWEEN 0 AND 9999
        )
      )
      AND (
        NOT (source_locator ? 'bbox')
        OR (
          jsonb_typeof(source_locator->'bbox') = 'object'
          AND (source_locator->'bbox' ?& ARRAY['x','y','w','h'])
          AND jsonb_typeof(source_locator->'bbox'->'x') = 'number'
          AND jsonb_typeof(source_locator->'bbox'->'y') = 'number'
          AND jsonb_typeof(source_locator->'bbox'->'w') = 'number'
          AND jsonb_typeof(source_locator->'bbox'->'h') = 'number'
        )
      )
    )
  ),
  CONSTRAINT clinical_fact_candidates_limits_ok CHECK (
    limitation_codes <@ ARRAY[
      'SYNTHETIC_FIXTURE_ONLY',
      'NOT_AUTHORITATIVE',
      'NO_NORMALIZATION',
      'UNRESOLVED_UNIT',
      'SOURCE_DECLARED_ONLY',
      'TRANSCRIPTION_ONLY',
      'NO_DISEASE_MAPPING',
      'NO_CLINICAL_VERIFICATION'
    ]::text[]
  )
);

COMMENT ON TABLE clinical_fact_candidates IS
  'F3D-1 append-only source-linked fact candidates. Not clinically verified or usable.';

CREATE UNIQUE INDEX clinical_fact_candidates_active_identity_unique
  ON clinical_fact_candidates (organization_id, clinic_id, source_identity_fingerprint)
  WHERE decision_status = 'ACTIVE';

CREATE INDEX clinical_fact_candidates_consultation_idx
  ON clinical_fact_candidates (
    organization_id, clinic_id, consultation_id, created_at ASC
  );

CREATE INDEX clinical_fact_candidates_evidence_idx
  ON clinical_fact_candidates (
    organization_id, clinic_id, evidence_item_id, created_at DESC
  )
  WHERE evidence_item_id IS NOT NULL;

CREATE OR REPLACE FUNCTION ehas2_fact_candidate_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'FACT_CANDIDATES_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.clinic_id IS DISTINCT FROM OLD.clinic_id
     OR NEW.patient_id IS DISTINCT FROM OLD.patient_id
     OR NEW.consultation_id IS DISTINCT FROM OLD.consultation_id
     OR NEW.source_channel IS DISTINCT FROM OLD.source_channel
     OR NEW.fact_category IS DISTINCT FROM OLD.fact_category
     OR NEW.source_field IS DISTINCT FROM OLD.source_field
     OR NEW.intake_symptom_id IS DISTINCT FROM OLD.intake_symptom_id
     OR NEW.evidence_item_id IS DISTINCT FROM OLD.evidence_item_id
     OR NEW.extraction_run_id IS DISTINCT FROM OLD.extraction_run_id
     OR NEW.extraction_candidate_id IS DISTINCT FROM OLD.extraction_candidate_id
     OR NEW.review_event_id IS DISTINCT FROM OLD.review_event_id
     OR NEW.original_source_span IS DISTINCT FROM OLD.original_source_span
     OR NEW.asserted_text IS DISTINCT FROM OLD.asserted_text
     OR NEW.asserted_value IS DISTINCT FROM OLD.asserted_value
     OR NEW.unit_text IS DISTINCT FROM OLD.unit_text
     OR NEW.unit_posture IS DISTINCT FROM OLD.unit_posture
     OR NEW.negated IS DISTINCT FROM OLD.negated
     OR NEW.duration_text IS DISTINCT FROM OLD.duration_text
     OR NEW.onset_text IS DISTINCT FROM OLD.onset_text
     OR NEW.source_locator IS DISTINCT FROM OLD.source_locator
     OR NEW.source_identity_fingerprint IS DISTINCT FROM OLD.source_identity_fingerprint
     OR NEW.content_fingerprint IS DISTINCT FROM OLD.content_fingerprint
     OR NEW.limitation_codes IS DISTINCT FROM OLD.limitation_codes
     OR NEW.confidence IS DISTINCT FROM OLD.confidence
     OR NEW.normalization_method IS DISTINCT FROM OLD.normalization_method
     OR NEW.normalization_version IS DISTINCT FROM OLD.normalization_version
     OR NEW.normalization_fingerprint IS DISTINCT FROM OLD.normalization_fingerprint
     OR NEW.authority_status IS DISTINCT FROM OLD.authority_status
     OR NEW.supersedes_fact_id IS DISTINCT FROM OLD.supersedes_fact_id
     OR NEW.clinically_used IS DISTINCT FROM OLD.clinically_used
     OR NEW.actor_id IS DISTINCT FROM OLD.actor_id
     OR NEW.actor_role IS DISTINCT FROM OLD.actor_role
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'FACT_CANDIDATES_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  IF OLD.decision_status = 'ACTIVE' AND NEW.decision_status = 'SUPERSEDED' THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'FACT_CANDIDATES_IMMUTABLE' USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER clinical_fact_candidates_append_only
  BEFORE UPDATE OR DELETE ON clinical_fact_candidates
  FOR EACH ROW
  EXECUTE FUNCTION ehas2_fact_candidate_append_only();

ALTER TABLE clinical_fact_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_fact_candidates FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clinical_fact_candidates_tenant_isolation
  ON clinical_fact_candidates;
CREATE POLICY clinical_fact_candidates_tenant_isolation
  ON clinical_fact_candidates
  FOR ALL
  USING (ehas2_tenant_ok(organization_id, clinic_id))
  WITH CHECK (ehas2_tenant_ok(organization_id, clinic_id));

GRANT SELECT, INSERT, UPDATE ON clinical_fact_candidates TO ehas2_app;
REVOKE DELETE ON clinical_fact_candidates FROM ehas2_app;
