import { canonicalStableDumps } from '../rule4/canonicalJson.js';
import {
  RULE5_CANONICAL_MONITORING_PLAN_SCHEMA_DEFINITION,
  type Rule5MonitoringPlanFieldDefinition,
  type Rule5MonitoringPlanSchemaDefinition,
} from './monitoringPlanSchema.js';
import { type Rule5MissingMonitoringPlanPolicy } from './missingMonitoringPlanPolicy.js';
import { type Rule5ClinicianReviewPolicy } from './monitoringPlanSchema.js';

function normalizeField(field: Rule5MonitoringPlanFieldDefinition): Record<string, unknown> {
  return {
    clinicalValueAuthorized: field.clinicalValueAuthorized,
    executable: field.executable,
    fieldId: field.fieldId,
    fieldKey: field.fieldKey,
    ownerDecisionAnchor: field.ownerDecisionAnchor,
    ownerLabel: field.ownerLabel,
    reference: field.reference,
    representation: field.representation,
  };
}

function normalizeMissingPlanPolicy(
  policy: Rule5MissingMonitoringPlanPolicy,
): Record<string, unknown> {
  return {
    executable: policy.executable,
    noAutoContinue: policy.noAutoContinue,
    noPass: policy.noPass,
    ownerDecisionAnchor: policy.ownerDecisionAnchor,
    reasonCode: policy.reasonCode,
    requiredActionReference: policy.requiredActionReference,
    statusReference: policy.statusReference,
  };
}

function normalizeClinicianReviewPolicy(
  policy: Rule5ClinicianReviewPolicy,
): Record<string, unknown> {
  return {
    acknowledgmentIsNotPass: policy.acknowledgmentIsNotPass,
    clinicianIdentityAuthorized: policy.clinicianIdentityAuthorized,
    clinicianReviewRequired: policy.clinicianReviewRequired,
    executionAuthorized: policy.executionAuthorized,
    ownerDecisionAnchor: policy.ownerDecisionAnchor,
    restartRequiresNewReviewedPlan: policy.restartRequiresNewReviewedPlan,
  };
}

function normalizeSchema(doc: Rule5MonitoringPlanSchemaDefinition): Record<string, unknown> {
  return {
    clinicalValuesAuthorized: doc.clinicalValuesAuthorized,
    clinicianIdentifiersAuthorized: doc.clinicianIdentifiersAuthorized,
    clinicianReviewPolicy: normalizeClinicianReviewPolicy(doc.clinicianReviewPolicy),
    connected: doc.connected,
    deterministicFingerprint: doc.deterministicFingerprint,
    evidencePolicy: doc.evidencePolicy,
    executable: doc.executable,
    fields: doc.fields.map(normalizeField),
    fingerprintVersion: doc.fingerprintVersion,
    freeTextAuthorized: doc.freeTextAuthorized,
    implemented: doc.implemented,
    missingPlanPolicy: normalizeMissingPlanPolicy(doc.missingPlanPolicy),
    patientIdentifiersAuthorized: doc.patientIdentifiersAuthorized,
    schemaKind: doc.schemaKind,
    schemaVersion: doc.schemaVersion,
    thresholdPolicy: doc.thresholdPolicy,
    thresholdValuesAuthorized: doc.thresholdValuesAuthorized,
    timingValuesAuthorized: doc.timingValuesAuthorized,
  };
}

export function serializeRule5MonitoringPlanSchemaDefinition(
  doc: Rule5MonitoringPlanSchemaDefinition = RULE5_CANONICAL_MONITORING_PLAN_SCHEMA_DEFINITION,
): string {
  return canonicalStableDumps(normalizeSchema(doc));
}

export function serializeRule5MonitoringPlanSchemaFingerprintFoundation(
  doc: Rule5MonitoringPlanSchemaDefinition = RULE5_CANONICAL_MONITORING_PLAN_SCHEMA_DEFINITION,
): string {
  return canonicalStableDumps({
    evidencePolicy: doc.evidencePolicy,
    fieldIds: doc.fields.map((f) => f.fieldId),
    fingerprintVersion: doc.fingerprintVersion,
    schemaVersion: doc.schemaVersion,
    thresholdPolicy: doc.thresholdPolicy,
  });
}
