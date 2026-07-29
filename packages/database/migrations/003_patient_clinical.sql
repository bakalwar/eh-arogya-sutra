-- Patient and clinical persistence (no original report bytes / paths)
CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  display_name text NOT NULL,
  date_of_birth date NULL,
  sex_at_birth text NULL,
  phone_masked text NULL,
  email_masked text NULL,
  status text NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED', 'LEGAL_HOLD')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_actor_id uuid NULL,
  updated_by_actor_id uuid NULL,
  CONSTRAINT patients_clinic_org_fk
    FOREIGN KEY (clinic_id, organization_id)
    REFERENCES clinics(id, organization_id)
);

CREATE TABLE patient_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  system_code text NOT NULL,
  identifier_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, clinic_id, system_code, identifier_value)
);

CREATE TABLE consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  patient_id uuid NOT NULL REFERENCES patients(id),
  doctor_user_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN (
      'DRAFT', 'IN_PROGRESS', 'AWAITING_REPORT_VERIFICATION', 'ANALYZED',
      'PENDING_CLINICIAN_REVIEW', 'COMPLETED', 'CANCELLED'
    )),
  chief_complaint_text text NULL,
  chief_complaint_onset text NULL,
  chief_complaint_duration text NULL,
  consultation_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by_actor_id uuid NULL,
  updated_by_actor_id uuid NULL
);

CREATE TABLE vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL UNIQUE REFERENCES consultations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  blood_pressure_systolic int NULL,
  blood_pressure_diastolic int NULL,
  pulse_bpm int NULL,
  temperature_c numeric(5,2) NULL,
  weight_kg numeric(6,2) NULL,
  height_cm numeric(6,2) NULL,
  spo2_percent numeric(5,2) NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  symptom_code text NULL,
  label text NOT NULL,
  severity text NULL,
  duration text NULL,
  phase text NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE clinical_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL UNIQUE REFERENCES consultations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  history_notes text NULL,
  temperament_label text NULL,
  temperament_notes text NULL,
  constitution_label text NULL,
  constitution_notes text NULL,
  lifestyle_evidence text NULL,
  additional_context text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE affected_body_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  site_code text NULL,
  label text NOT NULL,
  laterality text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE structured_report_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  report_category text NOT NULL,
  normalized_finding text NULL,
  value_text text NOT NULL,
  unit text NULL,
  reference_range text NULL,
  confidence numeric(5,4) NULL,
  verification_status text NOT NULL
    CHECK (verification_status IN (
      'EXTRACTED_UNVERIFIED', 'NEEDS_REVIEW', 'VERIFIED',
      'CORRECTED_BY_DOCTOR', 'REJECTED_AS_INCORRECT', 'NOT_CLINICALLY_USED'
    )),
  doctor_correction text NULL,
  correction_reason text NULL,
  verified_by_actor_id uuid NULL,
  verified_at timestamptz NULL,
  extraction_engine_version text NULL,
  clinically_used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT structured_report_findings_verified_actor_time CHECK (
    verification_status IN ('EXTRACTED_UNVERIFIED', 'NEEDS_REVIEW', 'NOT_CLINICALLY_USED')
    OR (verified_by_actor_id IS NOT NULL AND verified_at IS NOT NULL)
  )
);

CREATE TABLE clinical_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  status text NOT NULL,
  engine_version text NOT NULL,
  rules_version text NOT NULL,
  disease_data_version text NOT NULL,
  medicine_data_version text NOT NULL,
  input_hash text NOT NULL,
  content_hash text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric(5,4) NULL,
  unresolved_reason text NULL,
  structured_result jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_actor_id uuid NULL
);

CREATE TABLE oral_formulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_analysis_id uuid NOT NULL REFERENCES clinical_analyses(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  sequence_no int NOT NULL,
  label text NOT NULL,
  potency text NULL,
  electricity text NULL,
  dose_instructions text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE oral_formula_medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oral_formula_id uuid NOT NULL REFERENCES oral_formulas(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  medicine_code text NOT NULL,
  sequence_no int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tablet_section_a (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_analysis_id uuid NOT NULL UNIQUE REFERENCES clinical_analyses(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  status text NOT NULL,
  potency text NULL,
  electricity text NULL,
  schedule_instructions text NULL,
  not_generated_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tablet_section_a_medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tablet_section_a_id uuid NOT NULL REFERENCES tablet_section_a(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  medicine_code text NOT NULL,
  sequence_no int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tablet_section_b_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_analysis_id uuid NOT NULL REFERENCES clinical_analyses(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  slot_code text NOT NULL,
  status text NOT NULL,
  medicine_code text NULL,
  potency text NULL,
  electricity text NULL,
  timing text NULL,
  not_generated_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinical_analysis_id, slot_code)
);

CREATE TABLE external_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_analysis_id uuid NOT NULL REFERENCES clinical_analyses(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  body_site text NOT NULL,
  preparation text NULL,
  frequency text NULL,
  duration text NULL,
  safety_instructions text NULL,
  medicines jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE diet_guidance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_analysis_id uuid NOT NULL REFERENCES clinical_analyses(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  guidance_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE safety_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_analysis_id uuid NOT NULL REFERENCES clinical_analyses(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  warning_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  due_at timestamptz NULL,
  instructions text NULL,
  status text NULL CHECK (status IN ('scheduled', 'due', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE clinician_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  review_state text NOT NULL
    CHECK (review_state IN (
      'GENERATED_PENDING_REVIEW', 'NEEDS_CLARIFICATION', 'ACCEPTED',
      'MODIFIED', 'REJECTED', 'ISSUED', 'SUPERSEDED'
    )),
  modification_reason text NULL,
  reviewed_by_actor_id uuid NULL,
  reviewed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE prescription_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  version_number int NOT NULL,
  previous_version_id uuid NULL REFERENCES prescription_versions(id),
  review_state text NOT NULL
    CHECK (review_state IN (
      'GENERATED_PENDING_REVIEW', 'NEEDS_CLARIFICATION', 'ACCEPTED',
      'MODIFIED', 'REJECTED', 'ISSUED', 'SUPERSEDED'
    )),
  structured_prescription jsonb NOT NULL,
  readable_snapshot text NOT NULL,
  engine_version text NOT NULL,
  rules_version text NOT NULL,
  disease_data_version text NOT NULL,
  medicine_data_version text NOT NULL,
  input_hash text NOT NULL,
  content_hash text NOT NULL,
  clinician_decision text NULL,
  modification_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_actor_id uuid NULL,
  UNIQUE (consultation_id, version_number)
);

CREATE TABLE clinical_summary_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  consultation_id uuid NOT NULL REFERENCES consultations(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  clinic_id uuid NOT NULL REFERENCES clinics(id),
  prescription_version_id uuid NULL REFERENCES prescription_versions(id),
  readable_text text NOT NULL,
  structured_summary jsonb NOT NULL,
  engine_version text NOT NULL,
  rules_version text NOT NULL,
  disease_data_version text NOT NULL,
  medicine_data_version text NOT NULL,
  input_hash text NOT NULL,
  content_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_actor_id uuid NULL
);
