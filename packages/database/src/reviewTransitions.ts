import { InvalidReviewTransitionError } from './errors.js';

export const REVIEW_STATES = [
  'GENERATED_PENDING_REVIEW',
  'NEEDS_CLARIFICATION',
  'ACCEPTED',
  'MODIFIED',
  'REJECTED',
  'ISSUED',
  'SUPERSEDED',
] as const;

export type ReviewState = (typeof REVIEW_STATES)[number];

const ALLOWED: Record<ReviewState, readonly ReviewState[]> = {
  GENERATED_PENDING_REVIEW: ['NEEDS_CLARIFICATION', 'ACCEPTED', 'MODIFIED', 'REJECTED'],
  NEEDS_CLARIFICATION: ['GENERATED_PENDING_REVIEW', 'ACCEPTED', 'MODIFIED', 'REJECTED'],
  ACCEPTED: ['ISSUED', 'MODIFIED', 'REJECTED'],
  MODIFIED: ['GENERATED_PENDING_REVIEW', 'ACCEPTED', 'ISSUED', 'REJECTED'],
  REJECTED: [],
  ISSUED: ['SUPERSEDED'],
  SUPERSEDED: [],
};

export function assertValidReviewTransition(from: ReviewState, to: ReviewState): void {
  if (!ALLOWED[from]?.includes(to)) {
    throw new InvalidReviewTransitionError(`${from} -> ${to}`);
  }
}

export function isTerminalReviewState(state: ReviewState): boolean {
  return state === 'REJECTED' || state === 'SUPERSEDED';
}
