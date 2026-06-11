-- Extended blood test metadata for EH report CDSS
ALTER TABLE blood_test_values ADD COLUMN IF NOT EXISTS label_hi VARCHAR(128);
ALTER TABLE blood_test_values ADD COLUMN IF NOT EXISTS high_vitiation VARCHAR(32);
ALTER TABLE blood_test_values ADD COLUMN IF NOT EXISTS low_vitiation VARCHAR(32);
ALTER TABLE blood_test_values ADD COLUMN IF NOT EXISTS high_meaning TEXT;
ALTER TABLE blood_test_values ADD COLUMN IF NOT EXISTS low_meaning TEXT;
ALTER TABLE blood_test_values ADD COLUMN IF NOT EXISTS high_medicine_hint VARCHAR(128);
ALTER TABLE blood_test_values ADD COLUMN IF NOT EXISTS low_medicine_hint VARCHAR(128);

UPDATE blood_test_values SET
  label_hi = 'हीमोग्लोबिन',
  high_vitiation = 'SANGUINE', low_vitiation = 'SANGUINE',
  high_meaning = 'Polycythemia - Blood badhna - Positive Rog',
  low_meaning = 'Anemia - Rakt ki kami - Negative Rog',
  high_medicine_hint = 'C-8, A-2', low_medicine_hint = 'S-1, C-1, A-1'
WHERE test_key = 'hemoglobin';

UPDATE blood_test_values SET
  label_hi = 'श्वेत रक्त कणिका',
  high_vitiation = 'SANGUINE', low_vitiation = 'LYMPHATIC',
  high_meaning = 'Infection/Inflammation - Positive Rog',
  low_meaning = 'Immune weakness - Negative Rog',
  high_medicine_hint = 'C-8, F-1', low_medicine_hint = 'S-1, C-1'
WHERE test_key = 'wbc';

UPDATE blood_test_values SET
  label_hi = 'प्लेटलेट्स',
  high_vitiation = 'SANGUINE', low_vitiation = 'SANGUINE',
  high_meaning = 'Thrombocytosis',
  low_meaning = 'Thrombocytopenia - Bleeding risk',
  high_medicine_hint = 'A-2, C-5', low_medicine_hint = 'C-1, A-1'
WHERE test_key = 'platelets';

UPDATE blood_test_values SET
  label_hi = 'खाली पेट शुगर',
  high_vitiation = 'SANGUINE', low_vitiation = 'SANGUINE',
  high_meaning = 'Diabetes - Positive Rog',
  low_meaning = 'Hypoglycemia - Negative Rog',
  high_medicine_hint = 'C-6, S-4', low_medicine_hint = 'C-2, A-1'
WHERE test_key = 'glucose';

UPDATE blood_test_values SET
  label_hi = 'क्रिएटिनिन',
  high_vitiation = 'LYMPHATIC', low_vitiation = 'LYMPHATIC',
  high_meaning = 'Kidney problem - Positive Rog',
  low_meaning = 'Low muscle mass',
  high_medicine_hint = 'S-6, C-17', low_medicine_hint = 'S-1, C-1'
WHERE test_key = 'creatinine';

UPDATE blood_test_values SET
  label_hi = 'यूरिक एसिड',
  high_vitiation = 'LYMPHATIC', low_vitiation = 'LYMPHATIC',
  high_meaning = 'Gout/Arthritis - Positive Rog',
  low_meaning = 'Low uric acid',
  high_medicine_hint = 'S-6, C-9', low_medicine_hint = 'S-1'
WHERE test_key = 'uric_acid';

UPDATE blood_test_values SET
  label_hi = 'CRP',
  high_vitiation = 'SANGUINE', low_vitiation = 'SANGUINE',
  high_meaning = 'Active inflammation - Positive Rog',
  low_meaning = 'No inflammation',
  high_medicine_hint = 'C-8, F-1', low_medicine_hint = NULL
WHERE test_key = 'crp';

