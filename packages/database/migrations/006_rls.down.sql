-- Keep ehas2_app role (may be referenced); revoke grants softly
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM ehas2_app;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM ehas2_app;
REVOKE USAGE ON SCHEMA public FROM ehas2_app;

DROP POLICY IF EXISTS clinics_tenant_isolation ON clinics;
ALTER TABLE clinics NO FORCE ROW LEVEL SECURITY;
ALTER TABLE clinics DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clinical_summary_snapshots',
    'prescription_versions',
    'clinician_reviews',
    'follow_ups',
    'safety_warnings',
    'diet_guidance',
    'external_applications',
    'tablet_section_b_slots',
    'tablet_section_a_medicines',
    'tablet_section_a',
    'oral_formula_medicines',
    'oral_formulas',
    'clinical_analyses',
    'structured_report_findings',
    'affected_body_sites',
    'clinical_contexts',
    'symptoms',
    'vitals',
    'consultations',
    'patient_identifiers',
    'patients'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tenant_isolation', t);
    EXECUTE format('ALTER TABLE %I NO FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS ehas2_tenant_ok(uuid, uuid);
DROP FUNCTION IF EXISTS ehas2_clinic_id();
DROP FUNCTION IF EXISTS ehas2_tenant_id();
