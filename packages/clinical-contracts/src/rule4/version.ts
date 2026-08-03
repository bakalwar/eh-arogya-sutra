/** Frozen Rule 4 documentation baseline (commit 4c35469) — Phase 1 contract only. */
export const RULE4_CONTRACT_VERSION = 'ehas2-rule4-contract-v1-phase1' as const;

export const RULE4_CONTRACT_VERSION_PHASE2 = 'ehas2-rule4-contract-v1-phase2-safety' as const;

export const RULE4_CONTRACT_VERSION_PHASE3_EVIDENCE =
  'ehas2-rule4-contract-v1-phase3-evidence' as const;

export const RULE4_CONTRACT_VERSION_PHASE4_POLARITY =
  'ehas2-rule4-contract-v1-phase4-polarity' as const;

export const RULE4_RULESET_VERSION_DOC_BASELINE =
  'ehas2-rule4-ruleset-v1-frozen-doc-4c35469' as const;

export type Rule4EngineMode = 'off' | 'shadow' | 'active';

export type Rule4ExecutionStatus = 'NOT_IMPLEMENTED';

export type Rule4PotencyStatus =
  'NOT_EVALUATED' | 'UNRESOLVED' | 'BLOCKED_BY_PATIENT_WIDE_SAFETY_GATE';

export type Rule4RuntimeDelta = 'NONE';

export const RULE4_DEFAULT_ENGINE_MODE: Rule4EngineMode = 'off';

export const RULE4_REGISTRY_FIXTURE_RELATIVE =
  'fixtures/rule4/reason-code-registry.phase1-foundation-subset.v1.json' as const;

export const RULE4_REGISTRY_VERSION = 'rule4-reason-codes-phase1-foundation-subset-v1' as const;

export const RULE4_REGISTRY_SCOPE = 'PHASE1_FOUNDATION_SUBSET' as const;

export const RULE4_REGISTRY_COMPLETE = false as const;

export const RULE4_CLINICAL_REGISTRY_STATUS =
  'INCOMPLETE_NOT_EXECUTABLE_FOR_CLINICAL_CASCADE' as const;

export const RULE4_DOCUMENTATION_BASELINE_COMMIT =
  '4c35469b9e9ba104e4097ddc48649b0aaa3761b4' as const;

export const RULE4_UNKNOWN_CODE_POLICY = 'REJECT_UNKNOWN_CODE' as const;

export const RULE4_FULL_REGISTRY_STATUS = 'FUTURE_MECHANICAL_HARVEST_PENDING' as const;

export const RULE4_REGISTRY_FIXTURE_PHASE2_RELATIVE =
  'fixtures/rule4/reason-code-registry.phase2-safety-subset.v1.json' as const;

export const RULE4_REGISTRY_PHASE2_VERSION = 'rule4-reason-codes-phase2-safety-subset-v1' as const;

export const RULE4_REGISTRY_PHASE2_SCOPE = 'PHASE2_SAFETY_SUBSET' as const;

export const RULE4_REGISTRY_FIXTURE_PHASE3_RELATIVE =
  'fixtures/rule4/reason-code-registry.phase3-evidence-subset.v1.json' as const;

export const RULE4_REGISTRY_PHASE3_VERSION =
  'rule4-reason-codes-phase3-evidence-subset-v1' as const;

export const RULE4_REGISTRY_PHASE3_SCOPE = 'PHASE3_EVIDENCE_SUBSET' as const;

export const RULE4_REGISTRY_PHASE3_COMPLETE = false as const;

export const RULE4_REGISTRY_FIXTURE_PHASE4_RELATIVE =
  'fixtures/rule4/reason-code-registry.phase4-polarity-subset.v1.json' as const;

export const RULE4_REGISTRY_PHASE4_VERSION =
  'rule4-reason-codes-phase4-polarity-subset-v1' as const;

export const RULE4_REGISTRY_PHASE4_SCOPE = 'PHASE4_POLARITY_SUBSET' as const;

export const RULE4_REGISTRY_PHASE4_COMPLETE = false as const;

export const RULE4_REGISTRY_PHASE4_CLINICAL_STATUS =
  'INCOMPLETE_NOT_EXECUTABLE_FOR_NUMERIC_CASCADE' as const;

export const RULE4_FORBIDDEN_SELECTOR_INPUT_FIELDS = [
  'global_text',
  'globalText',
  'sys_text_full',
  'sysTextFull',
  'disease_keyword',
  'registry_nearest_match',
  'potency_logic',
] as const;
