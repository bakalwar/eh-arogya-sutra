-- EH CDSS — PostgreSQL schema (Technology Guide §2.4 + §7)
-- Apply when migrating from MongoDB to Sequelize + PostgreSQL / Supabase

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Core users (Admin / Doctor; Patient can be separate or role-based)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255),
  password_hash VARCHAR(255),
  role VARCHAR(32) NOT NULL CHECK (role IN ('admin', 'doctor', 'patient')),
  referral_code VARCHAR(64) UNIQUE,
  referred_by UUID REFERENCES users(id),
  subscription_status VARCHAR(32) DEFAULT 'trial', -- 'trial', 'basic', 'pro', 'expired'
  trial_ends_at TIMESTAMPTZ,
  patient_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  age INT,
  gender VARCHAR(32),
  mobile VARCHAR(20),
  weight INT,
  personal_factor SMALLINT CHECK (personal_factor IS NULL OR (personal_factor >= 1 AND personal_factor <= 9)),
  photo_url TEXT,
  symptoms TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  system VARCHAR(64) NOT NULL,
  polarity_hint VARCHAR(64),
  medicine_group VARCHAR(64),
  dilution VARCHAR(32),
  indications TEXT,
  search_document TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for Full-Text Search (FTS)
CREATE OR REPLACE FUNCTION medicines_tsvector_trigger() RETURNS trigger AS $$
begin
  new.search_document :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.indications, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.medicine_group, '')), 'C');
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_medicines_tsvector BEFORE INSERT OR UPDATE
ON medicines FOR EACH ROW EXECUTE FUNCTION medicines_tsvector_trigger();

CREATE INDEX IF NOT EXISTS medicines_search_idx ON medicines USING GIN (search_document);
CREATE INDEX IF NOT EXISTS idx_medicines_name_trgm ON medicines USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_medicines_indications_trgm ON medicines USING GIN ((COALESCE(indications, '')) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_medicines_group ON medicines (medicine_group);

COMMENT ON COLUMN medicines.medicine_group IS 'Electro-Homeopathy Mattei group: Scrofoloso, Canceroso, Angiotico, Linfatico, Melancholic, Phosphoric, Mixed, etc.';
COMMENT ON COLUMN medicines.dilution IS 'Dilution ratio e.g. 1:9, 1:47';
COMMENT ON COLUMN medicines.indications IS 'Clinical indications for search and CDSS';

-- Symptom catalog for fuzzy / FTS symptom checker (scales to large dictionaries)
CREATE TABLE IF NOT EXISTS symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(512) NOT NULL,
  name_hi VARCHAR(512),
  aliases TEXT[] DEFAULT '{}',
  search_document TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION symptoms_tsvector_trigger() RETURNS trigger AS $$
begin
  new.search_document :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.name_hi, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(new.aliases, ' ')), 'C');
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_symptoms_tsvector BEFORE INSERT OR UPDATE
ON symptoms FOR EACH ROW EXECUTE FUNCTION symptoms_tsvector_trigger();

CREATE INDEX IF NOT EXISTS symptoms_search_idx ON symptoms USING GIN (search_document);
CREATE INDEX IF NOT EXISTS idx_symptoms_name_trgm ON symptoms USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_symptoms_name_hi_trgm ON symptoms USING GIN ((COALESCE(name_hi, '')) gin_trgm_ops);

CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  doctor_id UUID REFERENCES users(id),
  items JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  file_url TEXT,
  analysis TEXT,
  analysis_json JSONB,
  report_type VARCHAR(32),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE OR REPLACE FUNCTION books_tsvector_trigger() RETURNS trigger AS $$
begin
  new.search_document :=
    setweight(to_tsvector('english', coalesce(new.book_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.chapter, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.passage, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.keywords, '')), 'D');
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_books_tsvector BEFORE INSERT OR UPDATE
ON books FOR EACH ROW EXECUTE FUNCTION books_tsvector_trigger();

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  action VARCHAR(128) NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(128) NOT NULL,
  rule_json JSONB NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription plans and tracking
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES users(id),
  plan_type VARCHAR(32) NOT NULL, -- 'basic', 'pro', 'trial'
  status VARCHAR(32) NOT NULL, -- 'active', 'expired', 'cancelled'
  price_paid DECIMAL(10, 2) DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  payment_method VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment tracking (QR / UPI / AutoPay)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_platform VARCHAR(64), -- 'phonepe', 'gpay', 'paytm'
  upi_ref_id VARCHAR(255),
  screenshot_url VARCHAR(512),
  status VARCHAR(32) DEFAULT 'pending', -- 'pending', 'verified', 'failed'
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral system tracking
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_id UUID NOT NULL REFERENCES users(id),
  referral_code VARCHAR(64) NOT NULL,
  reward_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
