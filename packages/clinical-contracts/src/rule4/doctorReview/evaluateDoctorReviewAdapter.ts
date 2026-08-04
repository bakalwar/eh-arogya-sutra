import { RULE4_CONTRACT_VERSION_PHASE10_DOCTOR_REVIEW_ISSUANCE } from '../version.js';
import { buildShadowAuditEvents } from './buildShadowAuditEvents.js';
import { evaluateExpectedAuthenticityAuthority } from './expectedAuthenticityAuthority.js';
import { buildIssuanceGateLedger, mandatoryGateBlocksEligibility } from './gateLedger.js';
import { fingerprintFromDoctorReviewOutput } from './doctorReviewFingerprintV1.js';
import { validateDoctorReviewOutputCodes } from './reviewCodeValidation.js';
import type {
  Rule4DoctorReviewAdapterInput,
  Rule4DoctorReviewAdapterOutput,
  Rule4DoctorReviewEvaluationContext,
  Rule4DoctorReviewStatus,
  Rule4EngineRevalidationStatus,
  Rule4IssuanceEligibilityStatus,
  Rule4Phase3ReviewState,
} from './types.js';

export class Rule4DoctorReviewAdapterValidationError extends Error {
  readonly code = 'RULE4_DOCTOR_REVIEW_ADAPTER_VALIDATION_FAILED';

  constructor(message: string) {
    super(message);
    this.name = 'Rule4DoctorReviewAdapterValidationError';
  }
}

function mapPhase3State(
  action: Rule4DoctorReviewAdapterInput['doctorAction'],
): Rule4Phase3ReviewState {
  switch (action) {
    case 'APPROVE':
      return 'ACCEPTED';
    case 'MODIFY':
    case 'EXCLUDE_UNRESOLVED_SLOT':
      return 'MODIFIED';
    case 'REJECT':
      return 'REJECTED';
    case 'REQUEST_REASSESSMENT':
      return 'NEEDS_CLARIFICATION';
    default:
      return 'GENERATED_PENDING_REVIEW';
  }
}

function validateAuthority(input: Rule4DoctorReviewAdapterInput): {
  ok: boolean;
  reasons: string[];
} {
  const r = input.reviewerAuthority;
  const reasons: string[] = [];
  if (r.actorRole !== 'DOCTOR') {
    reasons.push('CLINIC_ADMIN_CLINICAL_APPROVAL_FORBIDDEN');
    reasons.push('REVIEWER_AUTHORITY_INVALID');
  }
  if (!r.activeMembership) {
    reasons.push('REVIEWER_AUTHORITY_INVALID');
  }
  if (!r.treatingDoctorBound) {
    reasons.push('REVIEWER_AUTHORITY_INVALID');
  }
  if (!r.sessionAuthenticated) {
    reasons.push('REVIEWER_AUTHORITY_INVALID');
  }
  if (r.consultationId !== input.consultationId) {
    reasons.push('CONSULTATION_BINDING_MISMATCH');
  }
  if (!r.doctorId || !r.organizationId || !r.clinicId) {
    reasons.push('TENANT_BINDING_MISMATCH');
  }
  return { ok: reasons.length === 0, reasons: [...new Set(reasons)].sort() };
}

function validateModificationEnvelope(input: Rule4DoctorReviewAdapterInput): {
  ok: boolean;
  reasons: string[];
} {
  const action = input.doctorAction;
  if (action !== 'MODIFY' && action !== 'EXCLUDE_UNRESOLVED_SLOT') {
    return { ok: true, reasons: [] };
  }
  const reasons: string[] = [];
  if (action === 'MODIFY') {
    const env = input.modificationEnvelope;
    if (!env) {
      reasons.push('MODIFICATION_ENVELOPE_INVALID');
      return { ok: false, reasons };
    }
    if (!env.justification?.trim()) {
      reasons.push('MODIFICATION_JUSTIFICATION_REQUIRED');
    }
    if (env.originalDraftFingerprint !== input.draftAuthenticity.draftContentHash) {
      reasons.push('DRAFT_AUTHENTICITY_MISMATCH');
    }
    if (!env.proposedDraftVersion?.trim()) {
      reasons.push('MODIFICATION_ENVELOPE_INVALID');
    }
  }
  if (action === 'EXCLUDE_UNRESOLVED_SLOT') {
    if (!input.excludeSlotIds?.length) {
      reasons.push('MODIFICATION_ENVELOPE_INVALID');
    }
  }
  return { ok: reasons.length === 0, reasons: [...new Set(reasons)].sort() };
}

