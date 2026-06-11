-- Run once on existing DBs that already had the older `patients` table (greenfield: use schema.sql only).
ALTER TABLE patients ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight INT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS personal_factor SMALLINT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS photo_url TEXT;
