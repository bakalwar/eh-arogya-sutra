const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type ParsedIsoDate = { y: number; m: number; d: number };

export function parseIsoDateOnly(value: string | null | undefined): ParsedIsoDate | null {
  if (value == null || typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  const m = ISO_DATE.exec(trimmed);
  if (!m) {
    return null;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!isValidCalendarDate(y, mo, d)) {
    return null;
  }
  return { y, m: mo, d };
}

function isValidCalendarDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1) {
    return false;
  }
  const dim = daysInMonth(y, m);
  return d <= dim;
}

function daysInMonth(y: number, m: number): number {
  if (m === 2) {
    return isLeapYear(y) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(m)) {
    return 30;
  }
  return 31;
}

function isLeapYear(y: number): boolean {
  if (y % 400 === 0) {
    return true;
  }
  if (y % 100 === 0) {
    return false;
  }
  return y % 4 === 0;
}

/** UTC calendar day number for stable arithmetic (no timezone). */
function dayNumber({ y, m, d }: ParsedIsoDate): number {
  let y2 = y;
  let m2 = m;
  if (m2 <= 2) {
    y2 -= 1;
    m2 += 12;
  }
  const era = Math.floor(y2 / 400);
  const yoe = y2 - era * 400;
  const doy = Math.floor((153 * (m2 - 3) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/**
 * Inclusive duration: same day → 1; assessment before onset → null (invalid).
 */
export function inclusiveDurationDays(
  onset: string | null | undefined,
  assessment: string | null | undefined,
): { days: number | null; invalid: boolean } {
  const o = parseIsoDateOnly(onset);
  const a = parseIsoDateOnly(assessment);
  if (!o || !a) {
    return { days: null, invalid: false };
  }
  const diff = dayNumber(a) - dayNumber(o);
  if (diff < 0) {
    return { days: null, invalid: true };
  }
  return { days: diff + 1, invalid: false };
}

export function isValidPositiveIntegerDuration(raw: unknown): raw is number {
  return typeof raw === 'number' && Number.isInteger(raw) && raw > 0;
}
