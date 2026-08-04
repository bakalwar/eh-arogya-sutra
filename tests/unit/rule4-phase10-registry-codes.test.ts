import { describe, expect, it } from 'vitest';
import { RULE4_PHASE10_REASON_CODE_REGISTRY } from '../../packages/clinical-contracts/src/rule4/reasonCodesPhase10.js';
import { assertKnownRule4ReasonCode } from '../../packages/clinical-contracts/src/rule4/reasonCodes.js';

describe('Rule 4 Phase 10 reason code registry', () => {
  it.each(RULE4_PHASE10_REASON_CODE_REGISTRY.map((e) => e.code))(
    'registered code %s is known at runtime',
    (code) => {
      expect(() => assertKnownRule4ReasonCode(code)).not.toThrow();
    },
  );
});
