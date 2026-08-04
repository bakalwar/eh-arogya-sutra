import type { Rule4FrozenDilution } from '../selection/types.js';
import type { Rule4PediatricBand } from '../safety/types.js';

export type Rule4OverlayMatrixCell = 'ALLOW' | 'RESTRICT' | 'PROHIBIT';

export type Rule4PediatricMatrixAuthority = 'D13_C_POSITIVE' | 'Q8_H_NEGATIVE' | 'NOT_APPLICABLE';

const POSITIVE_DILUTIONS = new Set<Rule4FrozenDilution>(['D3', 'D5', 'D10', 'D30', 'D60']);
const NEGATIVE_DILUTIONS = new Set<Rule4FrozenDilution>(['D1', 'D2']);

const D13_C_MATRIX: Record<
  'P13_C' | 'P13_D',
  Record<'D3' | 'D5' | 'D10' | 'D30' | 'D60', Rule4OverlayMatrixCell>
> = {
  P13_C: {
    D3: 'RESTRICT',
    D5: 'ALLOW',
    D10: 'RESTRICT',
    D30: 'PROHIBIT',
    D60: 'PROHIBIT',
  },
  P13_D: {
    D3: 'RESTRICT',
    D5: 'ALLOW',
    D10: 'RESTRICT',
    D30: 'RESTRICT',
    D60: 'PROHIBIT',
  },
};

const Q8_H_MATRIX: Record<'P13_C' | 'P13_D', Record<'D1' | 'D2', Rule4OverlayMatrixCell>> = {
  P13_C: { D1: 'PROHIBIT', D2: 'RESTRICT' },
  P13_D: { D1: 'RESTRICT', D2: 'ALLOW' },
};

export function pediatricMatrixAuthorityForDilution(
  dilution: Rule4FrozenDilution,
): Rule4PediatricMatrixAuthority {
  if (POSITIVE_DILUTIONS.has(dilution)) {
    return 'D13_C_POSITIVE';
  }
  if (NEGATIVE_DILUTIONS.has(dilution)) {
    return 'Q8_H_NEGATIVE';
  }
  return 'NOT_APPLICABLE';
}

export function overlayCellForBandAndDilution(
  band: Rule4PediatricBand,
  dilution: Rule4FrozenDilution,
): Rule4OverlayMatrixCell | 'NOT_APPLICABLE' | 'NOT_APPLICABLE_UNDER_HARD_STOP' {
  if (band === 'P13_A' || band === 'P13_B') {
    return 'NOT_APPLICABLE_UNDER_HARD_STOP';
  }
  if (band === 'P13_E' || band == null) {
    return 'NOT_APPLICABLE';
  }
  if (dilution === 'D1' || dilution === 'D2') {
    return Q8_H_MATRIX[band][dilution];
  }
  if (POSITIVE_DILUTIONS.has(dilution)) {
    return D13_C_MATRIX[band][dilution as 'D3' | 'D5' | 'D10' | 'D30' | 'D60'];
  }
  return 'NOT_APPLICABLE';
}
