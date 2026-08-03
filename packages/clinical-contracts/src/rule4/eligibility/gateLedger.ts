import type { Rule4GateOutcome, Rule4GateResult } from './types.js';

export function gateResult(
  gateId: string,
  outcome: Rule4GateOutcome,
  opts: {
    evidenceItemIds?: readonly string[];
    reasonCodes?: readonly string[];
    limitationCodes?: readonly string[];
  } = {},
): Rule4GateResult {
  return {
    gateId,
    outcome,
    evidenceItemIds: [...(opts.evidenceItemIds ?? [])].sort(),
    reasonCodes: [...new Set(opts.reasonCodes ?? [])].sort(),
    limitationCodes: [...new Set(opts.limitationCodes ?? [])].sort(),
  };
}

export function mandatoryGateBlocksFamily(gates: readonly Rule4GateResult[]): boolean {
  return gates.some((g) => g.outcome !== 'PASS');
}

export function blockingGateCodesFrom(gates: readonly Rule4GateResult[]): string[] {
  return gates
    .filter((g) => g.outcome !== 'PASS')
    .map((g) => g.gateId)
    .sort();
}
