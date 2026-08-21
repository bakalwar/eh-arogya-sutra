import { createHash } from 'node:crypto';
import {
  loadPinnedProductionPack,
  parseOwnerFrozenCues,
  type CueParserResult,
  type EligibleCueParserInput,
  type LoadedTerminologyPack,
} from '@ehas2/evidence-extract';
import { ResourceNotFoundError, ValidationError } from '../domainErrors.js';
import { withTenantTransaction } from '../pool.js';
import { PgConsultationRepository } from '../repositories/postgres.js';
import {
  assertTenantContext,
  type TenantContext,
  type TransactionContext,
} from '../tenantContext.js';
import { assertUuid, hashPayload } from '../validation.js';
import { lockChiefComplaintCueSource } from './cueSourceLock.js';

const consultations = new PgConsultationRepository();

const CLOSED_INPUT_KEYS = new Set(['consultationId']);
const PARSER_MAX_UTF16 = 2000;
const SOURCE_CHANNEL = 'DOCTOR_DECLARED' as const;
const SOURCE_FIELD = 'CHIEF_COMPLAINT' as const;
const PARSER_AUTHORITY_SCOPE = 'TERMINOLOGY_CUE_MATCH_ONLY' as const;
const PARSER_VERSION_BINDING = 'f3d2b-cue-parser-v1' as const;

const PARSER_FAIL_CODES = new Set([
  'UNTRUSTED_INPUT',
  'MALFORMED_UNICODE',
  'INPUT_TOO_LARGE',
  'PACK_UNAVAILABLE',
  'PARSER_TIMEOUT',
  'SOURCE_LOCATOR_STORAGE_FORBIDDEN',
]);

export type ParseDoctorDeclaredChiefComplaintCuesInput = {
  readonly consultationId: string;
};

export type DoctorDeclaredChiefComplaintCueAdapterResult = {
  readonly organizationId: string;
  readonly clinicId: string;
  readonly patientId: string;
  readonly consultationId: string;
  readonly sourceChannel: typeof SOURCE_CHANNEL;
  readonly sourceField: typeof SOURCE_FIELD;
  readonly sourceIdentityFingerprint: string;
  readonly parser: CueParserResult;
};

function assertClosedSelectorInput(input: ParseDoctorDeclaredChiefComplaintCuesInput): void {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('UNTRUSTED_INPUT');
  }
  for (const key of Object.keys(input)) {
    if (!CLOSED_INPUT_KEYS.has(key)) {
      throw new ValidationError('UNTRUSTED_INPUT');
    }
  }
  if (typeof input.consultationId !== 'string') {
    throw new ValidationError('UNTRUSTED_INPUT');
  }
  assertUuid(input.consultationId, 'consultationId');
}

function assertCaseOwner(tenant: TenantContext, doctorUserId: string): void {
  if (tenant.actorRole === 'ClinicAdmin') return;
  if (tenant.actorRole === 'Doctor' && tenant.actorId === doctorUserId) return;
  throw new ResourceNotFoundError();
}

