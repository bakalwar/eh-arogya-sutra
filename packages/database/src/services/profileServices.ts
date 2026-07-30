import {
  assertClinicAdminRole,
  assertProfileAccessContext,
  type TenantContext,
} from '../tenantContext.js';
import { withTenantTransaction } from '../pool.js';
import { PgAuditEventRepository } from '../repositories/postgres.js';
import {
  PgClinicProfileRepository,
  PgDoctorProfileRepository,
  buildPrescriberIdentitySnapshot,
} from '../repositories/profiles.js';
import {
  AccessDeniedError,
  ConflictError,
  ResourceNotFoundError,
  ValidationError,
} from '../domainErrors.js';
import {
  assertCountryCode,
  assertDayOfWeek,
  assertDisplayOrder,
  assertLanguageCode,
  assertOptionalBoundedText,
  assertOptionalEmail,
  assertOptionalIsoDate,
  assertOptionalPhone,
  assertOptionalTime,
  assertOptionalYear,
  assertPostalCode,
  assertRegistrationDates,
  assertRequiredBoundedText,
  assertTimezone,
  assertUuid,
} from '../validation.js';
import { sanitizeDatabaseError } from '../errors.js';
import type {
  ClinicHoursRecord,
  ClinicPrescriptionDisplaySettingsRecord,
  ClinicProfileRecord,
  DoctorProfessionalProfileRecord,
  DoctorQualificationRecord,
  DoctorRegistrationRecord,
  PrescriberIdentitySnapshot,
} from '../repositories/types.js';

const doctors = new PgDoctorProfileRepository();
const clinics = new PgClinicProfileRepository();
const audit = new PgAuditEventRepository();

function rethrowDomainOrSanitize(err: unknown): never {
  if (
    err instanceof ResourceNotFoundError ||
    err instanceof ValidationError ||
    err instanceof AccessDeniedError ||
    err instanceof ConflictError
  ) {
    throw err;
  }
  const safe = sanitizeDatabaseError(err);
  const wrapped = new Error(safe.message);
  (wrapped as Error & { code: string }).code = safe.code;
  throw wrapped;
}

function rejectProtectedDoctorFields(raw: Record<string, unknown>): void {
  for (const key of [
    'userId',
    'id',
    'organizationId',
    'clinicId',
    'verificationClaimed',
    'createdByActorId',
  ]) {
    if (Object.prototype.hasOwnProperty.call(raw, key)) {
      throw new ValidationError(`Protected field not allowed: ${key}`);
    }
  }
}

export class DoctorProfileService {
  async getOwn(
    tenant: TenantContext,
    env: Record<string, string | undefined> = process.env,
  ): Promise<{
    profile: DoctorProfessionalProfileRecord;
    qualifications: DoctorQualificationRecord[];
    registrations: DoctorRegistrationRecord[];
  }> {
    assertProfileAccessContext(tenant);
    try {
      return await withTenantTransaction(
        tenant,
        async (tx) => {
          const profile = await doctors.findOwn(tenant, tx);
          if (!profile) throw new ResourceNotFoundError();
          return {
            profile,
            qualifications: await doctors.listQualifications(tenant, tx),
            registrations: await doctors.listRegistrations(tenant, tx),
          };
        },
        env,
      );
    } catch (err) {
      rethrowDomainOrSanitize(err);
    }
  }

