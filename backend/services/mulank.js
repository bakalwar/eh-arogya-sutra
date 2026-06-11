/**
 * Silent "personal factor" from patient name (digital root style — not shown in UI).
 * Stored as `personalFactor` on Patient for internal CDSS weighting only.
 */
function personalFactorFromName(name) {
  const s = String(name || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!s) return null;
  let sum = 0;
  for (let i = 0; i < s.length; i += 1) {
    sum += s.charCodeAt(i);
  }
  let n = sum;
  while (n > 9) {
    n = String(n)
      .split('')
      .reduce((a, d) => a + Number(d), 0);
  }
  return n || 9;
}

module.exports = { personalFactorFromName };
