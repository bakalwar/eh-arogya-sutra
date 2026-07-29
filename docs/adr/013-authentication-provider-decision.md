# ADR 013 — Authentication provider decision

## Status

**PROPOSED** — not accepted. Owner approval required.

## Context

E.H. AROGYA SUTRA 2 needs secure, scalable, provider-portable authentication for Doctors (India mobile-first), Clinic Admins, Management Admins, and a separate Super Admin / Break-Glass control plane. Target scale is a free/low-cost pilot growing toward 100,000 registered doctors with free-to-paid infrastructure migration.

Phase 2A already defines deny-by-default authorization. Authentication remains `NOT_IMPLEMENTED`.

## Requirements (summary)

- India mobile OTP onboarding option + passkey migration path
- No universal OTP; OTP abuse controls
- Multi-clinic memberships; no shared clinic login
- Management Admin MFA/passkey; no Super Admin by default; no default patient PHI
- Super Admin phishing-resistant passkey/security key; SMS cannot be sole factor; separate session boundary
- Provider portability and identity export
- Pilot cost control and 100k-doctor suitability

## Options compared

| ID | Category | Candidate |
|----|----------|-----------|
| A1 | Managed identity platform | Auth0 (Okta Customer Identity Cloud) |
| B1 | Major cloud identity | Amazon Cognito User Pools |
| B2 | Major cloud identity | Firebase Authentication (+ Identity Platform) |
| C1/E1 | Hybrid / provider-neutral | EHAS2-owned identity + sessions + WebAuthn; MSG91 OTP delivery; Twilio Verify fallback |
| D1 | Self-hosted identity | Keycloak |

Official sources are listed in `docs/phase-reports/PHASE_2B_A_OFFICIAL_SOURCES.md` (access date 2026-07-30).

## Proposed decision

**Primary architecture: Hybrid (Category E / C1)**

1. **OTP delivery:** MSG91 (India) as primary SMS/OTP channel; Twilio Verify as fallback channel  
2. **Identity & authorization truth:** EHAS2 internal stable user ID + memberships + roles + TenantContext (PostgreSQL in Phase 3)  
3. **Sessions:** EHAS2 opaque server-side sessions; HttpOnly Secure cookies; never localStorage  
4. **Passkeys:** EHAS2 WebAuthn/PasskeyProvider for Doctor (encouraged), Management (mandatory), Super Admin (phishing-resistant mandatory)  
5. **Provider mapping table:** allows dual-provider transition and exit without rewriting clinical ownership  

**Fallback managed platform:** Amazon Cognito Essentials (if owner prefers less custom session/WebAuthn operations). Cognito SMS still billed separately via Amazon SNS; India OTP economics remain a sales/ops confirmation item.

## Reasons

- India OTP cost and DLT practicality favor a dedicated India SMS/OTP provider over Auth0/Firebase as the *only* doctor login path  
- Authorization must remain EHAS2-controlled (Phase 2A); provider user IDs must not become clinical ownership keys  
- Super Admin requires phishing-resistant factors; SMS-only is prohibited by policy  
- Cognito’s published free tier (10,000 MAU Lite/Essentials for direct/social sign-in) is attractive for pilot/growth, but hybrid still wins for India OTP economics and portability  
- Auth0 Free (up to 25,000 MAU) is pilot-friendly for MFA/passkeys, but phone OTP typically routes through Twilio and adds channel fees  
- Keycloak passkeys are supported (26.4+), but self-host ops burden is high for the free pilot  

## Rejected / deferred alternatives

- **Firebase Auth as sole IdP:** Phone Auth is Blaze + per-SMS; base Auth SMS has published daily limits; Identity Platform adds MAU pricing; Super Admin SMS-only path is unacceptable  
- **Auth0 as sole doctor OTP IdP:** Strong MFA/passkeys; SMS/phone via Twilio or custom; MAU + channel costs and vendor lock-in for authorization truth  
- **Keycloak as sole pilot IdP:** Excellent portability/control; rejected as *primary pilot* due to operational complexity (may revisit later)  

## Costs

See `docs/architecture/authentication-cost-model.md` and `PHASE_2B_A_COST_MATRIX.md`. Ranges use official base fees where published; India SMS totals require sales confirmation for MSG91 negotiated rates and Twilio India SMS channel fees.

## Security consequences

- OTP never logged/plaintext; abuse budgets; no auth bypass on provider outage  
- Separate Management / Super Admin session namespaces  
- Provider identity ≠ authorization truth  

## Operational consequences

- EHAS2 owns session store and WebAuthn ops  
- Dual OTP providers for outage resilience  
- Free-to-paid trigger includes OTP spend, MAU, audit, and SLA needs  

## Portability / exit

- Internal user ID stable across providers  
- `ProviderAccountMapping` contract  
- Dual-link transition + re-verification + rollback + audit  

## Implementation prerequisites (future phases)

- Owner acceptance of this ADR  
- Phase 3 PostgreSQL persistence for users/sessions/mappings  
- Legal/compliance review of OTP vendor subprocessors and Indian privacy requirements  
- No SDK/account/OTP traffic until a later approved implementation phase  

## Unresolved owner decisions

See `docs/phase-reports/PHASE_2B_A_OWNER_DECISIONS.md`.
