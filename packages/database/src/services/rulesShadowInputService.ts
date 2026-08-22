import {
  FACT_ANALYSIS_ACCEPTANCE_ACTION,
  FACT_ANALYSIS_ACCEPTANCE_AUTHORITY,
  FACT_ANALYSIS_ACCEPTANCE_CONTRACT_VERSION,
  FACT_CANDIDATE_F3D1_AUTHORITY,
  FACT_NORMALIZATION_KINDS,
  FACT_NORMALIZATION_NEGATION_SCOPE,
  FACT_VERIFICATION_AUTHORITY_SCOPE,
  MAX_RULES_SHADOW_INPUT_FACTS,
  MAX_RULES_SHADOW_INPUT_NORMS_PER_FACT,
  MAX_RULES_SHADOW_INPUT_TOTAL_NORMS,
  RULES_SHADOW_INPUT_AUTHORITY,
  RULES_SHADOW_INPUT_CREATED_FROM_CONTRACT_VERSION,
  RULES_SHADOW_INPUT_SCHEMA_VERSION,
  type BuildRulesShadowInputResult,
  type FactNormalizationDto,
  type FactNormalizationKind,
  type RulesShadowInputDto,
  type RulesShadowInputFactEnvelope,
  type RulesShadowInputNormalizedSignal,
  type RulesShadowInputReasonCode,
} from '@ehas2/evidence-extract';
import { ResourceNotFoundError, ValidationError } from '../domainErrors.js';
import { buildNormalizationSnapshotFingerprint } from '../factAnalysisAcceptanceSnapshot.js';
import { withTenantTransaction } from '../pool.js';
import { PgFactAnalysisAcceptanceRepository } from '../repositories/factAnalysisAcceptance.js';
import { PgFactCandidateRepository } from '../repositories/factCandidate.js';
import { PgFactNormalizationRepository } from '../repositories/factNormalization.js';
import { PgFactVerificationRepository } from '../repositories/factVerification.js';
import { PgConsultationRepository } from '../repositories/postgres.js';
import {
  assertRulesShadowInputNfcString,
  buildRulesShadowInputFingerprint,
  compareRulesShadowFactOrder,
  compareRulesShadowNormOrder,
} from '../rulesShadowInputCanonical.js';
import { assertTenantContext, type TenantContext } from '../tenantContext.js';
import { assertUuid } from '../validation.js';
import { isStructuredVitalSourceField } from './structuredVitalSource.js';
import {
  acquireRulesShadowInputLockPlan,
  buildRulesShadowInputLockPlan,
  planMatchesFinalFactIds,
  type RulesShadowInputPreflightFact,
} from './rulesShadowInputLockPlan.js';

export const RULES_SHADOW_INPUT_OPERATION = 'clinical.rules_shadow_input_v1' as const;

const CLOSED_INPUT_KEYS = new Set(['consultationId']);

const ALLOWED_NORM_KINDS = new Set<string>(FACT_NORMALIZATION_KINDS);

export type BuildRulesShadowInputArgs = {
  consultationId: string;
};

function assertClosedInput(raw: Record<string, unknown>): void {
  for (const key of Object.keys(raw)) {
    if (!CLOSED_INPUT_KEYS.has(key)) throw new ValidationError('UNKNOWN_INPUT_KEY');
  }
}

function fail(reasonCode: RulesShadowInputReasonCode): BuildRulesShadowInputResult {
  return { ok: false, reasonCode };
}

function assertNfcOrMalformed(text: string, max: number): RulesShadowInputReasonCode | null {
  try {
    assertRulesShadowInputNfcString(text, max);
    return null;
  } catch {
    return 'MALFORMED_UNICODE';
  }
}

