-- Super Admin platform tables + doctor subscription fields

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'doctor', 'patient', 'super_admin'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(32) DEFAULT 'trial';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(32) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS platform_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_settings (setting_key, setting_value) VALUES
  ('pricing', '{"basicMonthly":699,"basicYearly":6999,"proMonthly":1499,"proYearly":14999,"trialDays":14,"basicPatientLimit":100}'),
  ('referral_rules', '{"10":1,"20":3,"30":6,"50":12,"100":"lifetime"}'),
  ('pharmacy', '{"phone":"9098791989","whatsapp":"9098791989","freeDeliveryAbove":500,"message":"E.H. AROGYA SUTRA se order karein"}'),
  ('branding', '{"appName":"E.H. AROGYA SUTRA","tagline":"Ancient Wisdom · Modern Clinical System","supportEmail":"contact@eharogyasutra.com","supportPhone":"9098791989"}'),
  ('notifications', '{"emailOnRegistration":true,"emailOnPayment":true,"emailOnExpiry":true,"dailyRevenueReport":false,"reportEmail":""}'),
  ('maintenance', '{"enabled":false,"message":"Site under maintenance. Please try again later."}')
ON CONFLICT (setting_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR(8) DEFAULT 'INR',
  method VARCHAR(32),
  status VARCHAR(32) DEFAULT 'paid',
  plan VARCHAR(32),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_doctor ON payments (doctor_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments (created_at);

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(64) UNIQUE NOT NULL,
  discount_percent INTEGER NOT NULL,
  valid_until DATE,
  max_uses INTEGER DEFAULT 100,
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(32) DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target VARCHAR(64) DEFAULT 'all',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  open_rate NUMERIC(5,2) DEFAULT 0,
  meta JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS blocked_ips (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(64) UNIQUE NOT NULL,
  reason TEXT,
  blocked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pharmacy_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_number VARCHAR(32),
  items JSONB DEFAULT '[]',
  amount INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(32) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pending_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(64),
  description TEXT,
  status VARCHAR(32) DEFAULT 'pending',
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
