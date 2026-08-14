import type { Rule9FailureCode } from './constants.js';

export class Rule9EvaluationError extends Error {
  readonly failureCode: Rule9FailureCode;

  constructor(failureCode: Rule9FailureCode) {
    super(failureCode);
    this.name = 'Rule9EvaluationError';
    this.failureCode = failureCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
