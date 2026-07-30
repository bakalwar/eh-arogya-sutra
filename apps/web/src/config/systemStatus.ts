export const SYSTEM_STATUS_LABELS = [
  'E.H. AROGYA SUTRA 2',
  'UI Foundation',
  'Clinical Engine · Not Connected',
  'Disease Data · Not Installed',
  'Medicine Data · Not Installed',
  'Authentication · Session Core · OTP Not Configured',
  'Payment · Not Active',
  'Monitoring · Not Active',
] as const;

export const DASHBOARD_INTEGRATION_STATUS = [
  { id: 'engine', label: 'Clinical Engine', value: 'Not Connected' },
  { id: 'disease', label: 'Disease Data', value: 'Not Installed' },
  { id: 'medicine', label: 'Medicine Data', value: 'Not Installed' },
  { id: 'auth', label: 'Authentication', value: 'Session Core · OTP Not Configured' },
  { id: 'payment', label: 'Payment', value: 'Not Active' },
  { id: 'monitoring', label: 'Monitoring', value: 'Not Active' },
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
  if (
    !joined.includes('preview only') &&
    !joined.includes('not active') &&
    !joined.includes('otp not configured')
  ) {
    return false;
  }
  for (const claim of FORBIDDEN_STATUS_CLAIMS) {
    if (joined.includes(claim.toLowerCase())) return false;
  }
  return true;
}
