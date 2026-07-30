# Privileged access assurance (Phase 4A)

## Role assurance levels

| Role | Required assurance | SMS-only login | Workspace | Default patient PHI |
|------|--------------------|----------------|-----------|---------------------|
| Doctor | AAL1 OTP | Allowed | doctor | Via membership + permission |
| ClinicAdmin | AAL1 (+ passkey encouraged) | Allowed | doctor | Via membership + permission |
| Management Admin | AAL2 MFA/passkey required for activation | OTP foundation only; reauth passkey contract | management | **None by default** |
| Super Admin | AAL3 phishing-resistant | **Denied** | super_admin | **None by default** |
| Break-glass | Strongest (contract) | N/A | not activated | None |

## Policies enforced now

- `requiredAssuranceForRole()` / `smsOnlyLoginAllowed()`
- Super Admin SMS-only verify → `SMS_ONLY_SUPER_ADMIN_DENIED`
- Shorter privileged session idle/absolute timeouts
- Reauthenticate + passkey endpoints → `PASSKEY_NOT_CONNECTED` / `501`
- No client-supplied role selection without server membership proof
- Management / Super Admin navigation excluded from doctor nav

## Break-glass

Not activated. Emergency-only contract remains documentation-only in this phase.

## Status

Policies and session core are local. **Production privileged authentication is not active** (no passkeys, no real OTP provider).
