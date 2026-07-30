# PHASE 3C VALIDATION AND PRIVACY

## Validation
Bounded NFC-normalized strings, email format, phone without inventing country codes, timezone via `Intl`, language codes, postal/country, registration date order, experience years 0–80, clinic hour windows.

## Privacy / logging
- Audit metadata forbids phone/address/email/registration_number/password/otp keys
- Audit events store status/ids/counts only — not full profile payloads
- Domain errors preferred; unknown DB errors sanitized
- No passwords/OTP/tokens in profile tables
- `verification_claimed` constrained false in this phase
