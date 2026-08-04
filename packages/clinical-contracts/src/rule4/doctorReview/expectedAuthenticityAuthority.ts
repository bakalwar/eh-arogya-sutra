import type {
  Rule4DoctorAction,
  Rule4DoctorReviewAdapterInput,
  Rule4DoctorReviewEvaluationContext,
  Rule4DraftAuthenticityBundle,
  Rule4UpstreamShadowSnapshot,
} from './types.js';

export const MANDATORY_EXPECTED_AUTHENTICITY_FIELDS: readonly (keyof Rule4DraftAuthenticityBundle)[] =
  [
    'draftVersion',
    'draftContentHash',
    'slotManifestFingerprint',
    'evidenceFingerprint',
    'polarityFingerprint',
    'phaseFingerprint',
    'severityFingerprint',
    'eligibilityFingerprint',
    'selectionFingerprint',
    'pediatricFingerprint',
    'clinicalSummaryFingerprint',
    'rulesetVersion',
    'registryVersion',
  ] as const;

export type ExpectedAuthenticityEvaluation = {
  approvalPathRequiresExpected: boolean;
  expectedMissing: boolean;
  expectedFieldMissing: string[];
  mismatchCodes: string[];
  superseded: boolean;
  bindingMismatchCodes: string[];
};

