-- Operations, audit, backup and version registries
CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NULL REFERENCES organizations(id),
  clinic_id uuid NULL REFERENCES clinics(id),
  actor_id uuid NULL,
  actor_role text NULL,
  event_type text NOT NULL,
  resource_type text NULL,
  resource_id uuid NULL,
  outcome text NOT NULL CHECK (outcome IN ('SUCCESS', 'DENIED', 'FAILED')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_events_no_sensitive_payload CHECK (
    NOT (metadata ? 'otp')
    AND NOT (metadata ? 'token')
    AND NOT (metadata ? 'report_bytes')
    AND NOT (metadata ? 'base64')
    AND NOT (metadata ? 'image')
    AND NOT (metadata ? 'pdf')
    AND NOT (metadata ? 'secret')
  )
);

CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NULL REFERENCES organizations(id),
  clinic_id uuid NULL REFERENCES clinics(id),
  opened_by_actor_id uuid NULL,
  status text NOT NULL DEFAULT 'OPEN'
    CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  subject text NOT NULL,
  body_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE doctor_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NULL REFERENCES organizations(id),
  clinic_id uuid NULL REFERENCES clinics(id),
  doctor_user_id uuid NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'SUBMITTED'
    CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'CLOSED')),
  category text NULL,
  body_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE data_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('disease', 'medicine', 'rules', 'other')),
  version_label text NOT NULL,
  checksum_sha256 text NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, version_label)
);

CREATE TABLE engine_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_version text NOT NULL UNIQUE,
  rules_version text NOT NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE backup_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_status text NOT NULL
    CHECK (backup_status IN (
      'PLANNED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'VERIFIED', 'RESTORE_TESTED'
    )),
  checksum_sha256 text NULL,
  verification_status text NULL
    CHECK (verification_status IN ('NOT_RUN', 'PASSED', 'FAILED')),
  restore_test_status text NULL
    CHECK (restore_test_status IN ('NOT_RUN', 'PASSED', 'FAILED')),
  migration_step text NULL,
  integrity_result text NULL,
  owner_confirmation text NULL,
  traffic_switch_status text NULL
    CHECK (traffic_switch_status IN ('NOT_STARTED', 'READY', 'SWITCHED', 'ROLLED_BACK')),
  rollback_status text NULL
    CHECK (rollback_status IN ('NOT_STARTED', 'READY', 'EXECUTED', 'FAILED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  notes text NULL
);
