import type { Rule1FailureCode } from './constants.js';

export class Rule1EvaluationError extends Error {
  readonly failureCode: Rule1FailureCode;

  constructor(failureCode: Rule1FailureCode, message: string) {
    super(message);
    this.name = 'Rule1EvaluationError';
    this.failureCode = failureCode;
  }
}
