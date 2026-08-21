-- F3D-2E1: source-linked facts accepted for analysis eligibility only.
-- No diagnosis, Rules 1-9, medicine, treatment, Rx, or clinically_used authority.

CREATE UNIQUE INDEX clinical_fact_candidates_018_acceptance_parent_uq
  ON clinical_fact_candidates (
    organization_id, clinic_id, patient_id, consultation_id, source_channel, source_field,
    source_identity_fingerprint, content_fingerprint, id
  );
CREATE UNIQUE INDEX clinical_fact_normalizations_018_acceptance_norm_uq
  ON clinical_fact_normalizations (
    organization_id, clinic_id, source_fact_candidate_id,
    normalization_identity_fingerprint, id
  );

CREATE TABLE clinical_fact_analysis_acceptance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  consultation_id uuid NOT NULL REFERENCES consultations(id),
  fact_candidate_id uuid NOT NULL,
  source_channel text NOT NULL CHECK (source_channel IN (
    'DOCTOR_DECLARED', 'STRUCTURED_INTAKE', 'REVIEWED_REPORT_TEXT'
  )),
  source_field text NOT NULL CHECK (source_field IN (
    'CHIEF_COMPLAINT', 'SYMPTOM_ROW', 'DOCTOR_OBSERVATIONS', 'HISTORY_NOTES',
    'VITAL_BP_SYSTOLIC', 'VITAL_BP_DIASTOLIC', 'VITAL_PULSE', 'VITAL_TEMPERATURE',
    'VITAL_SPO2', 'VITAL_WEIGHT', 'VITAL_HEIGHT', 'REVIEWED_EXTRACTION_CANDIDATE'
  )),
  source_identity_fingerprint text NOT NULL CHECK (source_identity_fingerprint ~ '^[a-f0-9]{64}$'),
  content_fingerprint text NOT NULL CHECK (content_fingerprint ~ '^[a-f0-9]{64}$'),
  verification_event_id uuid NOT NULL,
  normalization_snapshot_fingerprint text NOT NULL
    CHECK (normalization_snapshot_fingerprint ~ '^[a-f0-9]{64}$'),
  normalization_count integer NOT NULL CHECK (normalization_count BETWEEN 0 AND 32),
  action text NOT NULL CHECK (action = 'ACCEPT_SOURCE_LINKED_FACT_FOR_ANALYSIS_ONLY'),
  authority_scope text NOT NULL CHECK (authority_scope = 'SOURCE_LINKED_FACT_ANALYSIS_ELIGIBLE_ONLY'),
  reason_code text NOT NULL CHECK (reason_code = 'SOURCE_LINKED_FACT_ANALYSIS_ACCEPTED'),
  decision_status text NOT NULL CHECK (decision_status IN ('ACTIVE', 'SUPERSEDED')),
  supersedes_acceptance_id uuid NULL REFERENCES clinical_fact_analysis_acceptance_events(id),
  actor_id uuid NOT NULL,
  actor_role text NOT NULL CHECK (actor_role = 'Doctor'),
  clinically_used boolean NOT NULL DEFAULT false CHECK (clinically_used = false),
  acceptance_contract_version text NOT NULL
    CHECK (acceptance_contract_version = 'f3d2e1-analysis-acceptance-v1'),
  pack_id text NOT NULL CHECK (length(pack_id) BETWEEN 1 AND 64),
  pack_version text NOT NULL CHECK (length(pack_version) BETWEEN 1 AND 64),
  pack_content_checksum text NOT NULL CHECK (pack_content_checksum ~ '^[a-f0-9]{64}$'),
  parser_version text NOT NULL CHECK (length(parser_version) BETWEEN 1 AND 64),
  parser_fingerprint text NOT NULL CHECK (parser_fingerprint ~ '^[a-f0-9]{64}$'),
  normalizer_method text NOT NULL CHECK (length(normalizer_method) BETWEEN 1 AND 80),
  normalizer_version text NOT NULL CHECK (length(normalizer_version) BETWEEN 1 AND 64),
  normalizer_fingerprint text NOT NULL CHECK (normalizer_fingerprint ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinical_fact_analysis_acceptance_clinic_org_fk
    FOREIGN KEY (clinic_id, organization_id) REFERENCES clinics(id, organization_id),
  CONSTRAINT clinical_fact_analysis_acceptance_parent_fk
    FOREIGN KEY (
      organization_id, clinic_id, patient_id, consultation_id, source_channel, source_field,
      source_identity_fingerprint, content_fingerprint, fact_candidate_id
    ) REFERENCES clinical_fact_candidates (
      organization_id, clinic_id, patient_id, consultation_id, source_channel, source_field,
      source_identity_fingerprint, content_fingerprint, id
    ),
  CONSTRAINT clinical_fact_analysis_acceptance_verification_fk
    FOREIGN KEY (verification_event_id, organization_id, clinic_id, fact_candidate_id)
    REFERENCES clinical_fact_verification_events (
      id, organization_id, clinic_id, fact_candidate_id
    )
);

