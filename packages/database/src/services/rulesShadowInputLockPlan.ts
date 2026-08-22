import type { TenantContext, TransactionContext } from '../tenantContext.js';
import { PgFactAnalysisAcceptanceRepository } from '../repositories/factAnalysisAcceptance.js';
import { PgFactCandidateRepository } from '../repositories/factCandidate.js';
import { PgFactNormalizationRepository } from '../repositories/factNormalization.js';
import { PgFactVerificationRepository } from '../repositories/factVerification.js';
import {
  acquireCanonicalSourceLocks,
  buildCanonicalSourceLockSubjectsFromFacts,
  type CanonicalSourceLockSubject,
  type SourceLockFactPeek,
} from './cueSourceLockPlan.js';
import { recordRulesShadowInputLockTrace } from './rulesShadowInputLockTrace.js';

export type RulesShadowInputLockPlan = {
  consultationId: string;
  sourceSubjects: CanonicalSourceLockSubject[];
  factIds: string[];
  factIdentityFingerprints: string[];
  normIdentityFingerprints: string[];
  d5FactIds: string[];
  e1FactIds: string[];
};

export type RulesShadowInputPreflightFact = SourceLockFactPeek & {
  id: string;
  sourceIdentityFingerprint: string;
};

function sortIds(ids: readonly string[]): string[] {
  return [...new Set(ids)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function buildRulesShadowInputLockPlan(
  consultationId: string,
  factPeeks: readonly RulesShadowInputPreflightFact[],
  normFingerprintsByFactId: ReadonlyMap<string, readonly string[]>,
): RulesShadowInputLockPlan {
  const factIds = sortIds(factPeeks.map((f) => f.id));
  const factIdentityFingerprints = sortIds(factPeeks.map((f) => f.sourceIdentityFingerprint));
  const normIdentityFingerprints = sortIds(
    factIds.flatMap((factId) => [...(normFingerprintsByFactId.get(factId) ?? [])]),
  );
  const sourceSubjects = buildCanonicalSourceLockSubjectsFromFacts(consultationId, factPeeks);

  return {
    consultationId,
    sourceSubjects,
    factIds,
    factIdentityFingerprints,
    normIdentityFingerprints,
    d5FactIds: factIds,
    e1FactIds: factIds,
  };
}

export async function acquireRulesShadowInputLockPlan(
  tenant: TenantContext,
  tx: TransactionContext,
  plan: RulesShadowInputLockPlan,
  repos: {
    facts: PgFactCandidateRepository;
    norms: PgFactNormalizationRepository;
    verifications: PgFactVerificationRepository;
    acceptances: PgFactAnalysisAcceptanceRepository;
  },
): Promise<void> {
  await acquireCanonicalSourceLocks(tenant, tx, plan.sourceSubjects);

  for (const fingerprint of plan.factIdentityFingerprints) {
    await repos.facts.lockIdentity(tx, fingerprint);
    recordRulesShadowInputLockTrace({ class: 'fact', subject: fingerprint });
  }

  await repos.norms.lockIdentitiesSorted(tx, plan.normIdentityFingerprints);
  for (const fingerprint of plan.normIdentityFingerprints) {
    recordRulesShadowInputLockTrace({ class: 'norm', subject: fingerprint });
  }

  await repos.verifications.lockSubjectsSorted(tenant, tx, plan.d5FactIds);
  for (const factId of plan.d5FactIds) {
    recordRulesShadowInputLockTrace({ class: 'd5', subject: factId });
  }

  await repos.acceptances.lockSubjectsSorted(tenant, tx, plan.e1FactIds);
  for (const factId of plan.e1FactIds) {
    recordRulesShadowInputLockTrace({ class: 'e1', subject: factId });
  }
}

export function planMatchesFinalFactIds(
  plan: RulesShadowInputLockPlan,
  finalFactIds: readonly string[],
): boolean {
  const sortedFinal = sortIds(finalFactIds);
  if (sortedFinal.length !== plan.factIds.length) return false;
  for (let i = 0; i < plan.factIds.length; i += 1) {
    if (plan.factIds[i] !== sortedFinal[i]) return false;
  }
  return true;
}
