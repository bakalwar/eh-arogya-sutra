# Super Admin authentication (design)

## Required

- Separate hostname / control-plane concept  
- Separate login and cookie/session namespace  
- No Doctor navigation link; no Management elevation  
- Phishing-resistant passkey/security key  
- SMS cannot be the only factor  
- Short timeout; re-authentication; reason for privileged actions  
- Device/session controls; login alerts; restricted recovery  
- Immutable privileged audit  
- No default patient-PHI access  

## Break-glass

Emergency-only; strongest auth; explicit reason; restricted scope; limited duration; immediate alert; immutable audit; automatic expiry; mandatory post-use review.

## Status

No `/ops` login implementation in Phase 2B-A. Policies remain deny-by-default.