COMMENT ON TABLE clinical_fact_analysis_acceptance_events IS
  'F3D-2E1 analysis eligibility only: SOURCE_LINKED_FACT_ANALYSIS_ELIGIBLE_ONLY. Not clinical truth, diagnosis, Rules, medicine, treatment, Rx, or clinically_used.';

CREATE UNIQUE INDEX clinical_fact_analysis_acceptance_active_fact_uq
  ON clinical_fact_analysis_acceptance_events (organization_id, clinic_id, fact_candidate_id)
  WHERE decision_status = 'ACTIVE';
CREATE INDEX clinical_fact_analysis_acceptance_consultation_idx
  ON clinical_fact_analysis_acceptance_events (
    organization_id, clinic_id, consultation_id, created_at ASC
  );
CREATE INDEX clinical_fact_analysis_acceptance_fact_idx
  ON clinical_fact_analysis_acceptance_events (
    organization_id, clinic_id, fact_candidate_id, created_at DESC
  );
CREATE UNIQUE INDEX clinical_fact_analysis_acceptance_018_child_parent_uq
  ON clinical_fact_analysis_acceptance_events (id, organization_id, clinic_id, fact_candidate_id);

CREATE OR REPLACE FUNCTION ehas2_fact_analysis_acceptance_event_append_only()
RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_EVENTS_IMMUTABLE'
      USING ERRCODE = 'restrict_violation';
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
     OR NEW.verification_event_id IS DISTINCT FROM OLD.verification_event_id
     OR NEW.normalization_snapshot_fingerprint IS DISTINCT FROM OLD.normalization_snapshot_fingerprint
     OR NEW.normalization_count IS DISTINCT FROM OLD.normalization_count
     OR NEW.action IS DISTINCT FROM OLD.action
     OR NEW.authority_scope IS DISTINCT FROM OLD.authority_scope
     OR NEW.reason_code IS DISTINCT FROM OLD.reason_code
     OR NEW.supersedes_acceptance_id IS DISTINCT FROM OLD.supersedes_acceptance_id
     OR NEW.actor_id IS DISTINCT FROM OLD.actor_id
     OR NEW.actor_role IS DISTINCT FROM OLD.actor_role
     OR NEW.clinically_used IS DISTINCT FROM OLD.clinically_used
     OR NEW.acceptance_contract_version IS DISTINCT FROM OLD.acceptance_contract_version
     OR NEW.pack_id IS DISTINCT FROM OLD.pack_id
     OR NEW.pack_version IS DISTINCT FROM OLD.pack_version
     OR NEW.pack_content_checksum IS DISTINCT FROM OLD.pack_content_checksum
     OR NEW.parser_version IS DISTINCT FROM OLD.parser_version
     OR NEW.parser_fingerprint IS DISTINCT FROM OLD.parser_fingerprint
     OR NEW.normalizer_method IS DISTINCT FROM OLD.normalizer_method
     OR NEW.normalizer_version IS DISTINCT FROM OLD.normalizer_version
     OR NEW.normalizer_fingerprint IS DISTINCT FROM OLD.normalizer_fingerprint
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_EVENTS_IMMUTABLE'
      USING ERRCODE = 'restrict_violation';
  END IF;
  IF OLD.decision_status = 'ACTIVE' AND NEW.decision_status = 'SUPERSEDED' THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_EVENTS_IMMUTABLE'
    USING ERRCODE = 'restrict_violation';
