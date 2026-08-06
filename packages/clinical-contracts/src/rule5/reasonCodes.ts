/**
 * Authoritative Rule 5 clinical reason registry (R5-M2).
 * Full entries are canonical in TypeScript; JSON fixture is a deterministic mirror.
 */

import { RULE5_REASON_REGISTRY_VERSION } from './version.js';

export type Rule5OwnerDecisionAnchor = 'OD-R5-M0-014' | 'OD-R5-M0-015';

export type Rule5ClinicalReasonRegistryEntry = {
  code: string;
  namespace: 'R5';
  meaning: string;
  executable: false;
  introducedInVersion: typeof RULE5_REASON_REGISTRY_VERSION;
  ownerDecisionAnchor: Rule5OwnerDecisionAnchor;
};

export type Rule5ClinicalReasonRegistry = {
  registryVersion: typeof RULE5_REASON_REGISTRY_VERSION;
  entries: readonly Rule5ClinicalReasonRegistryEntry[];
};

/** Deterministic code order (locale-independent). JSON fixture entries MUST match this order. */
const CANONICAL_CLINICAL_REASON_ENTRY_DEFINITIONS = [
  {
    code: 'R5_ACTIVE_ORAL_COUNT_BELOW_REQUIRED',
    namespace: 'R5',
    meaning: 'Active oral mixture count below required 3/4/5 (OD-011); typed safety hold.',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-015',
  },
  {
    code: 'R5_ADVERSE_EVENT_DATA_INCOMPLETE',
    namespace: 'R5',
    meaning: 'AE payload insufficient to assess',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-014',
  },
  {
    code: 'R5_ADVERSE_EVENT_FOLLOW_UP_REQUIRED',
    namespace: 'R5',
    meaning: 'AE follow-up owed',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-014',
  },
  {
    code: 'R5_ADVERSE_EVENT_INTAKE_RECORDED',
    namespace: 'R5',
    meaning: 'AE intake logged; not clinical success',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-014',
  },
  {
    code: 'R5_CAUSALITY_NOT_ASSESSED',
    namespace: 'R5',
    meaning: 'Causality not determined',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-014',
  },
  {
    code: 'R5_DOSAGE_EVIDENCE_MISSING_OR_UNVERIFIED',
    namespace: 'R5',
    meaning: 'Dosage evidence missing or unverified (OD-012); not evaluable.',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-015',
  },
  {
    code: 'R5_DUPLICATE_EVENT_REPORT_DETECTED',
    namespace: 'R5',
    meaning: 'Duplicate AE report',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-014',
  },
  {
    code: 'R5_EMERGENCY_EVALUATION_REQUIRED',
    namespace: 'R5',
    meaning: 'Emergency gate triggered',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-014',
  },
  {
    code: 'R5_EVIDENCE_MISSING_OR_UNVERIFIED',
    namespace: 'R5',
    meaning: 'Threshold or conditional evidence missing or unverified (OD-008, OD-017); not PASS.',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-015',
  },
  {
    code: 'R5_FOLLOW_UP_DATA_CONTRADICTORY',
    namespace: 'R5',
    meaning: 'Follow-up data contradictory (OD-005); must not be presented as PASS or stable.',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-015',
  },
  {
    code: 'R5_FOLLOW_UP_DATA_STALE',
    namespace: 'R5',
    meaning: 'Follow-up data stale (OD-005); must not be presented as PASS or stable.',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-015',
  },
  {
    code: 'R5_FOLLOW_UP_OVERDUE',
    namespace: 'R5',
    meaning: 'Follow-up overdue (OD-005); must not be presented as PASS or stable.',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-015',
  },
  {
    code: 'R5_MATERIAL_SAFETY_EVENT_REQUIRES_FULL_PLAN_REVALIDATION',
    namespace: 'R5',
    meaning: 'Material safety event requires full plan revalidation (OD-004).',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-015',
  },
  {
    code: 'R5_PRODUCT_QUALITY_ISSUE_SUSPECTED',
    namespace: 'R5',
    meaning: 'Product quality / identity concern',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-014',
  },
  {
    code: 'R5_REGULATORY_REPORTABILITY_REVIEW_REQUIRED',
    namespace: 'R5',
    meaning: 'Reporting review needed',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-014',
  },
  {
    code: 'R5_REPLACEMENT_CLINICAL_EVIDENCE_INSUFFICIENT',
    namespace: 'R5',
    meaning: 'Insufficient clinical evidence for replacement (OD-011); no filler prescription.',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-015',
  },
  {
    code: 'R5_REPORT_SUBMISSION_FAILED',
    namespace: 'R5',
    meaning: 'Report submission failed (truthful)',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-014',
  },
  {
    code: 'R5_REQUIRED_MONITORING_DATA_MISSING',
    namespace: 'R5',
    meaning: 'Monitoring not evaluable',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-014',
  },
  {
    code: 'R5_SERIOUS_ADVERSE_EVENT_SUSPECTED',
    namespace: 'R5',
    meaning: 'Seriousness triage positive / suspected',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-014',
  },
  {
    code: 'R5_SEVERE_REACTION_SUSPECTED',
    namespace: 'R5',
    meaning: 'Severe reaction suspected',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-014',
  },
  {
    code: 'R5_UNKNOWN_SEVERITY',
    namespace: 'R5',
    meaning: 'Unknown severity meta-rule (OD-009); fail-closed not-evaluable.',
    executable: false,
    introducedInVersion: RULE5_REASON_REGISTRY_VERSION,
    ownerDecisionAnchor: 'OD-R5-M0-015',
  },
] as const satisfies readonly Rule5ClinicalReasonRegistryEntry[];

