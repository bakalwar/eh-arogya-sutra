-- =============================================================================
-- E.H. Arogya Sutra — Medicines + default branding (PostgreSQL)
-- Target database (pgAdmin): eh_arogyaa_sutra_db
-- Run: connect to that database in pgAdmin Query Tool, paste & execute,
--   or: psql "postgresql://USER:PASS@HOST:PORT/eh_arogyaa_sutra_db" -f this_file.sql
--
-- Scalability: shared medicine catalog (read-heavy). Indexes support fast
-- name/group search and pg_trgm fuzzy match under high concurrency.
-- At 100k+ doctors, use PgBouncer + app connection pool tuning (see AGENTS.md).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Uncomment only if replacing an old draft medicines table:
-- DROP TABLE IF EXISTS medicines CASCADE;

CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medicine_name VARCHAR(255) NOT NULL,
  medicine_group VARCHAR(64) NOT NULL,
  dilution VARCHAR(32) NOT NULL,
  indications TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_medicine_group CHECK (char_length(trim(medicine_group)) > 0),
  CONSTRAINT chk_dilution CHECK (char_length(trim(dilution)) > 0 AND dilution ~ '^[0-9]+:[0-9]+$')
);

COMMENT ON TABLE medicines IS 'Electro-Homeopathy medicine library — shared across all doctors.';
COMMENT ON COLUMN medicines.medicine_group IS 'Mattei group: Scrofoloso, Canceroso, Angiotico, etc.';
COMMENT ON COLUMN medicines.dilution IS 'e.g. 1:9, 1:47';

CREATE INDEX IF NOT EXISTS idx_medicines_group ON medicines (medicine_group);
CREATE INDEX IF NOT EXISTS idx_medicines_name_lower ON medicines (LOWER(medicine_name));
CREATE INDEX IF NOT EXISTS idx_medicines_name_trgm ON medicines USING GIN (medicine_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_medicines_indications_trgm ON medicines USING GIN ((COALESCE(indications, '')) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_medicines_group_name ON medicines (medicine_group, LOWER(medicine_name));

CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(128) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (key, value, updated_at)
VALUES
  ('clinic_name', 'E.H. AROGYA SUTRA', NOW()),
  ('clinic_phone', '9098791989', NOW())
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();