END;
$fn$;
CREATE TRIGGER clinical_fact_analysis_acceptance_events_append_only
  BEFORE UPDATE OR DELETE ON clinical_fact_analysis_acceptance_events
  FOR EACH ROW EXECUTE FUNCTION ehas2_fact_analysis_acceptance_event_append_only();

ALTER TABLE clinical_fact_analysis_acceptance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_fact_analysis_acceptance_events FORCE ROW LEVEL SECURITY;
CREATE POLICY clinical_fact_analysis_acceptance_events_tenant_isolation
  ON clinical_fact_analysis_acceptance_events FOR ALL
  USING (ehas2_tenant_ok(organization_id, clinic_id))
  WITH CHECK (ehas2_tenant_ok(organization_id, clinic_id));
GRANT SELECT, INSERT, UPDATE ON clinical_fact_analysis_acceptance_events TO ehas2_app;
REVOKE DELETE ON clinical_fact_analysis_acceptance_events FROM ehas2_app;

CREATE TABLE clinical_fact_analysis_acceptance_normalizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acceptance_event_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  clinic_id uuid NOT NULL,
  fact_candidate_id uuid NOT NULL,
  normalization_id uuid NOT NULL,
  normalization_identity_fingerprint text NOT NULL
    CHECK (normalization_identity_fingerprint ~ '^[a-f0-9]{64}$'),
  snapshot_ordinal integer NOT NULL CHECK (snapshot_ordinal >= 0 AND snapshot_ordinal < 32),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clinical_fact_analysis_acceptance_norm_event_fk
    FOREIGN KEY (acceptance_event_id, organization_id, clinic_id, fact_candidate_id)
    REFERENCES clinical_fact_analysis_acceptance_events (
      id, organization_id, clinic_id, fact_candidate_id
    ),
  CONSTRAINT clinical_fact_analysis_acceptance_norm_norm_fk
    FOREIGN KEY (
      organization_id, clinic_id, fact_candidate_id,
      normalization_identity_fingerprint, normalization_id
    ) REFERENCES clinical_fact_normalizations (
      organization_id, clinic_id, source_fact_candidate_id,
      normalization_identity_fingerprint, id
    ),
  CONSTRAINT clinical_fact_analysis_acceptance_norm_clinic_org_fk
    FOREIGN KEY (clinic_id, organization_id) REFERENCES clinics(id, organization_id),
  CONSTRAINT clinical_fact_analysis_acceptance_norm_uq
    UNIQUE (acceptance_event_id, normalization_id),
  CONSTRAINT clinical_fact_analysis_acceptance_norm_ord_uq
    UNIQUE (acceptance_event_id, snapshot_ordinal)
);
CREATE INDEX clinical_fact_analysis_acceptance_norm_event_idx
  ON clinical_fact_analysis_acceptance_normalizations (
    acceptance_event_id, snapshot_ordinal ASC
  );

CREATE OR REPLACE FUNCTION ehas2_fact_analysis_acceptance_norm_append_only()
RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_NORMS_IMMUTABLE'
    USING ERRCODE = 'restrict_violation';
END;
$fn$;
CREATE TRIGGER clinical_fact_analysis_acceptance_normalizations_append_only
  BEFORE UPDATE OR DELETE ON clinical_fact_analysis_acceptance_normalizations
  FOR EACH ROW EXECUTE FUNCTION ehas2_fact_analysis_acceptance_norm_append_only();

