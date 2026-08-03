import { assertKnownRule4LimitationCode, assertKnownRule4ReasonCode } from '../reasonCodes.js';
import type { Rule4EligibilityAdapterOutput } from './types.js';

export function validateEligibilityOutputCodes(output: Rule4EligibilityAdapterOutput): void {
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
    for (const gate of slot.gateResults) {
      for (const code of gate.reasonCodes) {
        assertKnownRule4ReasonCode(code);
      }
      for (const code of gate.limitationCodes) {
        assertKnownRule4LimitationCode(code);
      }
    }
  }
}
