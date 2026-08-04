import { assertKnownRule4LimitationCode, assertKnownRule4ReasonCode } from '../reasonCodes.js';
import type { Rule4DoctorReviewAdapterOutput } from './types.js';

export function validateDoctorReviewOutputCodes(output: Rule4DoctorReviewAdapterOutput): void {
  for (const code of output.reasonCodes) {
    assertKnownRule4ReasonCode(code);
  }
  for (const code of output.limitationCodes) {
    assertKnownRule4LimitationCode(code);
  }
  for (const gate of output.issuanceGateResults) {
    for (const code of gate.reasonCodes) {
      assertKnownRule4ReasonCode(code);
    }
  }
}