ALTER TABLE clinical_fact_analysis_acceptance_normalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_fact_analysis_acceptance_normalizations FORCE ROW LEVEL SECURITY;
CREATE POLICY clinical_fact_analysis_acceptance_norm_tenant_isolation
  ON clinical_fact_analysis_acceptance_normalizations FOR ALL
  USING (ehas2_tenant_ok(organization_id, clinic_id))
  WITH CHECK (ehas2_tenant_ok(organization_id, clinic_id));
GRANT SELECT, INSERT ON clinical_fact_analysis_acceptance_normalizations TO ehas2_app;
REVOKE UPDATE, DELETE ON clinical_fact_analysis_acceptance_normalizations FROM ehas2_app;

-- Canonical lock: ehas2:fact-analysis-acceptance:v1:<lower-org>:<lower-clinic>:<lower-fact>.
CREATE OR REPLACE FUNCTION ehas2_fact_analysis_acceptance_subject_lock_key(
  p_organization_id uuid, p_clinic_id uuid, p_fact_candidate_id uuid
) RETURNS text LANGUAGE sql IMMUTABLE AS $fn$
  SELECT 'ehas2:fact-analysis-acceptance:v1:'
    || lower(p_organization_id::text) || ':'
    || lower(p_clinic_id::text) || ':'
    || lower(p_fact_candidate_id::text);
$fn$;

CREATE OR REPLACE FUNCTION ehas2_fact_analysis_acceptance_lock_subject(
  p_organization_id uuid, p_clinic_id uuid, p_fact_candidate_id uuid
) RETURNS void LANGUAGE plpgsql AS $fn$
BEGIN
  IF p_organization_id IS NULL OR p_clinic_id IS NULL OR p_fact_candidate_id IS NULL THEN
    RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_SUBJECT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(
    ehas2_fact_analysis_acceptance_subject_lock_key(
      p_organization_id, p_clinic_id, p_fact_candidate_id
    ), 0
  ));
END;
$fn$;

CREATE OR REPLACE FUNCTION ehas2_fact_analysis_acceptance_lock_subjects_sorted(p_keys text[])
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE k text;
BEGIN
  IF p_keys IS NULL OR cardinality(p_keys) = 0 THEN
    RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_SUBJECT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;
  FOR k IN
    SELECT s.x FROM (
      SELECT DISTINCT t.x COLLATE "C" AS x
      FROM unnest(p_keys) t(x) WHERE t.x IS NOT NULL AND length(t.x) > 0
    ) s ORDER BY s.x
  LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended(k, 0));
  END LOOP;
END;
$fn$;

-- SHA-256 of unique lower(uuid):lower(64hex), sorted COLLATE "C", LF joined.
CREATE OR REPLACE FUNCTION ehas2_fact_analysis_acceptance_snapshot_fingerprint(p_event_id uuid)
RETURNS text LANGUAGE sql STABLE AS $fn$
  SELECT encode(digest(coalesce((
    SELECT string_agg(x.line, E'\n' ORDER BY x.line COLLATE "C")
    FROM (
      SELECT DISTINCT lower(c.normalization_id::text) || ':'
        || lower(c.normalization_identity_fingerprint) AS line
      FROM clinical_fact_analysis_acceptance_normalizations c
      WHERE c.acceptance_event_id = p_event_id
    ) x
  ), ''), 'sha256'), 'hex');
$fn$;

CREATE OR REPLACE FUNCTION ehas2_fact_analysis_acceptance_validate_event(p_event_id uuid)
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE
  subj_org uuid; subj_clinic uuid; subj_fact uuid;
  ev clinical_fact_analysis_acceptance_events%ROWTYPE;
  parent clinical_fact_candidates%ROWTYPE;
  verification clinical_fact_verification_events%ROWTYPE;
  child_count integer; mismatch_count integer; live_count integer;
