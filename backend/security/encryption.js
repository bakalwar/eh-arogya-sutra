const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'eh-arogya-sutra-default-key-2026';

/**
 * Encrypt sensitive data using AES-256.
 */
function encrypt(text) {
  if (!text) return null;
  return CryptoJS.AES.encrypt(String(text), ENCRYPTION_KEY).toString();
}

/**
 * Decrypt sensitive data using AES-256.
 */
function decrypt(ciphertext) {
  if (!ciphertext) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error('Decryption failed:', err);
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt
};
