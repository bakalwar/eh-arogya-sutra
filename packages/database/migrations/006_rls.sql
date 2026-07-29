-- Row-Level Security — deny by default; tenant GUC required
-- Session variables: ehas2.tenant_id, ehas2.clinic_id, ehas2.actor_id, ehas2.actor_role
-- Management Admin / Super Admin intentionally have NO default PHI bypass.
-- Non-superuser app role is required because PostgreSQL superusers bypass RLS.

DO $$
BEGIN
  CREATE ROLE ehas2_app NOINHERIT;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

GRANT USAGE ON SCHEMA public TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ehas2_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ehas2_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ehas2_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ehas2_app;
GRANT ehas2_app TO CURRENT_USER;

CREATE OR REPLACE FUNCTION ehas2_tenant_id() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('ehas2.tenant_id', true), '');
$$;

CREATE OR REPLACE FUNCTION ehas2_clinic_id() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('ehas2.clinic_id', true), '');
$$;

CREATE OR REPLACE FUNCTION ehas2_tenant_ok(org uuid, clinic uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT ehas2_tenant_id() IS NOT NULL
    AND org::text = ehas2_tenant_id()
    AND (
      ehas2_clinic_id() IS NULL
      OR clinic::text = ehas2_clinic_id()
    );
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'patients',
    'patient_identifiers',
    'consultations',
    'vitals',
    'symptoms',
    'clinical_contexts',
    'affected_body_sites',
    'structured_report_findings',
    'clinical_analyses',
    'oral_formulas',
    'oral_formula_medicines',
    'tablet_section_a',
    'tablet_section_a_medicines',
    'tablet_section_b_slots',
    'external_applications',
    'diet_guidance',
    'safety_warnings',
    'follow_ups',
    'clinician_reviews',
    'prescription_versions',
    'clinical_summary_snapshots'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tenant_isolation', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (ehas2_tenant_ok(organization_id, clinic_id)) WITH CHECK (ehas2_tenant_ok(organization_id, clinic_id))',
      t || '_tenant_isolation',
      t
    );
  END LOOP;
END $$;

ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clinics_tenant_isolation ON clinics;
CREATE POLICY clinics_tenant_isolation ON clinics
  FOR ALL
  USING (ehas2_tenant_id() IS NOT NULL AND organization_id::text = ehas2_tenant_id())
  WITH CHECK (ehas2_tenant_id() IS NOT NULL AND organization_id::text = ehas2_tenant_id());
