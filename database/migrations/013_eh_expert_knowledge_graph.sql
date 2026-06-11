-- EH Expert System — Knowledge graph (Anatomy → Groups → Electricity → Potency)
-- No pre-made disease formulas; engine composes dynamically from these mappings.
-- Apply via: npm run db:schema

-- ---------------------------------------------------------------------------
-- 1) Anatomy master: organ / region → body system
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eh_anatomy_master (
  id              SERIAL PRIMARY KEY,
  organ_key       VARCHAR(64) NOT NULL UNIQUE,
  organ_name      VARCHAR(128) NOT NULL,
  organ_name_hi   VARCHAR(128),
  body_system     VARCHAR(64) NOT NULL,
  search_terms    TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eh_anatomy_system ON eh_anatomy_master (body_system);
CREATE INDEX IF NOT EXISTS idx_eh_anatomy_terms ON eh_anatomy_master USING GIN (search_terms);

COMMENT ON TABLE eh_anatomy_master IS 'Maps organs/regions to EH body systems for dynamic formula building.';

-- ---------------------------------------------------------------------------
-- 2) EH materia group → target systems (which groups apply to which anatomy system)
-- typical_codes = representative codes for dynamic pick (not a fixed disease recipe).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eh_materia_medica_group (
  id               SERIAL PRIMARY KEY,
  group_code       VARCHAR(16) NOT NULL UNIQUE,
  group_label      VARCHAR(128) NOT NULL,
  target_systems   TEXT[] NOT NULL DEFAULT '{}',
  role_description TEXT,
  polarity_affinity VARCHAR(16) CHECK (polarity_affinity IS NULL OR polarity_affinity IN ('POSITIVE', 'NEGATIVE', 'MIXED', 'ANY')),
  typical_codes    TEXT[] NOT NULL DEFAULT '{}',
  sort_priority    SMALLINT NOT NULL DEFAULT 10,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eh_mm_group_targets ON eh_materia_medica_group USING GIN (target_systems);

COMMENT ON TABLE eh_materia_medica_group IS 'EH medicine GROUPS and which body systems they support; engine picks codes from typical_codes rotationally by context.';

-- ---------------------------------------------------------------------------
-- 3) Electricity fluids
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eh_electricity_master (
  id            SERIAL PRIMARY KEY,
  fluid_code    VARCHAR(8) NOT NULL UNIQUE,
  nature        VARCHAR(16) NOT NULL CHECK (nature IN ('Positive', 'Negative', 'Neutral')),
  indication_hi TEXT,
  indication_en TEXT,
  for_hyper     BOOLEAN NOT NULL DEFAULT FALSE,
  for_hypo      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 4) Potency rules (polarity + phase + condition)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eh_potency_rules (
  id                  SERIAL PRIMARY KEY,
  rule_key            VARCHAR(64) NOT NULL UNIQUE,
  polarity_context    VARCHAR(16) NOT NULL CHECK (polarity_context IN ('POSITIVE', 'NEGATIVE', 'MIXED', 'ANY')),
  phase               VARCHAR(32) NOT NULL,
  condition_state     VARCHAR(64),
  potency             VARCHAR(32) NOT NULL,
  notes               TEXT,
  rule_priority       SMALLINT NOT NULL DEFAULT 100,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eh_potency_lookup ON eh_potency_rules (polarity_context, phase, rule_priority);

COMMENT ON TABLE eh_potency_rules IS 'Law of polarity / phase → potency; engine picks best match by priority.';

-- ---------------------------------------------------------------------------
-- 5) Pathology / report terms → organ_key (for OCR/NLP matching)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eh_pathology_lexicon (
  id          SERIAL PRIMARY KEY,
  pattern     VARCHAR(256) NOT NULL,
  organ_key   VARCHAR(64) NOT NULL REFERENCES eh_anatomy_master(organ_key) ON DELETE CASCADE,
  polarity_hint VARCHAR(16) CHECK (polarity_hint IS NULL OR polarity_hint IN ('POSITIVE', 'NEGATIVE', 'MIXED')),
  UNIQUE (pattern, organ_key)
);

CREATE INDEX IF NOT EXISTS idx_eh_path_pattern ON eh_pathology_lexicon (LOWER(pattern));