BEGIN
  SELECT organization_id, clinic_id, fact_candidate_id
    INTO subj_org, subj_clinic, subj_fact
  FROM clinical_fact_analysis_acceptance_events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_SUBJECT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;
  -- Separate PERFORM lock, then re-read all final state.
  PERFORM ehas2_fact_analysis_acceptance_lock_subject(subj_org, subj_clinic, subj_fact);
  SELECT * INTO ev FROM clinical_fact_analysis_acceptance_events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_SUBJECT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;
  SELECT count(*)::integer INTO child_count
  FROM clinical_fact_analysis_acceptance_normalizations
  WHERE acceptance_event_id = ev.id;
  IF child_count IS DISTINCT FROM ev.normalization_count
     OR ehas2_fact_analysis_acceptance_snapshot_fingerprint(ev.id)
          IS DISTINCT FROM ev.normalization_snapshot_fingerprint THEN
    RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;
  IF ev.decision_status = 'SUPERSEDED' THEN RETURN; END IF;
  IF ev.decision_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO verification FROM clinical_fact_verification_events
  WHERE id = ev.verification_event_id;
  IF NOT FOUND
     OR verification.organization_id IS DISTINCT FROM ev.organization_id
     OR verification.clinic_id IS DISTINCT FROM ev.clinic_id
     OR verification.fact_candidate_id IS DISTINCT FROM ev.fact_candidate_id
     OR verification.decision_status IS DISTINCT FROM 'ACTIVE'
     OR verification.action IS DISTINCT FROM 'ACCEPT_SOURCE_LINKED_FACT'
     OR verification.authority_scope IS DISTINCT FROM 'SOURCE_LINKED_FACT_CLINICAL_REVIEW_ONLY'
     OR verification.normalization_count IS DISTINCT FROM ev.normalization_count
     OR verification.normalization_snapshot_fingerprint
          IS DISTINCT FROM ev.normalization_snapshot_fingerprint THEN
    RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT count(*)::integer INTO mismatch_count
  FROM clinical_fact_analysis_acceptance_normalizations a
  WHERE a.acceptance_event_id = ev.id
    AND NOT EXISTS (
      SELECT 1 FROM clinical_fact_verification_normalizations v
      WHERE v.verification_event_id = ev.verification_event_id
        AND v.normalization_id = a.normalization_id
        AND v.normalization_identity_fingerprint = a.normalization_identity_fingerprint
    );
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;
  SELECT count(*)::integer INTO mismatch_count
  FROM clinical_fact_verification_normalizations v
  WHERE v.verification_event_id = ev.verification_event_id
    AND NOT EXISTS (
      SELECT 1 FROM clinical_fact_analysis_acceptance_normalizations a
      WHERE a.acceptance_event_id = ev.id
        AND a.normalization_id = v.normalization_id
        AND a.normalization_identity_fingerprint = v.normalization_identity_fingerprint
    );
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO parent FROM clinical_fact_candidates WHERE id = ev.fact_candidate_id;
  IF NOT FOUND
     OR parent.organization_id IS DISTINCT FROM ev.organization_id
     OR parent.clinic_id IS DISTINCT FROM ev.clinic_id
     OR parent.patient_id IS DISTINCT FROM ev.patient_id
     OR parent.consultation_id IS DISTINCT FROM ev.consultation_id
     OR parent.source_channel IS DISTINCT FROM ev.source_channel
     OR parent.source_field IS DISTINCT FROM ev.source_field
     OR parent.source_identity_fingerprint IS DISTINCT FROM ev.source_identity_fingerprint
     OR parent.content_fingerprint IS DISTINCT FROM ev.content_fingerprint
     OR parent.decision_status IS DISTINCT FROM 'ACTIVE'
     OR parent.authority_status IS DISTINCT FROM 'FACT_CANDIDATE_UNVERIFIED'
     OR parent.clinically_used IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT count(*)::integer INTO live_count FROM clinical_fact_normalizations n
  WHERE n.organization_id = ev.organization_id AND n.clinic_id = ev.clinic_id
    AND n.source_fact_candidate_id = ev.fact_candidate_id
    AND n.decision_status = 'ACTIVE';
  IF live_count IS DISTINCT FROM ev.normalization_count THEN
    RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;
  SELECT count(*)::integer INTO mismatch_count
  FROM clinical_fact_analysis_acceptance_normalizations a
  LEFT JOIN clinical_fact_normalizations n ON n.id = a.normalization_id
  WHERE a.acceptance_event_id = ev.id AND (
    n.id IS NULL
    OR n.organization_id IS DISTINCT FROM ev.organization_id
    OR n.clinic_id IS DISTINCT FROM ev.clinic_id
    OR n.source_fact_candidate_id IS DISTINCT FROM ev.fact_candidate_id
    OR n.decision_status IS DISTINCT FROM 'ACTIVE'
    OR n.authority_scope IS DISTINCT FROM 'FACT_NORMALIZED_SOURCE_LINKED'
    OR n.clinically_used IS DISTINCT FROM false
    OR n.normalization_identity_fingerprint
         IS DISTINCT FROM a.normalization_identity_fingerprint
    OR n.pack_id IS DISTINCT FROM ev.pack_id
    OR n.pack_version IS DISTINCT FROM ev.pack_version
    OR n.pack_content_checksum IS DISTINCT FROM ev.pack_content_checksum
    OR n.parser_version IS DISTINCT FROM ev.parser_version
    OR n.parser_fingerprint IS DISTINCT FROM ev.parser_fingerprint
    OR n.normalizer_method IS DISTINCT FROM ev.normalizer_method
    OR n.normalizer_version IS DISTINCT FROM ev.normalizer_version
    OR n.normalizer_fingerprint IS DISTINCT FROM ev.normalizer_fingerprint
  );
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;
  SELECT count(*)::integer INTO mismatch_count
  FROM clinical_fact_normalizations n
  WHERE n.organization_id = ev.organization_id AND n.clinic_id = ev.clinic_id
    AND n.source_fact_candidate_id = ev.fact_candidate_id
    AND n.decision_status = 'ACTIVE'
    AND NOT EXISTS (
      SELECT 1 FROM clinical_fact_analysis_acceptance_normalizations a
      WHERE a.acceptance_event_id = ev.id
        AND a.normalization_id = n.id
        AND a.normalization_identity_fingerprint = n.normalization_identity_fingerprint
    );
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;
END;
$fn$;

