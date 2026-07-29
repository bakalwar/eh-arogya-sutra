# Identity provider portability

## Boundary

```
External identity / OTP provider
→ verified provider identity
→ EHAS2 internal stable user
→ doctor/user profile
→ clinic memberships
→ active TenantContext
→ permissions
→ resource ownership
→ access decision
```

## Rules

- Provider user ID is not the only application identity  
- Authorization remains EHAS2-controlled  
- Client role/tenant claims are not trusted alone  
- Clinical records key off internal IDs, not provider IDs  
- Accounts can migrate providers without changing patient ownership  

## Contracts (Phase 2B-A)

`IdentityProvider`, `OtpProvider`, `PasskeyProvider`, `SessionStore`, `ProviderAccountMapping` in `@ehas2/security` — all NOT_IMPLEMENTED.

## Migration / exit

- Export mappings + users  
- Dual-provider link + re-verify  
- Cutover + rollback window  
- Audit trail  
- Provider outage: safe errors, **no auth bypass**
