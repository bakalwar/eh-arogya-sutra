import { describe, expect, it } from 'vitest';
import {
  bandFromScore,
  bandsMatch,
  isValidBand,
  isValidIntegerScore,
} from '../../packages/clinical-contracts/src/rule4/severity/severityScale.js';

describe('Rule 4 Phase 6 severity scale', () => {
  it('accepts integers 1–10 only', () => {
    for (let n = 1; n <= 10; n += 1) {
      expect(isValidIntegerScore(n)).toBe(true);
    }
    expect(isValidIntegerScore(0)).toBe(false);
    expect(isValidIntegerScore(11)).toBe(false);
    expect(isValidIntegerScore(5.5)).toBe(false);
    expect(isValidIntegerScore('5')).toBe(false);
    expect(isValidIntegerScore(null)).toBe(false);
    expect(isValidIntegerScore(true)).toBe(false);
  });

  it('band boundaries', () => {
    expect(bandFromScore(1)).toBe('LOW');
    expect(bandFromScore(3)).toBe('LOW');
    expect(bandFromScore(4)).toBe('MODERATE');
    expect(bandFromScore(6)).toBe('MODERATE');
    expect(bandFromScore(7)).toBe('HIGH');
    expect(bandFromScore(10)).toBe('HIGH');
  });

  it('bandsMatch', () => {
    expect(bandsMatch(5, 'MODERATE')).toBe(true);
    expect(bandsMatch(5, 'HIGH')).toBe(false);
    expect(isValidBand('MODERATE')).toBe(true);
    expect(isValidBand('SEVERE')).toBe(false);
  });
});
