-- Blood test reference ranges (EH report analysis catalog)
CREATE TABLE IF NOT EXISTS blood_test_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_key VARCHAR(64) NOT NULL UNIQUE,
  label VARCHAR(128) NOT NULL,
  unit VARCHAR(32),
  min_normal NUMERIC NOT NULL,
  max_normal NUMERIC NOT NULL,
  low_rog_polarity VARCHAR(16) NOT NULL DEFAULT 'negative',
  high_rog_polarity VARCHAR(16) NOT NULL DEFAULT 'positive',
  sort_order SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE blood_test_values IS 'Normal ranges for blood report CDSS — HIGH=Positive rog, LOW=Negative rog';
COMMENT ON COLUMN blood_test_values.low_rog_polarity IS 'Rog when value below normal (ghatna)';
COMMENT ON COLUMN blood_test_values.high_rog_polarity IS 'Rog when value above normal (badhna)';

INSERT INTO blood_test_values (test_key, label, unit, min_normal, max_normal, sort_order) VALUES
  ('hemoglobin', 'Hemoglobin', 'g/dL', 12, 17, 1),
  ('wbc', 'WBC', '/µL', 4000, 11000, 2),
  ('platelets', 'Platelets', '/µL', 150000, 400000, 3),
  ('glucose', 'Sugar / Glucose', 'mg/dL', 70, 100, 4),
  ('creatinine', 'Creatinine', 'mg/dL', 0.6, 1.2, 5),
  ('uric_acid', 'Uric Acid', 'mg/dL', 3.5, 7.2, 6),
  ('esr', 'ESR', 'mm/hr', 0, 20, 7),
  ('crp', 'CRP', 'mg/L', 0, 5, 8),
  ('bp_systolic', 'BP Systolic', 'mmHg', 90, 120, 9),
  ('vitamin_d', 'Vitamin D', 'ng/mL', 30, 100, 10),
  ('hemoglobin_a1c', 'Hemoglobin A1c', '%', 4, 5.6, 11)
ON CONFLICT (test_key) DO UPDATE SET
  label = EXCLUDED.label,
  unit = EXCLUDED.unit,
  min_normal = EXCLUDED.min_normal,
  max_normal = EXCLUDED.max_normal,
  sort_order = EXCLUDED.sort_order;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS analysis_json JSONB;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_type VARCHAR(32);
