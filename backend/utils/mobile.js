/** Normalize Indian mobile to last 10 digits (digits only). */
function normalizeMobile(mobile) {
  const digits = String(mobile || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function mobilesMatch(a, b) {
  const na = normalizeMobile(a);
  const nb = normalizeMobile(b);
  return na.length >= 10 && na === nb;
}

module.exports = { normalizeMobile, mobilesMatch };
