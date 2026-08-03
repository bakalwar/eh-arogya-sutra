import { RULE4_KNOWN_LIMITATION_CODE_SET, RULE4_KNOWN_REASON_CODE_SET } from './reasonCodes.js';

export type Rule4UnknownCodeFailure = 'RULE4_UNKNOWN_REASON_CODE' | 'RULE4_UNKNOWN_LIMITATION_CODE';

export class Rule4UnknownCodeError extends Error {
  readonly failureCode: Rule4UnknownCodeFailure;

  constructor(failureCode: Rule4UnknownCodeFailure) {
    super(failureCode);
    this.name = 'Rule4UnknownCodeError';
    this.failureCode = failureCode;
  }
}

export type Rule4OutputCodeCarrier = {
  reasonCodes?: readonly string[];
  limitationCodes?: readonly string[];
  slots?: readonly {
    reasonCodes?: readonly string[];
    limitationCodes?: readonly string[];
  }[];
};

/** Fail-closed: unknown codes are rejected; registered codes pass. */
export function validateRule4OutputCodes(output: Rule4OutputCodeCarrier): void {
  for (const code of output.reasonCodes ?? []) {
    if (!RULE4_KNOWN_REASON_CODE_SET.has(code)) {
      throw new Rule4UnknownCodeError('RULE4_UNKNOWN_REASON_CODE');
    }
  }
  for (const code of output.limitationCodes ?? []) {
    if (!RULE4_KNOWN_LIMITATION_CODE_SET.has(code)) {
      throw new Rule4UnknownCodeError('RULE4_UNKNOWN_LIMITATION_CODE');
    }
  }
  for (const slot of output.slots ?? []) {
    for (const code of slot.reasonCodes ?? []) {
      if (!RULE4_KNOWN_REASON_CODE_SET.has(code)) {
        throw new Rule4UnknownCodeError('RULE4_UNKNOWN_REASON_CODE');
      }
    }
    for (const code of slot.limitationCodes ?? []) {
      if (!RULE4_KNOWN_LIMITATION_CODE_SET.has(code)) {
        throw new Rule4UnknownCodeError('RULE4_UNKNOWN_LIMITATION_CODE');
      }
    }
  }
}