UPDATE blood_test_values SET
  label_hi = 'ESR',
  high_vitiation = 'SANGUINE', low_vitiation = 'LYMPHATIC',
  high_meaning = 'Inflammation/Infection - Positive',
  low_meaning = 'Low ESR',
  high_medicine_hint = 'C-8, A-2', low_medicine_hint = NULL
WHERE test_key = 'esr';

UPDATE blood_test_values SET
  label_hi = 'विटामिन डी',
  high_vitiation = 'SANGUINE', low_vitiation = 'LYMPHATIC',
  high_meaning = 'Vitamin D toxicity (rare)',
  low_meaning = 'Deficiency - Bones weak - Negative Rog',
  high_medicine_hint = NULL, low_medicine_hint = 'C-1, A-1, S-1'
WHERE test_key = 'vitamin_d';

UPDATE blood_test_values SET
  label_hi = 'HbA1c',
  high_vitiation = 'SANGUINE', low_vitiation = 'SANGUINE',
  high_meaning = 'Long term high sugar - Positive Rog',
  low_meaning = 'Hypoglycemia tendency',
  high_medicine_hint = 'C-6, S-4, A-2', low_medicine_hint = 'C-2'
WHERE test_key = 'hemoglobin_a1c';

INSERT INTO blood_test_values (test_key, label, label_hi, unit, min_normal, max_normal, sort_order,
  high_vitiation, low_vitiation, high_meaning, low_meaning, high_medicine_hint, low_medicine_hint) VALUES
  ('rbc', 'RBC Count', 'लाल रक्त कणिका', 'million/uL', 4.5, 5.5, 12,
   'SANGUINE', 'SANGUINE', 'Polycythemia', 'Anemia', 'A-2, C-8', 'A-1, C-1'),
  ('hematocrit', 'Hematocrit', 'हेमाटोक्रिट', '%', 36, 50, 13,
   'SANGUINE', 'SANGUINE', 'High blood viscosity', 'Low blood volume', 'A-2', 'A-1, C-1'),
  ('sgot', 'SGOT/AST', 'SGOT', 'U/L', 10, 40, 20,
   'LYMPHATIC', 'LYMPHATIC', 'Liver inflammation', 'Low enzyme', 'S-3, C-8', 'S-1'),
  ('sgpt', 'SGPT/ALT', 'SGPT', 'U/L', 7, 56, 21,
   'LYMPHATIC', 'LYMPHATIC', 'Liver damage', 'Low liver function', 'S-3, C-8', 'S-1, A-1'),
  ('tsh', 'TSH', 'TSH', 'mIU/L', 0.4, 4.0, 30,
   'LYMPHATIC', 'LYMPHATIC', 'Hypothyroidism signal', 'Hyperthyroidism', 'S-4, C-3', 'C-8, A-2'),
  ('cholesterol', 'Total Cholesterol', 'कोलेस्ट्रॉल', 'mg/dL', 0, 200, 40,
   'SANGUINE', 'SANGUINE', 'Heart disease risk', 'Malabsorption', 'A-2, C-8', 'A-1, S-1'),
  ('triglycerides', 'Triglycerides', 'ट्राइग्लिसराइड', 'mg/dL', 0, 150, 41,
   'SANGUINE', 'SANGUINE', 'High fat in blood', 'Malnutrition', 'A-2, S-4', 'A-1'),
  ('ferritin', 'Ferritin', 'फेरिटिन', 'ng/mL', 12, 300, 42,
   'SANGUINE', 'LYMPHATIC', 'Iron overload', 'Iron deficiency', 'A-2, C-8', 'A-1, C-1')
ON CONFLICT (test_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_hi = EXCLUDED.label_hi,
  unit = EXCLUDED.unit,
  min_normal = EXCLUDED.min_normal,
  max_normal = EXCLUDED.max_normal,
  high_vitiation = EXCLUDED.high_vitiation,
  low_vitiation = EXCLUDED.low_vitiation,
  high_meaning = EXCLUDED.high_meaning,
  low_meaning = EXCLUDED.low_meaning,
  high_medicine_hint = EXCLUDED.high_medicine_hint,
  low_medicine_hint = EXCLUDED.low_medicine_hint;
