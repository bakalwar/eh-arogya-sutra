/**
 * R5-M5 — missing monitoring-plan governance metadata (non-executable).
 * @see OD-R5-M0-003
 */

export const RULE5_MISSING_PLAN_STATUS_REFERENCE = 'STATUS_NOT_EVALUABLE' as const;

export const RULE5_MISSING_PLAN_REQUIRED_ACTION_REFERENCE = 'DOCTOR_REVIEW_REQUIRED' as const;

export const RULE5_MISSING_PLAN_REASON_CODE = 'R5_REQUIRED_MONITORING_DATA_MISSING' as const;

export const RULE5_MISSING_PLAN_OWNER_ANCHOR = 'OD-R5-M0-003' as const;

export type Rule5MissingMonitoringPlanPolicy = {
  reasonCode: typeof RULE5_MISSING_PLAN_REASON_CODE;
  statusReference: typeof RULE5_MISSING_PLAN_STATUS_REFERENCE;
  requiredActionReference: typeof RULE5_MISSING_PLAN_REQUIRED_ACTION_REFERENCE;
  noPass: true;
  noAutoContinue: true;
  executable: false;
  ownerDecisionAnchor: typeof RULE5_MISSING_PLAN_OWNER_ANCHOR;
};

function deepFreeze<T extends object>(value: T): T {
  Object.freeze(value);
  for (const v of Object.values(value)) {
    if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) {
      deepFreeze(v as object);
    }
  }
  return value;
}

export const RULE5_CANONICAL_MISSING_MONITORING_PLAN_POLICY: Rule5MissingMonitoringPlanPolicy =
  deepFreeze({
    reasonCode: RULE5_MISSING_PLAN_REASON_CODE,
    statusReference: RULE5_MISSING_PLAN_STATUS_REFERENCE,
    requiredActionReference: RULE5_MISSING_PLAN_REQUIRED_ACTION_REFERENCE,
    noPass: true,
    noAutoContinue: true,
    executable: false,
    ownerDecisionAnchor: RULE5_MISSING_PLAN_OWNER_ANCHOR,
  });
