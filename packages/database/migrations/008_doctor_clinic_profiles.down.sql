ALTER TABLE prescription_versions DROP COLUMN IF EXISTS prescriber_identity_snapshot;

DROP POLICY IF EXISTS clinic_rx_display_tenant_isolation ON clinic_prescription_display_settings;
ALTER TABLE clinic_prescription_display_settings NO FORCE ROW LEVEL SECURITY;
ALTER TABLE clinic_prescription_display_settings DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS clinic_prescription_display_settings;

DROP POLICY IF EXISTS clinic_hours_tenant_isolation ON clinic_operating_hours;
ALTER TABLE clinic_operating_hours NO FORCE ROW LEVEL SECURITY;
ALTER TABLE clinic_operating_hours DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS clinic_operating_hours;

DROP INDEX IF EXISTS idx_clinics_org_clinic_code;

ALTER TABLE clinics
  DROP COLUMN IF EXISTS legal_name,
  DROP COLUMN IF EXISTS clinic_code,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS whatsapp_contact,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS website,
  DROP COLUMN IF EXISTS address_line1,
  DROP COLUMN IF EXISTS address_line2,
  DROP COLUMN IF EXISTS landmark,
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS district,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS postal_code,
  DROP COLUMN IF EXISTS country,
  DROP COLUMN IF EXISTS preferred_language;

DROP POLICY IF EXISTS doctor_registrations_owner_isolation ON doctor_registrations;
ALTER TABLE doctor_registrations NO FORCE ROW LEVEL SECURITY;
ALTER TABLE doctor_registrations DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS doctor_registrations;

DROP POLICY IF EXISTS doctor_qualifications_owner_isolation ON doctor_qualifications;
ALTER TABLE doctor_qualifications NO FORCE ROW LEVEL SECURITY;
ALTER TABLE doctor_qualifications DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS doctor_qualifications;

DROP POLICY IF EXISTS doctor_profiles_owner_isolation ON doctor_professional_profiles;
ALTER TABLE doctor_professional_profiles NO FORCE ROW LEVEL SECURITY;
ALTER TABLE doctor_professional_profiles DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS doctor_professional_profiles;

DROP FUNCTION IF EXISTS ehas2_actor_id();
