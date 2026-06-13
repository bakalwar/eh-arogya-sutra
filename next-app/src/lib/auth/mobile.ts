export function normalizeMobile(mobile: unknown): string {
  const digits = String(mobile ?? '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export function mobileLookupValues(mobile10: string): string[] {
  return [mobile10, `+91${mobile10}`, `91${mobile10}`, `0${mobile10}`];
}