CREATE OR REPLACE FUNCTION ehas2_fact_analysis_acceptance_deferred_from_event()
RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
  PERFORM ehas2_fact_analysis_acceptance_lock_subject(
    NEW.organization_id, NEW.clinic_id, NEW.fact_candidate_id
  );
  PERFORM ehas2_fact_analysis_acceptance_validate_event(NEW.id);
  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION ehas2_fact_analysis_acceptance_deferred_from_child()
RETURNS trigger LANGUAGE plpgsql AS $fn$
DECLARE subj record; eid uuid := COALESCE(NEW.acceptance_event_id, OLD.acceptance_event_id);
BEGIN
  SELECT organization_id, clinic_id, fact_candidate_id INTO subj
  FROM clinical_fact_analysis_acceptance_events WHERE id = eid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FACT_ANALYSIS_ACCEPTANCE_SUBJECT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;
  PERFORM ehas2_fact_analysis_acceptance_lock_subject(
    subj.organization_id, subj.clinic_id, subj.fact_candidate_id
  );
  PERFORM ehas2_fact_analysis_acceptance_validate_event(eid);
  RETURN COALESCE(NEW, OLD);
END;
$fn$;

CREATE OR REPLACE FUNCTION ehas2_fact_analysis_acceptance_deferred_from_subject()
RETURNS trigger LANGUAGE plpgsql AS $fn$
DECLARE
  old_org uuid; old_clinic uuid; old_fact uuid;
  new_org uuid; new_clinic uuid; new_fact uuid;
  keys text[] := ARRAY[]::text[]; r record;
