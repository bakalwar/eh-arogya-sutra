const crypto = require('crypto');

/** Random 8-char password — letters + digits, no ambiguous chars (0/O, 1/l/I). */
function generateTempPassword(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

module.exports = { generateTempPassword };
