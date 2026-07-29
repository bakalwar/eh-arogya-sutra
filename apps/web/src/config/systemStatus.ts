export const SYSTEM_STATUS_LABELS = [
  'E.H. AROGYA SUTRA 2',
  'UI Foundation',
  'Clinical Engine · Not Connected',
  'Disease Data · Not Installed',
  'Medicine Data · Not Installed',
  'Authentication · Not Active',
] as const;

export const FORBIDDEN_STATUS_CLAIMS = [
  'Engine Online',
  '116,284 diseases',
  '39 medicines',
  'Secure/Protected',
  'security monitoring active',
] as const;

export function statusLabelsAreTruthful(labels: readonly string[] = SYSTEM_STATUS_LABELS): boolean {
  const joined = labels.join(' | ').toLowerCase();
  if (!joined.includes('not connected')) return false;
  if (!joined.includes('not installed')) return false;
  if (!joined.includes('not active')) return false;
  for (const claim of FORBIDDEN_STATUS_CLAIMS) {
    if (joined.includes(claim.toLowerCase())) return false;
  }
  return true;
}
