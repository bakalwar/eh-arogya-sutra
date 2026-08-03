import { createHash } from 'node:crypto';

import { canonicalStableDumps } from '../canonicalJson.js';
import type { Rule4EvidenceAdapterOutput, Rule4FormulaBoundEvidencePool } from './types.js';

export const RULE4_EVIDENCE_POOL_FINGERPRINT_V1 = 'rule4-evidence-pool-fingerprint-v1' as const;

export type Rule4EvidenceFingerprintV1Input = {
  rulesetVersion: string;
  registryVersion: string;
  dataAssetVersion: string | null;
  formulaBoundPools: readonly Rule4FormulaBoundEvidencePool[];
  reasonCodes: readonly string[];
  limitationCodes: readonly string[];
};

function poolPayload(pool: Rule4FormulaBoundEvidencePool): Record<string, unknown> {
  return {
    formula_slot_id: pool.formulaSlotId,
    formula_target_id: pool.formulaTargetId,
    usable_finding_ids: [...pool.usableFindingIds].sort(),
    ignored_finding_ids: [...pool.ignoredFindingIds].sort(),
    corroboration_distinct_parent_count: pool.corroborationDistinctParentCount,
    corroborating_parent_source_ids: [...pool.corroboratingParentSourceIds].sort(),
    contradiction_evidence_status: pool.contradiction.evidenceStatus,
    contradiction_reason_codes: [...pool.contradiction.reasonCodes].sort(),
    contradiction_limitation_codes: [...pool.contradiction.limitationCodes].sort(),
  };
}

export function buildRule4EvidencePoolFingerprintV1Payload(
  input: Rule4EvidenceFingerprintV1Input,
): Record<string, unknown> {
  const pools = [...input.formulaBoundPools]
    .sort((a, b) => a.formulaSlotId.localeCompare(b.formulaSlotId))
    .map(poolPayload);
  return {
    fingerprint_version: RULE4_EVIDENCE_POOL_FINGERPRINT_V1,
    ruleset_version: input.rulesetVersion,
    registry_version: input.registryVersion,
    data_asset_version: input.dataAssetVersion,
    formula_bound_pools: pools,
    reason_codes: [...new Set(input.reasonCodes)].sort(),
    limitation_codes: [...new Set(input.limitationCodes)].sort(),
  };
}

export function rule4EvidencePoolFingerprintV1Hash(input: Rule4EvidenceFingerprintV1Input): string {
  const payload = canonicalStableDumps(buildRule4EvidencePoolFingerprintV1Payload(input));
  return createHash('sha256').update(payload, 'utf8').digest('hex').toUpperCase();
}

export function fingerprintFromAdapterOutput(
  output: Pick<
    Rule4EvidenceAdapterOutput,
    | 'rulesetVersion'
    | 'registryVersion'
    | 'dataAssetVersion'
    | 'formulaBoundPools'
    | 'reasonCodes'
    | 'limitationCodes'
  >,
): string {
  return rule4EvidencePoolFingerprintV1Hash({
    rulesetVersion: output.rulesetVersion,
    registryVersion: output.registryVersion,
    dataAssetVersion: output.dataAssetVersion,
    formulaBoundPools: output.formulaBoundPools,
    reasonCodes: output.reasonCodes,
    limitationCodes: output.limitationCodes,
  });
}
