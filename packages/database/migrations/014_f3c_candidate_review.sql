-- F3C: append-only source-linked extraction candidate review events.
-- Does not mutate original candidate text. Does not grant clinical authority.
-- ACCEPT_AS_SOURCE_TEXT means transcription of written source only.

CREATE TABLE clinical_evidence_extraction_candidate_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  consultation_id uuid NOT NULL REFERENCES consultations(id),
  evidence_item_id uuid NOT NULL REFERENCES clinical_evidence_items(id),
  extraction_run_id uuid NOT NULL REFERENCES clinical_evidence_extraction_runs(id),
  candidate_id uuid NOT NULL REFERENCES clinical_evidence_extraction_candidates(id),
  action text NOT NULL CHECK (action IN (
    'ACCEPT_AS_SOURCE_TEXT',
    'CORRECT_SOURCE_TEXT',
    'REJECT_SOURCE_TEXT',
    'MARK_UNRESOLVED'
  )),
  actor_id uuid NOT NULL,
  actor_role text NOT NULL CHECK (actor_role IN ('Doctor', 'ClinicAdmin')),
  reason_code text NOT NULL CHECK (reason_code IN (
    'SOURCE_TEXT_MATCHES_PAGE',
    'SOURCE_TEXT_MISREAD',
    'SOURCE_TEXT_NOT_PRESENT',
    'SOURCE_TEXT_UNCERTAIN',
    'OCR_ARTIFACT',
    'PARTIAL_PAGE',
    'LOW_CONFIDENCE_VISIBLE',
    'SYNTHETIC_FIXTURE_REVIEW'
  )),
  original_raw_text text NOT NULL CHECK (char_length(original_raw_text) BETWEEN 1 AND 500),
  original_normalized_text text NULL
    CHECK (original_normalized_text IS NULL OR char_length(original_normalized_text) BETWEEN 1 AND 500),
  corrected_raw_text text NULL
    CHECK (corrected_raw_text IS NULL OR char_length(corrected_raw_text) BETWEEN 1 AND 500),
  corrected_normalized_text text NULL
    CHECK (corrected_normalized_text IS NULL OR char_length(corrected_normalized_text) BETWEEN 1 AND 500),
  source_locator jsonb NOT NULL,
  supersedes_review_id uuid NULL
    REFERENCES clinical_evidence_extraction_candidate_reviews(id),
  decision_status text NOT NULL CHECK (decision_status IN ('ACTIVE', 'SUPERSEDED')),
  authority_scope text NOT NULL DEFAULT 'SOURCE_TEXT_TRANSCRIPTION_ONLY'
    CHECK (authority_scope = 'SOURCE_TEXT_TRANSCRIPTION_ONLY'),
  clinically_used boolean NOT NULL DEFAULT false CHECK (clinically_used = false),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinical_evidence_extraction_candidate_reviews_clinic_org_fk
    FOREIGN KEY (clinic_id, organization_id)
    REFERENCES clinics(id, organization_id),
  CONSTRAINT clinical_evidence_extraction_candidate_reviews_action_text_ok CHECK (
    (
      action <> 'CORRECT_SOURCE_TEXT'
      AND corrected_raw_text IS NULL
      AND corrected_normalized_text IS NULL
    )
    OR (
      action = 'CORRECT_SOURCE_TEXT'
      AND corrected_raw_text IS NOT NULL
      AND char_length(corrected_raw_text) BETWEEN 1 AND 500
      AND corrected_raw_text IS DISTINCT FROM original_raw_text
    )
  ),
  CONSTRAINT clinical_evidence_extraction_candidate_reviews_reason_ok CHECK (
    (action = 'ACCEPT_AS_SOURCE_TEXT' AND reason_code IN (
      'SOURCE_TEXT_MATCHES_PAGE', 'SYNTHETIC_FIXTURE_REVIEW'
    ))
    OR (action = 'CORRECT_SOURCE_TEXT' AND reason_code IN (
      'SOURCE_TEXT_MISREAD', 'OCR_ARTIFACT', 'PARTIAL_PAGE', 'SYNTHETIC_FIXTURE_REVIEW'
    ))
    OR (action = 'REJECT_SOURCE_TEXT' AND reason_code IN (
      'SOURCE_TEXT_NOT_PRESENT', 'OCR_ARTIFACT', 'SYNTHETIC_FIXTURE_REVIEW'
    ))
    OR (action = 'MARK_UNRESOLVED' AND reason_code IN (
      'SOURCE_TEXT_UNCERTAIN', 'LOW_CONFIDENCE_VISIBLE', 'PARTIAL_PAGE', 'SYNTHETIC_FIXTURE_REVIEW'
    ))
  ),
  CONSTRAINT clinical_evidence_extraction_candidate_reviews_locator_ok CHECK (
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
        AND (source_locator->'bbox'->>'x')::numeric >= 0
        AND (source_locator->'bbox'->>'y')::numeric >= 0
        AND (source_locator->'bbox'->>'w')::numeric > 0
        AND (source_locator->'bbox'->>'h')::numeric > 0
        AND (source_locator->'bbox'->>'w')::numeric <= 1
        AND (source_locator->'bbox'->>'h')::numeric <= 1
      )
    )
  )
);

