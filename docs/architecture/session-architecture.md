# Session architecture (future)

## Model

- Stable internal user ID  
- Opaque server-side session ID (preferred over long-lived JWT-only)  
- Cookie: `HttpOnly`, `Secure`, explicit `SameSite`  
- CSRF protection where cookie auth is used cross-site  
- Idle + absolute timeouts  
- Rotation after login and privilege/workspace change  
- Device/session list + revocation  
- Active tenant/workspace + authentication method + assurance level  
- Privileged re-authentication timestamp  

## Forbidden storage

Do not store auth tokens in `localStorage`, `sessionStorage`, or URL/query strings.

## Boundaries

- Doctor / Clinic Admin session namespace  
- Management Admin separate workspace session  
- Super Admin separate control-plane cookie/session namespace  
- No elevation from Doctor → Management → Super Admin via URL/payload  

## Status

`SessionStore` interface exists as `NOT_IMPLEMENTED`. No production session issuance.
