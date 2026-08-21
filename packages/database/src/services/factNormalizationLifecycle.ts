import type { TenantContext, TransactionContext } from '../tenantContext.js';
import { PgFactCandidateRepository } from '../repositories/factCandidate.js';
import { PgFactNormalizationRepository } from '../repositories/factNormalization.js';

const facts = new PgFactCandidateRepository();
const norms = new PgFactNormalizationRepository();

/**
 * Global lock order for fact+normalization supersession (caller must already hold
 * the shared source/candidate lifecycle lock when invalidating from a source writer):
 *   1) sorted fact identity advisory locks
 *   2) sorted ACTIVE normalization identity advisory locks
 *   3) conditional ACTIVE→SUPERSEDED on facts
 *   4) conditional ACTIVE→SUPERSEDED on linked normalizations
 *
 * Never take source/candidate locks after fact/norm locks.
 */
export async function lockAndSupersedeFactsWithNormalizations(
  tenant: TenantContext,
  tx: TransactionContext,
  factIds: readonly string[],
): Promise<{ factCount: number; normalizationCount: number }> {
  if (factIds.length === 0) return { factCount: 0, normalizationCount: 0 };
  const uniqueIds = [...new Set(factIds)];

  const locked = await tx.query(
    `SELECT id, source_identity_fingerprint AS fp
     FROM clinical_fact_candidates
     WHERE organization_id = $1 AND clinic_id = $2
       AND id = ANY($3::uuid[])
       AND decision_status = 'ACTIVE'`,
    [tenant.organizationId, tenant.clinicId, uniqueIds],
  );
  const rows = locked.rows as { id: string; fp: string }[];
  if (rows.length === 0) return { factCount: 0, normalizationCount: 0 };

  const fingerprints = [...new Set(rows.map((r) => String(r.fp)))].sort((a, b) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  for (const fp of fingerprints) {
    await facts.lockIdentity(tx, fp);
  }

  const activeIds = rows.map((r) => String(r.id));
  await norms.lockActiveIdentitiesForParentFacts(tenant, tx, activeIds);

  const factCount = await facts.supersedeActiveByIds(tenant, tx, activeIds);
  const normalizationCount = await norms.supersedeActiveLinkedToFacts(tenant, tx, activeIds);
  return { factCount, normalizationCount };
}

export async function invalidateChiefComplaintFactsAndNormalizations(
  tenant: TenantContext,
  tx: TransactionContext,
  consultationId: string,
): Promise<{ factCount: number; normalizationCount: number }> {
  const r = await tx.query(
    `SELECT id FROM clinical_fact_candidates
     WHERE organization_id = $1 AND clinic_id = $2
       AND consultation_id = $3
       AND source_channel = 'DOCTOR_DECLARED'
       AND source_field = 'CHIEF_COMPLAINT'
       AND decision_status = 'ACTIVE'`,
    [tenant.organizationId, tenant.clinicId, consultationId],
  );
  const ids = (r.rows as { id: string }[]).map((row) => String(row.id));
  return lockAndSupersedeFactsWithNormalizations(tenant, tx, ids);
}

export async function invalidateReviewedCandidateFactsAndNormalizations(
  tenant: TenantContext,
  tx: TransactionContext,
  candidateId: string,
): Promise<{ factCount: number; normalizationCount: number }> {
  const r = await tx.query(
    `SELECT id FROM clinical_fact_candidates
     WHERE organization_id = $1 AND clinic_id = $2
       AND extraction_candidate_id = $3
       AND decision_status = 'ACTIVE'`,
    [tenant.organizationId, tenant.clinicId, candidateId],
  );
  const ids = (r.rows as { id: string }[]).map((row) => String(row.id));
  return lockAndSupersedeFactsWithNormalizations(tenant, tx, ids);
}