  async upsertOwn(
    tenant: TenantContext,
    raw: Record<string, unknown>,
    env: Record<string, string | undefined> = process.env,
  ): Promise<DoctorProfessionalProfileRecord> {
    assertProfileAccessContext(tenant);
    rejectProtectedDoctorFields(raw);
    const input = {
      legalName: assertRequiredBoundedText(String(raw.legalName ?? ''), 'legalName', 200),
      displayName: assertRequiredBoundedText(String(raw.displayName ?? ''), 'displayName', 200),
      prescriptionName: assertRequiredBoundedText(
        String(raw.prescriptionName ?? ''),
        'prescriptionName',
        200,
      ),
      primaryPhone: assertOptionalPhone(
        raw.primaryPhone == null ? null : String(raw.primaryPhone),
        'primaryPhone',
      ),
      alternatePhone: assertOptionalPhone(
        raw.alternatePhone == null ? null : String(raw.alternatePhone),
        'alternatePhone',
      ),
      professionalEmail: assertOptionalEmail(
        raw.professionalEmail == null ? null : String(raw.professionalEmail),
      ),
      specialization: assertOptionalBoundedText(
        raw.specialization == null ? null : String(raw.specialization),
        'specialization',
        120,
      ),
      yearsOfExperience: assertOptionalYear(
        raw.yearsOfExperience == null ? null : Number(raw.yearsOfExperience),
        'yearsOfExperience',
        0,
        80,
      ),
      professionalBio: assertOptionalBoundedText(
        raw.professionalBio == null ? null : String(raw.professionalBio),
        'professionalBio',
        2000,
      ),
      preferredLanguage: assertLanguageCode(String(raw.preferredLanguage ?? 'en')),
      timezone: assertTimezone(String(raw.timezone ?? 'Asia/Kolkata')),
      profileStatus: (['DRAFT', 'ACTIVE', 'INACTIVE'].includes(String(raw.profileStatus))
        ? String(raw.profileStatus)
        : 'DRAFT') as DoctorProfessionalProfileRecord['profileStatus'],
    };
    try {
      return await withTenantTransaction(
        tenant,
        async (tx) => {
          const saved = await doctors.upsert(tenant, tx, input);
          await audit.append(tx, {
            organizationId: tenant.organizationId,
            clinicId: tenant.clinicId,
            actorId: tenant.actorId,
            actorRole: tenant.actorRole,
            eventType: 'doctor_profile_upserted',
            resourceType: 'doctor_professional_profile',
            resourceId: saved.userId,
            outcome: 'SUCCESS',
            metadata: { profileStatus: saved.profileStatus },
          });
          return saved;
        },
        env,
      );
    } catch (err) {
      rethrowDomainOrSanitize(err);
    }
  }

  async addQualification(
    tenant: TenantContext,
    raw: Record<string, unknown>,
    env: Record<string, string | undefined> = process.env,
  ): Promise<DoctorQualificationRecord> {
    assertProfileAccessContext(tenant);
    const input = {
      degreeTitle: assertRequiredBoundedText(String(raw.degreeTitle ?? ''), 'degreeTitle', 200),
      institution: assertOptionalBoundedText(
        raw.institution == null ? null : String(raw.institution),
        'institution',
        200,
      ),
      awardingAuthority: assertOptionalBoundedText(
        raw.awardingAuthority == null ? null : String(raw.awardingAuthority),
        'awardingAuthority',
        200,
      ),
      completionYear: assertOptionalYear(
        raw.completionYear == null ? null : Number(raw.completionYear),
        'completionYear',
        1950,
        2100,
      ),
      displayOrder: assertDisplayOrder(
        raw.displayOrder == null ? undefined : Number(raw.displayOrder),
      ),
    };
    try {
      return await withTenantTransaction(
        tenant,
        async (tx) => {
          const created = await doctors.addQualification(tenant, tx, input);
          await audit.append(tx, {
            organizationId: tenant.organizationId,
            clinicId: tenant.clinicId,
            actorId: tenant.actorId,
            actorRole: tenant.actorRole,
            eventType: 'doctor_qualification_added',
            resourceType: 'doctor_qualification',
            resourceId: created.id,
            outcome: 'SUCCESS',
            metadata: { displayOrder: created.displayOrder },
          });
          return created;
        },
        env,
      );
    } catch (err) {
      rethrowDomainOrSanitize(err);
    }
  }

  async deactivateQualification(
    tenant: TenantContext,
    qualificationId: string,
    env: Record<string, string | undefined> = process.env,
  ): Promise<DoctorQualificationRecord> {
    assertProfileAccessContext(tenant);
    assertUuid(qualificationId, 'qualificationId');
    try {
      return await withTenantTransaction(
        tenant,
        async (tx) => doctors.deactivateQualification(tenant, tx, qualificationId),
        env,
      );
    } catch (err) {
      rethrowDomainOrSanitize(err);
    }
  }