-- ---------------------------------------------------------------------------
-- Seed: anatomy
-- ---------------------------------------------------------------------------
INSERT INTO eh_anatomy_master (organ_key, organ_name, organ_name_hi, body_system, search_terms) VALUES
  ('liver', 'Liver', 'जिगर', 'Digestive', ARRAY['liver','jigar','hepat','sgpt','sgot','fatty liver','jaundice','piliya']),
  ('gallbladder', 'Gallbladder', 'पित्ताशय', 'Digestive', ARRAY['gallbladder','gall stone','cholecyst','bile']),
  ('stomach', 'Stomach', 'आमाशय', 'Digestive', ARRAY['stomach','gastric','acidity','gerd','ulcer','peptic']),
  ('intestine', 'Intestine', 'आंत', 'Digestive', ARRAY['intestine','bowel','ibs','colitis','diarrhoea','diarrhea','constipation']),
  ('pancreas', 'Pancreas', 'अग्न्याशय', 'Digestive', ARRAY['pancreas','diabetes','sugar','insulin','hba1c']),
  ('kidney', 'Kidney', 'गुर्दा', 'Urinary', ARRAY['kidney','renal','creatinine','dialysis','ckd','gurda']),
  ('bladder', 'Bladder', 'मूत्राशय', 'Urinary', ARRAY['bladder','uti','cystitis','urine']),
  ('heart', 'Heart', 'हृदय', 'Cardiovascular', ARRAY['heart','cardiac','angina','chest pain','dil']),
  ('artery', 'Arteries / vessels', 'धमनी', 'Cardiovascular', ARRAY['artery','cholesterol','ldl','hdl','bp high','hypertension']),
  ('vein', 'Veins', 'शिरा', 'Cardiovascular', ARRAY['vein','varicose','hemorrhoid','piles']),
  ('blood', 'Blood / marrow', 'रक्त', 'Cardiovascular', ARRAY['blood','anemia','hb','hemoglobin','wbc','platelet']),
  ('lung', 'Lungs', 'फेफड़े', 'Respiratory', ARRAY['lung','pulmonary','pneumonia','bronch','asthma','dama','tb','pleura']),
  ('throat', 'Throat / pharynx', 'गला', 'Respiratory', ARRAY['throat','tonsil','pharyng','sore throat','khansi','cough']),
  ('brain', 'Brain / CNS', 'मस्तिष्क', 'Nervous', ARRAY['brain','cns','migraine','headache','stroke','epilepsy','anxiety','depression']),
  ('nerve', 'Peripheral nerve', 'नस', 'Nervous', ARRAY['nerve','neuropathy','sciatica','numbness']),
  ('spine', 'Spine', 'रीढ़', 'Musculoskeletal', ARRAY['spine','back','lumbar','cervical','disc','spondyl']),
  ('joint', 'Joints', 'जोड़', 'Musculoskeletal', ARRAY['joint','arthritis','gout','uric','ra','jod']),
  ('muscle', 'Muscle', 'मांसपेशी', 'Musculoskeletal', ARRAY['muscle','myalgia','weakness','cramps']),
  ('bone', 'Bone', 'हड्डी', 'Musculoskeletal', ARRAY['bone','osteoporosis','fracture','density']),
  ('skin', 'Skin', 'त्वचा', 'Integumentary', ARRAY['skin','eczema','psoriasis','rash','acne','fungal']),
  ('thyroid', 'Thyroid', 'थायरॉइड', 'Endocrine', ARRAY['thyroid','tsh','t3','t4','hypothyroid','hyperthyroid']),
  ('repro_female', 'Female reproductive', 'स्त्री प्रजनन', 'Reproductive', ARRAY['uterus','ovary','pcos','fibroid','period','menopause']),
  ('repro_male', 'Male reproductive', 'पुरुष प्रजनन', 'Reproductive', ARRAY['prostate','ed','male','sperm']),
  ('eye', 'Eye', 'आंख', 'Sensory', ARRAY['eye','vision','cataract','glaucoma','retina']),
  ('ear', 'Ear', 'कान', 'Sensory', ARRAY['ear','tinnitus','hearing']),
  ('spleen_lymph', 'Spleen / lymph', 'प्लीहा / लसिका', 'Lymphatic', ARRAY['spleen','lymph','lymphatic','inguinal'])
