-- F3D-2D1: append-only source-linked fact-normalization child events.
-- Parent clinical_fact_candidates rows stay FACT_CANDIDATE_UNVERIFIED.
-- FACT_NORMALIZED_SOURCE_LINKED is child-event authority only — not diagnosis,
-- clinical verification, Rules 1–9, medicine, or clinically usable findings.
-- No cue-match row persistence. No normalizer execution in this migration.
-- Parent linkage is composite-bound; callers must not invent tenant/patient/source fields.

-- 016-owned parent unique target for child composite FK (non-partial).
CREATE UNIQUE INDEX clinical_fact_candidates_016_norm_parent_uq
  ON clinical_fact_candidates (
    organization_id,
    clinic_id,
    patient_id,
    consultation_id,
    source_channel,
    source_field,
    source_identity_fingerprint,
    id
  );

CREATE TABLE clinical_fact_normalizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  consultation_id uuid NOT NULL REFERENCES consultations(id),
  source_fact_candidate_id uuid NOT NULL,
  source_identity_fingerprint text NOT NULL CHECK (source_identity_fingerprint ~ '^[a-f0-9]{64}$'),
  normalization_identity_fingerprint text NOT NULL CHECK (normalization_identity_fingerprint ~ '^[a-f0-9]{64}$'),
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
  normalization_kind text NOT NULL CHECK (normalization_kind IN (
    'UNIT_ALIAS',
    'DURATION_PHRASE',
    'NEGATION_CUE'
  )),
  canonical_label text NOT NULL CHECK (char_length(canonical_label) BETWEEN 1 AND 120),
  negation_scope text NULL
    CHECK (
      negation_scope IS NULL
      OR negation_scope = 'SCOPE_UNRESOLVED'
    ),
  cue_entry_ids text[] NOT NULL DEFAULT '{}'::text[]
    CHECK (coalesce(cardinality(cue_entry_ids), 0) <= 8),
  pack_id text NOT NULL CHECK (char_length(pack_id) BETWEEN 1 AND 64),
  pack_version text NOT NULL CHECK (char_length(pack_version) BETWEEN 1 AND 32),
  pack_content_checksum text NOT NULL CHECK (pack_content_checksum ~ '^[a-f0-9]{64}$'),
  parser_version text NOT NULL CHECK (char_length(parser_version) BETWEEN 1 AND 64),
  parser_fingerprint text NOT NULL CHECK (parser_fingerprint ~ '^[a-f0-9]{64}$'),
  normalizer_method text NOT NULL CHECK (normalizer_method IN (
    'OWNER_FROZEN_SOURCE_PRESERVING_V1'
  )),
  normalizer_version text NOT NULL CHECK (char_length(normalizer_version) BETWEEN 1 AND 32),
  normalizer_fingerprint text NOT NULL CHECK (normalizer_fingerprint ~ '^[a-f0-9]{64}$'),
  authority_scope text NOT NULL DEFAULT 'FACT_NORMALIZED_SOURCE_LINKED'
    CHECK (authority_scope = 'FACT_NORMALIZED_SOURCE_LINKED'),
  decision_status text NOT NULL CHECK (decision_status IN ('ACTIVE', 'SUPERSEDED')),
  supersedes_normalization_id uuid NULL
    REFERENCES clinical_fact_normalizations(id),
  limitation_codes text[] NOT NULL DEFAULT '{}'::text[],
  clinically_used boolean NOT NULL DEFAULT false CHECK (clinically_used = false),
  actor_id uuid NOT NULL,
  actor_role text NOT NULL CHECK (actor_role IN ('Doctor', 'ClinicAdmin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinical_fact_normalizations_clinic_org_fk
    FOREIGN KEY (clinic_id, organization_id)
    REFERENCES clinics(id, organization_id),
  CONSTRAINT clinical_fact_normalizations_parent_link_fk
    FOREIGN KEY (
      organization_id,
      clinic_id,
      patient_id,
      consultation_id,
      source_channel,
      source_field,
      source_identity_fingerprint,
      source_fact_candidate_id
    )
    REFERENCES clinical_fact_candidates (
      organization_id,
      clinic_id,
      patient_id,
      consultation_id,
      source_channel,
      source_field,
      source_identity_fingerprint,
      id
    ),
  CONSTRAINT clinical_fact_normalizations_negation_kind_ok CHECK (
    (
      normalization_kind = 'NEGATION_CUE'
      AND negation_scope = 'SCOPE_UNRESOLVED'
    )
    OR (
      normalization_kind IN ('UNIT_ALIAS', 'DURATION_PHRASE')
      AND negation_scope IS NULL
    )
  ),
  CONSTRAINT clinical_fact_normalizations_limits_ok CHECK (
    limitation_codes <@ ARRAY[
      'NOT_AUTHORITATIVE',
      'NO_CLINICAL_VERIFICATION',
      'NO_DISEASE_MAPPING',
      'SOURCE_LINKED_NORMALIZATION_ONLY',
      'SCOPE_UNRESOLVED',
      'SYNTHETIC_FIXTURE_ONLY',
      'NO_UNIT_CONVERSION',
      'RECOMPUTE_CUES_FROM_SOURCE'
    ]::text[]
  )
);

COMMENT ON TABLE clinical_fact_normalizations IS
  'F3D-2D1 append-only fact-normalization child events. Not clinical verification, diagnosis, Rules, or Rx. Parent facts remain FACT_CANDIDATE_UNVERIFIED.';

CREATE UNIQUE INDEX clinical_fact_normalizations_active_identity_unique
  ON clinical_fact_normalizations (organization_id, clinic_id, normalization_identity_fingerprint)
  WHERE decision_status = 'ACTIVE';

CREATE INDEX clinical_fact_normalizations_consultation_idx
  ON clinical_fact_normalizations (
    organization_id, clinic_id, consultation_id, created_at ASC
  );

CREATE INDEX clinical_fact_normalizations_parent_fact_idx
  ON clinical_fact_normalizations (
    organization_id, clinic_id, source_fact_candidate_id, created_at DESC
  );

CREATE OR REPLACE FUNCTION ehas2_fact_normalization_append_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'FACT_NORMALIZATIONS_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.clinic_id IS DISTINCT FROM OLD.clinic_id
     OR NEW.patient_id IS DISTINCT FROM OLD.patient_id
     OR NEW.consultation_id IS DISTINCT FROM OLD.consultation_id
     OR NEW.source_fact_candidate_id IS DISTINCT FROM OLD.source_fact_candidate_id
     OR NEW.source_identity_fingerprint IS DISTINCT FROM OLD.source_identity_fingerprint
     OR NEW.normalization_identity_fingerprint IS DISTINCT FROM OLD.normalization_identity_fingerprint
     OR NEW.source_channel IS DISTINCT FROM OLD.source_channel
     OR NEW.source_field IS DISTINCT FROM OLD.source_field
     OR NEW.normalization_kind IS DISTINCT FROM OLD.normalization_kind
     OR NEW.canonical_label IS DISTINCT FROM OLD.canonical_label
     OR NEW.negation_scope IS DISTINCT FROM OLD.negation_scope
     OR NEW.cue_entry_ids IS DISTINCT FROM OLD.cue_entry_ids
     OR NEW.pack_id IS DISTINCT FROM OLD.pack_id
     OR NEW.pack_version IS DISTINCT FROM OLD.pack_version
     OR NEW.pack_content_checksum IS DISTINCT FROM OLD.pack_content_checksum
     OR NEW.parser_version IS DISTINCT FROM OLD.parser_version
     OR NEW.parser_fingerprint IS DISTINCT FROM OLD.parser_fingerprint
     OR NEW.normalizer_method IS DISTINCT FROM OLD.normalizer_method
     OR NEW.normalizer_version IS DISTINCT FROM OLD.normalizer_version
     OR NEW.normalizer_fingerprint IS DISTINCT FROM OLD.normalizer_fingerprint
     OR NEW.authority_scope IS DISTINCT FROM OLD.authority_scope
     OR NEW.supersedes_normalization_id IS DISTINCT FROM OLD.supersedes_normalization_id
     OR NEW.limitation_codes IS DISTINCT FROM OLD.limitation_codes
     OR NEW.clinically_used IS DISTINCT FROM OLD.clinically_used
     OR NEW.actor_id IS DISTINCT FROM OLD.actor_id
     OR NEW.actor_role IS DISTINCT FROM OLD.actor_role
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'FACT_NORMALIZATIONS_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  IF OLD.decision_status = 'ACTIVE' AND NEW.decision_status = 'SUPERSEDED' THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'FACT_NORMALIZATIONS_IMMUTABLE' USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER clinical_fact_normalizations_append_only
  BEFORE UPDATE OR DELETE ON clinical_fact_normalizations
  FOR EACH ROW
  EXECUTE FUNCTION ehas2_fact_normalization_append_only();

ALTER TABLE clinical_fact_normalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_fact_normalizations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clinical_fact_normalizations_tenant_isolation
  ON clinical_fact_normalizations;
CREATE POLICY clinical_fact_normalizations_tenant_isolation
  ON clinical_fact_normalizations
  FOR ALL
  USING (ehas2_tenant_ok(organization_id, clinic_id))
  WITH CHECK (ehas2_tenant_ok(organization_id, clinic_id));

GRANT SELECT, INSERT, UPDATE ON clinical_fact_normalizations TO ehas2_app;
REVOKE DELETE ON clinical_fact_normalizations FROM ehas2_app;
