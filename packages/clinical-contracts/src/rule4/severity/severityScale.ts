export const RULE4_SEVERITY_BAND_VALUES = ['LOW', 'MODERATE', 'HIGH'] as const;

export type Rule4SeverityBand = (typeof RULE4_SEVERITY_BAND_VALUES)[number];

export function bandFromScore(score: number): Rule4SeverityBand {
  if (score >= 1 && score <= 3) {
    return 'LOW';
  }
  if (score >= 4 && score <= 6) {
    return 'MODERATE';
  }
  return 'HIGH';
}

export function isValidIntegerScore(raw: unknown): raw is number {
  return (
    typeof raw === 'number' &&
    Number.isFinite(raw) &&
    Number.isInteger(raw) &&
    raw >= 1 &&
    raw <= 10
  );
}

export function isValidBand(raw: unknown): raw is Rule4SeverityBand {
  return raw === 'LOW' || raw === 'MODERATE' || raw === 'HIGH';
}

export function bandsMatch(score: number, band: Rule4SeverityBand): boolean {
  return bandFromScore(score) === band;
}
