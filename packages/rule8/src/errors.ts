import type { Rule8FailureCode } from './constants.js';

export class Rule8EvaluationError extends Error {
  readonly failureCode: Rule8FailureCode;

  constructor(failureCode: Rule8FailureCode) {
    super(failureCode);
    this.name = 'Rule8EvaluationError';
    this.failureCode = failureCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
