import type { Rule1FailureCode } from './constants.js';

export class Rule1EvaluationError extends Error {
  readonly failureCode: Rule1FailureCode;

  constructor(failureCode: Rule1FailureCode) {
    super(failureCode);
    this.name = 'Rule1EvaluationError';
    this.failureCode = failureCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
