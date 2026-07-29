# Authentication options

Access date for official facts: **2026-07-30**. Sources: `PHASE_2B_A_OFFICIAL_SOURCES.md`.

## Categories

| Category | Description |
|----------|-------------|
| A | Managed authentication/identity platform |
| B | Major cloud identity service |
| C | Provider-neutral framework with EHAS2-owned identity/session data |
| D | Self-hosted identity platform |
| E | Hybrid: managed OTP/SMS + EHAS2 identity/memberships/sessions |

## Candidates

### A1 — Auth0

- Free: up to 25,000 MAU; passkeys included across plans (Auth0 pricing.md)  
- MFA factors include SMS (via Twilio/custom/Auth0 eval limits) and WebAuthn security keys  
- Organizations support for B2B  
- Risk: phone OTP cost/complexity; vendor lock-in if Auth0 IDs become app truth  

### B1 — Amazon Cognito

- Lite / Essentials / Plus tiers; Essentials includes passkeys  
- Free tier: 10,000 MAU (Lite/Essentials, direct/social); Plus has no MAU free tier  
- SMS via Amazon SNS (separate pricing)  
- Strong AWS ecosystem fit; India SMS economics need SNS + DLT confirmation  

### B2 — Firebase Authentication

- Phone Auth: Blaze; billed per SMS (“see current rates”)  
- Auth SMS limits: e.g. 3,000 sent/day (upgrade Identity Platform for higher)  
- Identity Platform: no-cost up to 50K MAU then GCP pricing for email/social/custom  
- India SMS rates not fixed on public pricing page → sales confirmation required  

### C1/E1 — Hybrid (proposed)

- MSG91 OTP Pricing India page shows volume-based ₹/SMS (e.g. illustrative calculator values around ₹0.18–₹0.25; personalized plans via sales)  
- Twilio Verify: $0.05 per successful verification + channel fees (India SMS channel fee variable)  
- EHAS2 owns users, memberships, sessions, WebAuthn  
- Best portability and India cost control; more engineering ownership  

### D1 — Keycloak

- Official passkeys support from 26.4; organizations features evolving  
- Self-hosted cost = infra + ops (no MAU fee)  
- High operational complexity for free pilot  

## Proposed selection

**Primary:** Hybrid E1  
**Fallback managed platform:** Cognito Essentials  

Weighted scoring: `PHASE_2B_A_PROVIDER_MATRIX.md`.
