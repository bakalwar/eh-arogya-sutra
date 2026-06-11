-- Migration 002: EH medicine library columns + symptoms (run on DBs created before schema refresh)
-- psql -U postgres -d eh_arogya_sutra -f database/migrations/002_eh_library_symptoms.sql

ALTER TABLE medicines ADD COLUMN IF NOT EXISTS medicine_group VARCHAR(64);
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS dilution VARCHAR(32);
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS indications TEXT;

CREATE INDEX IF NOT EXISTS idx_medicines_name_trgm ON medicines USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_medicines_indications_trgm ON medicines USING GIN ((COALESCE(indications, '')) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_medicines_group ON medicines (medicine_group);

CREATE TABLE IF NOT EXISTS symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(512) NOT NULL,
  name_hi VARCHAR(512),
  aliases TEXT[] DEFAULT '{}',
  search_document TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS symptoms_search_idx ON symptoms USING GIN (search_document);
CREATE INDEX IF NOT EXISTS idx_symptoms_name_trgm ON symptoms USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_symptoms_name_hi_trgm ON symptoms USING GIN ((COALESCE(name_hi, '')) gin_trgm_ops);
