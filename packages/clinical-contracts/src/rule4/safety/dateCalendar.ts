/** UTC calendar date (no time-of-day) for verified DOB / assessment comparisons. */

export type CalendarDateParts = { year: number; month: number; day: number };

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDateOnly(value: string | null | undefined): CalendarDateParts | null {
  if (value == null || typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  const m = ISO_DATE.exec(trimmed);
  if (!m) {
    return null;
  }
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function calendarDateToUtcMs(parts: CalendarDateParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

export function calendarDaysBetween(from: CalendarDateParts, to: CalendarDateParts): number {
  const ms = calendarDateToUtcMs(to) - calendarDateToUtcMs(from);
  return Math.floor(ms / 86_400_000);
}

/** First birthday calendar date (same month/day when valid; Feb 29 → Feb 28 on non-leap years). */
export function firstBirthdayDate(dob: CalendarDateParts): CalendarDateParts {
  const targetYear = dob.year + 1;
  const probe = new Date(Date.UTC(targetYear, dob.month - 1, dob.day));
  if (probe.getUTCMonth() === dob.month - 1 && probe.getUTCDate() === dob.day) {
    return { year: targetYear, month: dob.month, day: dob.day };
  }
  return {
    year: targetYear,
    month: dob.month,
    day: Math.max(1, dob.day - 1),
  };
}

export function isStrictlyBeforeCalendar(
  left: CalendarDateParts,
  right: CalendarDateParts,
): boolean {
  return calendarDateToUtcMs(left) < calendarDateToUtcMs(right);
}

export function completedYearsBetween(dob: CalendarDateParts, on: CalendarDateParts): number {
  let years = on.year - dob.year;
  const birthdayThisYear: CalendarDateParts = { year: on.year, month: dob.month, day: dob.day };
  const probe = new Date(Date.UTC(on.year, dob.month - 1, dob.day));
  const effectiveBirthday: CalendarDateParts =
    probe.getUTCMonth() === dob.month - 1 && probe.getUTCDate() === dob.day
      ? birthdayThisYear
      : { year: on.year, month: dob.month, day: Math.max(1, dob.day - 1) };
  if (isStrictlyBeforeCalendar(on, effectiveBirthday)) {
    years -= 1;
  }
  return Math.max(0, years);
}

export function bandFromDaysAndCalendar(
  daysSinceBirth: number,
  dob: CalendarDateParts,
  assessment: CalendarDateParts,
): 'P13_A' | 'P13_B' | 'P13_C' | 'P13_D' | 'P13_E' | null {
  const fb = firstBirthdayDate(dob);
  if (isStrictlyBeforeCalendar(assessment, fb)) {
    if (daysSinceBirth >= 0 && daysSinceBirth <= 28) {
      return 'P13_A';
    }
    if (daysSinceBirth >= 29) {
      return 'P13_B';
    }
    return null;
  }
  const completed = completedYearsBetween(dob, assessment);
  if (completed >= 1 && completed <= 5) {
    return 'P13_C';
  }
  if (completed >= 6 && completed <= 12) {
    return 'P13_D';
  }
  if (completed >= 13) {
    return 'P13_E';
  }
  return null;
}
