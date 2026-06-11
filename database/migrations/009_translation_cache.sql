-- Translation cache + multi-language prescription summaries
CREATE TABLE IF NOT EXISTS translation_cache (
  id SERIAL PRIMARY KEY,
  hash VARCHAR(32) NOT NULL UNIQUE,
  original_text VARCHAR(200),
  language VARCHAR(5) NOT NULL,
  translated_text TEXT NOT NULL,
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_translation_cache_lang ON translation_cache (language);
CREATE INDEX IF NOT EXISTS idx_translation_cache_prescription ON translation_cache (prescription_id);

ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS summary_mr TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS summary_gu TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS summary_ta TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS summary_te TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS summary_kn TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS summary_ur TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS summary_bn TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS summary_ar TEXT;
