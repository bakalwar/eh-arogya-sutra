import { describe, expect, it } from 'vitest';
import {
  inclusiveDurationDays,
  isValidPositiveIntegerDuration,
  parseIsoDateOnly,
} from '../../packages/clinical-contracts/src/rule4/phase/durationCalendar.js';
import { fallbackPhaseFromDurationDays as bandFromDays } from '../../packages/clinical-contracts/src/rule4/phase/dayBands.js';

describe('Rule 4 Phase 5 duration calendar', () => {
  it('parses YYYY-MM-DD only', () => {
    expect(parseIsoDateOnly('2026-01-15')).not.toBeNull();
    expect(parseIsoDateOnly('2026-1-15')).toBeNull();
    expect(parseIsoDateOnly('2026-02-30')).toBeNull();
  });

  it('same day is Day 1 inclusive', () => {
    expect(inclusiveDurationDays('2026-03-01', '2026-03-01').days).toBe(1);
  });

  it('next calendar day is Day 2', () => {
    expect(inclusiveDurationDays('2026-03-01', '2026-03-02').days).toBe(2);
  });

  it('assessment before onset is invalid', () => {
    expect(inclusiveDurationDays('2026-03-02', '2026-03-01').invalid).toBe(true);
  });

  it('leap day Feb 29 valid year', () => {
    expect(parseIsoDateOnly('2024-02-29')).not.toBeNull();
    expect(inclusiveDurationDays('2024-02-28', '2024-02-29').days).toBe(2);
  });

  it('month/year boundary', () => {
    expect(inclusiveDurationDays('2026-01-31', '2026-02-01').days).toBe(2);
  });

  it('raw duration positive integer only', () => {
    expect(isValidPositiveIntegerDuration(10)).toBe(true);
    expect(isValidPositiveIntegerDuration(0)).toBe(false);
  });
});

describe('Rule 4 Phase 5 day bands', () => {
  it('maps frozen bands', () => {
    expect(bandFromDays(1)).toBe('ACUTE');
    expect(bandFromDays(14)).toBe('ACUTE');
    expect(bandFromDays(15)).toBe('SUB_ACUTE');
    expect(bandFromDays(45)).toBe('SUB_ACUTE');
    expect(bandFromDays(46)).toBe('CHRONIC_MODERATE');
    expect(bandFromDays(90)).toBe('CHRONIC_MODERATE');
    expect(bandFromDays(91)).toBe('DEEP_CHRONIC');
  });
});
