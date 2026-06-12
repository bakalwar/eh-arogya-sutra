-- Password-only login (no OTP / 2FA)
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

-- Clear legacy 2FA secrets (optional cleanup)
UPDATE users SET totp_secret = NULL WHERE totp_secret IS NOT NULL;
