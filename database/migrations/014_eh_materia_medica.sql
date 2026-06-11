-- Per-medicine EH materia medica (DOC blueprint + book extraction → eh_materia_medica)
-- Complements eh_materia_medica_group (group-level typical_codes).

CREATE TABLE IF NOT EXISTS eh_materia_medica (
  id              SERIAL PRIMARY KEY,
  medicine_code   VARCHAR(20) NOT NULL UNIQUE,
  group_name      VARCHAR(64) NOT NULL,
  target_system   VARCHAR(64),
  target_organ    VARCHAR(256),
  polarity        VARCHAR(16) CHECK (polarity IS NULL OR polarity IN ('POSITIVE', 'NEGATIVE', 'MIXED', 'BOTH', 'ANY')),
  action          TEXT,
  keywords        TEXT,
  book_page       INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eh_mm_code ON eh_materia_medica (medicine_code);
CREATE INDEX IF NOT EXISTS idx_eh_mm_group ON eh_materia_medica (group_name);
CREATE INDEX IF NOT EXISTS idx_eh_mm_system ON eh_materia_medica (target_system);
CREATE INDEX IF NOT EXISTS idx_eh_mm_organ_trgm ON eh_materia_medica USING GIN (target_organ gin_trgm_ops);

COMMENT ON TABLE eh_materia_medica IS 'Individual EH medicine codes; populated from book extraction + blueprint seed.';

-- Electricity keyword column (book extraction + rule engine keyword match)
ALTER TABLE eh_electricity_master ADD COLUMN IF NOT EXISTS keywords TEXT;

-- Seed core medicines (blueprint; book PDF extraction can upsert more)
INSERT INTO eh_materia_medica (medicine_code, group_name, target_system, target_organ, polarity, action) VALUES
  ('S-1', 'Scrofoloso', 'Lymphatic', 'General Lymph, Kidney', 'NEGATIVE', 'Immunity, Lymph clean, Metabolism'),
  ('S-2', 'Scrofoloso', 'Lymphatic', 'Liver, Lymph nodes', 'NEGATIVE', 'Liver detox, Bile, Glandular'),
  ('S-5', 'Scrofoloso', 'Lymphatic', 'Skin, Joints', 'NEGATIVE', 'Skin disease, Joint sujan'),
  ('S-6', 'Scrofoloso', 'Urinary', 'Kidney, Urinary tract', 'NEGATIVE', 'Creatinine, UTI, Uric acid'),
  ('A-1', 'Angitico', 'Sanguine', 'Heart, Arteries', 'NEGATIVE', 'High BP, Heart left side'),
  ('A-2', 'Angitico', 'Sanguine', 'Heart, Veins', 'NEGATIVE', 'Veins, circulation'),
  ('A-3', 'Angitico', 'Sanguine', 'Blood cells', 'BOTH', 'RBC, WBC, Platelets, HB'),
  ('P-1', 'Pectorale', 'Respiratory', 'Lungs Upper', 'NEGATIVE', 'Bronchi, Bronchitis'),
  ('P-3', 'Pectorale', 'Respiratory', 'Lungs Chronic', 'NEGATIVE', 'Chronic lung, Asthma'),
  ('C-4', 'Canceroso', 'Musculoskeletal', 'Bone, Hair, PTH', 'BOTH', 'Osteoporosis, PTH, Calcium'),
  ('C-5', 'Canceroso', 'Lymphatic', 'Lymph nodes, Tumor', 'NEGATIVE', 'Ganth, Tumor, Nodes'),
  ('C-10', 'Canceroso', 'Digestive', 'Pancreas', 'BOTH', 'Diabetes, Insulin, Pancreas'),
  ('F-1', 'Febrifugo', 'Nervous', 'Brain, Nervous', 'BOTH', 'Fever, Brain, Metabolism'),
  ('VEN-1', 'Venereo', 'Digestive', 'Viral/Parasitic', 'NEGATIVE', 'HCV, Viral, Parasites')
ON CONFLICT (medicine_code) DO UPDATE SET
  group_name = EXCLUDED.group_name,
  target_system = EXCLUDED.target_system,
  target_organ = EXCLUDED.target_organ,
  polarity = EXCLUDED.polarity,
  action = EXCLUDED.action;

UPDATE eh_electricity_master SET keywords = v.kw
FROM (VALUES
  ('Y.E.', 'sujan,fever,bukhar,pain,dard,high,infection,uric'),
  ('R.E.', 'kamzori,weakness,low,atrophy,cold,anemia'),
  ('B.E.', 'heart,bp,cardiac,hypertension,dhadkan'),
  ('G.E.', 'joint,jod,ganth,sujan,lymph,tumor,arthritis'),
  ('W.E.', 'brain,nervous,mental,depression,memory,neend')
) AS v(code, kw)
WHERE eh_electricity_master.fluid_code = v.code AND (eh_electricity_master.keywords IS NULL OR eh_electricity_master.keywords = '');
