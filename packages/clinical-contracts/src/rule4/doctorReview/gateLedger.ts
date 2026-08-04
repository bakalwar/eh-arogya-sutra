import type {
  Rule4DoctorAction,
  Rule4DoctorReviewAdapterInput,
  Rule4DoctorReviewEvaluationContext,
  Rule4GateOutcome,
  Rule4IssuanceGateResult,
} from './types.js';
import type { ExpectedAuthenticityEvaluation } from './expectedAuthenticityAuthority.js';

function gate(
  gateId: Rule4IssuanceGateResult['gateId'],
  outcome: Rule4GateOutcome,
  reasonCodes: string[] = [],
): Rule4IssuanceGateResult {
  return { gateId, outcome, reasonCodes: [...new Set(reasonCodes)].sort() };
}

export function buildIssuanceGateLedger(
  input: Rule4DoctorReviewAdapterInput,
  context: Rule4DoctorReviewEvaluationContext,
  opts: {
    authorityOk: boolean;
    authorityReasons: string[];
    idempotencyBlocked: boolean;
    idempotencyReasons: string[];
    modificationValid: boolean;
    modificationReasons: string[];
    authEval: ExpectedAuthenticityEvaluation;
  },
): Rule4IssuanceGateResult[] {
  const upstream = context.upstream ?? {};
  const authEval = opts.authEval;
  const authMismatch = authEval.mismatchCodes;
  const isProduction = input.label === 'PRODUCTION';
  const action: Rule4DoctorAction = input.doctorAction;

  const missingExpectedReasons = authEval.expectedMissing
    ? ['EXPECTED_DRAFT_AUTHENTICITY_MISSING']
    : authEval.expectedFieldMissing.length > 0
      ? ['EXPECTED_AUTHENTICITY_FIELD_MISSING']
      : [];

  const revalStatus = upstream.engineRevalidationStatus ?? 'NOT_REQUIRED';
  let revalOutcome: Rule4GateOutcome = 'PASS';
  const revalReasons: string[] = [];
  if (action === 'MODIFY' || action === 'EXCLUDE_UNRESOLVED_SLOT') {
    revalOutcome = 'FAIL';
    revalReasons.push('MODIFY_REVALIDATION_REQUIRED');
    if (action === 'EXCLUDE_UNRESOLVED_SLOT') {
      revalReasons.push('EXCLUDE_SLOT_REVALIDATION_REQUIRED');
    }
  } else if (revalStatus === 'REQUIRED_PENDING') {
    revalOutcome = 'FAIL';
    revalReasons.push('ENGINE_REVALIDATION_PENDING');
  } else if (revalStatus === 'FAILED') {
    revalOutcome = 'FAIL';
    revalReasons.push('ENGINE_REVALIDATION_FAILED');
  } else if (revalStatus === 'PASSED' || revalStatus === 'NOT_REQUIRED') {
    revalOutcome = 'PASS';
  } else {
    revalOutcome = 'MISSING_INPUT';
  }

  let finalApproval: Rule4GateOutcome = 'NOT_EVALUATED';
  const finalReasons: string[] = [];
  if (authEval.approvalPathRequiresExpected && authEval.expectedMissing) {
    finalApproval = 'MISSING_INPUT';
    finalReasons.push('EXPECTED_DRAFT_AUTHENTICITY_MISSING');
  } else if (authEval.approvalPathRequiresExpected && authEval.expectedFieldMissing.length > 0) {
    finalApproval = 'MISSING_INPUT';
    finalReasons.push('EXPECTED_AUTHENTICITY_FIELD_MISSING');
  } else if (
    action === 'APPROVE' &&
    opts.authorityOk &&
    authEval.bindingMismatchCodes.length === 0 &&
    authMismatch.length === 0
  ) {
    finalApproval = 'PASS';
  } else if (action === 'APPROVE') {
    finalApproval = 'FAIL';
    finalReasons.push(...opts.authorityReasons, ...authEval.bindingMismatchCodes, ...authMismatch);
    if (finalReasons.length === 0) {
      finalReasons.push('MISSING_DOCTOR_APPROVAL');
    }
  } else if (action === 'REJECT' || action === 'REQUEST_REASSESSMENT') {
    finalApproval = 'NOT_EVALUATED';
  } else {
    finalApproval = 'FAIL';
    finalReasons.push('MISSING_DOCTOR_APPROVAL');
  }

  const crisis = upstream.urgentEscalationRequired
    ? gate('Q06C_CRISIS', 'FAIL', ['NON_OVERRIDABLE_SAFETY_BLOCK'])
    : gate('Q06C_CRISIS', 'PASS');

  const d13 = upstream.d13HardStopActive
    ? gate('D13_HS', 'FAIL', ['NON_OVERRIDABLE_SAFETY_BLOCK'])
    : gate('D13_HS', 'PASS');

  const hold = upstream.patientWideHold
    ? gate('Q15_PATIENT_HOLD', 'FAIL', ['NON_OVERRIDABLE_SAFETY_BLOCK'])
    : gate('Q15_PATIENT_HOLD', 'PASS');

  let rule3: Rule4IssuanceGateResult;
  if (upstream.rule3PrescriptionIssueAllowed === false) {
    rule3 = gate('RULE3_ISSUE_FLAG', 'FAIL', ['ISSUANCE_GATE_MANDATORY_FAIL']);
  } else {
    rule3 = gate('RULE3_ISSUE_FLAG', 'PASS');
  }

  const d13d = upstream.d13RestrictJustificationMissing
    ? gate('D13_RESTRICT_D13D', 'FAIL', ['ISSUANCE_GATE_MANDATORY_FAIL'])
    : gate('D13_RESTRICT_D13D', 'PASS');

  let pediatric: Rule4IssuanceGateResult;
  if (upstream.pediatricProhibitActive) {
    pediatric = gate('PEDIATRIC_OVERLAY_COMPLETE', 'FAIL', ['PEDIATRIC_PROHIBIT_BLOCKS_ISSUANCE']);
  } else if (upstream.phase8AuthFailed) {
    pediatric = gate('PEDIATRIC_OVERLAY_COMPLETE', 'FAIL', ['PHASE8_PHASE9_AUTH_FAILURE']);
  } else {
    pediatric = gate('PEDIATRIC_OVERLAY_COMPLETE', 'PASS');
  }

  let evidence: Rule4IssuanceGateResult;
  if (authEval.approvalPathRequiresExpected && authEval.expectedMissing) {
    evidence = gate('EVIDENCE_CURRENT', 'MISSING_INPUT', ['EXPECTED_DRAFT_AUTHENTICITY_MISSING']);
  } else if (authEval.approvalPathRequiresExpected && authEval.expectedFieldMissing.length > 0) {
    evidence = gate('EVIDENCE_CURRENT', 'MISSING_INPUT', ['EXPECTED_AUTHENTICITY_FIELD_MISSING']);
  } else if (
    authMismatch.some((c) =>
      [
        'STALE_EVIDENCE_FINGERPRINT',
        'DRAFT_AUTHENTICITY_MISMATCH',
        'EXPECTED_AUTHENTICITY_FIELD_MISSING',
      ].includes(c),
    )
  ) {
    evidence = gate('EVIDENCE_CURRENT', 'FAIL', authMismatch);
  } else if (!authEval.approvalPathRequiresExpected && !context.expectedAuthenticity) {
    evidence = gate('EVIDENCE_CURRENT', 'PASS');
  } else if (authMismatch.length > 0) {
    evidence = gate('EVIDENCE_CURRENT', 'FAIL', authMismatch);
  } else {
    evidence = gate('EVIDENCE_CURRENT', 'PASS');
  }

  let summary: Rule4IssuanceGateResult;
  if (authEval.approvalPathRequiresExpected && authEval.expectedMissing) {
    summary = gate('SUMMARY_FP_MATCH', 'MISSING_INPUT', ['EXPECTED_DRAFT_AUTHENTICITY_MISSING']);
  } else if (authEval.approvalPathRequiresExpected && authEval.expectedFieldMissing.length > 0) {
    summary = gate('SUMMARY_FP_MATCH', 'MISSING_INPUT', ['EXPECTED_AUTHENTICITY_FIELD_MISSING']);
  } else if (
    authMismatch.some((c) =>
      ['STALE_SUMMARY_FINGERPRINT', 'DRAFT_AUTHENTICITY_MISMATCH'].includes(c),
    )
  ) {
    summary = gate('SUMMARY_FP_MATCH', 'FAIL', authMismatch);
  } else if (authMismatch.length > 0) {
    summary = gate('SUMMARY_FP_MATCH', 'FAIL', authMismatch);
  } else {
    summary = gate('SUMMARY_FP_MATCH', 'PASS');
  }

  const isolation = upstream.formulaIsolationFailed
    ? gate('FORMULA_ISOLATION', 'FAIL', ['FORMULA_ISOLATION_FAILURE'])
    : gate('FORMULA_ISOLATION', 'PASS');

  let registry: Rule4IssuanceGateResult;
  if (authEval.approvalPathRequiresExpected && authEval.expectedMissing) {
    registry = gate('REGISTRY_RULESET', 'MISSING_INPUT', ['EXPECTED_DRAFT_AUTHENTICITY_MISSING']);
  } else if (authEval.approvalPathRequiresExpected && authEval.expectedFieldMissing.length > 0) {
    registry = gate('REGISTRY_RULESET', 'MISSING_INPUT', ['EXPECTED_AUTHENTICITY_FIELD_MISSING']);
  } else if (
    authMismatch.includes('RULESET_REGISTRY_MISMATCH') ||
    upstream.rulesetRegistryMismatch
  ) {
    registry = gate('REGISTRY_RULESET', 'FAIL', ['RULESET_REGISTRY_MISMATCH']);
  } else {
    registry = gate('REGISTRY_RULESET', 'PASS');
  }

  let tenant: Rule4IssuanceGateResult;
  const tenantReasons = [...opts.authorityReasons, ...authEval.bindingMismatchCodes];
  if (!opts.authorityOk || authEval.bindingMismatchCodes.length > 0) {
    tenant = gate('TENANT_AUTH', 'FAIL', tenantReasons);
  } else {
    tenant = gate('TENANT_AUTH', 'PASS');
  }

  let legacy: Rule4IssuanceGateResult;
  if (upstream.legacyAuthorityAttempt || upstream.registryQuarantine) {
    legacy = gate('LEGACY_QUARANTINE', 'FAIL', ['LEGACY_AUTHORITY_QUARANTINE']);
  } else {
    legacy = gate('LEGACY_QUARANTINE', 'PASS');
  }

  let registration: Rule4IssuanceGateResult;
  if (isProduction) {
    registration = gate('PROFESSIONAL_REGISTRATION', 'NOT_CONNECTED', [
      'PROFESSIONAL_REGISTRATION_VERIFICATION_NOT_CONNECTED',
      'PRODUCTION_ISSUANCE_NOT_CONNECTED',
    ]);
  } else if (input.reviewerAuthority.professionalRegistrationVerified === true) {
    registration = gate('PROFESSIONAL_REGISTRATION', 'PASS');
  } else {
    registration = gate('PROFESSIONAL_REGISTRATION', 'NOT_CONNECTED', [
      'PROFESSIONAL_REGISTRATION_VERIFICATION_NOT_CONNECTED',
    ]);
  }

  const q18Reasons: string[] = [];
  let q18Outcome: Rule4GateOutcome = 'PASS';
  if (crisis.outcome === 'FAIL' || d13.outcome === 'FAIL' || hold.outcome === 'FAIL') {
    q18Outcome = 'FAIL';
    q18Reasons.push('NON_OVERRIDABLE_SAFETY_BLOCK');
  }
  if (
    upstream.unresolvedMedicatedSlot &&
    action !== 'EXCLUDE_UNRESOLVED_SLOT' &&
    action !== 'MODIFY'
  ) {
    q18Outcome = 'FAIL';
    q18Reasons.push('UNRESOLVED_MEDICATED_SLOT_BLOCKS_ISSUANCE');
  }
  if (opts.idempotencyBlocked) {
    q18Outcome = 'BLOCKED';
    q18Reasons.push(...opts.idempotencyReasons);
  }
  if (!opts.modificationValid && (action === 'MODIFY' || action === 'EXCLUDE_UNRESOLVED_SLOT')) {
    q18Outcome = 'FAIL';
    q18Reasons.push(...opts.modificationReasons);
  }
  if (authEval.superseded) {
    q18Outcome = 'FAIL';
    q18Reasons.push('APPROVAL_SUPERSEDED');
  }
  if (missingExpectedReasons.length > 0) {
    q18Outcome = 'FAIL';
    q18Reasons.push(...missingExpectedReasons);
  }

  const q18 = gate('Q18_E_HOLDS', q18Outcome, q18Reasons);

  let strict: Rule4GateOutcome = 'PASS';
  const strictReasons: string[] = [];
  if (isProduction) {
    strict = 'NOT_EVALUATED';
    strictReasons.push('PRODUCTION_DOCTOR_REVIEW_NOT_EVALUATED');
  }
  if (opts.idempotencyBlocked) {
    strict = 'BLOCKED';
    strictReasons.push(...opts.idempotencyReasons);
  }

  return [
    gate('FINAL_DOCTOR_APPROVAL', finalApproval, finalReasons),
    gate('GATE_REVALIDATION', revalOutcome, revalReasons),
    q18,
    crisis,
    d13,
    hold,
    rule3,
    gate('RULE4_STRICT_FINAL', strict, strictReasons),
    d13d,
    pediatric,
    evidence,
    summary,
    isolation,
    registry,
    tenant,
    legacy,
    registration,
  ];
}

export function mandatoryGateBlocksEligibility(
  results: readonly Rule4IssuanceGateResult[],
): boolean {
  for (const g of results) {
    if (g.outcome !== 'PASS') {
      return true;
    }
  }
  return false;
}
