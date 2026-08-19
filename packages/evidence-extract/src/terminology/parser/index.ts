import type { LoadedTerminologyPack } from '../types.js';
import {
  CUE_PARSER_BUDGET_MS,
  executeOwnerFrozenCueParse,
  trustedMonotonicNow,
} from './execute.js';
import type { CueParserResult, EligibleCueParserInput } from './types.js';

export {
  CUE_PARSER_AUTHORITY_SCOPE,
  CUE_PARSER_CONNECTED,
  CUE_PARSER_FOUNDATION,
  CUE_PARSER_PRODUCTION_ENABLED,
  CUE_PARSER_VERSION,
} from './types.js';

/**
 * In-memory Freeze A+B+C cue matcher. Requires the pinned owner-frozen loaded
 * pack from loadPinnedProductionPack. Does not accept request-provided packs.
 * Production path always uses a fixed 50 ms CPU budget and a trusted monotonic
 * clock. No caller budget, clock, deadline, or cap override is accepted.
 */
export function parseOwnerFrozenCues(
  eligibleInput: EligibleCueParserInput,
  loadedPack: LoadedTerminologyPack,
): CueParserResult {
  return executeOwnerFrozenCueParse(
    eligibleInput,
    loadedPack,
    CUE_PARSER_BUDGET_MS,
    trustedMonotonicNow,
  );
}

type ParseOwnerFrozenCuesParams = Parameters<typeof parseOwnerFrozenCues>;
type PublicParserArityTwo = ParseOwnerFrozenCuesParams['length'] extends 2
  ? 2 extends ParseOwnerFrozenCuesParams['length']
    ? true
    : never
  : never;
const PUBLIC_PARSER_ARITY_IS_TWO: PublicParserArityTwo = true;
void PUBLIC_PARSER_ARITY_IS_TWO;