ON CONFLICT (organ_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed: materia groups (Mattei-style; typical_codes = starting pool for engine)
-- ---------------------------------------------------------------------------
INSERT INTO eh_materia_medica_group (group_code, group_label, target_systems, role_description, polarity_affinity, typical_codes, sort_priority) VALUES
  ('S', 'Scrofoloso (S)', ARRAY['Lymphatic','Digestive','Musculoskeletal'], 'Lymph + nutrition + chronic cleansing; often base for lymphatic temperament', 'MIXED', ARRAY['S-1','S-2','S-5','S-6','S-10'], 5),
  ('C', 'Canceroso (C)', ARRAY['Integumentary','Digestive','Urinary','Musculoskeletal','Respiratory','Cardiovascular'], 'Tissue / chronic degenerative / structural support layer', 'MIXED', ARRAY['C-1','C-5','C-8','C-10','C-14','C-16'], 20),
  ('A', 'Angiotico (A)', ARRAY['Cardiovascular'], 'Vascular / heart / circulation', 'MIXED', ARRAY['A-1','A-2','A-3'], 8),
  ('P', 'Pectorale (P)', ARRAY['Respiratory'], 'Chest / lungs / airways', 'MIXED', ARRAY['P-1','P-2','P-3','P-4'], 8),
  ('F', 'Febrifugo (F)', ARRAY['Nervous','Respiratory','Digestive'], 'Fever / acute flux / septic tendency support', 'POSITIVE', ARRAY['F-1','F-2'], 15),
  ('L', 'Linfatico (L)', ARRAY['Lymphatic','Cardiovascular'], 'Pure lymph / blood fluid balance', 'NEGATIVE', ARRAY['L-1'], 12),
  ('VEN', 'Vermifugo (VEN)', ARRAY['Digestive'], 'Parasitic / microbial burden — digestive', 'POSITIVE', ARRAY['VEN-1'], 25)
ON CONFLICT (group_code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed: electricity
-- ---------------------------------------------------------------------------
INSERT INTO eh_electricity_master (fluid_code, nature, indication_hi, indication_en, for_hyper, for_hypo) VALUES
  ('Y.E.', 'Negative', 'अधिक उर्जा, दर्द, सूजन, तेज़ लक्षण — संतुलन हेतु', 'Hyper / pain / inflammatory surge — balancing (EH framework)', TRUE, FALSE),
  ('R.E.', 'Positive', 'कमजोरी, सुस्ती, थकान, उर्जा की कमी — टोनिंग', 'Hypo / weakness / cold deficit — toning', FALSE, TRUE),
  ('B.E.', 'Neutral', 'रक्त वाहिकाओं / नीला-लाल संतुलन', 'Vascular / mixed circulatory support', TRUE, TRUE),
  ('G.E.', 'Neutral', 'यकृत / पित्त / विषैले उच्चार', 'Hepatic / metabolic / detox emphasis', TRUE, FALSE),
  ('W.E.', 'Neutral', 'मस्तिष्क / तंकरा / तंत्रिका संतुलन', 'CNS / neural calming or regulation', TRUE, TRUE)
ON CONFLICT (fluid_code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed: potency rules (EH polarity law — adjust clinical rows as your clinic prefers)
-- Idempotent: UNIQUE(rule_key) — upsert
-- ---------------------------------------------------------------------------
INSERT INTO eh_potency_rules (rule_key, polarity_context, phase, condition_state, potency, notes, rule_priority) VALUES
  ('neg_acute', 'NEGATIVE', 'ACUTE', 'hypo_weak', 'D6', 'Acute negative — lower dilution positive force', 10),
  ('neg_chronic', 'NEGATIVE', 'CHRONIC', 'hypo_weak', 'D6', 'Chronic negative — D6 family', 20),
  ('pos_acute', 'POSITIVE', 'ACUTE', 'hyper_inflam', 'D6', 'Acute positive — escalate dilution with supervision', 15),
  ('pos_sub', 'POSITIVE', 'SUB_ACUTE', 'hyper_inflam', 'D10', 'Sub-acute positive', 15),
  ('pos_chronic', 'POSITIVE', 'CHRONIC', 'hyper_inflam', 'D30', 'Chronic positive', 15),
  ('mixed_sub', 'MIXED', 'SUB_ACUTE', 'mixed', 'D10', 'Mixed sub-acute', 50),
  ('mixed_chronic', 'MIXED', 'CHRONIC', 'mixed', 'D10', 'Mixed chronic', 50),
  ('degen', 'ANY', 'DEGENERATIVE', 'tissue_loss', 'D10/D30', 'Degenerative planning', 30)
ON CONFLICT (rule_key) DO UPDATE SET
  polarity_context = EXCLUDED.polarity_context,
  phase = EXCLUDED.phase,
  condition_state = EXCLUDED.condition_state,
  potency = EXCLUDED.potency,
  notes = EXCLUDED.notes,
  rule_priority = EXCLUDED.rule_priority;

-- ---------------------------------------------------------------------------
-- Seed: pathology lexicon (OCR/NLP hints → organ)
-- ---------------------------------------------------------------------------
INSERT INTO eh_pathology_lexicon (pattern, organ_key, polarity_hint) VALUES
  ('hepatomegaly', 'liver', 'POSITIVE'),
  ('steatosis', 'liver', 'MIXED'),
  ('bronchitis', 'lung', 'POSITIVE'),
  ('pneumonia', 'lung', 'POSITIVE'),
  ('nephrolithiasis', 'kidney', 'POSITIVE'),
  ('hydronephrosis', 'kidney', 'POSITIVE'),
  ('fibroid', 'repro_female', 'POSITIVE'),
  ('polycystic ovary', 'repro_female', 'MIXED'),
  ('sciatica', 'nerve', 'POSITIVE'),
  ('cataract', 'eye', 'POSITIVE')
ON CONFLICT (pattern, organ_key) DO NOTHING;
