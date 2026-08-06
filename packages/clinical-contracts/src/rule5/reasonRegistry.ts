import { canonicalStableDumps } from '../rule4/canonicalJson.js';
import {
  RULE5_CANONICAL_CLINICAL_REASON_REGISTRY,
  type Rule5ClinicalReasonRegistry,
} from './reasonCodes.js';

export function serializeRule5ClinicalReasonRegistry(
  registry: Rule5ClinicalReasonRegistry = RULE5_CANONICAL_CLINICAL_REASON_REGISTRY,
): string {
  const normalized = {
    registryVersion: registry.registryVersion,
    entries: registry.entries.map((entry) => ({
      code: entry.code,
      executable: entry.executable,
      introducedInVersion: entry.introducedInVersion,
      meaning: entry.meaning,
      namespace: entry.namespace,
      ownerDecisionAnchor: entry.ownerDecisionAnchor,
    })),
  };
  return canonicalStableDumps(normalized);
}

export function rule5ClinicalReasonRegistryFingerprint(
  registry: Rule5ClinicalReasonRegistry = RULE5_CANONICAL_CLINICAL_REASON_REGISTRY,
): string {
  return serializeRule5ClinicalReasonRegistry(registry);
}