function sha256Utf8(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function bindDoctorDeclaredChiefComplaintSourceIdentity(input: {
  organizationId: string;
  clinicId: string;
  patientId: string;
  consultationId: string;
  exactPersistedText: string;
  packId: string;
  packVersion: string;
  packContentChecksum: string;
}): string {
  return hashPayload({
    v: 1,
    organizationId: input.organizationId,
    clinicId: input.clinicId,
    patientId: input.patientId,
    consultationId: input.consultationId,
    sourceChannel: SOURCE_CHANNEL,
    sourceField: SOURCE_FIELD,
    contentSha256: sha256Utf8(input.exactPersistedText),
    parserVersion: PARSER_VERSION_BINDING,
    parserAuthorityScope: PARSER_AUTHORITY_SCOPE,
    packId: input.packId,
    packVersion: input.packVersion,
    packContentChecksum: input.packContentChecksum,
  });
}

function loadPinnedPackOrThrow(): LoadedTerminologyPack {
  try {
    return loadPinnedProductionPack();
  } catch {
    throw new ValidationError('PACK_UNAVAILABLE');
  }
}

function mapParserThrow(err: unknown): never {
  const code =
    err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
  if (PARSER_FAIL_CODES.has(code)) {
    throw new ValidationError(code);
  }
  throw new ValidationError('PARSER_UNAVAILABLE');
}

export class CueEligibleSourceService {
  /**
   * Caller must already hold the shared chief-complaint cue source lock.
   */
  async parseDoctorDeclaredChiefComplaintCuesLocked(
    tenant: TenantContext,
    tx: TransactionContext,
    consultationId: string,
    pack: LoadedTerminologyPack,
  ): Promise<DoctorDeclaredChiefComplaintCueAdapterResult> {
    const row = await consultations.findById(tenant, tx, consultationId);
    if (!row) throw new ResourceNotFoundError();
    assertCaseOwner(tenant, row.doctorUserId);
    if (
      row.organizationId !== tenant.organizationId ||
      row.clinicId !== tenant.clinicId ||
      row.id !== consultationId
    ) {
      throw new ValidationError('SOURCE_MUTATED');
    }
    if (!row.patientId) throw new ResourceNotFoundError();

    const persisted = row.chiefComplaintText;
    if (persisted == null || persisted.trim() === '') {
      throw new ValidationError('SOURCE_INELIGIBLE');
    }
    if (persisted.length > PARSER_MAX_UTF16) {
      throw new ValidationError('INPUT_TOO_LARGE');
    }

    const sourceIdentityFingerprint = bindDoctorDeclaredChiefComplaintSourceIdentity({
      organizationId: row.organizationId,
      clinicId: row.clinicId,
      patientId: row.patientId,
      consultationId: row.id,
      exactPersistedText: persisted,
      packId: pack.packId,
      packVersion: pack.packVersion,
      packContentChecksum: pack.contentChecksum,
    });

    const eligibleInput: EligibleCueParserInput = {
      sourceIdentityFingerprint,
      sourceChannel: SOURCE_CHANNEL,
      sourceField: SOURCE_FIELD,
      eligibleText: persisted,
      sourceLocator: null,
      organizationId: row.organizationId,
      clinicId: row.clinicId,
      patientId: row.patientId,
      consultationId: row.id,
    };

    let parser: CueParserResult;
    try {
      parser = parseOwnerFrozenCues(eligibleInput, pack);
    } catch (err) {
      mapParserThrow(err);
    }

    return {
      organizationId: row.organizationId,
      clinicId: row.clinicId,
      patientId: row.patientId,
      consultationId: row.id,
      sourceChannel: SOURCE_CHANNEL,
      sourceField: SOURCE_FIELD,
      sourceIdentityFingerprint,
      parser,
    };
  }

  async parseDoctorDeclaredChiefComplaintCues(
    tenant: TenantContext,
    input: ParseDoctorDeclaredChiefComplaintCuesInput,
    env: Record<string, string | undefined> = process.env,
  ): Promise<DoctorDeclaredChiefComplaintCueAdapterResult> {
    assertTenantContext(tenant);
    assertUuid(tenant.organizationId, 'organizationId');
    assertUuid(tenant.clinicId, 'clinicId');
    assertUuid(tenant.actorId, 'actorId');
    assertClosedSelectorInput(input);
    const pack = loadPinnedPackOrThrow();

    return withTenantTransaction(
      tenant,
      async (tx) => {
        await lockChiefComplaintCueSource(tx, tenant, input.consultationId);
        return this.parseDoctorDeclaredChiefComplaintCuesLocked(
          tenant,
          tx,
          input.consultationId,
          pack,
        );
      },
      env,
    );
  }
}

export const cueEligibleSourceService = new CueEligibleSourceService();