function isNonEmpty(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function approvalPathRequiresExpectedAuthenticity(
  action: Rule4DoctorAction,
  upstream: Rule4UpstreamShadowSnapshot,
): boolean {
  if (action !== 'APPROVE') {
    return false;
  }
  const reval = upstream.engineRevalidationStatus ?? 'NOT_REQUIRED';
  if (reval === 'REQUIRED_PENDING' || reval === 'FAILED') {
    return false;
  }
  return true;
}

function compareDraftToExpected(
  draft: Rule4DraftAuthenticityBundle,
  expected: Rule4DraftAuthenticityBundle,
): { mismatchCodes: string[]; supersededFields: boolean } {
  const mismatchCodes: string[] = [];
  let supersededFields = false;
  const supersedeKeys: (keyof Rule4DraftAuthenticityBundle)[] = [
    'draftVersion',
    'draftContentHash',
    'slotManifestFingerprint',
    'evidenceFingerprint',
    'selectionFingerprint',
    'pediatricFingerprint',
    'clinicalSummaryFingerprint',
    'polarityFingerprint',
    'phaseFingerprint',
    'severityFingerprint',
    'eligibilityFingerprint',
    'rulesetVersion',
    'registryVersion',
  ];
  for (const k of MANDATORY_EXPECTED_AUTHENTICITY_FIELDS) {
    if (draft[k] !== expected[k]) {
      mismatchCodes.push('DRAFT_AUTHENTICITY_MISMATCH');
      if (k === 'evidenceFingerprint') {
        mismatchCodes.push('STALE_EVIDENCE_FINGERPRINT');
      }
      if (k === 'clinicalSummaryFingerprint') {
        mismatchCodes.push('STALE_SUMMARY_FINGERPRINT');
      }
      if (k === 'draftVersion' || k === 'draftContentHash') {
        mismatchCodes.push('STALE_DRAFT_VERSION');
      }
      if (k === 'selectionFingerprint') {
        mismatchCodes.push('STALE_PHASE8_SELECTION_FINGERPRINT');
      }
      if (k === 'pediatricFingerprint') {
        mismatchCodes.push('STALE_PHASE9_PEDIATRIC_FINGERPRINT');
      }
      if (supersedeKeys.includes(k)) {
        supersededFields = true;
      }
    }
  }
  if (
    draft.rulesetVersion !== expected.rulesetVersion ||
    draft.registryVersion !== expected.registryVersion
  ) {
    mismatchCodes.push('RULESET_REGISTRY_MISMATCH');
  }
  return { mismatchCodes: [...new Set(mismatchCodes)], supersededFields };
}

export function evaluateExpectedAuthenticityAuthority(
  input: Rule4DoctorReviewAdapterInput,
  context: Rule4DoctorReviewEvaluationContext,
  action: Rule4DoctorAction,
  upstream: Rule4UpstreamShadowSnapshot,
): ExpectedAuthenticityEvaluation {
  const approvalPathRequiresExpected = approvalPathRequiresExpectedAuthenticity(action, upstream);
  const expected = context.expectedAuthenticity;
  const bindingMismatchCodes: string[] = [];
  const binding = context.expectedReviewerBinding;
  if (approvalPathRequiresExpected) {
    if (binding) {
      const r = input.reviewerAuthority;
      if (binding.consultationId !== input.consultationId) {
        bindingMismatchCodes.push('CONSULTATION_BINDING_MISMATCH');
      }
      if (binding.doctorId !== r.doctorId) {
        bindingMismatchCodes.push('TENANT_BINDING_MISMATCH');
      }
      if (binding.organizationId !== r.organizationId || binding.clinicId !== r.clinicId) {
        bindingMismatchCodes.push('TENANT_BINDING_MISMATCH');
      }
    } else {
      bindingMismatchCodes.push('EXPECTED_REVIEWER_BINDING_MISSING');
    }
  }

  if (!approvalPathRequiresExpected) {
    return {
      approvalPathRequiresExpected: false,
      expectedMissing: false,
      expectedFieldMissing: [],
      mismatchCodes: expected
        ? compareDraftToExpected(input.draftAuthenticity, expected).mismatchCodes
        : [],
      superseded: false,
      bindingMismatchCodes: [...new Set(bindingMismatchCodes)],
    };
  }

  if (!expected) {
    return {
      approvalPathRequiresExpected: true,
      expectedMissing: true,
      expectedFieldMissing: [],
      mismatchCodes: ['EXPECTED_DRAFT_AUTHENTICITY_MISSING'],
      superseded: false,
      bindingMismatchCodes: [...new Set(bindingMismatchCodes)],
    };
  }

  const expectedFieldMissing: string[] = [];
  for (const field of MANDATORY_EXPECTED_AUTHENTICITY_FIELDS) {
    if (!isNonEmpty(expected[field])) {
      expectedFieldMissing.push(field);
    }
  }
  if (expectedFieldMissing.length > 0) {
    return {
      approvalPathRequiresExpected: true,
      expectedMissing: false,
      expectedFieldMissing,
      mismatchCodes: ['EXPECTED_AUTHENTICITY_FIELD_MISSING'],
      superseded: false,
      bindingMismatchCodes: [...new Set(bindingMismatchCodes)],
    };
  }

  const { mismatchCodes, supersededFields } = compareDraftToExpected(
    input.draftAuthenticity,
    expected,
  );

  let superseded = supersededFields && mismatchCodes.length > 0;

  const prior = context.priorApprovedAuthenticity;
  if (prior) {
    for (const k of [
      'draftVersion',
      'draftContentHash',
      'slotManifestFingerprint',
      'evidenceFingerprint',
      'selectionFingerprint',
      'pediatricFingerprint',
      'clinicalSummaryFingerprint',
    ] as const) {
      if (expected[k] !== prior[k]) {
        superseded = true;
        break;
      }
    }
  }

  if (upstream.slotManifestChange === 'ADDED' || upstream.slotManifestChange === 'REMOVED') {
    superseded = true;
  }

  if (
    upstream.priorApprovedDraftVersion &&
    upstream.priorApprovedDraftVersion !== expected.draftVersion
  ) {
    superseded = true;
  }

  if (superseded) {
    mismatchCodes.push('APPROVAL_SUPERSEDED');
  }

  return {
    approvalPathRequiresExpected: true,
    expectedMissing: false,
    expectedFieldMissing: [],
    mismatchCodes: [...new Set(mismatchCodes)],
    superseded,
    bindingMismatchCodes: [...new Set(bindingMismatchCodes)],
  };
}
