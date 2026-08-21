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

-- ---------------------------------------------------------------------------
-- F3D-2D5 snapshot completeness: deferred commit-time DB binding (A-I)
-- Canonical fingerprint: SHA-256(UTF-8 of sorted unique "uuid:64hex" lines joined by LF;
-- empty set => SHA-256 of empty string). Sort with COLLATE "C".
-- Concurrent write-skew: shared advisory xact lock on
--   ehas2:fact-verification:v1:<org>:<clinic>:<factId>
-- acquired in a separate statement before final-state validation reads.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION ehas2_fact_verification_subject_lock_key(
  p_organization_id uuid,
  p_clinic_id uuid,
  p_fact_candidate_id uuid
) RETURNS text
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT 'ehas2:fact-verification:v1:'
    || lower(p_organization_id::text) || ':'
    || lower(p_clinic_id::text) || ':'
    || lower(p_fact_candidate_id::text);
$fn$;

CREATE OR REPLACE FUNCTION ehas2_fact_verification_lock_subject(
  p_organization_id uuid,
  p_clinic_id uuid,
  p_fact_candidate_id uuid
) RETURNS void
LANGUAGE plpgsql
AS $fn$
BEGIN
  IF p_organization_id IS NULL
     OR p_clinic_id IS NULL
     OR p_fact_candidate_id IS NULL THEN
    RAISE EXCEPTION 'FACT_VERIFICATION_SUBJECT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;
  -- Separate statement: wait for lock before any subsequent validation snapshot.
  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      ehas2_fact_verification_subject_lock_key(
        p_organization_id,
        p_clinic_id,
        p_fact_candidate_id
      ),
      0
    )
  );
END;
$fn$;

CREATE OR REPLACE FUNCTION ehas2_fact_verification_lock_subjects_sorted(
  p_keys text[]
) RETURNS void
LANGUAGE plpgsql
AS $fn$
DECLARE
  k text;
BEGIN
  IF p_keys IS NULL OR cardinality(p_keys) = 0 THEN
    RAISE EXCEPTION 'FACT_VERIFICATION_SUBJECT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;
  FOR k IN
    SELECT s.x
    FROM (
      SELECT DISTINCT t.x COLLATE "C" AS x
      FROM unnest(p_keys) AS t(x)
      WHERE t.x IS NOT NULL AND length(t.x) > 0
    ) s
    ORDER BY s.x
  LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended(k, 0));
  END LOOP;
END;
$fn$;

CREATE OR REPLACE FUNCTION ehas2_fact_verification_snapshot_fingerprint(p_event_id uuid)
RETURNS text
LANGUAGE sql
STABLE
AS $fn$
  SELECT encode(
    digest(
      coalesce(
        (
          SELECT string_agg(x.line, E'\n' ORDER BY x.line COLLATE "C")
          FROM (
            SELECT DISTINCT
              lower(c.normalization_id::text)
                || ':'
                || lower(c.normalization_identity_fingerprint) AS line
            FROM clinical_fact_verification_normalizations c
            WHERE c.verification_event_id = p_event_id
          ) x
        ),
        ''
      ),
      'sha256'
    ),
    'hex'
  );
$fn$;

COMMENT ON FUNCTION ehas2_fact_verification_snapshot_fingerprint(uuid) IS
  'F3D-2D5 canonical snapshot fingerprint from child rows (uuid:hex lines, COLLATE C, LF-joined, sha256 hex). Empty => sha256 empty.';

