import {
  assertProfileAccessContext,
  type TenantContext,
  type TransactionContext,
} from '../tenantContext.js';
import { ConflictError, ResourceNotFoundError } from '../domainErrors.js';
import type {
  ClinicHoursRecord,
  ClinicPrescriptionDisplaySettingsRecord,
  ClinicProfileRecord,
  DoctorProfessionalProfileRecord,
  DoctorQualificationRecord,
  DoctorRegistrationRecord,
  PrescriberIdentitySnapshot,
} from './types.js';

function mapDoctorProfile(row: Record<string, unknown>): DoctorProfessionalProfileRecord {
  return {
    userId: String(row.user_id),
    legalName: String(row.legal_name),
    displayName: String(row.display_name),
    prescriptionName: String(row.prescription_name),
    primaryPhone: row.primary_phone == null ? null : String(row.primary_phone),
    alternatePhone: row.alternate_phone == null ? null : String(row.alternate_phone),
    professionalEmail: row.professional_email == null ? null : String(row.professional_email),
    specialization: row.specialization == null ? null : String(row.specialization),
    yearsOfExperience: row.years_of_experience == null ? null : Number(row.years_of_experience),
    professionalBio: row.professional_bio == null ? null : String(row.professional_bio),
    preferredLanguage: String(row.preferred_language),
    timezone: String(row.timezone),
    profileStatus: String(row.profile_status) as DoctorProfessionalProfileRecord['profileStatus'],
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapQualification(row: Record<string, unknown>): DoctorQualificationRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    degreeTitle: String(row.degree_title),
    institution: row.institution == null ? null : String(row.institution),
    awardingAuthority: row.awarding_authority == null ? null : String(row.awarding_authority),
    completionYear: row.completion_year == null ? null : Number(row.completion_year),
    displayOrder: Number(row.display_order),
    status: String(row.status) as DoctorQualificationRecord['status'],
  };
}

function mapRegistration(row: Record<string, unknown>): DoctorRegistrationRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    registrationNumber: String(row.registration_number),
    registrationAuthority: String(row.registration_authority),
    registrationRegion: row.registration_region == null ? null : String(row.registration_region),
    issuedOn:
      row.issued_on == null
        ? null
        : row.issued_on instanceof Date
          ? row.issued_on.toISOString().slice(0, 10)
          : String(row.issued_on).slice(0, 10),
    expiresOn:
      row.expires_on == null
        ? null
        : row.expires_on instanceof Date
          ? row.expires_on.toISOString().slice(0, 10)
          : String(row.expires_on).slice(0, 10),
    status: String(row.status) as DoctorRegistrationRecord['status'],
    displayOrder: Number(row.display_order),
    verificationClaimed: false,
  };
}