  async addRegistration(
    tenant: TenantContext,
    raw: Record<string, unknown>,
    env: Record<string, string | undefined> = process.env,
  ): Promise<DoctorRegistrationRecord> {
    assertProfileAccessContext(tenant);
    if (raw.verificationClaimed === true) {
      throw new ValidationError('verificationClaimed cannot be set true in this phase');
    }
    const issuedOn = assertOptionalIsoDate(
      raw.issuedOn == null ? null : String(raw.issuedOn),
      'issuedOn',
    );
    const expiresOn = assertOptionalIsoDate(
      raw.expiresOn == null ? null : String(raw.expiresOn),
      'expiresOn',
    );
    assertRegistrationDates(issuedOn, expiresOn);
    const input = {
      registrationNumber: assertRequiredBoundedText(
        String(raw.registrationNumber ?? ''),
        'registrationNumber',
        80,
      ),
      registrationAuthority: assertRequiredBoundedText(
        String(raw.registrationAuthority ?? ''),
        'registrationAuthority',
        200,
      ),
      registrationRegion: assertOptionalBoundedText(
        raw.registrationRegion == null ? null : String(raw.registrationRegion),
        'registrationRegion',
        120,
      ),
      issuedOn,
      expiresOn,
      displayOrder: assertDisplayOrder(
        raw.displayOrder == null ? undefined : Number(raw.displayOrder),
      ),
    };
    try {
      return await withTenantTransaction(
        tenant,
        async (tx) => {
          const created = await doctors.addRegistration(tenant, tx, input);
          await audit.append(tx, {
            organizationId: tenant.organizationId,
            clinicId: tenant.clinicId,
            actorId: tenant.actorId,
            actorRole: tenant.actorRole,
            eventType: 'doctor_registration_added',
            resourceType: 'doctor_registration',
            resourceId: created.id,
            outcome: 'SUCCESS',
            metadata: { displayOrder: created.displayOrder },
          });
          return created;
        },
        env,
      );
    } catch (err) {
      rethrowDomainOrSanitize(err);
    }
  }

  async captureIdentitySnapshot(
    tenant: TenantContext,
    env: Record<string, string | undefined> = process.env,
  ): Promise<PrescriberIdentitySnapshot> {
    assertProfileAccessContext(tenant);
    try {
      return await withTenantTransaction(
        tenant,
        async (tx) => buildPrescriberIdentitySnapshot(tenant, tx),
        env,
      );
    } catch (err) {
      rethrowDomainOrSanitize(err);
    }
  }
}

export class ClinicProfileService {
  async getCurrent(
    tenant: TenantContext,
    env: Record<string, string | undefined> = process.env,
  ): Promise<{
    clinic: ClinicProfileRecord;
    hours: ClinicHoursRecord[];
    displaySettings: ClinicPrescriptionDisplaySettingsRecord | null;
  }> {
    assertProfileAccessContext(tenant);
    try {
      return await withTenantTransaction(
        tenant,
        async (tx) => {
          const clinic = await clinics.findCurrent(tenant, tx);
          if (!clinic) throw new ResourceNotFoundError();
          return {
            clinic,
            hours: await clinics.listHours(tenant, tx),
            displaySettings: await clinics.getDisplaySettings(tenant, tx),
          };
        },
        env,
      );
    } catch (err) {
      rethrowDomainOrSanitize(err);
    }
  }

