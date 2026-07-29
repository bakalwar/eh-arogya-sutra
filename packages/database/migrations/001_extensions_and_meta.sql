-- EHAS2 Phase 3A — extensions and migration metadata
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS migration_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_id text NOT NULL,
  checksum_sha256 text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now(),
  applied_by text NOT NULL DEFAULT 'ehas2-migrator',
  direction text NOT NULL CHECK (direction IN ('up', 'down')),
  integrity_result text NOT NULL DEFAULT 'APPLIED',
  owner_confirmation text NULL,
  notes text NULL,
  UNIQUE (migration_id, direction)
);

CREATE TABLE IF NOT EXISTS schema_version (
  id int PRIMARY KEY CHECK (id = 1),
  version text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO schema_version (id, version)
VALUES (1, '3A.0.0')
ON CONFLICT (id) DO UPDATE SET version = EXCLUDED.version, updated_at = now();
