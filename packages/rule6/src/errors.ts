import type { Rule6FailureCode } from './constants.js';

export class Rule6EvaluationError extends Error {
  readonly failureCode: Rule6FailureCode;

  constructor(failureCode: Rule6FailureCode) {
    super(failureCode);
    this.name = 'Rule6EvaluationError';
    this.failureCode = failureCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
