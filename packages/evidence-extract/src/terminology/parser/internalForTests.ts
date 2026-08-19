/**
 * INTERNAL / TEST-ONLY cue-parser scanning seam.
 *
 * Not part of the public parser API. Must not be exported from the package
 * root, the terminology barrel, parser/index.ts, or generated public
 * declarations. Must not be imported from apps/, API routes, workers, or
 * other runtime modules. Not selectable by environment variables. Does not
 * change readiness.
 *
 * Tests may deep-import this module only from the dedicated parser test file.
 */

import type { LoadedTerminologyPack } from '../types.js';
import { CUE_PARSER_BUDGET_MS, executeOwnerFrozenCueParse } from './execute.js';
import { CueParserError, type CueParserResult, type EligibleCueParserInput } from './types.js';

function failClosed(): CueParserResult {
  return { ok: false, reason: 'UNTRUSTED_INPUT', matches: [] };
}

function failTimeout(): CueParserResult {
  return { ok: false, reason: 'PARSER_TIMEOUT', matches: [] };
}

function isValidInternalBudget(budgetMs: unknown): budgetMs is number {
  return (
    typeof budgetMs === 'number' &&
    Number.isFinite(budgetMs) &&
    budgetMs > 0 &&
    budgetMs <= CUE_PARSER_BUDGET_MS
  );
}

function wrapInternalClock(now: () => number): () => number {
  let last: number | undefined;
  return () => {
    let value: number;
    try {
      value = now();
    } catch {
      throw new CueParserError('PARSER_TIMEOUT');
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new CueParserError('PARSER_TIMEOUT');
    }
    if (last !== undefined && value < last) {
      throw new CueParserError('PARSER_TIMEOUT');
    }
    last = value;
    return value;
  };
}

/** Test-only parse with a validated budget in (0, 50] ms and a monotonic clock. */
export function parseOwnerFrozenCuesInternalForTests(
  eligibleInput: EligibleCueParserInput,
  loadedPack: LoadedTerminologyPack,
  controls: { readonly budgetMs: number; readonly now: () => number },
): CueParserResult {
  if (!controls || typeof controls !== 'object') {
    return failClosed();
  }
  if (!isValidInternalBudget(controls.budgetMs)) {
    return failClosed();
  }
  if (typeof controls.now !== 'function') {
    return failClosed();
  }
  try {
    return executeOwnerFrozenCueParse(
      eligibleInput,
      loadedPack,
      controls.budgetMs,
      wrapInternalClock(controls.now),
    );
  } catch (err) {
    const code = (err as { code?: string } | null)?.code;
    if (code === 'PARSER_TIMEOUT') {
      return failTimeout();
    }
    return failClosed();
  }
}