function evaluateIdempotency(
  input: Rule4DoctorReviewAdapterInput,
  context: Rule4DoctorReviewEvaluationContext,
): { blocked: boolean; replay: boolean; reasons: string[] } {
  const idem = context.idempotency;
  if (!idem?.idempotencyKey) {
    return { blocked: false, replay: false, reasons: [] };
  }
  const reasons: string[] = [];
  if (idem.expectedDraftVersion && idem.expectedDraftVersion !== input.draftVersion) {
    reasons.push('REVIEW_VERSION_CONFLICT');
    return { blocked: true, replay: false, reasons };
  }
  if (idem.priorRequestHash && idem.requestHash && idem.priorRequestHash !== idem.requestHash) {
    reasons.push('IDEMPOTENCY_PAYLOAD_MISMATCH');
    return { blocked: true, replay: false, reasons };
  }
  if (idem.priorRequestHash && idem.requestHash && idem.priorRequestHash === idem.requestHash) {
    reasons.push('IDEMPOTENCY_REPLAY');
    return { blocked: false, replay: true, reasons };
  }
  return { blocked: false, replay: false, reasons: [] };
}

function engineRevalidationFromAction(
  action: Rule4DoctorReviewAdapterInput['doctorAction'],
  upstream: Rule4DoctorReviewEvaluationContext['upstream'],
): Rule4EngineRevalidationStatus {
  if (action === 'MODIFY' || action === 'EXCLUDE_UNRESOLVED_SLOT') {
    return 'REQUIRED_PENDING';
  }
  const s = upstream?.engineRevalidationStatus;
  if (s === 'PASSED' || s === 'FAILED' || s === 'REQUIRED_PENDING') {
    return s;
  }
  return 'NOT_REQUIRED';
}

function resolveStatuses(
  action: Rule4DoctorReviewAdapterInput['doctorAction'],
  gatesBlock: boolean,
  authorityOk: boolean,
  idempotencyBlocked: boolean,
  reval: Rule4EngineRevalidationStatus,
  isProduction: boolean,
): {
  doctorReviewStatus: Rule4DoctorReviewStatus;
  issuanceEligibilityStatus: Rule4IssuanceEligibilityStatus;
} {
  if (action === 'REJECT') {
    return { doctorReviewStatus: 'REJECTED', issuanceEligibilityStatus: 'REJECTED' };
  }
  if (action === 'REQUEST_REASSESSMENT') {
    return {
      doctorReviewStatus: 'REASSESSMENT_REQUIRED',
      issuanceEligibilityStatus: 'REASSESSMENT_REQUIRED',
    };
  }
  if (action === 'MODIFY' || action === 'EXCLUDE_UNRESOLVED_SLOT') {
    return {
      doctorReviewStatus: 'REVALIDATION_REQUIRED',
      issuanceEligibilityStatus: 'REVALIDATION_REQUIRED',
    };
  }
  if (reval === 'REQUIRED_PENDING' || reval === 'FAILED') {
    return {
      doctorReviewStatus: 'REVALIDATION_REQUIRED',
      issuanceEligibilityStatus: 'REVALIDATION_REQUIRED',
    };
  }
  if (!authorityOk || idempotencyBlocked || gatesBlock || isProduction) {
    return {
      doctorReviewStatus: 'BLOCKED',
      issuanceEligibilityStatus: 'ISSUANCE_BLOCKED',
    };
  }
  if (action === 'APPROVE') {
    return {
      doctorReviewStatus: 'REVIEW_RECORDED',
      issuanceEligibilityStatus: 'ISSUANCE_ELIGIBLE',
    };
  }
  return {
    doctorReviewStatus: 'BLOCKED',
    issuanceEligibilityStatus: 'ISSUANCE_BLOCKED',
  };
}

export function validateDoctorReviewAdapterInput(input: Rule4DoctorReviewAdapterInput): void {
  if (input.contractVersion !== RULE4_CONTRACT_VERSION_PHASE10_DOCTOR_REVIEW_ISSUANCE) {
    throw new Rule4DoctorReviewAdapterValidationError(
      'contractVersion not supported for Phase 10 doctor review',
    );
  }
  if (!input.rulesetVersion || !input.registryVersion) {
    throw new Rule4DoctorReviewAdapterValidationError(
      'rulesetVersion and registryVersion required',
    );
  }
  if (input.label !== 'SYNTHETIC' && input.label !== 'PRODUCTION') {
    throw new Rule4DoctorReviewAdapterValidationError('label must be SYNTHETIC or PRODUCTION');
  }
}

