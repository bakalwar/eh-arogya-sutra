# Phase 4A — Secure authentication core and session foundation

## Summary

Phase 4A adds an EHAS2-owned authentication database foundation, provider-neutral OTP delivery interface, opaque server-side sessions with HttpOnly cookies and CSRF protection, membership selection, abuse controls, privileged-role assurance policies, audit attempt events, and truthful `OTP_PROVIDER_NOT_CONFIGURED` / `PASSKEY_NOT_CONNECTED` behavior.

## Explicit non-claims

- No real OTP provider is configured (MSG91 / Twilio Verify remain candidates only).
- No OTP was sent in this phase.
- No provider credentials exist in the repository or `.env`.
- Production authentication is **not** active.
- Passkeys are **PASSKEY_NOT_CONNECTED** (contract endpoints only; no WebAuthn library wired).
- No clinical engine, disease/medicine packages, OCR/upload, or payments are active.
- No production deployment exists.
- In-memory-only rate limiting is **not** claimed sufficient for multi-instance production; buckets are PostgreSQL-backed for single-instance foundation, and distributed rate limiting remains a Phase 4B+ ops requirement.

## Delivered

| Area | Status |
|------|--------|
| Migration `009_auth_foundation` | Present (hashed OTP verifier, hashed session token, RLS) |
| `OtpDeliveryProvider.sendChallenge()` | Present; default `NotConfiguredOtpDeliveryProvider` |
| Auth APIs under `/api/eh-as-2/v1/auth/` | Present |
| Session cookies (`ehas2_sid` HttpOnly) + CSRF (`ehas2_csrf` + `x-csrf-token`) | Present |
| Login / verify-otp UI | Truthful stop at provider-not-configured; preview mode separated |
| Passkey routes | `501 PASSKEY_NOT_CONNECTED` |
| Super Admin SMS-only login | Denied |
| Break-glass | Contract only; not activated |

## Security-event write failure policy

Login success records an `auth_attempts` row first. Best-effort append to `audit_events` is wrapped; if audit write fails, login still succeeds and the attempt row remains the durable signal. Failures must not roll back an already-issued session silently without the attempt trail.

## Next

**Phase 4B** — real OTP-provider connection only after owner account/provider approval.
