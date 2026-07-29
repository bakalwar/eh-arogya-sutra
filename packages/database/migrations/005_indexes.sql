-- Required indexes (avoid full sensitive narrative indexes)
CREATE INDEX idx_patients_tenant_patient ON patients (organization_id, id);
CREATE INDEX idx_patients_tenant_clinic ON patients (organization_id, clinic_id);
CREATE INDEX idx_consultations_tenant_date ON consultations (organization_id, consultation_at DESC);
CREATE INDEX idx_consultations_doctor_date ON consultations (doctor_user_id, consultation_at DESC);
CREATE INDEX idx_consultations_patient_history ON consultations (organization_id, patient_id, consultation_at DESC);
CREATE INDEX idx_follow_ups_due ON follow_ups (organization_id, clinic_id, due_at)
  WHERE due_at IS NOT NULL AND status IN ('scheduled', 'due');
CREATE INDEX idx_prescription_versions_status ON prescription_versions (organization_id, review_state);
CREATE INDEX idx_clinician_reviews_state ON clinician_reviews (organization_id, clinic_id, review_state);
CREATE INDEX idx_support_tickets_status ON support_tickets (status, created_at DESC);
CREATE INDEX idx_doctor_feedback_status ON doctor_feedback (status, created_at DESC);
CREATE INDEX idx_audit_events_timestamp ON audit_events (created_at DESC);
CREATE INDEX idx_audit_events_tenant_time ON audit_events (organization_id, created_at DESC);
CREATE INDEX idx_external_identity_mapping ON external_identity_mappings (provider_code, provider_subject);
CREATE INDEX idx_memberships_user_org ON memberships (user_id, organization_id, status);
