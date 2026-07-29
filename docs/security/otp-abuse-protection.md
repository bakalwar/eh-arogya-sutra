# OTP abuse protection (design)

## Controls

- E.164 mobile normalization  
- Short OTP expiry; one-time use; max attempts  
- Resend cooldown; per-number / per-IP / per-device / tenant limits  
- Daily/monthly OTP budget with spend alerts  
- Bot challenge / CAPTCHA where appropriate  
- Suspicious traffic + region anomaly detection  
- Delivery webhooks; failure handling; idempotent duplicate webhooks  
- Generic responses (no account enumeration)  
- Allowlist/blocklist governance  
- OTP never logged; never stored plaintext  
- **No universal development OTP**

## Status

Design only. `OtpProvider.sendChallenge` throws `NOT_IMPLEMENTED`.