function unionLimitations(codes: readonly string[]): string[] {
  return [...new Set(codes)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function toSignal(
  norm: FactNormalizationDto,
  factAssertedValue: string | null,
): RulesShadowInputNormalizedSignal | RulesShadowInputReasonCode {
  if (!ALLOWED_NORM_KINDS.has(norm.normalizationKind)) return 'UNSUPPORTED_NORMALIZATION';
  const kind = norm.normalizationKind as FactNormalizationKind;
  if (norm.negationScope != null && norm.negationScope !== FACT_NORMALIZATION_NEGATION_SCOPE) {
    return 'UNSUPPORTED_NORMALIZATION';
  }
  for (const label of [norm.canonicalLabel, ...norm.cueEntryIds, ...norm.limitationCodes]) {
    const bad = assertNfcOrMalformed(label, 256);
    if (bad) return bad;
  }
  if (factAssertedValue != null) {
    const bad = assertNfcOrMalformed(factAssertedValue, 64);
    if (bad) return bad;
  }
  const cueEntryIds = [...norm.cueEntryIds].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const limitationCodes = unionLimitations(norm.limitationCodes);
  return {
    normalizationId: norm.id,
    normalizationIdentityFingerprint: norm.normalizationIdentityFingerprint,
    normalizationKind: kind,
    canonicalLabel: norm.canonicalLabel,
    structuredNumericValue: kind === 'UNIT_ALIAS' ? factAssertedValue : null,
    exactUnitAlias: kind === 'UNIT_ALIAS' ? norm.canonicalLabel : null,
    durationLabel: kind === 'DURATION_PHRASE' ? norm.canonicalLabel : null,
    negationScope: norm.negationScope,
    cueEntryIds,
    limitationCodes,
  };
}

function isSupportedSourceBinding(fact: {
  sourceChannel: string;
  sourceField: string;
  extractionCandidateId: string | null;
}): boolean {
  if (fact.sourceChannel === 'DOCTOR_DECLARED' && fact.sourceField === 'CHIEF_COMPLAINT') {
    return true;
  }
  if (
    fact.sourceChannel === 'REVIEWED_REPORT_TEXT' &&
    fact.sourceField === 'REVIEWED_EXTRACTION_CANDIDATE' &&
    fact.extractionCandidateId
  ) {
    return true;
  }
  if (
    fact.sourceChannel === 'STRUCTURED_INTAKE' &&
    isStructuredVitalSourceField(fact.sourceField)
  ) {
    return true;
  }
  return false;
}

export class RulesShadowInputService {
  async buildRulesShadowInput(
    tenant: TenantContext,
    input: BuildRulesShadowInputArgs,
    env: Record<string, string | undefined> = process.env,
  ): Promise<BuildRulesShadowInputResult> {
    assertTenantContext(tenant);
    assertUuid(tenant.organizationId, 'organizationId');
    assertUuid(tenant.clinicId, 'clinicId');
    assertUuid(tenant.actorId, 'actorId');
    assertClosedInput(input as unknown as Record<string, unknown>);
    assertUuid(input.consultationId, 'consultationId');
    if (tenant.actorRole !== 'Doctor') throw new ResourceNotFoundError();

    const facts = new PgFactCandidateRepository();
    const norms = new PgFactNormalizationRepository();
    const verifications = new PgFactVerificationRepository();
    const acceptances = new PgFactAnalysisAcceptanceRepository();
    const consultations = new PgConsultationRepository();

    return withTenantTransaction(
      tenant,
      async (tx) => {
        const consultation = await consultations.findById(tenant, tx, input.consultationId);
        if (!consultation || consultation.doctorUserId !== tenant.actorId) {
          throw new ResourceNotFoundError();
        }

        const activeAcceptances = await acceptances.listActiveByConsultation(
          tenant,
          tx,
          consultation.id,
        );
        if (activeAcceptances.length === 0) {
          return fail('NO_ELIGIBLE_FACTS');
        }
        if (activeAcceptances.length > MAX_RULES_SHADOW_INPUT_FACTS) {
          return fail('FACT_CAP_OVERFLOW');
        }

        const factIds = [...new Set(activeAcceptances.map((a) => a.factCandidateId))].sort(
          (a, b) => (a < b ? -1 : a > b ? 1 : 0),
        );
        if (factIds.length !== activeAcceptances.length) {
          return fail('CONTRADICTORY_INPUT');
        }

        const preflightFacts: RulesShadowInputPreflightFact[] = [];
        const normFingerprintsByFactId = new Map<string, string[]>();
        let projectedNorms = 0;

        for (const factId of factIds) {
          const peek = await facts.findById(tenant, tx, factId);
          if (!peek || peek.consultationId !== consultation.id) {
            return fail('STALE_INPUT');
          }
          if (peek.patientId !== consultation.patientId) {
            return fail('INPUT_BINDING_INVALID');
          }
          if (!isSupportedSourceBinding(peek)) {
            return fail('INPUT_BINDING_INVALID');
          }

          const peekNorms = await norms.listActiveByParentFact(tenant, tx, factId);
          if (peekNorms.length > MAX_RULES_SHADOW_INPUT_NORMS_PER_FACT) {
            return fail('NORM_PER_FACT_OVERFLOW');
          }
          projectedNorms += peekNorms.length;
          if (projectedNorms > MAX_RULES_SHADOW_INPUT_TOTAL_NORMS) {
            return fail('TOTAL_NORM_CAP_OVERFLOW');
          }

          preflightFacts.push({
            id: peek.id,
            sourceChannel: peek.sourceChannel,
            sourceField: peek.sourceField,
            extractionCandidateId: peek.extractionCandidateId,
            sourceIdentityFingerprint: peek.sourceIdentityFingerprint,
          });
          normFingerprintsByFactId.set(
            factId,
            peekNorms.map((n) => n.normalizationIdentityFingerprint),
          );
        }

        const lockPlan = buildRulesShadowInputLockPlan(
          consultation.id,
          preflightFacts,
          normFingerprintsByFactId,
        );

        try {
          await acquireRulesShadowInputLockPlan(tenant, tx, lockPlan, {
            facts,
            norms,
            verifications,
            acceptances,
          });
        } catch (err) {
          if (err instanceof ValidationError && err.message === 'INPUT_BINDING_INVALID') {
            return fail('INPUT_BINDING_INVALID');
          }
          throw err;
        }

        const lockedConsultation = await consultations.findById(tenant, tx, consultation.id);
        if (
          !lockedConsultation ||
          lockedConsultation.doctorUserId !== tenant.actorId ||
          lockedConsultation.patientId !== consultation.patientId
        ) {
          return fail('STALE_INPUT');
        }

        const finalAcceptances = await acceptances.listActiveByConsultation(
          tenant,
          tx,
          lockedConsultation.id,
        );
        if (finalAcceptances.length === 0) {
          return fail('NO_ELIGIBLE_FACTS');
        }
        if (finalAcceptances.length > MAX_RULES_SHADOW_INPUT_FACTS) {
          return fail('FACT_CAP_OVERFLOW');
        }

        const finalFactIds = [...new Set(finalAcceptances.map((a) => a.factCandidateId))].sort(
          (a, b) => (a < b ? -1 : a > b ? 1 : 0),
        );
        if (finalFactIds.length !== finalAcceptances.length) {
          return fail('CONTRADICTORY_INPUT');
        }
        if (!planMatchesFinalFactIds(lockPlan, finalFactIds)) {
          return fail('STALE_INPUT');
        }

        const envelopes: RulesShadowInputFactEnvelope[] = [];
        let totalNorms = 0;

        for (const factId of finalFactIds) {
          const parent = await facts.findById(tenant, tx, factId);
          if (
            !parent ||
            parent.decisionStatus !== 'ACTIVE' ||
            parent.authorityStatus !== FACT_CANDIDATE_F3D1_AUTHORITY ||
            parent.clinicallyUsed !== false ||
            parent.consultationId !== lockedConsultation.id ||
            parent.patientId !== lockedConsultation.patientId
          ) {
            return fail('STALE_INPUT');
          }
          if (!isSupportedSourceBinding(parent)) {
            return fail('INPUT_BINDING_INVALID');
          }

          const lockedNorms = await norms.listActiveByParentFact(tenant, tx, parent.id);
          if (lockedNorms.length > MAX_RULES_SHADOW_INPUT_NORMS_PER_FACT) {
            return fail('NORM_PER_FACT_OVERFLOW');
          }
          if (totalNorms + lockedNorms.length > MAX_RULES_SHADOW_INPUT_TOTAL_NORMS) {
            return fail('TOTAL_NORM_CAP_OVERFLOW');
          }
          for (const n of lockedNorms) {
            if (
              n.decisionStatus !== 'ACTIVE' ||
              n.authorityScope !== 'FACT_NORMALIZED_SOURCE_LINKED' ||
              n.clinicallyUsed !== false ||
              n.sourceFactCandidateId !== parent.id
            ) {
              return fail('STALE_INPUT');
            }
          }

          const plannedNorms = normFingerprintsByFactId.get(parent.id) ?? [];
          const liveNormFingerprints = lockedNorms
            .map((n) => n.normalizationIdentityFingerprint)
            .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
          const plannedNormFingerprints = [...plannedNorms].sort((a, b) =>
            a < b ? -1 : a > b ? 1 : 0,
          );
          if (
            liveNormFingerprints.length !== plannedNormFingerprints.length ||
            liveNormFingerprints.some((fp, i) => fp !== plannedNormFingerprints[i])
          ) {
            return fail('STALE_INPUT');
          }

          const liveSnapshot = buildNormalizationSnapshotFingerprint(
            lockedNorms.map((n) => ({
              id: n.id,
              normalizationIdentityFingerprint: n.normalizationIdentityFingerprint,
            })),
          );

          const verification = await verifications.findActiveByFactId(tenant, tx, parent.id);
          if (
            !verification ||
            verification.action !== 'ACCEPT_SOURCE_LINKED_FACT' ||
            verification.authorityScope !== FACT_VERIFICATION_AUTHORITY_SCOPE ||
            verification.decisionStatus !== 'ACTIVE'
          ) {
            return fail('STALE_INPUT');
          }
          const verificationNorms = await verifications.listSnapshotByEventId(
            tenant,
            tx,
            verification.id,
          );
          const verificationSnapshot = buildNormalizationSnapshotFingerprint(
            verificationNorms.map((n) => ({
              id: n.normalizationId,
              normalizationIdentityFingerprint: n.normalizationIdentityFingerprint,
            })),
          );
          if (
            verification.normalizationSnapshotFingerprint !== liveSnapshot ||
            verification.normalizationCount !== lockedNorms.length ||
            verificationSnapshot !== liveSnapshot ||
            verificationNorms.length !== lockedNorms.length
          ) {
            return fail('INPUT_BINDING_INVALID');
          }

          const acceptance = await acceptances.findActiveByFactId(tenant, tx, parent.id);
          if (
            !acceptance ||
            acceptance.decisionStatus !== 'ACTIVE' ||
            acceptance.action !== FACT_ANALYSIS_ACCEPTANCE_ACTION ||
            acceptance.authorityScope !== FACT_ANALYSIS_ACCEPTANCE_AUTHORITY ||
            acceptance.clinicallyUsed !== false ||
            acceptance.acceptanceContractVersion !== FACT_ANALYSIS_ACCEPTANCE_CONTRACT_VERSION ||
            acceptance.consultationId !== lockedConsultation.id ||
            acceptance.patientId !== lockedConsultation.patientId ||
            acceptance.factCandidateId !== parent.id
          ) {
            return fail('STALE_INPUT');
          }
          if (
            acceptance.verificationEventId !== verification.id ||
            acceptance.normalizationSnapshotFingerprint !== liveSnapshot ||
            acceptance.normalizationCount !== lockedNorms.length ||
            acceptance.sourceIdentityFingerprint !== parent.sourceIdentityFingerprint ||
            acceptance.contentFingerprint !== parent.contentFingerprint
          ) {
            return fail('INPUT_BINDING_INVALID');
          }
          const acceptanceSnapshotRows = await acceptances.listSnapshotByEventId(
            tenant,
            tx,
            acceptance.id,
          );
          const acceptanceSnapshot = buildNormalizationSnapshotFingerprint(
            acceptanceSnapshotRows.map((n) => ({
              id: n.normalizationId,
              normalizationIdentityFingerprint: n.normalizationIdentityFingerprint,
            })),
          );
          if (
            acceptanceSnapshot !== liveSnapshot ||
            acceptanceSnapshotRows.length !== lockedNorms.length
          ) {
            return fail('INPUT_BINDING_INVALID');
          }

          totalNorms += lockedNorms.length;
          if (totalNorms > MAX_RULES_SHADOW_INPUT_TOTAL_NORMS) {
            return fail('TOTAL_NORM_CAP_OVERFLOW');
          }

          const signals: RulesShadowInputNormalizedSignal[] = [];
          const assertedValue = parent.assertedValue;
          if (assertedValue != null) {
            const bad = assertNfcOrMalformed(assertedValue, 64);
            if (bad) return fail(bad);
          }
          for (const n of lockedNorms) {
            const signal = toSignal(n, assertedValue);
            if (typeof signal === 'string') return fail(signal);
            signals.push(signal);
          }
          signals.sort(compareRulesShadowNormOrder);

          const factLimitations = unionLimitations(signals.flatMap((s) => [...s.limitationCodes]));
          envelopes.push({
            factCandidateId: parent.id,
            acceptanceEventId: acceptance.id,
            verificationEventId: verification.id,
            sourceChannel: parent.sourceChannel,
            sourceField: parent.sourceField,
            sourceIdentityFingerprint: parent.sourceIdentityFingerprint,
            sourceContentFingerprint: parent.contentFingerprint,
            normalizationSnapshotFingerprint: liveSnapshot,
            acceptanceContractVersion: RULES_SHADOW_INPUT_CREATED_FROM_CONTRACT_VERSION,
            packId: acceptance.packId,
            packVersion: acceptance.packVersion,
            packContentChecksum: acceptance.packContentChecksum,
            parserVersion: acceptance.parserVersion,
            parserFingerprint: acceptance.parserFingerprint,
            normalizerMethod: acceptance.normalizerMethod,
            normalizerVersion: acceptance.normalizerVersion,
            normalizerFingerprint: acceptance.normalizerFingerprint,
            decisionStatus: 'ACTIVE',
            limitationCodes: factLimitations,
            normalizedSignals: signals,
          });
        }

        envelopes.sort(compareRulesShadowFactOrder);

        const bySource = new Map<string, RulesShadowInputFactEnvelope>();
        const byContent = new Map<string, RulesShadowInputFactEnvelope>();
        for (const envFact of envelopes) {
          const priorSource = bySource.get(envFact.sourceIdentityFingerprint);
          if (priorSource) {
            return fail('CONTRADICTORY_INPUT');
          }
          bySource.set(envFact.sourceIdentityFingerprint, envFact);
          const priorContent = byContent.get(envFact.sourceContentFingerprint);
          if (
            priorContent &&
            (priorContent.sourceIdentityFingerprint !== envFact.sourceIdentityFingerprint ||
              priorContent.normalizationSnapshotFingerprint !==
                envFact.normalizationSnapshotFingerprint)
          ) {
            return fail('CONTRADICTORY_INPUT');
          }
          byContent.set(envFact.sourceContentFingerprint, envFact);
        }

        const patientId = lockedConsultation.patientId;
        for (const envFact of envelopes) {
          for (const field of [
            envFact.sourceChannel,
            envFact.sourceField,
            envFact.sourceIdentityFingerprint,
            envFact.sourceContentFingerprint,
            envFact.normalizationSnapshotFingerprint,
            envFact.packId,
            envFact.packVersion,
            envFact.packContentChecksum,
            envFact.parserVersion,
            envFact.parserFingerprint,
            envFact.normalizerMethod,
            envFact.normalizerVersion,
            envFact.normalizerFingerprint,
          ]) {
            const bad = assertNfcOrMalformed(field, 256);
            if (bad) return fail(bad);
          }
        }

        const envelopeLimitations = unionLimitations(
          envelopes.flatMap((f) => [...f.limitationCodes]),
        );
        const draft: Omit<RulesShadowInputDto, 'consultationInputFingerprint'> = {
          schemaVersion: RULES_SHADOW_INPUT_SCHEMA_VERSION,
          authorityScope: RULES_SHADOW_INPUT_AUTHORITY,
          clinicallyUsed: false,
          organizationId: tenant.organizationId,
          clinicId: tenant.clinicId,
          patientId,
          consultationId: lockedConsultation.id,
          treatingDoctorId: lockedConsultation.doctorUserId,
          createdFromContractVersion: RULES_SHADOW_INPUT_CREATED_FROM_CONTRACT_VERSION,
          limitationCodes: envelopeLimitations,
          facts: envelopes,
        };

        let fingerprint: string;
        try {
          fingerprint = buildRulesShadowInputFingerprint(draft);
        } catch {
          return fail('MALFORMED_UNICODE');
        }

        const dto: RulesShadowInputDto = {
          ...draft,
          consultationInputFingerprint: fingerprint,
        };
        return { ok: true, dto };
      },
      env,
    );
  }
}

export const rulesShadowInputService = new RulesShadowInputService();

export function buildRulesShadowInput(
  tenant: TenantContext,
  input: BuildRulesShadowInputArgs,
  env?: Record<string, string | undefined>,
): Promise<BuildRulesShadowInputResult> {
  return rulesShadowInputService.buildRulesShadowInput(tenant, input, env);
}
