/** Silent personal factor (same rule as backend) — do not display as “Mulank” in UI */
export function personalFactorFromName(name) {
  const s = String(name || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!s) return null;
  let sum = 0;
  for (let i = 0; i < s.length; i += 1) sum += s.charCodeAt(i);
  let n = sum;
  while (n > 9) {
    n = String(n)
      .split('')
      .reduce((a, d) => a + Number(d), 0);
  }
  return n || 9;
}

const LS_PATIENTS = 'eh_local_patients';

export function loadLocalPatients() {
  try {
    const raw = localStorage.getItem(LS_PATIENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalPatient(record) {
  const list = loadLocalPatients();
  list.unshift(record);
  localStorage.setItem(LS_PATIENTS, JSON.stringify(list.slice(0, 200)));
}

export const CDSS_CASE_KEY = 'eh_cdss_case';
