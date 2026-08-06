/** Historical R5-M2 registry identifier (fixture v1 only; not current clinical activation). */
export const RULE5_REASON_REGISTRY_VERSION_V1 = 'ehas2-rule5-reason-registry-v1' as const;

/** Current canonical clinical reason registry (R5-M3 extension). */
export const RULE5_REASON_REGISTRY_VERSION = 'ehas2-rule5-reason-registry-v2' as const;

export type Rule5ReasonRegistryVersion =
  typeof RULE5_REASON_REGISTRY_VERSION_V1 | typeof RULE5_REASON_REGISTRY_VERSION;

export const RULE5_HARD_BLOCKER_MATRIX_VERSION = 'ehas2-rule5-hard-blocker-matrix-v1' as const;

export const RULE5_REGISTRY_FIXTURE_V1_RELATIVE =
  'fixtures/rule5/reason-code-registry.clinical.v1.json' as const;

export const RULE5_REGISTRY_FIXTURE_V2_RELATIVE =
  'fixtures/rule5/reason-code-registry.clinical.v2.json' as const;

/** @deprecated Use RULE5_REGISTRY_FIXTURE_V2_RELATIVE for current canonical mirror. */
export const RULE5_REGISTRY_FIXTURE_RELATIVE = RULE5_REGISTRY_FIXTURE_V2_RELATIVE;

export const RULE5_HARD_BLOCKER_MATRIX_FIXTURE_RELATIVE =
  'fixtures/rule5/hard-blocker-matrix.v1.json' as const;

export const RULE5_CLINICAL_NAMESPACE = 'R5' as const;

export const RULE5_UNKNOWN_CODE_POLICY = 'REJECT_UNKNOWN_CODE' as const;

/** Rule 5 base input/output contract envelope (R5-M4 foundation). */
export const RULE5_CONTRACT_VERSION = 'ehas2-rule5-contract-v1' as const;

/** Fingerprint schema label only — M4 does not compute result hashes. */
export const RULE5_FINGERPRINT_VERSION = 'ehas2-rule5-contract-fingerprint-v1' as const;

export const RULE5_CONTRACT_FOUNDATION_FIXTURE_RELATIVE =
  'fixtures/rule5/contract-foundation.v1.json' as const;

/** Reference-only monitoring-plan schema definition (R5-M5). */
export const RULE5_MONITORING_PLAN_SCHEMA_VERSION =
  'ehas2-rule5-monitoring-plan-schema-v1' as const;

/** Monitoring-plan fingerprint schema label only — M5 does not compute result hashes. */
export const RULE5_MONITORING_PLAN_FINGERPRINT_VERSION =
  'ehas2-rule5-monitoring-plan-fingerprint-v1' as const;

export const RULE5_MONITORING_PLAN_SCHEMA_FIXTURE_RELATIVE =
  'fixtures/rule5/monitoring-plan-schema.v1.json' as const;