CREATE OR REPLACE FUNCTION ehas2_fact_verification_validate_event(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $fn$
DECLARE
  subj_org uuid;
  subj_clinic uuid;
  subj_fact uuid;
  ev clinical_fact_verification_events%ROWTYPE;
  child_count integer;
  expected_fp text;
  active_norm_count integer;
  mismatch_count integer;
  parent clinical_fact_candidates%ROWTYPE;
BEGIN
  IF p_event_id IS NULL THEN
    RAISE EXCEPTION 'FACT_VERIFICATION_SUBJECT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Subject derivation read (may be stale). Lock in a separate statement, then re-read.
  SELECT organization_id, clinic_id, fact_candidate_id
    INTO subj_org, subj_clinic, subj_fact
  FROM clinical_fact_verification_events
  WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FACT_VERIFICATION_SUBJECT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;

  PERFORM ehas2_fact_verification_lock_subject(subj_org, subj_clinic, subj_fact);

  -- Post-lock final-state reads (new statement snapshots after wait).
  SELECT * INTO ev
  FROM clinical_fact_verification_events
  WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FACT_VERIFICATION_SUBJECT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT count(*)::integer INTO child_count
  FROM clinical_fact_verification_normalizations
  WHERE verification_event_id = p_event_id;

  IF child_count IS DISTINCT FROM ev.normalization_count THEN
    RAISE EXCEPTION 'FACT_VERIFICATION_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;

  expected_fp := ehas2_fact_verification_snapshot_fingerprint(p_event_id);
  IF expected_fp IS DISTINCT FROM ev.normalization_snapshot_fingerprint THEN
    RAISE EXCEPTION 'FACT_VERIFICATION_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT count(*)::integer INTO mismatch_count
  FROM clinical_fact_verification_normalizations c
  LEFT JOIN clinical_fact_normalizations n ON n.id = c.normalization_id
  WHERE c.verification_event_id = p_event_id
    AND (
      n.id IS NULL
      OR c.organization_id IS DISTINCT FROM ev.organization_id
      OR c.clinic_id IS DISTINCT FROM ev.clinic_id
      OR c.fact_candidate_id IS DISTINCT FROM ev.fact_candidate_id
      OR n.organization_id IS DISTINCT FROM ev.organization_id
      OR n.clinic_id IS DISTINCT FROM ev.clinic_id
      OR n.source_fact_candidate_id IS DISTINCT FROM ev.fact_candidate_id
      OR n.normalization_identity_fingerprint
           IS DISTINCT FROM c.normalization_identity_fingerprint
    );
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'FACT_VERIFICATION_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;

  IF ev.decision_status = 'SUPERSEDED' THEN
    RETURN;
  END IF;

  IF ev.decision_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'FACT_VERIFICATION_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT * INTO parent
  FROM clinical_fact_candidates
  WHERE id = ev.fact_candidate_id;
  IF NOT FOUND
     OR parent.decision_status IS DISTINCT FROM 'ACTIVE'
     OR parent.authority_status IS DISTINCT FROM 'FACT_CANDIDATE_UNVERIFIED'
     OR parent.clinically_used IS DISTINCT FROM false
     OR parent.organization_id IS DISTINCT FROM ev.organization_id
     OR parent.clinic_id IS DISTINCT FROM ev.clinic_id
     OR parent.patient_id IS DISTINCT FROM ev.patient_id
     OR parent.consultation_id IS DISTINCT FROM ev.consultation_id
     OR parent.source_channel IS DISTINCT FROM ev.source_channel
     OR parent.source_field IS DISTINCT FROM ev.source_field
     OR parent.source_identity_fingerprint IS DISTINCT FROM ev.source_identity_fingerprint
     OR parent.content_fingerprint IS DISTINCT FROM ev.content_fingerprint
  THEN
    RAISE EXCEPTION 'FACT_VERIFICATION_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT count(*)::integer INTO mismatch_count
  FROM clinical_fact_verification_normalizations c
  JOIN clinical_fact_normalizations n ON n.id = c.normalization_id
  WHERE c.verification_event_id = p_event_id
    AND (
      n.decision_status IS DISTINCT FROM 'ACTIVE'
      OR n.authority_scope IS DISTINCT FROM 'FACT_NORMALIZED_SOURCE_LINKED'
      OR n.clinically_used IS DISTINCT FROM false
    );
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'FACT_VERIFICATION_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT count(*)::integer INTO active_norm_count
  FROM clinical_fact_normalizations
  WHERE organization_id = ev.organization_id
    AND clinic_id = ev.clinic_id
    AND source_fact_candidate_id = ev.fact_candidate_id
    AND decision_status = 'ACTIVE';

  IF active_norm_count IS DISTINCT FROM ev.normalization_count THEN
    RAISE EXCEPTION 'FACT_VERIFICATION_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT count(*)::integer INTO mismatch_count
  FROM clinical_fact_normalizations n
  WHERE n.organization_id = ev.organization_id
    AND n.clinic_id = ev.clinic_id
    AND n.source_fact_candidate_id = ev.fact_candidate_id
    AND n.decision_status = 'ACTIVE'
    AND NOT EXISTS (
      SELECT 1
      FROM clinical_fact_verification_normalizations c
      WHERE c.verification_event_id = p_event_id
        AND c.normalization_id = n.id
        AND c.normalization_identity_fingerprint = n.normalization_identity_fingerprint
    );
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'FACT_VERIFICATION_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT count(*)::integer INTO mismatch_count
  FROM clinical_fact_verification_normalizations c
  WHERE c.verification_event_id = p_event_id
    AND NOT EXISTS (
      SELECT 1
      FROM clinical_fact_normalizations n
      WHERE n.id = c.normalization_id
        AND n.decision_status = 'ACTIVE'
        AND n.normalization_identity_fingerprint = c.normalization_identity_fingerprint
        AND n.source_fact_candidate_id = ev.fact_candidate_id
        AND n.organization_id = ev.organization_id
        AND n.clinic_id = ev.clinic_id
    );
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'FACT_VERIFICATION_SNAPSHOT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;
END;
$fn$;

CREATE OR REPLACE FUNCTION ehas2_fact_verification_deferred_from_event()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  IF NEW.organization_id IS NULL
     OR NEW.clinic_id IS NULL
     OR NEW.fact_candidate_id IS NULL THEN
    RAISE EXCEPTION 'FACT_VERIFICATION_SUBJECT_INVALID'
      USING ERRCODE = 'check_violation';
  END IF;
  PERFORM ehas2_fact_verification_lock_subject(
    NEW.organization_id,
    NEW.clinic_id,
    NEW.fact_candidate_id
  );
  PERFORM ehas2_fact_verification_validate_event(NEW.id);
  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION ehas2_fact_verification_deferred_from_child()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
DECLARE
  event_ids uuid[];
  eid uuid;
  subj RECORD;
  keys text[] := ARRAY[]::text[];
BEGIN
  IF TG_OP = 'DELETE' THEN
    event_ids := ARRAY[OLD.verification_event_id];
  ELSIF TG_OP = 'UPDATE'
        AND OLD.verification_event_id IS DISTINCT FROM NEW.verification_event_id THEN
    event_ids := ARRAY[OLD.verification_event_id, NEW.verification_event_id];
  ELSE
    event_ids := ARRAY[NEW.verification_event_id];
  END IF;

  FOREACH eid IN ARRAY event_ids
  LOOP
    IF eid IS NULL THEN
      RAISE EXCEPTION 'FACT_VERIFICATION_SUBJECT_INVALID'
        USING ERRCODE = 'check_violation';
    END IF;
    SELECT organization_id, clinic_id, fact_candidate_id
      INTO subj
    FROM clinical_fact_verification_events
    WHERE id = eid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'FACT_VERIFICATION_SUBJECT_INVALID'
        USING ERRCODE = 'check_violation';
    END IF;
    keys := array_append(
      keys,
      ehas2_fact_verification_subject_lock_key(
        subj.organization_id,
        subj.clinic_id,
        subj.fact_candidate_id
      )
    );
  END LOOP;

  PERFORM ehas2_fact_verification_lock_subjects_sorted(keys);

  FOREACH eid IN ARRAY event_ids
  LOOP
    PERFORM ehas2_fact_verification_validate_event(eid);
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$fn$;

CREATE OR REPLACE FUNCTION ehas2_fact_verification_deferred_from_norm()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
DECLARE
  keys text[] := ARRAY[]::text[];
  r RECORD;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.organization_id IS NULL
       OR OLD.clinic_id IS NULL
       OR OLD.source_fact_candidate_id IS NULL THEN
      RAISE EXCEPTION 'FACT_VERIFICATION_SUBJECT_INVALID'
        USING ERRCODE = 'check_violation';
    END IF;
    keys := ARRAY[
      ehas2_fact_verification_subject_lock_key(
        OLD.organization_id,
        OLD.clinic_id,
        OLD.source_fact_candidate_id
      )
    ];
  ELSIF TG_OP = 'UPDATE'
        AND (
          OLD.organization_id IS DISTINCT FROM NEW.organization_id
          OR OLD.clinic_id IS DISTINCT FROM NEW.clinic_id
          OR OLD.source_fact_candidate_id IS DISTINCT FROM NEW.source_fact_candidate_id
        ) THEN
    keys := ARRAY[
      ehas2_fact_verification_subject_lock_key(
        OLD.organization_id,
        OLD.clinic_id,
        OLD.source_fact_candidate_id
      ),
      ehas2_fact_verification_subject_lock_key(
        NEW.organization_id,
        NEW.clinic_id,
        NEW.source_fact_candidate_id
      )
    ];
  ELSE
    IF NEW.organization_id IS NULL
       OR NEW.clinic_id IS NULL
       OR NEW.source_fact_candidate_id IS NULL THEN
      RAISE EXCEPTION 'FACT_VERIFICATION_SUBJECT_INVALID'
        USING ERRCODE = 'check_violation';
    END IF;
    keys := ARRAY[
      ehas2_fact_verification_subject_lock_key(
        NEW.organization_id,
        NEW.clinic_id,
        NEW.source_fact_candidate_id
      )
    ];
  END IF;

  -- Always lock subject(s) even when no ACTIVE verification yet (write-skew close).
  PERFORM ehas2_fact_verification_lock_subjects_sorted(keys);

  FOR r IN
    SELECT e.id
    FROM clinical_fact_verification_events e
    WHERE e.organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
      AND e.clinic_id = COALESCE(NEW.clinic_id, OLD.clinic_id)
      AND e.fact_candidate_id = COALESCE(NEW.source_fact_candidate_id, OLD.source_fact_candidate_id)
      AND e.decision_status = 'ACTIVE'
  LOOP
    PERFORM ehas2_fact_verification_validate_event(r.id);
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$fn$;

CREATE OR REPLACE FUNCTION ehas2_fact_verification_deferred_from_fact()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
DECLARE
  keys text[] := ARRAY[]::text[];
  r RECORD;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.organization_id IS NULL OR OLD.clinic_id IS NULL OR OLD.id IS NULL THEN
      RAISE EXCEPTION 'FACT_VERIFICATION_SUBJECT_INVALID'
        USING ERRCODE = 'check_violation';
    END IF;
    keys := ARRAY[
      ehas2_fact_verification_subject_lock_key(OLD.organization_id, OLD.clinic_id, OLD.id)
    ];
  ELSIF TG_OP = 'UPDATE'
        AND (
          OLD.organization_id IS DISTINCT FROM NEW.organization_id
          OR OLD.clinic_id IS DISTINCT FROM NEW.clinic_id
          OR OLD.id IS DISTINCT FROM NEW.id
        ) THEN
    keys := ARRAY[
      ehas2_fact_verification_subject_lock_key(OLD.organization_id, OLD.clinic_id, OLD.id),
      ehas2_fact_verification_subject_lock_key(NEW.organization_id, NEW.clinic_id, NEW.id)
    ];
  ELSE
    IF NEW.organization_id IS NULL OR NEW.clinic_id IS NULL OR NEW.id IS NULL THEN
      RAISE EXCEPTION 'FACT_VERIFICATION_SUBJECT_INVALID'
        USING ERRCODE = 'check_violation';
    END IF;
    keys := ARRAY[
      ehas2_fact_verification_subject_lock_key(NEW.organization_id, NEW.clinic_id, NEW.id)
    ];
  END IF;

  PERFORM ehas2_fact_verification_lock_subjects_sorted(keys);

  FOR r IN
    SELECT e.id
    FROM clinical_fact_verification_events e
    WHERE e.organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
      AND e.clinic_id = COALESCE(NEW.clinic_id, OLD.clinic_id)
      AND e.fact_candidate_id = COALESCE(NEW.id, OLD.id)
      AND e.decision_status = 'ACTIVE'
  LOOP
    PERFORM ehas2_fact_verification_validate_event(r.id);
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$fn$;

DROP TRIGGER IF EXISTS clinical_fact_verification_events_snapshot_deferred
  ON clinical_fact_verification_events;
CREATE CONSTRAINT TRIGGER clinical_fact_verification_events_snapshot_deferred
  AFTER INSERT OR UPDATE ON clinical_fact_verification_events
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION ehas2_fact_verification_deferred_from_event();

DROP TRIGGER IF EXISTS clinical_fact_verification_normalizations_snapshot_deferred
  ON clinical_fact_verification_normalizations;
CREATE CONSTRAINT TRIGGER clinical_fact_verification_normalizations_snapshot_deferred
  AFTER INSERT OR UPDATE OR DELETE ON clinical_fact_verification_normalizations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION ehas2_fact_verification_deferred_from_child();

DROP TRIGGER IF EXISTS clinical_fact_normalizations_verification_snapshot_deferred
  ON clinical_fact_normalizations;
CREATE CONSTRAINT TRIGGER clinical_fact_normalizations_verification_snapshot_deferred
  AFTER INSERT OR UPDATE OR DELETE ON clinical_fact_normalizations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION ehas2_fact_verification_deferred_from_norm();

DROP TRIGGER IF EXISTS clinical_fact_candidates_verification_snapshot_deferred
  ON clinical_fact_candidates;
CREATE CONSTRAINT TRIGGER clinical_fact_candidates_verification_snapshot_deferred
  AFTER UPDATE OR DELETE ON clinical_fact_candidates
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION ehas2_fact_verification_deferred_from_fact();
