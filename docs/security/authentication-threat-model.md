# Authentication threat model (Phase 4A)

## Assets

- EHAS2 user identity and hashed contact methods
- Opaque session tokens (browser cookie; server stores hash only)
- OTP challenges (verifier/hash only)
- Tenant membership and role bindings
- Audit / auth attempt metadata (no PHI)

## Adversaries / threats

| Threat | Mitigation in Phase 4A |
|--------|-------------------------|
| OTP interception / guessing | Hashed verifier, short TTL, attempt ceiling, resend cooldown |
| Account enumeration | Generic responses; invalid phone same shape as not-configured |
| Session theft via XSS | HttpOnly session cookie; no localStorage tokens |
| CSRF | Double-submit CSRF cookie + header; origin allowlist |
| Session fixation | New opaque token at login; rotation on membership change |
| Provider outage bypass | Fail closed; never authenticate without accepted delivery |
| Privilege escalation via client role | Server membership proof only; SMS-only Super Admin denied |
| Log leakage | No plaintext OTP/phone/token in ordinary logs or audit payloads |
| Demo abuse | Preview mode does not write to PostgreSQL |

## Out of scope (not claimed)

- Real SMS delivery integrity
- Distributed rate-limit cluster guarantees
- Passkey/WebAuthn cryptography (not connected)
- Break-glass activation
- Production WAF / botnet defenses

## Status

Session core implemented locally. **OTP provider NOT_CONFIGURED. Production authentication not active.**
