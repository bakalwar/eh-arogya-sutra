# Session and cookie policy (Phase 4A)

## Session model

- Opaque server-side sessions (`auth_sessions`)
- Browser holds plaintext token only in HttpOnly cookie `ehas2_sid`
- Server stores `token_hash` only (HMAC with `EHAS2_AUTH_PEPPER`)
- Idle timeout: 30 minutes (doctor) / 15 minutes (privileged)
- Absolute timeout: 12 hours (doctor) / 4 hours (privileged)
- Rotation after login and after membership/privilege change
- Logout revokes session; logout-all revokes all active sessions for the user

## Cookies

| Name | HttpOnly | Secure | SameSite | Purpose |
|------|----------|--------|----------|---------|
| `ehas2_sid` | yes | yes in production | Lax | Opaque session |
| `ehas2_csrf` | no | yes in production | Lax | Double-submit CSRF |

Path: `/`. Session token must never appear in URL query strings or localStorage.

## CSRF

State-changing authenticated requests require:

1. Valid Origin (allowlist / same-host)
2. CSRF header `x-csrf-token` matching the session’s CSRF hash

## Forbidden

- JWT in localStorage
- Session in URL
- Reading identity from `x-user-id` / query role parameters

## Status

Implemented in local engineering foundation. Production authentication is not active until OTP provider approval (Phase 4B).
