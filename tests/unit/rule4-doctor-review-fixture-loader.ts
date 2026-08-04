import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type {
  Rule4DoctorReviewAdapterInput,
  Rule4DoctorReviewEvaluationContext,
} from '../../packages/clinical-contracts/src/rule4/doctorReview/types.js';

const REPO = resolve(import.meta.dirname, '../..');
export const RULE4_DOCTOR_REVIEW_FIXTURE_PATH = resolve(
  REPO,
  'fixtures/rule4/doctor-review-issuance-scenarios.v1.json',
);

export type Rule4DoctorReviewFixtureScenario = {
  id: string;
  input: Record<string, unknown>;
  context: Record<string, unknown>;
  expected: Record<string, unknown>;
};

export type Rule4DoctorReviewFingerprintV1Reference = {
  reference_id: string;
  scenario_id: string;
  canonical_payload: string;
  doctor_review_sha256: string;
};

export type Rule4DoctorReviewAuditEventFingerprintV1Reference = {
  reference_id: string;
  scenario_id: string;
  event_type: string;
  canonical_payload: string;
  audit_event_sha256: string;
};

export type Rule4DoctorReviewFixture = {
  fixtureVersion: string;
  scenarioCount: number;
  fingerprintV1References: Rule4DoctorReviewFingerprintV1Reference[];
  auditEventFingerprintV1References?: Rule4DoctorReviewAuditEventFingerprintV1Reference[];
  scenarios: Rule4DoctorReviewFixtureScenario[];
};

export const RULE4_DOCTOR_REVIEW_FIXTURE_SHA256 =
  '94A533DB0542DEF59B647F1404AC88CF0897182A4156A5649C92C73BF08FD1CE';

function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function snakeToCamelDeep(obj: unknown): unknown {
  if (obj == null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamelDeep);
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[snakeToCamelKey(k)] = snakeToCamelDeep(v);
  }
  return out;
}

export function loadRule4DoctorReviewFixture(): Rule4DoctorReviewFixture {
  return JSON.parse(
    readFileSync(RULE4_DOCTOR_REVIEW_FIXTURE_PATH, 'utf8'),
  ) as Rule4DoctorReviewFixture;
}

export function doctorReviewInputFromScenario(
  scenario: Rule4DoctorReviewFixtureScenario,
): Rule4DoctorReviewAdapterInput {
  return snakeToCamelDeep(scenario.input) as Rule4DoctorReviewAdapterInput;
}

export function doctorReviewContextFromScenario(
  scenario: Rule4DoctorReviewFixtureScenario,
): Rule4DoctorReviewEvaluationContext {
  const ctx = snakeToCamelDeep(scenario.context ?? {}) as Rule4DoctorReviewEvaluationContext;
  if (ctx.idempotency === null) {
    return { ...ctx, idempotency: undefined };
  }
  return ctx;
}

export function doctorReviewExpectedView(output: {
  issuanceEligibilityStatus: string;
  doctorReviewStatus: string;
  phase3ReviewState: string;
  engineRevalidationStatus: string;
  prescriptionIssueAllowed: boolean;
  reasonCodes: readonly string[];
}): Record<string, unknown> {
  return {
    issuance_eligibility_status: output.issuanceEligibilityStatus,
    doctor_review_status: output.doctorReviewStatus,
    phase3_review_state: output.phase3ReviewState,
    engine_revalidation_status: output.engineRevalidationStatus,
    prescription_issue_allowed: output.prescriptionIssueAllowed,
    reason_codes: [...output.reasonCodes],
  };
}
