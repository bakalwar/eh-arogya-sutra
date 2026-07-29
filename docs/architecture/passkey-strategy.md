# Passkey strategy

## Doctor

- Verified onboarding (approved OTP or equivalent)  
- Passkey enrollment encouraged after first successful login  
- Passkey preferred for repeat login  
- Secure fallback: rate-limited OTP + device review  
- Lost-device: revoke passkeys + re-verify phone + revoke sessions  

## Management Admin

- Passkey and/or MFA **mandatory**  
- Re-authentication for payment/verification/refund-sensitive actions  
- Restricted recovery with manual review where appropriate  

## Super Admin

- Phishing-resistant passkey / FIDO2 security key **mandatory**  
- SMS-only authentication **prohibited**  
- Two securely managed authenticators recommended  
- Separate recovery ceremony; immediate alerts; short sessions  

## Risks to document in ops

- Shared clinic devices → discourage discoverable passkeys on shared browsers  
- Cloud passkey sync convenience vs account-takeover blast radius  
- Browser/WebAuthn support assumptions (modern Chromium/Safari/Firefox)  

No passkey registration is active in Phase 2B-A.