  async updateCurrent(
    tenant: TenantContext,
    raw: Record<string, unknown>,
    env: Record<string, string | undefined> = process.env,
  ): Promise<ClinicProfileRecord> {
    assertClinicAdminRole(tenant);
    for (const key of ['id', 'organizationId', 'publicId', 'clinicId']) {
      if (Object.prototype.hasOwnProperty.call(raw, key)) {
        throw new ValidationError(`Protected field not allowed: ${key}`);
      }
    }
    const patch: Parameters<PgClinicProfileRepository['updateAllowed']>[2] = {};
    if (raw.displayName !== undefined) {
      patch.displayName = assertRequiredBoundedText(String(raw.displayName), 'displayName', 200);
    }
    if (raw.legalName !== undefined) {
      patch.legalName = assertOptionalBoundedText(
        raw.legalName == null ? null : String(raw.legalName),
        'legalName',
        200,
      );
    }
    if (raw.clinicCode !== undefined) {
      patch.clinicCode = assertOptionalBoundedText(
        raw.clinicCode == null ? null : String(raw.clinicCode),
        'clinicCode',
        64,
      );
    }
    if (raw.phone !== undefined) {
      patch.phone = assertOptionalPhone(raw.phone == null ? null : String(raw.phone), 'phone');
    }
    if (raw.whatsappContact !== undefined) {
      patch.whatsappContact = assertOptionalPhone(
        raw.whatsappContact == null ? null : String(raw.whatsappContact),
        'whatsappContact',
      );
    }
    if (raw.email !== undefined) {
      patch.email = assertOptionalEmail(raw.email == null ? null : String(raw.email));
    }
    if (raw.website !== undefined) {
      patch.website = assertOptionalBoundedText(
        raw.website == null ? null : String(raw.website),
        'website',
        200,
      );
    }
    if (raw.addressLine1 !== undefined) {
      patch.addressLine1 = assertOptionalBoundedText(
        raw.addressLine1 == null ? null : String(raw.addressLine1),
        'addressLine1',
        200,
      );
    }
    if (raw.addressLine2 !== undefined) {
      patch.addressLine2 = assertOptionalBoundedText(
        raw.addressLine2 == null ? null : String(raw.addressLine2),
        'addressLine2',
        200,
      );
    }
    if (raw.landmark !== undefined) {
      patch.landmark = assertOptionalBoundedText(
        raw.landmark == null ? null : String(raw.landmark),
        'landmark',
        200,
      );
    }
    if (raw.city !== undefined) {
      patch.city = assertOptionalBoundedText(
        raw.city == null ? null : String(raw.city),
        'city',
        120,
      );
    }
    if (raw.district !== undefined) {
      patch.district = assertOptionalBoundedText(
        raw.district == null ? null : String(raw.district),
        'district',
        120,
      );
    }
    if (raw.state !== undefined) {
      patch.state = assertOptionalBoundedText(
        raw.state == null ? null : String(raw.state),
        'state',
        120,
      );
    }
    if (raw.postalCode !== undefined) {
      patch.postalCode = assertPostalCode(raw.postalCode == null ? null : String(raw.postalCode));
    }
    if (raw.country !== undefined) patch.country = assertCountryCode(String(raw.country));
    if (raw.preferredLanguage !== undefined) {
      patch.preferredLanguage = assertLanguageCode(String(raw.preferredLanguage));
    }
    if (raw.timezone !== undefined) patch.timezone = assertTimezone(String(raw.timezone));
    if (raw.status !== undefined) {
      if (raw.status !== 'ACTIVE' && raw.status !== 'INACTIVE') {
        throw new ValidationError('Invalid status');
      }
      patch.status = raw.status;
    }
    try {
      return await withTenantTransaction(
        tenant,
        async (tx) => {
          const updated = await clinics.updateAllowed(tenant, tx, patch);
          await audit.append(tx, {
            organizationId: tenant.organizationId,
            clinicId: tenant.clinicId,
            actorId: tenant.actorId,
            actorRole: tenant.actorRole,
            eventType: 'clinic_profile_updated',
            resourceType: 'clinic',
            resourceId: updated.id,
            outcome: 'SUCCESS',
            metadata: { status: updated.status },
          });
          return updated;
        },
        env,
      );
    } catch (err) {
      rethrowDomainOrSanitize(err);
    }
  }

