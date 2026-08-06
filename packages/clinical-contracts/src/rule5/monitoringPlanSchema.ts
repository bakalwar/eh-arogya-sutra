/**
 * R5-M5 — reference-only monitoring-plan schema definition (non-executable).
 * @see OD-R5-M0-003, OD-R5-M0-006
 */

import { RULE5_MATRIX_EVIDENCE_GATE, RULE5_MATRIX_THRESHOLD_POLICY } from './hardBlockerMatrix.js';
import {
  RULE5_CANONICAL_MISSING_MONITORING_PLAN_POLICY,
  type Rule5MissingMonitoringPlanPolicy,
} from './missingMonitoringPlanPolicy.js';
import {
  RULE5_MONITORING_PLAN_FINGERPRINT_VERSION,
  RULE5_MONITORING_PLAN_SCHEMA_VERSION,
} from './version.js';

export const RULE5_MONITORING_PLAN_SCHEMA_KIND = 'REFERENCE_ONLY_SCHEMA_DEFINITION' as const;

export const RULE5_MONITORING_PLAN_FIELD_OWNER_ANCHOR = 'OD-R5-M0-003' as const;

export const RULE5_MONITORING_PLAN_CLINICIAN_REVIEW_OWNER_ANCHOR = 'OD-R5-M0-006' as const;

export const RULE5_MONITORING_PLAN_FIELD_REPRESENTATION = 'REFERENCE_ONLY' as const;

export type Rule5MonitoringPlanFieldDefinition = {
  fieldId: string;
  fieldKey: string;
  ownerLabel: string;
  representation: typeof RULE5_MONITORING_PLAN_FIELD_REPRESENTATION;
  reference: null;
  clinicalValueAuthorized: false;
  executable: false;
  ownerDecisionAnchor: typeof RULE5_MONITORING_PLAN_FIELD_OWNER_ANCHOR;
};

export type Rule5ClinicianReviewPolicy = {
  clinicianReviewRequired: true;
  acknowledgmentIsNotPass: true;
  restartRequiresNewReviewedPlan: true;
  executionAuthorized: false;
  clinicianIdentityAuthorized: false;
  ownerDecisionAnchor: typeof RULE5_MONITORING_PLAN_CLINICIAN_REVIEW_OWNER_ANCHOR;
};

export type Rule5MonitoringPlanSchemaDefinition = {
  schemaVersion: typeof RULE5_MONITORING_PLAN_SCHEMA_VERSION;
  schemaKind: typeof RULE5_MONITORING_PLAN_SCHEMA_KIND;
  implemented: false;
  connected: false;
  executable: false;
  clinicalValuesAuthorized: false;
  thresholdValuesAuthorized: false;
  timingValuesAuthorized: false;
  freeTextAuthorized: false;
  patientIdentifiersAuthorized: false;
  clinicianIdentifiersAuthorized: false;
  fields: readonly Rule5MonitoringPlanFieldDefinition[];
  thresholdPolicy: typeof RULE5_MATRIX_THRESHOLD_POLICY;
  evidencePolicy: typeof RULE5_MATRIX_EVIDENCE_GATE;
  missingPlanPolicy: Rule5MissingMonitoringPlanPolicy;
  clinicianReviewPolicy: Rule5ClinicianReviewPolicy;
  fingerprintVersion: typeof RULE5_MONITORING_PLAN_FINGERPRINT_VERSION;
  deterministicFingerprint: null;
};

