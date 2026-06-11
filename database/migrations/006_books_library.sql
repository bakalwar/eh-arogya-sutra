-- Book library: categories, polarity, upload metadata
ALTER TABLE books ADD COLUMN IF NOT EXISTS category VARCHAR(64) DEFAULT 'eh_principles';
ALTER TABLE books ADD COLUMN IF NOT EXISTS polarity_hint VARCHAR(32);
ALTER TABLE books ADD COLUMN IF NOT EXISTS source_type VARCHAR(32) DEFAULT 'manual';
ALTER TABLE books ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id);
ALTER TABLE books ADD COLUMN IF NOT EXISTS title VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_books_category ON books (category);

COMMENT ON COLUMN books.category IS 'materia_medica | clinical_cases | eh_principles | medicine_making | symptoms_guide';

UPDATE books SET category = COALESCE(category, 'eh_principles') WHERE category IS NULL;