  async replaceHours(
    tenant: TenantContext,
    windows: Array<Record<string, unknown>>,
    env: Record<string, string | undefined> = process.env,
  ): Promise<ClinicHoursRecord[]> {
    assertClinicAdminRole(tenant);
    const validated = windows.map((w, index) => {
      const isClosed = Boolean(w.isClosed);
      const openTime = assertOptionalTime(
        w.openTime == null ? null : String(w.openTime),
        'openTime',
      );
      const closeTime = assertOptionalTime(
        w.closeTime == null ? null : String(w.closeTime),
        'closeTime',
      );
      if (isClosed && (openTime || closeTime)) {
        throw new ValidationError('Closed day cannot include open/close times');
      }
      if (!isClosed && (!openTime || !closeTime)) {
        throw new ValidationError('Open day requires openTime and closeTime');
      }
      if (!isClosed && openTime && closeTime && closeTime <= openTime) {
        throw new ValidationError('closeTime must be after openTime');
      }
      return {
        dayOfWeek: assertDayOfWeek(Number(w.dayOfWeek)),
        isClosed,
        openTime,
        closeTime,
        displayOrder: assertDisplayOrder(w.displayOrder == null ? index : Number(w.displayOrder)),
      };
    });
    try {
      return await withTenantTransaction(
        tenant,
        async (tx) => {
          const hours = await clinics.replaceHours(tenant, tx, validated);
          await audit.append(tx, {
            organizationId: tenant.organizationId,
            clinicId: tenant.clinicId,
            actorId: tenant.actorId,
            actorRole: tenant.actorRole,
            eventType: 'clinic_hours_replaced',
            resourceType: 'clinic',
            resourceId: tenant.clinicId,
            outcome: 'SUCCESS',
            metadata: { windowCount: hours.length },
          });
          return hours;
        },
        env,
      );
    } catch (err) {
      rethrowDomainOrSanitize(err);
    }
  }

  async upsertDisplaySettings(
    tenant: TenantContext,
    raw: Record<string, unknown>,
    env: Record<string, string | undefined> = process.env,
  ): Promise<ClinicPrescriptionDisplaySettingsRecord> {
    assertClinicAdminRole(tenant);
    for (const banned of [
      'medicines',
      'formulaCount',
      'potency',
      'polarity',
      'electricity',
      'tablets',
      'externalApplications',
      'diseaseMapping',
    ]) {
      if (Object.prototype.hasOwnProperty.call(raw, banned)) {
        throw new ValidationError(`Clinical setting not allowed: ${banned}`);
      }
    }
    const input = {
      showClinicName: raw.showClinicName !== false,
      showDoctorName: raw.showDoctorName !== false,
      showQualifications: raw.showQualifications !== false,
      showRegistration: raw.showRegistration !== false,
      showClinicContact: raw.showClinicContact !== false,
      showAddress: raw.showAddress !== false,
      headerText: assertOptionalBoundedText(
        raw.headerText == null ? null : String(raw.headerText),
        'headerText',
        500,
      ),
      footerText: assertOptionalBoundedText(
        raw.footerText == null ? null : String(raw.footerText),
        'footerText',
        500,
      ),
    };
    try {
      return await withTenantTransaction(
        tenant,
        async (tx) => clinics.upsertDisplaySettings(tenant, tx, input),
        env,
      );
    } catch (err) {
      rethrowDomainOrSanitize(err);
    }
  }
}

export class MembershipQueryService {
  async listAuthorizedForActor(
    tenant: TenantContext,
    env: Record<string, string | undefined> = process.env,
  ) {
    assertProfileAccessContext(tenant);
    const { PgMembershipRepository } = await import('../repositories/postgres.js');
    const memberships = new PgMembershipRepository();
    try {
      return await withTenantTransaction(
        tenant,
        async (tx) => {
          const mine = await memberships.listByActor(tx, tenant.actorId);
          return mine.filter(
            (m) =>
              m.organizationId === tenant.organizationId &&
              (m.clinicId == null || m.clinicId === tenant.clinicId),
          );
        },
        env,
      );
    } catch (err) {
      rethrowDomainOrSanitize(err);
    }
  }

  async denyCrossTenantCreate(
    tenant: TenantContext,
    targetOrganizationId: string,
    targetClinicId: string,
  ): Promise<never> {
    assertProfileAccessContext(tenant);
    if (targetOrganizationId !== tenant.organizationId || targetClinicId !== tenant.clinicId) {
      throw new AccessDeniedError('Cross-tenant membership creation denied');
    }
    throw new AccessDeniedError('Self-service membership creation denied');
  }
}

export const doctorProfileService = new DoctorProfileService();
export const clinicProfileService = new ClinicProfileService();
export const membershipQueryService = new MembershipQueryService();
