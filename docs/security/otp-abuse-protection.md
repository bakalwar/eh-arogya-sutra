# OTP abuse protection (Phase 4A)

## Controls implemented

- Indian mobile normalization (`+91` + 10-digit `[6-9]…`)
- OTP never stored plaintext; scrypt-based verifier + salt + pepper
- OTP never returned in API responses; never logged
- Expiry (`OTP_TTL_MS`), one-time consumption, attempt ceiling (`OTP_MAX_ATTEMPTS`)
- Resend cooldown (`OTP_RESEND_COOLDOWN_MS`)
- Per-phone and per-IP rate-limit buckets in PostgreSQL
- Generic failure responses (account enumeration resistance)
- Challenge invalidation of prior PENDING challenges on new request
- Provider outage / not-configured: fail closed (no session issuance)
- Account lock metadata after attempt ceiling (duration `ACCOUNT_LOCK_MS`)
- Request ID correlation via `x-request-id`

## Default provider behavior

`NotConfiguredOtpDeliveryProvider` → `OTP_PROVIDER_NOT_CONFIGURED` (never fake success).

Deterministic fake provider exists **only** under `tests/helpers/`.

## Multi-instance / distributed rate limiting

PostgreSQL buckets provide a single-database foundation. They are **not** claimed sufficient alone for multi-region production scale. Multi-instance deployments must add a shared distributed limiter (e.g. Redis / edge) with the same keying model (`otp:phone:*`, `otp:ip:*`) before production OTP traffic.

## Status

Foundation controls tested locally. **No real OTP sent. Provider NOT_CONFIGURED.**
