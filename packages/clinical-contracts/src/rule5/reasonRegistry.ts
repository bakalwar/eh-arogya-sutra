import fs from 'node:fs';
import path from 'node:path';

import { canonicalStableDumps } from '../rule4/canonicalJson.js';
import {
  RULE5_CANONICAL_CLINICAL_REASON_REGISTRY,
  type Rule5ClinicalReasonRegistry,
} from './reasonCodes.js';
import { validateRule5ClinicalReasonRegistryDocument } from './reasonCodeValidation.js';
import { RULE5_REGISTRY_FIXTURE_RELATIVE, RULE5_REASON_REGISTRY_VERSION } from './version.js';

/** Node-only: load fixture from a repository root (not exported from package barrel). */
export function loadRule5ClinicalReasonRegistryFromRepoRoot(
  repoRoot: string,
): Rule5ClinicalReasonRegistry {
  const fixturePath = path.join(repoRoot, RULE5_REGISTRY_FIXTURE_RELATIVE);
  const raw = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as unknown;
  return validateRule5ClinicalReasonRegistryDocument(raw);
}

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

export { RULE5_REASON_REGISTRY_VERSION };
