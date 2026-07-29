/**
 * Typed clinical API contracts — populated in Phase 6+.
 * UI must consume these types only; no medicine inference in components.
 */
import { EHAS2_API_NAMESPACE } from '@ehas2/shared';

export type ApiNamespace = typeof EHAS2_API_NAMESPACE;

export type EngineVersionInfo = {
  engineVersion: string;
  ruleVersion: string;
  diseaseDataVersion: string;
  medicineDataVersion: string;
};

/** Placeholder — full EHAS2ClinicalResult in Phase 6. */
export type EHAS2ClinicalResultShell = {
  _phase: '1a-shell';
  status: 'NOT_IMPLEMENTED';
  engineVersionInfo: EngineVersionInfo;
};

export const CLINICAL_CONTRACTS_VERSION = '0.1.0-phase1a' as const;
export const CLINICAL_CONTRACTS_STATUS = 'NOT_READY' as const;