function freezeClinicalReasonRegistryEntry(
  entry: Rule5ClinicalReasonRegistryEntry,
): Rule5ClinicalReasonRegistryEntry {
  return Object.freeze({ ...entry });
}

const FROZEN_CANONICAL_ENTRIES = Object.freeze(
  CANONICAL_CLINICAL_REASON_ENTRY_DEFINITIONS.map((entry) =>
    freezeClinicalReasonRegistryEntry({
      code: entry.code,
      namespace: entry.namespace,
      meaning: entry.meaning,
      executable: entry.executable,
      introducedInVersion: entry.introducedInVersion,
      ownerDecisionAnchor: entry.ownerDecisionAnchor,
    }),
  ),
) as readonly Rule5ClinicalReasonRegistryEntry[];

/** Runtime-frozen canonical entries (deterministic code order). */
export const RULE5_CANONICAL_CLINICAL_REASON_ENTRIES = FROZEN_CANONICAL_ENTRIES;

export type Rule5ClinicalReasonCode =
  (typeof CANONICAL_CLINICAL_REASON_ENTRY_DEFINITIONS)[number]['code'];

export const RULE5_CANONICAL_CLINICAL_REASON_REGISTRY: Rule5ClinicalReasonRegistry = Object.freeze({
  registryVersion: RULE5_REASON_REGISTRY_VERSION,
  entries: FROZEN_CANONICAL_ENTRIES,
});

export const RULE5_CLINICAL_REASON_CODES: readonly Rule5ClinicalReasonCode[] = Object.freeze(
  FROZEN_CANONICAL_ENTRIES.map((e) => e.code as Rule5ClinicalReasonCode),
);

export const RULE5_OD014_REASON_CODES: readonly Rule5ClinicalReasonCode[] = Object.freeze(
  FROZEN_CANONICAL_ENTRIES.filter((e) => e.ownerDecisionAnchor === 'OD-R5-M0-014').map(
    (e) => e.code as Rule5ClinicalReasonCode,
  ),
);

export const RULE5_OD015_REASON_CODES: readonly Rule5ClinicalReasonCode[] = Object.freeze(
  FROZEN_CANONICAL_ENTRIES.filter((e) => e.ownerDecisionAnchor === 'OD-R5-M0-015').map(
    (e) => e.code as Rule5ClinicalReasonCode,
  ),
);

export const RULE5_KNOWN_CLINICAL_REASON_CODE_SET: ReadonlySet<string> = new Set(
  RULE5_CLINICAL_REASON_CODES,
);

export const RULE5_CANONICAL_ENTRY_BY_CODE: Readonly<
  Record<Rule5ClinicalReasonCode, Rule5ClinicalReasonRegistryEntry>
> = Object.freeze(
  Object.fromEntries(FROZEN_CANONICAL_ENTRIES.map((entry) => [entry.code, entry])) as Record<
    Rule5ClinicalReasonCode,
    Rule5ClinicalReasonRegistryEntry
  >,
);
