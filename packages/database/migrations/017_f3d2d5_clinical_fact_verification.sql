-- F3D-2D5: append-only treating-doctor clinical fact-verification events.
-- Authority SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY = representation review only.
-- Not diagnosis, Rules 1-9, medicine, treatment, Rx, or clinically_used.
-- Parent facts remain FACT_CANDIDATE_UNVERIFIED; norms remain FACT_NORMALIZED_SOURCE_LINKED.

-- 017-owned parent unique targets for composite FKs (non-partial).
CREATE UNIQUE INDEX clinical_fact_candidates_017_verification_parent_uq
  ON clinical_fact_candidates (
    organization_id,
    clinic_id,
    patient_id,
    consultation_id,
    source_channel,
    source_field,
    source_identity_fingerprint,
    content_fingerprint,
    id
  );

CREATE UNIQUE INDEX clinical_fact_normalizations_017_verification_norm_uq
  ON clinical_fact_normalizations (
    organization_id,
    clinic_id,
    source_fact_candidate_id,
    normalization_identity_fingerprint,
    id
  );

CREATE TABLE clinical_fact_verification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  consultation_id uuid NOT NULL REFERENCES consultations(id),
  fact_candidate_id uuid NOT NULL,
  source_channel text NOT NULL CHECK (source_channel IN (
    'DOCTOR_DECLARED',
    'STRUCTURED_INTAKE',
    'REVIEWED_REPORT_TEXT'
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
  source_identity_fingerprint text NOT NULL CHECK (source_identity_fingerprint ~ '^[a-f0-9]{64}$'),
  content_fingerprint text NOT NULL CHECK (content_fingerprint ~ '^[a-f0-9]{64}$'),
  normalization_snapshot_fingerprint text NOT NULL CHECK (normalization_snapshot_fingerprint ~ '^[a-f0-9]{64}$'),
  normalization_count integer NOT NULL CHECK (normalization_count >= 0 AND normalization_count <= 32),
  action text NOT NULL CHECK (action IN (
    'ACCEPT_SOURCE_LINKED_FACT',
    'REJECT_SOURCE_LINKED_FACT',
    'MARK_UNRESOLVED',
    'REQUEST_SOURCE_CORRECTION'
  )),
  reason_code text NOT NULL CHECK (reason_code IN (
    'SOURCE_REPRESENTATION_REVIEWED',
    'SOURCE_REPRESENTATION_INACCURATE',
    'SOURCE_STALE_OR_CONFLICTING',
    'INSUFFICIENT_SOURCE_CONTEXT',
    'NORMALIZATION_SCOPE_UNRESOLVED',
    'SOURCE_TEXT_CORRECTION_REQUIRED',
    'SOURCE_VALUE_CORRECTION_REQUIRED'
  )),
  authority_scope text NOT NULL DEFAULT 'SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY'
    CHECK (authority_scope = 'SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY'),
  decision_status text NOT NULL CHECK (decision_status IN ('ACTIVE', 'SUPERSEDED')),
  supersedes_verification_id uuid NULL
    REFERENCES clinical_fact_verification_events(id),
  actor_id uuid NOT NULL,
  actor_role text NOT NULL CHECK (actor_role = 'Doctor'),
  clinically_used boolean NOT NULL DEFAULT false CHECK (clinically_used = false),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinical_fact_verification_events_clinic_org_fk
    FOREIGN KEY (clinic_id, organization_id)
    REFERENCES clinics(id, organization_id),
  CONSTRAINT clinical_fact_verification_events_parent_link_fk
    FOREIGN KEY (
      organization_id,
      clinic_id,
      patient_id,
      consultation_id,
      source_channel,
      source_field,
      source_identity_fingerprint,
      content_fingerprint,
      fact_candidate_id
    )
    REFERENCES clinical_fact_candidates (
      organization_id,
      clinic_id,
      patient_id,
      consultation_id,
      source_channel,
      source_field,
      source_identity_fingerprint,
      content_fingerprint,
      id
    ),
  CONSTRAINT clinical_fact_verification_events_action_reason_ok CHECK (
    (action = 'ACCEPT_SOURCE_LINKED_FACT' AND reason_code IN (
      'SOURCE_REPRESENTATION_REVIEWED'
    ))
    OR (action = 'REJECT_SOURCE_LINKED_FACT' AND reason_code IN (
      'SOURCE_REPRESENTATION_INACCURATE',
      'SOURCE_STALE_OR_CONFLICTING'
    ))
    OR (action = 'MARK_UNRESOLVED' AND reason_code IN (
      'INSUFFICIENT_SOURCE_CONTEXT',
      'NORMALIZATION_SCOPE_UNRESOLVED'
    ))
    OR (action = 'REQUEST_SOURCE_CORRECTION' AND reason_code IN (
      'SOURCE_TEXT_CORRECTION_REQUIRED',
      'SOURCE_VALUE_CORRECTION_REQUIRED'
    ))
  )
);

COMMENT ON TABLE clinical_fact_verification_events IS
  'F3D-2D5 append-only treating-doctor source-linked fact representation review. Authority SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY only. Not diagnosis, Rules, medicine, Rx, or clinically_used.';

CREATE UNIQUE INDEX clinical_fact_verification_events_active_fact_unique
  ON clinical_fact_verification_events (organization_id, clinic_id, fact_candidate_id)
  WHERE decision_status = 'ACTIVE';

CREATE INDEX clinical_fact_verification_events_consultation_idx
  ON clinical_fact_verification_events (
    organization_id, clinic_id, consultation_id, created_at ASC
  );

CREATE INDEX clinical_fact_verification_events_fact_idx
  ON clinical_fact_verification_events (
    organization_id, clinic_id, fact_candidate_id, created_at DESC
  );

-- 017-owned composite unique for child snapshot FK (id + tenant + fact).
CREATE UNIQUE INDEX clinical_fact_verification_events_017_child_parent_uq
  ON clinical_fact_verification_events (id, organization_id, clinic_id, fact_candidate_id);

CREATE OR REPLACE FUNCTION ehas2_fact_verification_event_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'FACT_VERIFICATIONS_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.clinic_id IS DISTINCT FROM OLD.clinic_id
     OR NEW.patient_id IS DISTINCT FROM OLD.patient_id
     OR NEW.consultation_id IS DISTINCT FROM OLD.consultation_id
     OR NEW.fact_candidate_id IS DISTINCT FROM OLD.fact_candidate_id
     OR NEW.source_channel IS DISTINCT FROM OLD.source_channel
     OR NEW.source_field IS DISTINCT FROM OLD.source_field
     OR NEW.source_identity_fingerprint IS DISTINCT FROM OLD.source_identity_fingerprint
     OR NEW.content_fingerprint IS DISTINCT FROM OLD.content_fingerprint
     OR NEW.normalization_snapshot_fingerprint IS DISTINCT FROM OLD.normalization_snapshot_fingerprint
     OR NEW.normalization_count IS DISTINCT FROM OLD.normalization_count
     OR NEW.action IS DISTINCT FROM OLD.action
     OR NEW.reason_code IS DISTINCT FROM OLD.reason_code
     OR NEW.authority_scope IS DISTINCT FROM OLD.authority_scope
     OR NEW.supersedes_verification_id IS DISTINCT FROM OLD.supersedes_verification_id
     OR NEW.actor_id IS DISTINCT FROM OLD.actor_id
     OR NEW.actor_role IS DISTINCT FROM OLD.actor_role
     OR NEW.clinically_used IS DISTINCT FROM OLD.clinically_used
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'FACT_VERIFICATIONS_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  IF OLD.decision_status = 'ACTIVE' AND NEW.decision_status = 'SUPERSEDED' THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'FACT_VERIFICATIONS_IMMUTABLE' USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER clinical_fact_verification_events_append_only
  BEFORE UPDATE OR DELETE ON clinical_fact_verification_events
  FOR EACH ROW
  EXECUTE FUNCTION ehas2_fact_verification_event_append_only();

ALTER TABLE clinical_fact_verification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_fact_verification_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clinical_fact_verification_events_tenant_isolation
  ON clinical_fact_verification_events;
CREATE POLICY clinical_fact_verification_events_tenant_isolation
  ON clinical_fact_verification_events
  FOR ALL
  USING (ehas2_tenant_ok(organization_id, clinic_id))
  WITH CHECK (ehas2_tenant_ok(organization_id, clinic_id));

GRANT SELECT, INSERT, UPDATE ON clinical_fact_verification_events TO ehas2_app;
REVOKE DELETE ON clinical_fact_verification_events FROM ehas2_app;

CREATE TABLE clinical_fact_verification_normalizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_event_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  clinic_id uuid NOT NULL,
  fact_candidate_id uuid NOT NULL,
  normalization_id uuid NOT NULL,
  normalization_identity_fingerprint text NOT NULL CHECK (normalization_identity_fingerprint ~ '^[a-f0-9]{64}$'),
  snapshot_ordinal integer NOT NULL CHECK (snapshot_ordinal >= 0 AND snapshot_ordinal < 32),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinical_fact_verification_normalizations_event_fk
    FOREIGN KEY (verification_event_id, organization_id, clinic_id, fact_candidate_id)
    REFERENCES clinical_fact_verification_events (
      id, organization_id, clinic_id, fact_candidate_id
    ),
  CONSTRAINT clinical_fact_verification_normalizations_norm_fk
    FOREIGN KEY (
      organization_id,
      clinic_id,
      fact_candidate_id,
      normalization_identity_fingerprint,
      normalization_id
    )
    REFERENCES clinical_fact_normalizations (
      organization_id,
      clinic_id,
      source_fact_candidate_id,
      normalization_identity_fingerprint,
      id
    ),
  CONSTRAINT clinical_fact_verification_normalizations_clinic_org_fk
    FOREIGN KEY (clinic_id, organization_id)
    REFERENCES clinics(id, organization_id),
  CONSTRAINT clinical_fact_verification_normalizations_uq
    UNIQUE (verification_event_id, normalization_id),
  CONSTRAINT clinical_fact_verification_normalizations_ord_uq
    UNIQUE (verification_event_id, snapshot_ordinal)
);

