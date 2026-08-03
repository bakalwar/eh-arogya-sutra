import { Rule4UnknownCodeError } from '../outputCodeValidation.js';
import { RULE4_KNOWN_LIMITATION_CODE_SET, RULE4_KNOWN_REASON_CODE_SET } from '../reasonCodes.js';
import type { Rule4PolarityAdapterOutput } from './types.js';

export function validatePolarityOutputCodes(output: Rule4PolarityAdapterOutput): void {
  for (const code of output.reasonCodes) {
    if (!RULE4_KNOWN_REASON_CODE_SET.has(code)) {
      throw new Rule4UnknownCodeError('RULE4_UNKNOWN_REASON_CODE');
    }
  }
  for (const code of output.limitationCodes) {
    if (!RULE4_KNOWN_LIMITATION_CODE_SET.has(code)) {
      throw new Rule4UnknownCodeError('RULE4_UNKNOWN_LIMITATION_CODE');
    }
  }
  for (const slot of output.slotRoutings) {
    for (const code of slot.reasonCodes) {
      if (!RULE4_KNOWN_REASON_CODE_SET.has(code)) {
        throw new Rule4UnknownCodeError('RULE4_UNKNOWN_REASON_CODE');
      }
    }
    for (const code of slot.limitationCodes) {
      if (!RULE4_KNOWN_LIMITATION_CODE_SET.has(code)) {
        throw new Rule4UnknownCodeError('RULE4_UNKNOWN_LIMITATION_CODE');
      }
    }
  }
}