const FIELD_SPECS: readonly {
  fieldId: string;
  fieldKey: string;
  ownerLabel: string;
}[] = Object.freeze([
  {
    fieldId: 'MPF-001',
    fieldKey: 'baselineRequirements',
    ownerLabel: 'Baseline requirements',
  },
  {
    fieldId: 'MPF-002',
    fieldKey: 'monitoredSymptomsVitalsLabsEvents',
    ownerLabel: 'Monitored symptoms / vitals / labs / events',
  },
  {
    fieldId: 'MPF-003',
    fieldKey: 'followUpWindow',
    ownerLabel: 'Follow-up window',
  },
  {
    fieldId: 'MPF-004',
    fieldKey: 'warningThresholds',
    ownerLabel: 'Warning thresholds',
  },
  {
    fieldId: 'MPF-005',
    fieldKey: 'responsibleClinician',
    ownerLabel: 'Responsible clinician',
  },
  {
    fieldId: 'MPF-006',
    fieldKey: 'patientInstructions',
    ownerLabel: 'Patient instructions',
  },
  {
    fieldId: 'MPF-007',
    fieldKey: 'pauseCriteria',
    ownerLabel: 'Pause criteria',
  },
  {
    fieldId: 'MPF-008',
    fieldKey: 'stopCriteria',
    ownerLabel: 'Stop criteria',
  },
  {
    fieldId: 'MPF-009',
    fieldKey: 'emergencyCriteriaAndEscalationPath',
    ownerLabel: 'Emergency criteria and escalation path',
  },
  {
    fieldId: 'MPF-010',
    fieldKey: 'evidenceVersion',
    ownerLabel: 'Evidence version',
  },
  {
    fieldId: 'MPF-011',
    fieldKey: 'monitoringPlanVersionAndFingerprint',
    ownerLabel: 'Monitoring-plan version / fingerprint',
  },
]);

function deepFreeze<T extends object>(value: T): T {
  Object.freeze(value);
  for (const v of Object.values(value)) {
    if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) {
      deepFreeze(v as object);
    }
  }
  return value;
}

function buildFieldDefinition(
  spec: (typeof FIELD_SPECS)[number],
): Rule5MonitoringPlanFieldDefinition {
  return deepFreeze({
    fieldId: spec.fieldId,
    fieldKey: spec.fieldKey,
    ownerLabel: spec.ownerLabel,
    representation: RULE5_MONITORING_PLAN_FIELD_REPRESENTATION,
    reference: null,
    clinicalValueAuthorized: false,
    executable: false,
    ownerDecisionAnchor: RULE5_MONITORING_PLAN_FIELD_OWNER_ANCHOR,
  });
}

const CANONICAL_FIELDS: readonly Rule5MonitoringPlanFieldDefinition[] = deepFreeze(
  FIELD_SPECS.map(buildFieldDefinition),
);

const CANONICAL_CLINICIAN_REVIEW_POLICY: Rule5ClinicianReviewPolicy = deepFreeze({
  clinicianReviewRequired: true,
  acknowledgmentIsNotPass: true,
  restartRequiresNewReviewedPlan: true,
  executionAuthorized: false,
  clinicianIdentityAuthorized: false,
  ownerDecisionAnchor: RULE5_MONITORING_PLAN_CLINICIAN_REVIEW_OWNER_ANCHOR,
});

export const RULE5_MONITORING_PLAN_FIELD_COUNT = 11 as const;

export const RULE5_CANONICAL_MONITORING_PLAN_SCHEMA_DEFINITION: Rule5MonitoringPlanSchemaDefinition =
  deepFreeze({
    schemaVersion: RULE5_MONITORING_PLAN_SCHEMA_VERSION,
    schemaKind: RULE5_MONITORING_PLAN_SCHEMA_KIND,
    implemented: false,
    connected: false,
    executable: false,
    clinicalValuesAuthorized: false,
    thresholdValuesAuthorized: false,
    timingValuesAuthorized: false,
    freeTextAuthorized: false,
    patientIdentifiersAuthorized: false,
    clinicianIdentifiersAuthorized: false,
    fields: CANONICAL_FIELDS,
    thresholdPolicy: RULE5_MATRIX_THRESHOLD_POLICY,
    evidencePolicy: RULE5_MATRIX_EVIDENCE_GATE,
    missingPlanPolicy: RULE5_CANONICAL_MISSING_MONITORING_PLAN_POLICY,
    clinicianReviewPolicy: CANONICAL_CLINICIAN_REVIEW_POLICY,
    fingerprintVersion: RULE5_MONITORING_PLAN_FINGERPRINT_VERSION,
    deterministicFingerprint: null,
  });

/** Ordered field specs for parity tests (read-only). */
export const RULE5_MONITORING_PLAN_FIELD_SPECS = FIELD_SPECS;