function mapClinic(row: Record<string, unknown>): ClinicProfileRecord {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    publicId: String(row.public_id),
    displayName: String(row.name),
    legalName: row.legal_name == null ? null : String(row.legal_name),
    clinicCode: row.clinic_code == null ? null : String(row.clinic_code),
    phone: row.phone == null ? null : String(row.phone),
    whatsappContact: row.whatsapp_contact == null ? null : String(row.whatsapp_contact),
    email: row.email == null ? null : String(row.email),
    website: row.website == null ? null : String(row.website),
    addressLine1: row.address_line1 == null ? null : String(row.address_line1),
    addressLine2: row.address_line2 == null ? null : String(row.address_line2),
    landmark: row.landmark == null ? null : String(row.landmark),
    city: row.city == null ? null : String(row.city),
    district: row.district == null ? null : String(row.district),
    state: row.state == null ? null : String(row.state),
    postalCode: row.postal_code == null ? null : String(row.postal_code),
    country: String(row.country ?? 'IN'),
    preferredLanguage: String(row.preferred_language ?? 'en'),
    timezone: String(row.timezone),
    status: String(row.status),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export class PgDoctorProfileRepository {
  async upsert(
    tenant: TenantContext,
    tx: TransactionContext,
    input: {
      legalName: string;
      displayName: string;
      prescriptionName: string;
      primaryPhone?: string | null;
      alternatePhone?: string | null;
      professionalEmail?: string | null;
      specialization?: string | null;
      yearsOfExperience?: number | null;
      professionalBio?: string | null;
      preferredLanguage: string;
      timezone: string;
      profileStatus: DoctorProfessionalProfileRecord['profileStatus'];
    },
  ): Promise<DoctorProfessionalProfileRecord> {
    assertProfileAccessContext(tenant);
    const r = await tx.query(
      `INSERT INTO doctor_professional_profiles (
         user_id, legal_name, display_name, prescription_name, primary_phone, alternate_phone,
         professional_email, specialization, years_of_experience, professional_bio,
         preferred_language, timezone, profile_status, created_by_actor_id, updated_by_actor_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$1,$1)
       ON CONFLICT (user_id) DO UPDATE SET
         legal_name = EXCLUDED.legal_name,
         display_name = EXCLUDED.display_name,
         prescription_name = EXCLUDED.prescription_name,
         primary_phone = EXCLUDED.primary_phone,
         alternate_phone = EXCLUDED.alternate_phone,
         professional_email = EXCLUDED.professional_email,
         specialization = EXCLUDED.specialization,
         years_of_experience = EXCLUDED.years_of_experience,
         professional_bio = EXCLUDED.professional_bio,
         preferred_language = EXCLUDED.preferred_language,
         timezone = EXCLUDED.timezone,
         profile_status = EXCLUDED.profile_status,
         updated_at = now(),
         updated_by_actor_id = EXCLUDED.updated_by_actor_id
       RETURNING *`,
      [
        tenant.actorId,
        input.legalName,
        input.displayName,
        input.prescriptionName,
        input.primaryPhone ?? null,
        input.alternatePhone ?? null,
        input.professionalEmail ?? null,
        input.specialization ?? null,
        input.yearsOfExperience ?? null,
        input.professionalBio ?? null,
        input.preferredLanguage,
        input.timezone,
        input.profileStatus,
      ],
    );
    return mapDoctorProfile(r.rows[0] as Record<string, unknown>);
  }

  async findOwn(
    tenant: TenantContext,
    tx: TransactionContext,
  ): Promise<DoctorProfessionalProfileRecord | null> {
    assertProfileAccessContext(tenant);
    const r = await tx.query(`SELECT * FROM doctor_professional_profiles WHERE user_id = $1`, [
      tenant.actorId,
    ]);
    return r.rows[0] ? mapDoctorProfile(r.rows[0] as Record<string, unknown>) : null;
  }

  async listQualifications(
    tenant: TenantContext,
    tx: TransactionContext,
  ): Promise<DoctorQualificationRecord[]> {
    assertProfileAccessContext(tenant);
    const r = await tx.query(
      `SELECT * FROM doctor_qualifications
       WHERE user_id = $1
       ORDER BY display_order ASC, id ASC`,
      [tenant.actorId],
    );
    return r.rows.map((row) => mapQualification(row as Record<string, unknown>));
  }

  async addQualification(
    tenant: TenantContext,
    tx: TransactionContext,
    input: {
      degreeTitle: string;
      institution?: string | null;
      awardingAuthority?: string | null;
      completionYear?: number | null;
      displayOrder: number;
    },
  ): Promise<DoctorQualificationRecord> {
    assertProfileAccessContext(tenant);
    const r = await tx.query(
      `INSERT INTO doctor_qualifications (
         user_id, degree_title, institution, awarding_authority, completion_year,
         display_order, created_by_actor_id, updated_by_actor_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$1,$1) RETURNING *`,
      [
        tenant.actorId,
        input.degreeTitle,
        input.institution ?? null,
        input.awardingAuthority ?? null,
        input.completionYear ?? null,
        input.displayOrder,
      ],
    );
    return mapQualification(r.rows[0] as Record<string, unknown>);
  }

  async deactivateQualification(
    tenant: TenantContext,
    tx: TransactionContext,
    qualificationId: string,
  ): Promise<DoctorQualificationRecord> {
    assertProfileAccessContext(tenant);
    const r = await tx.query(
      `UPDATE doctor_qualifications
       SET status = 'INACTIVE', updated_at = now(), updated_by_actor_id = $2
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [qualificationId, tenant.actorId],
    );
    if (!r.rows[0]) throw new ResourceNotFoundError();
    return mapQualification(r.rows[0] as Record<string, unknown>);
  }

  async updateQualification(
    tenant: TenantContext,
    tx: TransactionContext,
    qualificationId: string,
    input: {
      degreeTitle?: string;
      institution?: string | null;
      awardingAuthority?: string | null;
      completionYear?: number | null;
      displayOrder?: number;
      status?: DoctorQualificationRecord['status'];
    },
  ): Promise<DoctorQualificationRecord> {
    assertProfileAccessContext(tenant);
    const existing = await tx.query(
      `SELECT * FROM doctor_qualifications WHERE id = $1 AND user_id = $2`,
      [qualificationId, tenant.actorId],
    );
    if (!existing.rows[0]) throw new ResourceNotFoundError();
    const cur = mapQualification(existing.rows[0] as Record<string, unknown>);
    const r = await tx.query(
      `UPDATE doctor_qualifications SET
         degree_title = $3,
         institution = $4,
         awarding_authority = $5,
         completion_year = $6,
         display_order = $7,
         status = $8,
         updated_at = now(),
         updated_by_actor_id = $2
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        qualificationId,
        tenant.actorId,
        input.degreeTitle ?? cur.degreeTitle,
        input.institution !== undefined ? input.institution : cur.institution,
        input.awardingAuthority !== undefined ? input.awardingAuthority : cur.awardingAuthority,
        input.completionYear !== undefined ? input.completionYear : cur.completionYear,
        input.displayOrder ?? cur.displayOrder,
        input.status ?? cur.status,
      ],
    );
    if (!r.rows[0]) throw new ResourceNotFoundError();
    return mapQualification(r.rows[0] as Record<string, unknown>);
  }

  async listRegistrations(
    tenant: TenantContext,
    tx: TransactionContext,
  ): Promise<DoctorRegistrationRecord[]> {
    assertProfileAccessContext(tenant);
    const r = await tx.query(
      `SELECT * FROM doctor_registrations
       WHERE user_id = $1
       ORDER BY display_order ASC, id ASC`,
      [tenant.actorId],
    );
    return r.rows.map((row) => mapRegistration(row as Record<string, unknown>));
  }

  async addRegistration(
    tenant: TenantContext,
    tx: TransactionContext,
    input: {
      registrationNumber: string;
      registrationAuthority: string;
      registrationRegion?: string | null;
      issuedOn?: string | null;
      expiresOn?: string | null;
      displayOrder: number;
      status?: DoctorRegistrationRecord['status'];
    },
  ): Promise<DoctorRegistrationRecord> {
    assertProfileAccessContext(tenant);
    const r = await tx.query(
      `INSERT INTO doctor_registrations (
         user_id, registration_number, registration_authority, registration_region,
         issued_on, expires_on, status, display_order, verification_claimed,
         created_by_actor_id, updated_by_actor_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,false,$1,$1) RETURNING *`,
      [
        tenant.actorId,
        input.registrationNumber,
        input.registrationAuthority,
        input.registrationRegion ?? null,
        input.issuedOn ?? null,
        input.expiresOn ?? null,
        input.status ?? 'ACTIVE',
        input.displayOrder,
      ],
    );
    return mapRegistration(r.rows[0] as Record<string, unknown>);
  }

  async deactivateRegistration(
    tenant: TenantContext,
    tx: TransactionContext,
    registrationId: string,
  ): Promise<DoctorRegistrationRecord> {
    assertProfileAccessContext(tenant);
    const r = await tx.query(
      `UPDATE doctor_registrations
       SET status = 'INACTIVE', updated_at = now(), updated_by_actor_id = $2
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [registrationId, tenant.actorId],
    );
    if (!r.rows[0]) throw new ResourceNotFoundError();
    return mapRegistration(r.rows[0] as Record<string, unknown>);
  }

  async updateRegistration(
    tenant: TenantContext,
    tx: TransactionContext,
    registrationId: string,
    input: {
      registrationNumber?: string;
      registrationAuthority?: string;
      registrationRegion?: string | null;
      issuedOn?: string | null;
      expiresOn?: string | null;
      displayOrder?: number;
      status?: DoctorRegistrationRecord['status'];
    },
  ): Promise<DoctorRegistrationRecord> {
    assertProfileAccessContext(tenant);
    const existing = await tx.query(
      `SELECT * FROM doctor_registrations WHERE id = $1 AND user_id = $2`,
      [registrationId, tenant.actorId],
    );
    if (!existing.rows[0]) throw new ResourceNotFoundError();
    const cur = mapRegistration(existing.rows[0] as Record<string, unknown>);
    const r = await tx.query(
      `UPDATE doctor_registrations SET
         registration_number = $3,
         registration_authority = $4,
         registration_region = $5,
         issued_on = $6,
         expires_on = $7,
         display_order = $8,
         status = $9,
         verification_claimed = false,
         updated_at = now(),
         updated_by_actor_id = $2
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        registrationId,
        tenant.actorId,
        input.registrationNumber ?? cur.registrationNumber,
        input.registrationAuthority ?? cur.registrationAuthority,
        input.registrationRegion !== undefined ? input.registrationRegion : cur.registrationRegion,
        input.issuedOn !== undefined ? input.issuedOn : cur.issuedOn,
        input.expiresOn !== undefined ? input.expiresOn : cur.expiresOn,
        input.displayOrder ?? cur.displayOrder,
        input.status ?? cur.status,
      ],
    );
    if (!r.rows[0]) throw new ResourceNotFoundError();
    return mapRegistration(r.rows[0] as Record<string, unknown>);
  }
}

