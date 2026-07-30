# Authentication provider portability (Phase 4A)

## Accepted architecture (Phase 2B-A)

- EHAS2-owned stable user identity
- EHAS2-owned tenant memberships and roles
- EHAS2-owned opaque server-side sessions
- Provider-neutral OTP delivery interface
- India-ready SMS provider connected later (owner approval)
- Passkeys encouraged for doctors; mandatory for privileged activation
- Provider identity mappings table for portable subject hashes (`auth_provider_identity_mappings`)

## Provider status

| Provider | Status |
|----------|--------|
| MSG91 | Candidate, **NOT_CONFIGURED** |
| Twilio Verify | Fallback candidate, **NOT_CONFIGURED** |
| Amazon Cognito | Architectural fallback only |
| Default adapter | `NotConfiguredOtpDeliveryProvider` |

No provider SDK is installed without separate owner approval. No provider secrets in PostgreSQL or source.

## Interface

`OtpDeliveryProvider.sendChallenge()` returns provider-neutral codes:

- `OTP_PROVIDER_NOT_CONFIGURED`
- `OTP_DELIVERY_ACCEPTED`
- `OTP_DELIVERY_FAILED`
- `OTP_RATE_LIMITED`
- `OTP_PROVIDER_UNAVAILABLE`

## Next

Phase 4B wires a single approved provider behind the same interface after owner account creation and secret injection outside git.