export function evaluateDoctorReviewAdapter(
  input: Rule4DoctorReviewAdapterInput,
  context: Rule4DoctorReviewEvaluationContext = {},
): Rule4DoctorReviewAdapterOutput {
  validateDoctorReviewAdapterInput(input);

  const authority = validateAuthority(input);
  const modification = validateModificationEnvelope(input);
  const idempotency = evaluateIdempotency(input, context);
  const upstream = context.upstream ?? {};

  if (upstream.legacyAuthorityAttempt) {
    authority.ok = false;
    authority.reasons.push('LEGACY_AUTHORITY_QUARANTINE');
    authority.reasons = [...new Set(authority.reasons)].sort();
  }

  const authEval = evaluateExpectedAuthenticityAuthority(
    input,
    context,
    input.doctorAction,
    upstream,
  );

  const issuanceGateResults = buildIssuanceGateLedger(input, context, {
    authorityOk: authority.ok,
    authorityReasons: authority.reasons,
    idempotencyBlocked: idempotency.blocked,
    idempotencyReasons: idempotency.reasons,
    modificationValid: modification.ok,
    modificationReasons: modification.reasons,
    authEval,
  });

  const gatesBlock = mandatoryGateBlocksEligibility(issuanceGateResults);
  const reval = engineRevalidationFromAction(input.doctorAction, upstream);
  const isProduction = input.label === 'PRODUCTION';

  const { doctorReviewStatus, issuanceEligibilityStatus } = resolveStatuses(
    input.doctorAction,
    gatesBlock,
    authority.ok,
    idempotency.blocked,
    reval,
    isProduction,
  );

  const reasonCodes = [
    'DOCTOR_REVIEW_SHADOW_DRAFT_ONLY',
    'DOCTOR_REVIEW_NOT_PRESCRIPTION_ISSUANCE',
    ...authority.reasons,
    ...modification.reasons,
    ...idempotency.reasons,
    ...authEval.bindingMismatchCodes,
    ...authEval.mismatchCodes,
    ...issuanceGateResults.flatMap((g) => g.reasonCodes),
    ...(isProduction ? ['PRODUCTION_DOCTOR_REVIEW_NOT_EVALUATED'] : []),
    ...(issuanceEligibilityStatus === 'ISSUANCE_BLOCKED' ? ['ISSUANCE_GATE_MANDATORY_FAIL'] : []),
  ];

  const limitationCodes = ['SHADOW_DOCTOR_REVIEW_DRAFT_ONLY'];

  const core: Rule4DoctorReviewAdapterOutput = {
    contractVersion: input.contractVersion,
    rulesetVersion: input.rulesetVersion,
    registryVersion: input.registryVersion,
    executionStatus: 'NOT_IMPLEMENTED',
    automaticIssuanceRuntime: false,
    automaticPrescriptionIssuanceRuntime: false,
    prescriptionIssueAllowed: false,
    finalDoctorApprovalRequired: true,
    currentRuntimeIssuanceDelta: 'NONE',
    doctorReviewStatus,
    issuanceEligibilityStatus,
    phase3ReviewState: mapPhase3State(input.doctorAction),
    engineRevalidationStatus: reval,
    issuanceGateResults,
    reasonCodes: [...new Set(reasonCodes)].sort(),
    limitationCodes: [...new Set(limitationCodes)].sort(),
    deterministicDoctorReviewFingerprint: '',
    idempotencyReplay: idempotency.replay,
    shadowAuditEvents: [],
  };

  validateDoctorReviewOutputCodes(core);

  const fp = fingerprintFromDoctorReviewOutput(core, {
    doctorAction: input.doctorAction,
    consultationId: input.consultationId,
    draftVersion: input.draftVersion,
    doctorId: input.reviewerAuthority.doctorId,
  });

  const shadowAuditEvents = buildShadowAuditEvents({
    doctorAction: input.doctorAction,
    consultationId: input.consultationId,
    draftVersion: input.draftVersion,
    doctorId: input.reviewerAuthority.doctorId,
    organizationId: input.reviewerAuthority.organizationId,
    clinicId: input.reviewerAuthority.clinicId,
    reviewTimestamp: input.reviewerAuthority.reviewTimestamp,
    decisionFingerprint: fp,
    reasonCodes: core.reasonCodes,
    output: core,
    superseded: authEval.superseded,
  });

  return {
    ...core,
    deterministicDoctorReviewFingerprint: fp,
    shadowAuditEvents,
  };
}
