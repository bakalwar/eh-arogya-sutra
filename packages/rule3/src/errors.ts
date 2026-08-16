import type { Rule3FailureCode } from './constants.js';

export class Rule3EvaluationError extends Error {
  readonly failureCode: Rule3FailureCode;

  constructor(failureCode: Rule3FailureCode) {
    super(failureCode);
    this.name = 'Rule3EvaluationError';
    this.failureCode = failureCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
