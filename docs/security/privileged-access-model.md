# Privileged access model

**Status:** Policy/architecture (Phase 1A-H). Implementation begins Phase 2.

## Roles (least privilege)

| Role | Intent |
|------|--------|
| Doctor | Clinical workflow only |
| Clinic Admin | Clinic configuration (non-platform) |
| Support Operator | Limited support tickets; no default patient PHI |
| Security Analyst | Security events (redacted) |
| Operations Admin | Ops health / deployments (scoped) |
| Super Admin | Full control-plane privileges |
| Break-Glass Super Admin | Emergency only; always alerted + audited |

## Super Admin authentication (planned)

- Separate Super Admin identity  
- Phishing-resistant MFA / passkeys preferred  
- **No SMS-only** protection for privileged access  
- Short sessions; re-auth for sensitive actions  
- Trusted-device controls; login risk scoring  
- Failed-login throttling; suspicious-login alerts  
- Session revocation; limited concurrent sessions  
- Secure recovery codes; break-glass with alerting  
- Periodic access review  

## Forbidden

- Hardcoded Super Admin password  
- Default admin credentials  
- Password in source  
- Hidden backdoor  
- Auth bypass query parameter  
- Universal OTP  
- Shared ordinary-doctor / Super Admin login  

## Authorization

- Deny by default  
- Explicit permission policy  
- Backend checks on **every** request  
- No frontend-only authorization  
- Doctor must never gain Super Admin by changing URL or payload  
- Dual approval for destructive/high-risk actions where appropriate  
- Immutable audit event for privileged actions  

## Patient data

Super Admin dashboards must **not** read patient data by default. Support access requires reason, minimum necessary scope, authorization, time limit, and full audit.
