-- Phase 4A authentication foundation (provider-neutral; no provider secrets)
-- OTP plaintext and session plaintext tokens are never stored.

CREATE TABLE auth_contact_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  channel text NOT NULL CHECK (channel IN ('sms_mobile', 'email')),
  contact_hash text NOT NULL,
  contact_last4 text NOT NULL CHECK (char_length(contact_last4) BETWEEN 2 AND 4),
  country_hint text NOT NULL DEFAULT 'IN',
  verified_at timestamptz NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel, contact_hash)
);

CREATE TABLE auth_otp_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_method_id uuid NULL REFERENCES auth_contact_methods(id),
  contact_hash text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('login', 'reauthenticate', 'recovery')),
  otp_verifier text NOT NULL,
  otp_salt text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz NULL,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts integer NOT NULL DEFAULT 5,
  resend_available_at timestamptz NOT NULL,
  ip_hash text NULL,
  user_agent_hash text NULL,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'CONSUMED', 'EXPIRED', 'INVALIDATED', 'LOCKED')),
  provider_code text NOT NULL DEFAULT 'none',
  delivery_status text NOT NULL DEFAULT 'NOT_CONFIGURED'
    CHECK (delivery_status IN ('NOT_CONFIGURED', 'ACCEPTED', 'FAILED', 'RATE_LIMITED', 'UNAVAILABLE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_auth_otp_challenges_contact_created
  ON auth_otp_challenges (contact_hash, created_at DESC);
CREATE INDEX idx_auth_otp_challenges_status_expires
  ON auth_otp_challenges (status, expires_at);

CREATE TABLE auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  token_hash text NOT NULL UNIQUE,
  workspace text NOT NULL CHECK (workspace IN ('doctor', 'management', 'super_admin')),
  assurance_level text NOT NULL
    CHECK (assurance_level IN ('aal1_otp', 'aal2_mfa_or_passkey', 'aal3_phishing_resistant')),
  auth_methods text[] NOT NULL DEFAULT ARRAY['sms_otp']::text[],
  membership_id uuid NULL REFERENCES memberships(id),
  organization_id uuid NULL REFERENCES organizations(id),
  clinic_id uuid NULL REFERENCES clinics(id),
  role_code text NULL,
  csrf_token_hash text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  idle_expires_at timestamptz NOT NULL,
  absolute_expires_at timestamptz NOT NULL,
  rotated_from_session_id uuid NULL REFERENCES auth_sessions(id),
  revoked_at timestamptz NULL,
  revoke_reason text NULL,
  ip_hash text NULL,
  user_agent_hash text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_auth_sessions_user_active
  ON auth_sessions (user_id, revoked_at, absolute_expires_at);

CREATE TABLE auth_session_revocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES auth_sessions(id),
  user_id uuid NOT NULL REFERENCES users(id),
  reason text NOT NULL,
  revoked_by_actor_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_hash text NULL,
  ip_hash text NULL,
  user_id uuid NULL REFERENCES users(id),
  event_type text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('SUCCESS', 'DENIED', 'FAILED', 'THROTTLED')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_auth_attempts_contact_created
  ON auth_attempts (contact_hash, created_at DESC);
CREATE INDEX idx_auth_attempts_ip_created
  ON auth_attempts (ip_hash, created_at DESC);

CREATE TABLE auth_passkey_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  credential_id_hash text NOT NULL UNIQUE,
  public_key_cose text NOT NULL,
  sign_count bigint NOT NULL DEFAULT 0,
  transports text[] NOT NULL DEFAULT ARRAY[]::text[],
  aaguid text NULL,
  nickname text NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'REVOKED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_privileged_reauth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  workspace text NOT NULL CHECK (workspace IN ('management', 'super_admin', 'break_glass')),
  method text NOT NULL CHECK (method IN ('passkey', 'security_key', 'reauth_otp')),
  verified_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_account_security (
  user_id uuid PRIMARY KEY REFERENCES users(id),
  lock_until timestamptz NULL,
  failed_verify_count integer NOT NULL DEFAULT 0,
  last_failed_at timestamptz NULL,
  require_passkey boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_rate_limit_buckets (
  bucket_key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  hit_count integer NOT NULL DEFAULT 0 CHECK (hit_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_recovery_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  method_type text NOT NULL CHECK (method_type IN ('recovery_codes_contract', 'support_assisted')),
  status text NOT NULL DEFAULT 'CONTRACT_ONLY'
    CHECK (status IN ('CONTRACT_ONLY', 'ACTIVE', 'INACTIVE')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_provider_identity_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  provider_code text NOT NULL,
  provider_subject_hash text NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz NULL,
  status text NOT NULL DEFAULT 'INACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'REVOKED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_code, provider_subject_hash)
);

-- Auth tables are looked up by hashed token/contact before tenant GUCs exist.
-- Restrict to ehas2_app; application must use admin/auth pool paths with hashed lookups only.
ALTER TABLE auth_contact_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_contact_methods FORCE ROW LEVEL SECURITY;
ALTER TABLE auth_otp_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_otp_challenges FORCE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE auth_session_revocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_session_revocations FORCE ROW LEVEL SECURITY;
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_attempts FORCE ROW LEVEL SECURITY;
ALTER TABLE auth_passkey_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_passkey_credentials FORCE ROW LEVEL SECURITY;
ALTER TABLE auth_privileged_reauth ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_privileged_reauth FORCE ROW LEVEL SECURITY;
ALTER TABLE auth_account_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_account_security FORCE ROW LEVEL SECURITY;
ALTER TABLE auth_rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_rate_limit_buckets FORCE ROW LEVEL SECURITY;
ALTER TABLE auth_recovery_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_recovery_methods FORCE ROW LEVEL SECURITY;
ALTER TABLE auth_provider_identity_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_provider_identity_mappings FORCE ROW LEVEL SECURITY;

-- Actor-scoped policies for authenticated reads; auth writes use admin client in services.
CREATE POLICY auth_sessions_actor_read ON auth_sessions
  FOR SELECT USING (user_id::text = NULLIF(current_setting('ehas2.actor_id', true), ''));
CREATE POLICY auth_passkeys_actor_all ON auth_passkey_credentials
  FOR ALL USING (user_id::text = NULLIF(current_setting('ehas2.actor_id', true), ''))
  WITH CHECK (user_id::text = NULLIF(current_setting('ehas2.actor_id', true), ''));
CREATE POLICY auth_contact_actor_read ON auth_contact_methods
  FOR SELECT USING (user_id::text = NULLIF(current_setting('ehas2.actor_id', true), ''));
CREATE POLICY auth_recovery_actor_read ON auth_recovery_methods
  FOR SELECT USING (user_id::text = NULLIF(current_setting('ehas2.actor_id', true), ''));
CREATE POLICY auth_account_security_actor_read ON auth_account_security
  FOR SELECT USING (user_id::text = NULLIF(current_setting('ehas2.actor_id', true), ''));
CREATE POLICY auth_privileged_actor_read ON auth_privileged_reauth
  FOR SELECT USING (user_id::text = NULLIF(current_setting('ehas2.actor_id', true), ''));
CREATE POLICY auth_provider_map_actor_read ON auth_provider_identity_mappings
  FOR SELECT USING (user_id::text = NULLIF(current_setting('ehas2.actor_id', true), ''));

-- Deny-by-default remaining auth tables for non-admin (no policies => no access under FORCE RLS for ehas2_app).
-- Migration runner / withAdminClient uses table owner / BYPASSRLS-capable role.

GRANT SELECT, INSERT, UPDATE, DELETE ON auth_contact_methods TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_otp_challenges TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_sessions TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_session_revocations TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_attempts TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_passkey_credentials TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_privileged_reauth TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_account_security TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_rate_limit_buckets TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_recovery_methods TO ehas2_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_provider_identity_mappings TO ehas2_app;
