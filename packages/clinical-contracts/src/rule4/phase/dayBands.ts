import type { Rule4ClinicalPhase } from './types.js';

export function fallbackPhaseFromDurationDays(days: number): Rule4ClinicalPhase {
  if (days >= 1 && days <= 14) {
    return 'ACUTE';
  }
  if (days >= 15 && days <= 45) {
    return 'SUB_ACUTE';
  }
  if (days >= 46 && days <= 90) {
    return 'CHRONIC_MODERATE';
  }
  return 'DEEP_CHRONIC';
}