BEGIN
  IF TG_TABLE_NAME = 'clinical_fact_candidates' THEN
    old_org := OLD.organization_id; old_clinic := OLD.clinic_id; old_fact := OLD.id;
    new_org := NEW.organization_id; new_clinic := NEW.clinic_id; new_fact := NEW.id;
  ELSIF TG_TABLE_NAME = 'clinical_fact_normalizations' THEN
    old_org := OLD.organization_id; old_clinic := OLD.clinic_id;
    old_fact := OLD.source_fact_candidate_id;
    new_org := NEW.organization_id; new_clinic := NEW.clinic_id;
    new_fact := NEW.source_fact_candidate_id;
  ELSE
    old_org := OLD.organization_id; old_clinic := OLD.clinic_id;
    old_fact := OLD.fact_candidate_id;
    new_org := NEW.organization_id; new_clinic := NEW.clinic_id;
    new_fact := NEW.fact_candidate_id;
  END IF;
  IF old_org IS NOT NULL AND old_clinic IS NOT NULL AND old_fact IS NOT NULL THEN
    keys := array_append(keys,
      ehas2_fact_analysis_acceptance_subject_lock_key(old_org, old_clinic, old_fact));
  END IF;
  IF new_org IS NOT NULL AND new_clinic IS NOT NULL AND new_fact IS NOT NULL THEN
    keys := array_append(keys,
      ehas2_fact_analysis_acceptance_subject_lock_key(new_org, new_clinic, new_fact));
  END IF;
  -- Always lock subject(s), including when zero ACTIVE acceptances exist.
  PERFORM ehas2_fact_analysis_acceptance_lock_subjects_sorted(keys);
  FOR r IN
    SELECT a.id FROM clinical_fact_analysis_acceptance_events a
    WHERE a.decision_status = 'ACTIVE' AND (
      (a.organization_id = old_org AND a.clinic_id = old_clinic AND a.fact_candidate_id = old_fact)
      OR
      (a.organization_id = new_org AND a.clinic_id = new_clinic AND a.fact_candidate_id = new_fact)
    )
  LOOP
    PERFORM ehas2_fact_analysis_acceptance_validate_event(r.id);
  END LOOP;
  RETURN COALESCE(NEW, OLD);
END;
$fn$;

CREATE CONSTRAINT TRIGGER clinical_fact_analysis_acceptance_events_snapshot_deferred
  AFTER INSERT OR UPDATE ON clinical_fact_analysis_acceptance_events
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION ehas2_fact_analysis_acceptance_deferred_from_event();
CREATE CONSTRAINT TRIGGER clinical_fact_analysis_acceptance_norms_snapshot_deferred
  AFTER INSERT OR UPDATE OR DELETE ON clinical_fact_analysis_acceptance_normalizations
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION ehas2_fact_analysis_acceptance_deferred_from_child();
CREATE CONSTRAINT TRIGGER clinical_fact_verification_events_acceptance_snapshot_deferred
  AFTER UPDATE ON clinical_fact_verification_events
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION ehas2_fact_analysis_acceptance_deferred_from_subject();
CREATE CONSTRAINT TRIGGER clinical_fact_normalizations_acceptance_snapshot_deferred
  AFTER INSERT OR UPDATE OR DELETE ON clinical_fact_normalizations
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION ehas2_fact_analysis_acceptance_deferred_from_subject();
CREATE CONSTRAINT TRIGGER clinical_fact_candidates_acceptance_snapshot_deferred
  AFTER UPDATE OR DELETE ON clinical_fact_candidates
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
  EXECUTE FUNCTION ehas2_fact_analysis_acceptance_deferred_from_subject();