export class PgClinicProfileRepository {
  async findCurrent(
    tenant: TenantContext,
    tx: TransactionContext,
  ): Promise<ClinicProfileRecord | null> {
    assertProfileAccessContext(tenant);
    const r = await tx.query(`SELECT * FROM clinics WHERE id = $1 AND organization_id = $2`, [
      tenant.clinicId,
      tenant.organizationId,
    ]);
    return r.rows[0] ? mapClinic(r.rows[0] as Record<string, unknown>) : null;
  }

  async updateAllowed(
    tenant: TenantContext,
    tx: TransactionContext,
    input: {
      displayName?: string;
      legalName?: string | null;
      clinicCode?: string | null;
      phone?: string | null;
      whatsappContact?: string | null;
      email?: string | null;
      website?: string | null;
      addressLine1?: string | null;
      addressLine2?: string | null;
      landmark?: string | null;
      city?: string | null;
      district?: string | null;
      state?: string | null;
      postalCode?: string | null;
      country?: string;
      preferredLanguage?: string;
      timezone?: string;
      status?: 'ACTIVE' | 'INACTIVE';
      expectedUpdatedAt?: string;
    },
  ): Promise<ClinicProfileRecord> {
    assertProfileAccessContext(tenant);
    const current = await this.findCurrent(tenant, tx);
    if (!current) throw new ResourceNotFoundError();
    if (input.expectedUpdatedAt && current.updatedAt !== input.expectedUpdatedAt) {
      throw new ConflictError('Clinic profile was modified by another request');
    }
    const r = await tx.query(
      `UPDATE clinics SET
         name = $3,
         legal_name = $4,
         clinic_code = $5,
         phone = $6,
         whatsapp_contact = $7,
         email = $8,
         website = $9,
         address_line1 = $10,
         address_line2 = $11,
         landmark = $12,
         city = $13,
         district = $14,
         state = $15,
         postal_code = $16,
         country = $17,
         preferred_language = $18,
         timezone = $19,
         status = $20,
         updated_at = now(),
         updated_by_actor_id = $21
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [
        tenant.clinicId,
        tenant.organizationId,
        input.displayName ?? current.displayName,
        input.legalName !== undefined ? input.legalName : current.legalName,
        input.clinicCode !== undefined ? input.clinicCode : current.clinicCode,
        input.phone !== undefined ? input.phone : current.phone,
        input.whatsappContact !== undefined ? input.whatsappContact : current.whatsappContact,
        input.email !== undefined ? input.email : current.email,
        input.website !== undefined ? input.website : current.website,
        input.addressLine1 !== undefined ? input.addressLine1 : current.addressLine1,
        input.addressLine2 !== undefined ? input.addressLine2 : current.addressLine2,
        input.landmark !== undefined ? input.landmark : current.landmark,
        input.city !== undefined ? input.city : current.city,
        input.district !== undefined ? input.district : current.district,
        input.state !== undefined ? input.state : current.state,
        input.postalCode !== undefined ? input.postalCode : current.postalCode,
        input.country ?? current.country,
        input.preferredLanguage ?? current.preferredLanguage,
        input.timezone ?? current.timezone,
        input.status ?? current.status,
        tenant.actorId,
      ],
    );
    if (!r.rows[0]) throw new ConflictError('Clinic update failed');
    return mapClinic(r.rows[0] as Record<string, unknown>);
  }

  async replaceHours(
    tenant: TenantContext,
    tx: TransactionContext,
    windows: Array<{
      dayOfWeek: number;
      isClosed: boolean;
      openTime: string | null;
      closeTime: string | null;
      displayOrder: number;
    }>,
  ): Promise<ClinicHoursRecord[]> {
    assertProfileAccessContext(tenant);
    await tx.query(
      `DELETE FROM clinic_operating_hours WHERE organization_id = $1 AND clinic_id = $2`,
      [tenant.organizationId, tenant.clinicId],
    );
    const out: ClinicHoursRecord[] = [];
    for (const w of windows) {
      const r = await tx.query(
        `INSERT INTO clinic_operating_hours (
           organization_id, clinic_id, day_of_week, is_closed, open_time, close_time,
           display_order, created_by_actor_id, updated_by_actor_id
         ) VALUES ($1,$2,$3,$4,$5::time,$6::time,$7,$8,$8) RETURNING *`,
        [
          tenant.organizationId,
          tenant.clinicId,
          w.dayOfWeek,
          w.isClosed,
          w.openTime,
          w.closeTime,
          w.displayOrder,
          tenant.actorId,
        ],
      );
      const row = r.rows[0] as Record<string, unknown>;
      out.push({
        id: String(row.id),
        organizationId: String(row.organization_id),
        clinicId: String(row.clinic_id),
        dayOfWeek: Number(row.day_of_week),
        isClosed: Boolean(row.is_closed),
        openTime: row.open_time == null ? null : String(row.open_time).slice(0, 5),
        closeTime: row.close_time == null ? null : String(row.close_time).slice(0, 5),
        displayOrder: Number(row.display_order),
      });
    }
    return out;
  }

  async listHours(tenant: TenantContext, tx: TransactionContext): Promise<ClinicHoursRecord[]> {
    assertProfileAccessContext(tenant);
    const r = await tx.query(
      `SELECT * FROM clinic_operating_hours
       WHERE organization_id = $1 AND clinic_id = $2
       ORDER BY day_of_week ASC, display_order ASC, id ASC`,
      [tenant.organizationId, tenant.clinicId],
    );
    return r.rows.map((row) => {
      const rec = row as Record<string, unknown>;
      return {
        id: String(rec.id),
        organizationId: String(rec.organization_id),
        clinicId: String(rec.clinic_id),
        dayOfWeek: Number(rec.day_of_week),
        isClosed: Boolean(rec.is_closed),
        openTime: rec.open_time == null ? null : String(rec.open_time).slice(0, 5),
        closeTime: rec.close_time == null ? null : String(rec.close_time).slice(0, 5),
        displayOrder: Number(rec.display_order),
      };
    });
  }

  async upsertDisplaySettings(
    tenant: TenantContext,
    tx: TransactionContext,
    input: {
      showClinicName: boolean;
      showDoctorName: boolean;
      showQualifications: boolean;
      showRegistration: boolean;
      showClinicContact: boolean;
      showAddress: boolean;
      headerText?: string | null;
      footerText?: string | null;
    },
  ): Promise<ClinicPrescriptionDisplaySettingsRecord> {
    assertProfileAccessContext(tenant);
    const r = await tx.query(
      `INSERT INTO clinic_prescription_display_settings (
         clinic_id, organization_id, show_clinic_name, show_doctor_name, show_qualifications,
         show_registration, show_clinic_contact, show_address, header_text, footer_text,
         updated_by_actor_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (clinic_id) DO UPDATE SET
         show_clinic_name = EXCLUDED.show_clinic_name,
         show_doctor_name = EXCLUDED.show_doctor_name,
         show_qualifications = EXCLUDED.show_qualifications,
         show_registration = EXCLUDED.show_registration,
         show_clinic_contact = EXCLUDED.show_clinic_contact,
         show_address = EXCLUDED.show_address,
         header_text = EXCLUDED.header_text,
         footer_text = EXCLUDED.footer_text,
         updated_at = now(),
         updated_by_actor_id = EXCLUDED.updated_by_actor_id
       RETURNING *`,
      [
        tenant.clinicId,
        tenant.organizationId,
        input.showClinicName,
        input.showDoctorName,
        input.showQualifications,
        input.showRegistration,
        input.showClinicContact,
        input.showAddress,
        input.headerText ?? null,
        input.footerText ?? null,
        tenant.actorId,
      ],
    );
    const row = r.rows[0] as Record<string, unknown>;
    return {
      clinicId: String(row.clinic_id),
      organizationId: String(row.organization_id),
      showClinicName: Boolean(row.show_clinic_name),
      showDoctorName: Boolean(row.show_doctor_name),
      showQualifications: Boolean(row.show_qualifications),
      showRegistration: Boolean(row.show_registration),
      showClinicContact: Boolean(row.show_clinic_contact),
      showAddress: Boolean(row.show_address),
      headerText: row.header_text == null ? null : String(row.header_text),
      footerText: row.footer_text == null ? null : String(row.footer_text),
    };
  }

  async getDisplaySettings(
    tenant: TenantContext,
    tx: TransactionContext,
  ): Promise<ClinicPrescriptionDisplaySettingsRecord | null> {
    assertProfileAccessContext(tenant);
    const r = await tx.query(
      `SELECT * FROM clinic_prescription_display_settings
       WHERE clinic_id = $1 AND organization_id = $2`,
      [tenant.clinicId, tenant.organizationId],
    );
    if (!r.rows[0]) return null;
    const row = r.rows[0] as Record<string, unknown>;
    return {
      clinicId: String(row.clinic_id),
      organizationId: String(row.organization_id),
      showClinicName: Boolean(row.show_clinic_name),
      showDoctorName: Boolean(row.show_doctor_name),
      showQualifications: Boolean(row.show_qualifications),
      showRegistration: Boolean(row.show_registration),
      showClinicContact: Boolean(row.show_clinic_contact),
      showAddress: Boolean(row.show_address),
      headerText: row.header_text == null ? null : String(row.header_text),
      footerText: row.footer_text == null ? null : String(row.footer_text),
    };
  }
}

export async function buildPrescriberIdentitySnapshot(
  tenant: TenantContext,
  tx: TransactionContext,
): Promise<PrescriberIdentitySnapshot> {
  assertProfileAccessContext(tenant);
  const doctors = new PgDoctorProfileRepository();
  const clinics = new PgClinicProfileRepository();
  const profile = await doctors.findOwn(tenant, tx);
  const clinic = await clinics.findCurrent(tenant, tx);
  if (!profile || !clinic) throw new ResourceNotFoundError();
  const quals = (await doctors.listQualifications(tenant, tx)).filter((q) => q.status === 'ACTIVE');
  const regs = (await doctors.listRegistrations(tenant, tx)).filter((r) => r.status === 'ACTIVE');
  return {
    schemaVersion: 'ehas2.prescriber_identity.v1',
    capturedAt: new Date().toISOString(),
    doctor: {
      userId: profile.userId,
      legalName: profile.legalName,
      displayName: profile.displayName,
      prescriptionName: profile.prescriptionName,
      qualifications: quals.map((q) => ({
        degreeTitle: q.degreeTitle,
        displayOrder: q.displayOrder,
      })),
      registrations: regs.map((r) => ({
        registrationNumber: r.registrationNumber,
        registrationAuthority: r.registrationAuthority,
        registrationRegion: r.registrationRegion,
        displayOrder: r.displayOrder,
        verificationClaimed: false as const,
      })),
    },
    clinic: {
      clinicId: clinic.id,
      organizationId: clinic.organizationId,
      displayName: clinic.displayName,
      legalName: clinic.legalName,
      phone: clinic.phone,
      addressLine1: clinic.addressLine1,
      city: clinic.city,
      state: clinic.state,
      postalCode: clinic.postalCode,
      country: clinic.country,
    },
  };
}
