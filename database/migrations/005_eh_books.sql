-- EH Mattei book passages for CDSS book search
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_name VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  page_number INT,
  chapter VARCHAR(128),
  content_cleaned TEXT NOT NULL,
  passage TEXT NOT NULL,
  symptoms_related JSONB NOT NULL DEFAULT '[]',
  keywords TEXT,
  body_system VARCHAR(64),
  medicine_codes TEXT[] DEFAULT '{}',
  search_document TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_symptoms_related ON books USING GIN (symptoms_related);
CREATE INDEX IF NOT EXISTS idx_books_medicine_codes ON books USING GIN (medicine_codes);
CREATE INDEX IF NOT EXISTS idx_books_body_system ON books (body_system);
CREATE INDEX IF NOT EXISTS idx_books_content_trgm ON books USING GIN (content_cleaned gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_keywords_trgm ON books USING GIN ((COALESCE(keywords, '')) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_books_search ON books USING GIN (search_document);

COMMENT ON TABLE books IS 'Electro-Homoeopathy reference book passages for symptom-linked CDSS';

INSERT INTO books (book_name, author, page_number, chapter, content_cleaned, passage, symptoms_related, keywords, body_system, medicine_codes) VALUES
(
  'Mattei Electro-Homoeopathy — Clinical Guide',
  'Count Cesare Mattei',
  45,
  'Respiratory & Fever',
  'In acute respiratory cases with fever bukhar khansi and throat irritation, the primary combination is C-8 with S-1 as lymphatic support. Angiotico A-2 may be added when sanguine congestion is evident.',
  'In acute respiratory cases with fever (bukhar), cough (khansi), and throat irritation (gale dard), the primary combination is C-8 with S-1 as lymphatic support. Angiotico A-2 may be added when sanguine congestion is evident. Yellow Electricity is preferred for positive inflammatory rog.',
  '["fever","bukhar","cough","khansi","sore throat","gale dard","respiratory"]',
  'respiratory fever cough throat inflammation acute',
  'respiratory',
  ARRAY['C-8','S-1','A-2']
),
(
  'Mattei Principles of Polarity',
  'Count Cesare Mattei',
  112,
  'Lymphatic Vitiation',
  'Where glandular swelling and chronic lymphatic stasis dominate, Scrofoloso S-1 and S-2 are foundational. Canceroso C-5 supports terrain when mixed vitiation is suspected.',
  'Where glandular swelling (sujan) and chronic lymphatic stasis dominate, Scrofoloso S-1 and S-2 are foundational. Canceroso C-5 supports terrain when mixed vitiation is suspected. Prefer attenuated dilution in sub-acute phases.',
  '["swelling","gland","lymph","weakness","chronic"]',
  'lymphatic gland swelling scrofoloso',
  'lymphatic',
  ARRAY['S-1','S-2','C-5']
),
(
  'Mattei Angiotico Compendium',
  'Count Cesare Mattei',
  78,
  'Sanguine / Blood',
  'Hypertension palpitations and acute heat in the blood channel respond to Angiotico A-1 and A-2 with Febrifugo support. High BP and fever together suggest C-11 with A-1.',
  'Hypertension, palpitations, and acute heat in the blood (sanguine) channel respond to Angiotico A-1 and A-2. When high BP and fever occur together, C-11 with A-1 is indicated as primary.',
  '["high blood pressure","fever","palpitations","heart","blood"]',
  'sanguine blood hypertension circulation angiotico',
  'sanguine',
  ARRAY['A-1','A-2','C-11']
),
(
  'Mattei General Therapeutics',
  'Count Cesare Mattei',
  12,
  'Core Law',
  'The physician must always oppose rog polarity with medicine polarity. Positive inflammatory rog receives negative medicine at third dilution. Formula planning begins with Mukhya Aushadh then Prabhavit Ang.',
  'The physician must always oppose rog polarity with medicine polarity. Positive inflammatory rog receives negative medicine at third dilution. Formula planning begins with Mukhya Aushadh (Formula A), then Prabhavit Ang (Formula B), Sahayak (C), and Bahya (D) for external terrain.',
  '[]',
  'polarity principle formula mukhya prabhavit general',
  'general',
  ARRAY['C-8','S-1','A-2']
)
;

UPDATE books SET search_document = to_tsvector('simple',
  coalesce(book_name, '') || ' ' || coalesce(author, '') || ' ' ||
  coalesce(content_cleaned, '') || ' ' || coalesce(keywords, '') || ' ' ||
  coalesce(body_system, '') || ' ' || coalesce(array_to_string(medicine_codes, ' '), '')
) WHERE search_document IS NULL;
