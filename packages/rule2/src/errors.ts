import type { Rule2FailureCode } from './constants.js';

export class Rule2EvaluationError extends Error {
  readonly failureCode: Rule2FailureCode;

  constructor(failureCode: Rule2FailureCode) {
    super(failureCode);
    this.name = 'Rule2EvaluationError';
    this.failureCode = failureCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