COMMENT ON TABLE clinical_fact_verification_normalizations IS
  'F3D-2D5 exact ACTIVE normalization snapshot binding for a verification event. IDs and fingerprints only; no labels/spans/source values.';

CREATE INDEX clinical_fact_verification_normalizations_event_idx
  ON clinical_fact_verification_normalizations (verification_event_id, snapshot_ordinal ASC);

CREATE OR REPLACE FUNCTION ehas2_fact_verification_norm_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'FACT_VERIFICATION_NORMS_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  RAISE EXCEPTION 'FACT_VERIFICATION_NORMS_IMMUTABLE' USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER clinical_fact_verification_normalizations_append_only
  BEFORE UPDATE OR DELETE ON clinical_fact_verification_normalizations
  FOR EACH ROW
  EXECUTE FUNCTION ehas2_fact_verification_norm_append_only();

ALTER TABLE clinical_fact_verification_normalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_fact_verification_normalizations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clinical_fact_verification_normalizations_tenant_isolation
  ON clinical_fact_verification_normalizations;
CREATE POLICY clinical_fact_verification_normalizations_tenant_isolation
  ON clinical_fact_verification_normalizations
  FOR ALL
  USING (ehas2_tenant_ok(organization_id, clinic_id))
  WITH CHECK (ehas2_tenant_ok(organization_id, clinic_id));

GRANT SELECT, INSERT ON clinical_fact_verification_normalizations TO ehas2_app;
REVOKE UPDATE, DELETE ON clinical_fact_verification_normalizations FROM ehas2_app;
