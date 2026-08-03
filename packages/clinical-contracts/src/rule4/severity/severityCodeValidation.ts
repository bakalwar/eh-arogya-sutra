import { assertKnownRule4LimitationCode, assertKnownRule4ReasonCode } from '../reasonCodes.js';
import type { Rule4SeverityAdapterOutput } from './types.js';

export function validateSeverityOutputCodes(output: Rule4SeverityAdapterOutput): void {
  for (const code of output.reasonCodes) {
    assertKnownRule4ReasonCode(code);
  }
  for (const code of output.limitationCodes) {
    assertKnownRule4LimitationCode(code);
  }
  for (const slot of output.slotResolutions) {
    for (const code of slot.reasonCodes) {
      assertKnownRule4ReasonCode(code);
    }
    for (const code of slot.limitationCodes) {
      assertKnownRule4LimitationCode(code);
    }
  }
}
