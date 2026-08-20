import type { TenantContext, TransactionContext } from '../tenantContext.js';
import { FactConflictError, ResourceNotFoundError, ValidationError } from '../domainErrors.js';
import {
  FACT_NORMALIZATION_AUTHORITY_SCOPE,
  FACT_NORMALIZATION_KINDS,
  FACT_NORMALIZATION_LIMITATION_CODES,
  FACT_NORMALIZATION_METHODS,
  FACT_NORMALIZATION_NEGATION_SCOPE,
  type FactNormalizationDecisionStatus,
  type FactNormalizationDto,
  type FactNormalizationKind,
  type FactNormalizationLimitationCode,
  type FactNormalizationMethod,
} from '@ehas2/evidence-extract';

const PARENT_AUTHORITY = 'FACT_CANDIDATE_UNVERIFIED' as const;

function mapTs(value: unknown): string {
  return new Date(String(value)).toISOString();
}

function isUniqueViolation(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  if (code === '23505') return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /unique|duplicate/i.test(msg);
}

function isImmutableNorm(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /FACT_NORMALIZATIONS_IMMUTABLE/i.test(msg);
}

function assertCueEntryIds(ids: readonly string[]): void {
  if (ids.length > 8) throw new ValidationError('INVALID_FACT_NORMALIZATION');
  for (const id of ids) {
    if (id.length < 1 || id.length > 64) throw new ValidationError('INVALID_FACT_NORMALIZATION');
  }
}

function mapNorm(row: Record<string, unknown>): FactNormalizationDto {
  if (row.clinically_used === true) {
    throw new ValidationError('FACT_NORMALIZATION_CLINICALLY_USED_CORRUPT');
  }
  if (String(row.authority_scope) !== FACT_NORMALIZATION_AUTHORITY_SCOPE) {
    throw new ValidationError('FACT_NORMALIZATION_AUTHORITY_CORRUPT');
  }
  const kind = String(row.normalization_kind) as FactNormalizationKind;
  if (!(FACT_NORMALIZATION_KINDS as readonly string[]).includes(kind)) {
    throw new ValidationError('FACT_NORMALIZATION_KIND_CORRUPT');
  }
  const method = String(row.normalizer_method) as FactNormalizationMethod;
  if (!(FACT_NORMALIZATION_METHODS as readonly string[]).includes(method)) {
    throw new ValidationError('FACT_NORMALIZATION_METHOD_CORRUPT');
  }
  const codes = Array.isArray(row.limitation_codes)
    ? (row.limitation_codes as string[]).map((c) => c as FactNormalizationLimitationCode)
    : [];
  const cueEntryIds = Array.isArray(row.cue_entry_ids)
    ? (row.cue_entry_ids as string[]).map(String)
    : [];
  const negationRaw = row.negation_scope;
  const negationScope =
    negationRaw == null ? null : (String(negationRaw) as typeof FACT_NORMALIZATION_NEGATION_SCOPE);
  if (negationScope != null && negationScope !== FACT_NORMALIZATION_NEGATION_SCOPE) {
    throw new ValidationError('FACT_NORMALIZATION_NEGATION_CORRUPT');
  }
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    clinicId: String(row.clinic_id),
    patientId: String(row.patient_id),
    consultationId: String(row.consultation_id),
    sourceFactCandidateId: String(row.source_fact_candidate_id),
    sourceIdentityFingerprint: String(row.source_identity_fingerprint),
    normalizationIdentityFingerprint: String(row.normalization_identity_fingerprint),
    sourceChannel: String(row.source_channel),
    sourceField: String(row.source_field),
    normalizationKind: kind,
    canonicalLabel: String(row.canonical_label),
    negationScope,
    cueEntryIds,
    packId: String(row.pack_id),
    packVersion: String(row.pack_version),
    packContentChecksum: String(row.pack_content_checksum),
    parserVersion: String(row.parser_version),
    parserFingerprint: String(row.parser_fingerprint),
    normalizerMethod: method,
    normalizerVersion: String(row.normalizer_version),
    normalizerFingerprint: String(row.normalizer_fingerprint),
    authorityScope: FACT_NORMALIZATION_AUTHORITY_SCOPE,
    decisionStatus: String(row.decision_status) as FactNormalizationDecisionStatus,
    supersedesNormalizationId:
      row.supersedes_normalization_id == null ? null : String(row.supersedes_normalization_id),
    limitationCodes: codes,
    clinicallyUsed: false,
    actorId: String(row.actor_id),
    actorRole: String(row.actor_role) as 'Doctor' | 'ClinicAdmin',
    createdAt: mapTs(row.created_at),
  };
}

type ParentFactLinkRow = {
  id: string;
  organization_id: string;
  clinic_id: string;
  patient_id: string;
  consultation_id: string;
  source_channel: string;
  source_field: string;
  source_identity_fingerprint: string;
  authority_status: string;
  decision_status: string;
  clinically_used: boolean;
};