COMMENT ON TABLE clinical_evidence_extraction_candidate_reviews IS
  'F3C append-only source-text review. ACCEPT_AS_SOURCE_TEXT is transcription-only; never clinical authority.';

CREATE UNIQUE INDEX clinical_evidence_extraction_candidate_reviews_active_unique
  ON clinical_evidence_extraction_candidate_reviews (candidate_id)
  WHERE decision_status = 'ACTIVE';

CREATE INDEX clinical_evidence_extraction_candidate_reviews_candidate_idx
  ON clinical_evidence_extraction_candidate_reviews (
    organization_id, clinic_id, candidate_id, created_at ASC
  );

CREATE INDEX clinical_evidence_extraction_candidate_reviews_evidence_idx
  ON clinical_evidence_extraction_candidate_reviews (
    organization_id, clinic_id, evidence_item_id, created_at DESC
  );

CREATE OR REPLACE FUNCTION ehas2_candidate_review_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'REVIEW_EVENTS_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.clinic_id IS DISTINCT FROM OLD.clinic_id
     OR NEW.patient_id IS DISTINCT FROM OLD.patient_id
     OR NEW.consultation_id IS DISTINCT FROM OLD.consultation_id
     OR NEW.evidence_item_id IS DISTINCT FROM OLD.evidence_item_id
     OR NEW.extraction_run_id IS DISTINCT FROM OLD.extraction_run_id
     OR NEW.candidate_id IS DISTINCT FROM OLD.candidate_id
     OR NEW.action IS DISTINCT FROM OLD.action
     OR NEW.actor_id IS DISTINCT FROM OLD.actor_id
     OR NEW.actor_role IS DISTINCT FROM OLD.actor_role
     OR NEW.reason_code IS DISTINCT FROM OLD.reason_code
     OR NEW.original_raw_text IS DISTINCT FROM OLD.original_raw_text
     OR NEW.original_normalized_text IS DISTINCT FROM OLD.original_normalized_text
     OR NEW.corrected_raw_text IS DISTINCT FROM OLD.corrected_raw_text
     OR NEW.corrected_normalized_text IS DISTINCT FROM OLD.corrected_normalized_text
     OR NEW.source_locator IS DISTINCT FROM OLD.source_locator
     OR NEW.supersedes_review_id IS DISTINCT FROM OLD.supersedes_review_id
     OR NEW.authority_scope IS DISTINCT FROM OLD.authority_scope
     OR NEW.clinically_used IS DISTINCT FROM OLD.clinically_used
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'REVIEW_EVENTS_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  IF OLD.decision_status = 'ACTIVE' AND NEW.decision_status = 'SUPERSEDED' THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'REVIEW_EVENTS_IMMUTABLE' USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER clinical_evidence_extraction_candidate_reviews_append_only
  BEFORE UPDATE OR DELETE ON clinical_evidence_extraction_candidate_reviews
  FOR EACH ROW
  EXECUTE FUNCTION ehas2_candidate_review_append_only();

ALTER TABLE clinical_evidence_extraction_candidate_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_evidence_extraction_candidate_reviews FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clinical_evidence_extraction_candidate_reviews_tenant_isolation
  ON clinical_evidence_extraction_candidate_reviews;
CREATE POLICY clinical_evidence_extraction_candidate_reviews_tenant_isolation
  ON clinical_evidence_extraction_candidate_reviews
  FOR ALL
  USING (ehas2_tenant_ok(organization_id, clinic_id))
  WITH CHECK (ehas2_tenant_ok(organization_id, clinic_id));

GRANT SELECT, INSERT, UPDATE ON clinical_evidence_extraction_candidate_reviews TO ehas2_app;
REVOKE DELETE ON clinical_evidence_extraction_candidate_reviews FROM ehas2_app;
