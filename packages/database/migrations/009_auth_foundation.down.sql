DROP POLICY IF EXISTS auth_sessions_actor_read ON auth_sessions;
DROP POLICY IF EXISTS auth_passkeys_actor_all ON auth_passkey_credentials;
DROP POLICY IF EXISTS auth_contact_actor_read ON auth_contact_methods;
DROP POLICY IF EXISTS auth_recovery_actor_read ON auth_recovery_methods;
DROP POLICY IF EXISTS auth_account_security_actor_read ON auth_account_security;
DROP POLICY IF EXISTS auth_privileged_actor_read ON auth_privileged_reauth;
DROP POLICY IF EXISTS auth_provider_map_actor_read ON auth_provider_identity_mappings;

DROP TABLE IF EXISTS auth_provider_identity_mappings;
DROP TABLE IF EXISTS auth_recovery_methods;
DROP TABLE IF EXISTS auth_rate_limit_buckets;
DROP TABLE IF EXISTS auth_account_security;
DROP TABLE IF EXISTS auth_privileged_reauth;
DROP TABLE IF EXISTS auth_passkey_credentials;
DROP TABLE IF EXISTS auth_attempts;
DROP TABLE IF EXISTS auth_session_revocations;
DROP TABLE IF EXISTS auth_sessions;
DROP TABLE IF EXISTS auth_otp_challenges;
DROP TABLE IF EXISTS auth_contact_methods;
