const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

/**
 * Generate a new TOTP secret for a user.
 */
function generateTotpSecret(email) {
  const secret = speakeasy.generateSecret({
    issuer: 'EH Arogya Sutra',
    name: `EH Arogya Sutra (${email})`,
    length: 20
  });
  return secret;
}

/**
 * Generate a QR code for the TOTP secret.
 */
async function generateQrCode(otpauth_url) {
  try {
    return await qrcode.toDataURL(otpauth_url);
  } catch (err) {
    console.error('QR Code generation failed:', err);
    throw err;
  }
}

/**
 * Verify a TOTP token against a secret.
 */
function verifyTotpToken(secret, token) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1 // Allow 30 seconds before/after
  });
}

module.exports = {
  generateTotpSecret,
  generateQrCode,
  verifyTotpToken
};
