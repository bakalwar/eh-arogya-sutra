import type { Rule7FailureCode } from './constants.js';

export class Rule7EvaluationError extends Error {
  readonly failureCode: Rule7FailureCode;

  constructor(failureCode: Rule7FailureCode) {
    super(failureCode);
    this.name = 'Rule7EvaluationError';
    this.failureCode = failureCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
