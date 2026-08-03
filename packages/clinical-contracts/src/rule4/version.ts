/** Frozen Rule 4 documentation baseline (commit 4c35469) — Phase 1 contract only. */
export const RULE4_CONTRACT_VERSION = 'ehas2-rule4-contract-v1-phase1' as const;

export const RULE4_RULESET_VERSION_DOC_BASELINE =
  'ehas2-rule4-ruleset-v1-frozen-doc-4c35469' as const;

export type Rule4EngineMode = 'off' | 'shadow' | 'active';

export type Rule4ExecutionStatus = 'NOT_IMPLEMENTED';

export type Rule4PotencyStatus = 'NOT_EVALUATED';

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

export const RULE4_FORBIDDEN_SELECTOR_INPUT_FIELDS = [
  'global_text',
  'globalText',
  'sys_text_full',
  'sysTextFull',
  'disease_keyword',
  'registry_nearest_match',
  'potency_logic',
] as const;
