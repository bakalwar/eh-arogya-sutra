-- Phase 3C: doctor professional profile, clinic profile extensions, membership roles seed,
-- operating hours, non-clinical prescription display prefs, identity snapshot column.
-- No OTP secrets, passwords, uploads, or clinical defaults.

INSERT INTO roles (code, name)
VALUES
  ('Doctor', 'Doctor'),
  ('ClinicAdmin', 'Clinic Admin')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE doctor_professional_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  legal_name text NOT NULL,
  display_name text NOT NULL,
  prescription_name text NOT NULL,
  primary_phone text NULL,
  alternate_phone text NULL,
  professional_email text NULL,
  specialization text NULL,
  years_of_experience int NULL
    CHECK (years_of_experience IS NULL OR (years_of_experience >= 0 AND years_of_experience <= 80)),
  professional_bio text NULL,
  preferred_language text NOT NULL DEFAULT 'en',
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  profile_status text NOT NULL DEFAULT 'DRAFT'
    CHECK (profile_status IN ('DRAFT', 'ACTIVE', 'INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_actor_id uuid NULL,
  updated_by_actor_id uuid NULL
);

CREATE TABLE doctor_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES doctor_professional_profiles(user_id) ON DELETE CASCADE,
  degree_title text NOT NULL,
  institution text NULL,
  awarding_authority text NULL,
  completion_year int NULL
    CHECK (completion_year IS NULL OR (completion_year >= 1950 AND completion_year <= 2100)),
  display_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_actor_id uuid NULL,
  updated_by_actor_id uuid NULL,
  CONSTRAINT doctor_qualifications_degree_nonempty CHECK (length(btrim(degree_title)) > 0)
);

CREATE INDEX idx_doctor_qualifications_user_order
  ON doctor_qualifications (user_id, display_order, id);

CREATE TABLE doctor_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES doctor_professional_profiles(user_id) ON DELETE CASCADE,
  registration_number text NOT NULL,
  registration_authority text NOT NULL,
  registration_region text NULL,
  issued_on date NULL,
  expires_on date NULL,
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED')),
  display_order int NOT NULL DEFAULT 0,
  verification_claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_actor_id uuid NULL,
  updated_by_actor_id uuid NULL,
  CONSTRAINT doctor_registrations_number_nonempty CHECK (length(btrim(registration_number)) > 0),
  CONSTRAINT doctor_registrations_authority_nonempty CHECK (length(btrim(registration_authority)) > 0),
  CONSTRAINT doctor_registrations_dates_ok
    CHECK (expires_on IS NULL OR issued_on IS NULL OR expires_on >= issued_on),
  CONSTRAINT doctor_registrations_unverified_default CHECK (verification_claimed = false)
);

CREATE INDEX idx_doctor_registrations_user_order
  ON doctor_registrations (user_id, display_order, id);

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS legal_name text NULL,
  ADD COLUMN IF NOT EXISTS clinic_code text NULL,
  ADD COLUMN IF NOT EXISTS phone text NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_contact text NULL,
  ADD COLUMN IF NOT EXISTS email text NULL,
  ADD COLUMN IF NOT EXISTS website text NULL,
  ADD COLUMN IF NOT EXISTS address_line1 text NULL,
  ADD COLUMN IF NOT EXISTS address_line2 text NULL,
  ADD COLUMN IF NOT EXISTS landmark text NULL,
  ADD COLUMN IF NOT EXISTS city text NULL,
  ADD COLUMN IF NOT EXISTS district text NULL,
  ADD COLUMN IF NOT EXISTS state text NULL,
  ADD COLUMN IF NOT EXISTS postal_code text NULL,
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'IN',
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en';

CREATE UNIQUE INDEX IF NOT EXISTS idx_clinics_org_clinic_code
  ON clinics (organization_id, clinic_code)
  WHERE clinic_code IS NOT NULL;

CREATE TABLE clinic_operating_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_closed boolean NOT NULL DEFAULT false,
  open_time time NULL,
  close_time time NULL,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_actor_id uuid NULL,
  updated_by_actor_id uuid NULL,
  CONSTRAINT clinic_hours_clinic_org_fk
    FOREIGN KEY (clinic_id, organization_id) REFERENCES clinics(id, organization_id),
  CONSTRAINT clinic_hours_window_ok CHECK (
    (is_closed = true AND open_time IS NULL AND close_time IS NULL)
    OR (is_closed = false AND open_time IS NOT NULL AND close_time IS NOT NULL AND close_time > open_time)
  )
);

CREATE INDEX idx_clinic_operating_hours_clinic
  ON clinic_operating_hours (organization_id, clinic_id, day_of_week, display_order);

CREATE TABLE clinic_prescription_display_settings (
  clinic_id uuid PRIMARY KEY REFERENCES clinics(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  show_clinic_name boolean NOT NULL DEFAULT true,
  show_doctor_name boolean NOT NULL DEFAULT true,
  show_qualifications boolean NOT NULL DEFAULT true,
  show_registration boolean NOT NULL DEFAULT true,
  show_clinic_contact boolean NOT NULL DEFAULT true,
  show_address boolean NOT NULL DEFAULT true,
  header_text text NULL,
  footer_text text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by_actor_id uuid NULL,
  CONSTRAINT clinic_rx_display_clinic_org_fk
    FOREIGN KEY (clinic_id, organization_id) REFERENCES clinics(id, organization_id)
);

ALTER TABLE prescription_versions
  ADD COLUMN IF NOT EXISTS prescriber_identity_snapshot jsonb NULL;

CREATE OR REPLACE FUNCTION ehas2_actor_id() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('ehas2.actor_id', true), '');
$$;

ALTER TABLE doctor_professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_professional_profiles FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS doctor_profiles_owner_isolation ON doctor_professional_profiles;
CREATE POLICY doctor_profiles_owner_isolation ON doctor_professional_profiles
  FOR ALL
  USING (user_id::text = ehas2_actor_id())
  WITH CHECK (user_id::text = ehas2_actor_id());

ALTER TABLE doctor_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_qualifications FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS doctor_qualifications_owner_isolation ON doctor_qualifications;
CREATE POLICY doctor_qualifications_owner_isolation ON doctor_qualifications
  FOR ALL
  USING (user_id::text = ehas2_actor_id())
  WITH CHECK (user_id::text = ehas2_actor_id());

ALTER TABLE doctor_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_registrations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS doctor_registrations_owner_isolation ON doctor_registrations;
CREATE POLICY doctor_registrations_owner_isolation ON doctor_registrations
  FOR ALL
  USING (user_id::text = ehas2_actor_id())
  WITH CHECK (user_id::text = ehas2_actor_id());

ALTER TABLE clinic_operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_operating_hours FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clinic_hours_tenant_isolation ON clinic_operating_hours;
CREATE POLICY clinic_hours_tenant_isolation ON clinic_operating_hours
  FOR ALL
  USING (ehas2_tenant_ok(organization_id, clinic_id))
  WITH CHECK (ehas2_tenant_ok(organization_id, clinic_id));

ALTER TABLE clinic_prescription_display_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_prescription_display_settings FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clinic_rx_display_tenant_isolation ON clinic_prescription_display_settings;
CREATE POLICY clinic_rx_display_tenant_isolation ON clinic_prescription_display_settings
  FOR ALL
  USING (ehas2_tenant_ok(organization_id, clinic_id))
  WITH CHECK (ehas2_tenant_ok(organization_id, clinic_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON doctor_professional_profiles TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON doctor_qualifications TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON doctor_registrations TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON clinic_operating_hours TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON clinic_prescription_display_settings TO ehas2_app;
