# PHASE 3A SCHEMA MANIFEST

## Migrations

1. `001_extensions_and_meta`  
2. `002_identity_tenancy`  
3. `003_patient_clinical`  
4. `004_operations`  
5. `005_indexes`  
6. `006_rls`  

## Identity / tenancy

users, external_identity_mappings, organizations, clinics, memberships, roles, permissions, membership_roles, role_permissions

## Patient / clinical

patients, patient_identifiers, consultations, vitals, symptoms, clinical_contexts, affected_body_sites, structured_report_findings, clinical_analyses, oral_formulas, oral_formula_medicines, tablet_section_a, tablet_section_a_medicines, tablet_section_b_slots, external_applications, diet_guidance, safety_warnings, follow_ups, clinician_reviews, prescription_versions, clinical_summary_snapshots

## Operations

audit_events, support_tickets, doctor_feedback, data_versions, engine_versions, backup_metadata, migration_runs, schema_version

## Absent by design

report_bytes, base64, thumbnail, ocr_source, object_url, storage_path, original_filename