/**
 * Caller supplies only parent id + normalization-specific fields.
 * Parent tenant/patient/consultation/source linkage is server-copied.
 */
export type InsertFactNormalizationInput = {
  sourceFactCandidateId: string;
  normalizationIdentityFingerprint: string;
  normalizationKind: FactNormalizationKind;
  canonicalLabel: string;
  negationScope: typeof FACT_NORMALIZATION_NEGATION_SCOPE | null;
  cueEntryIds: readonly string[];
  packId: string;
  packVersion: string;
  packContentChecksum: string;
  parserVersion: string;
  parserFingerprint: string;
  normalizerMethod: FactNormalizationMethod;
  normalizerVersion: string;
  normalizerFingerprint: string;
  limitationCodes: readonly FactNormalizationLimitationCode[];
  supersedesNormalizationId: string | null;
};

/**
 * F3D-2D1 persistence primitives only.
 * No production normalization writer / materializer / cue-parser invocation.
 *
 * Insert lock order:
 * 1) tenant-scoped parent fact row lock (SELECT … FOR UPDATE)
 * 2) normalization identity advisory lock (sorted when batching)
 * 3) INSERT
 */
export class PgFactNormalizationRepository {
  async lockIdentity(tx: TransactionContext, fingerprint: string): Promise<void> {
    await tx.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [fingerprint]);
  }

  async lockIdentitiesSorted(
    tx: TransactionContext,
    fingerprints: readonly string[],
  ): Promise<void> {
    const sorted = [...new Set(fingerprints)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    for (const fingerprint of sorted) {
      await this.lockIdentity(tx, fingerprint);
    }
  }

  async findById(
    tenant: TenantContext,
    tx: TransactionContext,
    normalizationId: string,
  ): Promise<FactNormalizationDto | null> {
    const r = await tx.query(
      `SELECT * FROM clinical_fact_normalizations
       WHERE organization_id = $1 AND clinic_id = $2 AND id = $3
       LIMIT 1`,
      [tenant.organizationId, tenant.clinicId, normalizationId],
    );
    return r.rows[0] ? mapNorm(r.rows[0] as Record<string, unknown>) : null;
  }

  async findActiveByIdentity(
    tenant: TenantContext,
    tx: TransactionContext,
    fingerprint: string,
  ): Promise<FactNormalizationDto | null> {
    const r = await tx.query(
      `SELECT * FROM clinical_fact_normalizations
       WHERE organization_id = $1 AND clinic_id = $2
         AND normalization_identity_fingerprint = $3 AND decision_status = 'ACTIVE'
       LIMIT 1`,
      [tenant.organizationId, tenant.clinicId, fingerprint],
    );
    return r.rows[0] ? mapNorm(r.rows[0] as Record<string, unknown>) : null;
  }

  async listByConsultation(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
  ): Promise<FactNormalizationDto[]> {
    const r = await tx.query(
      `SELECT * FROM clinical_fact_normalizations
       WHERE organization_id = $1 AND clinic_id = $2 AND consultation_id = $3
       ORDER BY created_at ASC, id ASC`,
      [tenant.organizationId, tenant.clinicId, consultationId],
    );
    return (r.rows as Record<string, unknown>[]).map(mapNorm);
  }

  async supersedeActive(
    tenant: TenantContext,
    tx: TransactionContext,
    normalizationId: string,
  ): Promise<{ id: string }> {
    try {
      const r = await tx.query(
        `UPDATE clinical_fact_normalizations
         SET decision_status = 'SUPERSEDED'
         WHERE organization_id = $1 AND clinic_id = $2
           AND id = $3 AND decision_status = 'ACTIVE'
         RETURNING id`,
        [tenant.organizationId, tenant.clinicId, normalizationId],
      );
      if (r.rowCount !== 1 || !r.rows[0]) {
        throw new FactConflictError();
      }
      return { id: String((r.rows[0] as { id: string }).id) };
    } catch (err) {
      if (err instanceof FactConflictError) throw err;
      if (isImmutableNorm(err)) throw new FactConflictError();
      throw err;
    }
  }

  /**
   * Lifecycle primitive for a future writer phase: supersede ACTIVE norms for parent facts.
   * Not wired into supersedeRuns / fact writers in D1.
   */
  async supersedeActiveLinkedToFacts(
    tenant: TenantContext,
    tx: TransactionContext,
    factIds: readonly string[],
  ): Promise<number> {
    if (factIds.length === 0) return 0;
    try {
      const r = await tx.query(
        `UPDATE clinical_fact_normalizations
         SET decision_status = 'SUPERSEDED'
         WHERE organization_id = $1 AND clinic_id = $2
           AND source_fact_candidate_id = ANY($3::uuid[])
           AND decision_status = 'ACTIVE'
         RETURNING id`,
        [tenant.organizationId, tenant.clinicId, [...factIds]],
      );
      return r.rowCount ?? 0;
    } catch (err) {
      if (isImmutableNorm(err)) throw new FactConflictError();
      throw err;
    }
  }

  private async lockAndLoadEligibleParent(
    tenant: TenantContext,
    tx: TransactionContext,
    sourceFactCandidateId: string,
  ): Promise<ParentFactLinkRow> {
    const r = await tx.query(
      `SELECT id, organization_id, clinic_id, patient_id, consultation_id,
              source_channel, source_field, source_identity_fingerprint,
              authority_status, decision_status, clinically_used
       FROM clinical_fact_candidates
       WHERE organization_id = $1 AND clinic_id = $2 AND id = $3
       FOR UPDATE`,
      [tenant.organizationId, tenant.clinicId, sourceFactCandidateId],
    );
    if (!r.rows[0]) {
      throw new ResourceNotFoundError();
    }
    const parent = r.rows[0] as ParentFactLinkRow;
    if (
      parent.decision_status !== 'ACTIVE' ||
      parent.authority_status !== PARENT_AUTHORITY ||
      parent.clinically_used === true
    ) {
      throw new ValidationError('FACT_INELIGIBLE');
    }
    return parent;
  }

  async insert(
    tenant: TenantContext,
    tx: TransactionContext,
    input: InsertFactNormalizationInput,
  ): Promise<FactNormalizationDto> {
    assertCueEntryIds(input.cueEntryIds);
    if (!(FACT_NORMALIZATION_KINDS as readonly string[]).includes(input.normalizationKind)) {
      throw new ValidationError('INVALID_FACT_NORMALIZATION');
    }
    if (!(FACT_NORMALIZATION_METHODS as readonly string[]).includes(input.normalizerMethod)) {
      throw new ValidationError('INVALID_FACT_NORMALIZATION');
    }
    const allow = new Set<string>(FACT_NORMALIZATION_LIMITATION_CODES);
    if (input.limitationCodes.some((c) => !allow.has(c))) {
      throw new ValidationError('INVALID_FACT_NORMALIZATION');
    }
    if (input.normalizationKind === 'NEGATION_CUE') {
      if (input.negationScope !== FACT_NORMALIZATION_NEGATION_SCOPE) {
        throw new ValidationError('INVALID_FACT_NORMALIZATION');
      }
    } else if (input.negationScope != null) {
      throw new ValidationError('INVALID_FACT_NORMALIZATION');
    }

    const parent = await this.lockAndLoadEligibleParent(tenant, tx, input.sourceFactCandidateId);
    await this.lockIdentity(tx, input.normalizationIdentityFingerprint);

    try {
      const r = await tx.query(
        `INSERT INTO clinical_fact_normalizations (
           organization_id, clinic_id, patient_id, consultation_id,
           source_fact_candidate_id, source_identity_fingerprint, normalization_identity_fingerprint,
           source_channel, source_field, normalization_kind, canonical_label, negation_scope,
           cue_entry_ids, pack_id, pack_version, pack_content_checksum,
           parser_version, parser_fingerprint, normalizer_method, normalizer_version,
           normalizer_fingerprint, authority_scope, decision_status, supersedes_normalization_id,
           limitation_codes, clinically_used, actor_id, actor_role
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::text[],$14,$15,$16,$17,$18,$19,$20,$21,
           'FACT_NORMALIZED_SOURCE_LINKED','ACTIVE',$22,$23::text[],false,$24,$25
         ) RETURNING *`,
        [
          parent.organization_id,
          parent.clinic_id,
          parent.patient_id,
          parent.consultation_id,
          parent.id,
          parent.source_identity_fingerprint,
          input.normalizationIdentityFingerprint,
          parent.source_channel,
          parent.source_field,
          input.normalizationKind,
          input.canonicalLabel,
          input.negationScope,
          [...input.cueEntryIds],
          input.packId,
          input.packVersion,
          input.packContentChecksum,
          input.parserVersion,
          input.parserFingerprint,
          input.normalizerMethod,
          input.normalizerVersion,
          input.normalizerFingerprint,
          input.supersedesNormalizationId,
          [...input.limitationCodes],
          tenant.actorId,
          tenant.actorRole,
        ],
      );
      return mapNorm(r.rows[0] as Record<string, unknown>);
    } catch (err) {
      if (isUniqueViolation(err)) throw new FactConflictError();
      const code = (err as { code?: string } | null)?.code;
      if (code === '23514' || code === '23502' || code === '23503') {
        throw new ValidationError('INVALID_FACT_NORMALIZATION');
      }
      throw err;
    }
  }
}
