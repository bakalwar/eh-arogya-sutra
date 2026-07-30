import type { Express, Response } from 'express';
import { EHAS2_API_NAMESPACE } from '@ehas2/shared';
import { Permission } from '@ehas2/security';
import {
  clinicProfileService,
  doctorProfileService,
  membershipQueryService,
  type ClinicProfileService,
  type DoctorProfileService,
  type MembershipQueryService,
} from '@ehas2/database';
import { requirePermission } from '../middleware/authorization.js';
import { mutationRateLimit } from '../middleware/rateLimit.js';
import {
  requireTenantContext,
  type TenantAuthedRequest,
  type TenantContextResolver,
} from '../middleware/tenantBridge.js';
import { sendDomainError, sendError, sendSuccess } from '../http/errors.js';

export type ProfileRouteDeps = {
  resolveTenantContext: TenantContextResolver;
  doctors?: DoctorProfileService;
  clinics?: ClinicProfileService;
  memberships?: MembershipQueryService;
};

function privateNoStore(res: Response): void {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Pragma', 'no-cache');
}

function bodyObject(req: TenantAuthedRequest): Record<string, unknown> {
  return req.body && typeof req.body === 'object' && !Array.isArray(req.body)
    ? (req.body as Record<string, unknown>)
    : {};
}

/**
 * Phase 3D doctor/clinic profile routes under /api/eh-as-2/v1/.
 * Fail closed without Principal + TenantContext. No header/query identity bypass.
 */
export function registerProfileRoutes(app: Express, deps: ProfileRouteDeps): void {
  const doctors = deps.doctors ?? doctorProfileService;
  const clinics = deps.clinics ?? clinicProfileService;
  const memberships = deps.memberships ?? membershipQueryService;
  const ns = EHAS2_API_NAMESPACE;
  const tenant = requireTenantContext(deps.resolveTenantContext);
  const mutate = mutationRateLimit();

  const doctorRead = [
    requirePermission(Permission.DoctorProfileRead, (req) =>
      req.principal
        ? {
            resourceKind: 'doctor-profile' as const,
            resourceTenantId: req.principal.tenantId ?? '',
            ownerDoctorId: req.principal.subjectId,
          }
        : null,
    ),
    tenant,
  ];
  const doctorWrite = [
    requirePermission(Permission.DoctorProfileWrite, (req) =>
      req.principal
        ? {
            resourceKind: 'doctor-profile' as const,
            resourceTenantId: req.principal.tenantId ?? '',
            ownerDoctorId: req.principal.subjectId,
          }
        : null,
    ),
    tenant,
    mutate,
  ];
  const clinicRead = [
    requirePermission(Permission.ClinicProfileRead, (req) =>
      req.principal
        ? {
            resourceKind: 'clinic-profile' as const,
            resourceTenantId: req.principal.tenantId ?? '',
          }
        : null,
    ),
    tenant,
  ];
  const clinicWrite = [
    requirePermission(Permission.ClinicProfileWrite, (req) =>
      req.principal
        ? {
            resourceKind: 'clinic-profile' as const,
            resourceTenantId: req.principal.tenantId ?? '',
          }
        : null,
    ),
    tenant,
    mutate,
  ];
  const hoursWrite = [
    requirePermission(Permission.ClinicHoursWrite, (req) =>
      req.principal
        ? {
            resourceKind: 'clinic-config' as const,
            resourceTenantId: req.principal.tenantId ?? '',
          }
        : null,
    ),
    tenant,
    mutate,
  ];
  const membershipRead = [
    requirePermission(Permission.MembershipListOwn, (req) =>
      req.principal
        ? {
            resourceKind: 'clinic-profile' as const,
            resourceTenantId: req.principal.tenantId ?? '',
          }
        : null,
    ),
    tenant,
  ];

  app.get(`${ns}/me/profile`, ...doctorRead, async (req: TenantAuthedRequest, res) => {
    privateNoStore(res);
    try {
      const data = await doctors.getOwn(req.tenantContext!);
      sendSuccess(res, data, req.requestId ?? 'unknown');
    } catch (err) {
      sendDomainError(res, err, req.requestId ?? 'unknown');
    }
  });

  app.patch(`${ns}/me/profile`, ...doctorWrite, async (req: TenantAuthedRequest, res) => {
    privateNoStore(res);
    try {
      const data = await doctors.upsertOwn(req.tenantContext!, bodyObject(req));
      sendSuccess(res, data, req.requestId ?? 'unknown');
    } catch (err) {
      sendDomainError(res, err, req.requestId ?? 'unknown');
    }
  });

  app.get(`${ns}/me/qualifications`, ...doctorRead, async (req: TenantAuthedRequest, res) => {
    privateNoStore(res);
    try {
      const data = await doctors.getOwn(req.tenantContext!);
      sendSuccess(res, data.qualifications, req.requestId ?? 'unknown');
    } catch (err) {
      sendDomainError(res, err, req.requestId ?? 'unknown');
    }
  });

  app.post(`${ns}/me/qualifications`, ...doctorWrite, async (req: TenantAuthedRequest, res) => {
    privateNoStore(res);
    try {
      const data = await doctors.addQualification(req.tenantContext!, bodyObject(req));
      sendSuccess(res, data, req.requestId ?? 'unknown', 201);
    } catch (err) {
      sendDomainError(res, err, req.requestId ?? 'unknown');
    }
  });

  app.patch(
    `${ns}/me/qualifications/:qualificationId`,
    ...doctorWrite,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const data = await doctors.updateQualification(
          req.tenantContext!,
          String(req.params.qualificationId),
          bodyObject(req),
        );
        sendSuccess(res, data, req.requestId ?? 'unknown');
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );

  app.delete(
    `${ns}/me/qualifications/:qualificationId`,
    ...doctorWrite,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const data = await doctors.deactivateQualification(
          req.tenantContext!,
          String(req.params.qualificationId),
        );
        sendSuccess(res, data, req.requestId ?? 'unknown');
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );

  app.get(`${ns}/me/registrations`, ...doctorRead, async (req: TenantAuthedRequest, res) => {
    privateNoStore(res);
    try {
      const data = await doctors.getOwn(req.tenantContext!);
      sendSuccess(res, data.registrations, req.requestId ?? 'unknown');
    } catch (err) {
      sendDomainError(res, err, req.requestId ?? 'unknown');
    }
  });

  app.post(`${ns}/me/registrations`, ...doctorWrite, async (req: TenantAuthedRequest, res) => {
    privateNoStore(res);
    try {
      const data = await doctors.addRegistration(req.tenantContext!, bodyObject(req));
      sendSuccess(res, data, req.requestId ?? 'unknown', 201);
    } catch (err) {
      sendDomainError(res, err, req.requestId ?? 'unknown');
    }
  });

  app.patch(
    `${ns}/me/registrations/:registrationId`,
    ...doctorWrite,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const data = await doctors.updateRegistration(
          req.tenantContext!,
          String(req.params.registrationId),
          bodyObject(req),
        );
        sendSuccess(res, data, req.requestId ?? 'unknown');
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );

  app.delete(
    `${ns}/me/registrations/:registrationId`,
    ...doctorWrite,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const data = await doctors.deactivateRegistration(
          req.tenantContext!,
          String(req.params.registrationId),
        );
        sendSuccess(res, data, req.requestId ?? 'unknown');
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );

  app.get(
    `${ns}/me/prescriber-identity-preview`,
    ...doctorRead,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const data = await doctors.captureIdentitySnapshot(req.tenantContext!);
        sendSuccess(
          res,
          {
            previewOnly: true,
            notAnIssuedPrescription: true,
            snapshot: data,
          },
          req.requestId ?? 'unknown',
        );
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );

  app.get(`${ns}/me/profile-completion`, ...doctorRead, async (req: TenantAuthedRequest, res) => {
    privateNoStore(res);
    try {
      const data = await doctors.getProfileCompletion(req.tenantContext!);
      sendSuccess(res, data, req.requestId ?? 'unknown');
    } catch (err) {
      sendDomainError(res, err, req.requestId ?? 'unknown');
    }
  });

  app.get(`${ns}/clinics/current`, ...clinicRead, async (req: TenantAuthedRequest, res) => {
    privateNoStore(res);
    try {
      const data = await clinics.getCurrent(req.tenantContext!);
      sendSuccess(res, data, req.requestId ?? 'unknown');
    } catch (err) {
      sendDomainError(res, err, req.requestId ?? 'unknown');
    }
  });

  app.patch(`${ns}/clinics/current`, ...clinicWrite, async (req: TenantAuthedRequest, res) => {
    privateNoStore(res);
    try {
      const data = await clinics.updateCurrent(req.tenantContext!, bodyObject(req));
      sendSuccess(res, data, req.requestId ?? 'unknown');
    } catch (err) {
      sendDomainError(res, err, req.requestId ?? 'unknown');
    }
  });

  app.get(`${ns}/clinics/current/hours`, ...clinicRead, async (req: TenantAuthedRequest, res) => {
    privateNoStore(res);
    try {
      const data = await clinics.getCurrent(req.tenantContext!);
      sendSuccess(res, data.hours, req.requestId ?? 'unknown');
    } catch (err) {
      sendDomainError(res, err, req.requestId ?? 'unknown');
    }
  });

  app.put(`${ns}/clinics/current/hours`, ...hoursWrite, async (req: TenantAuthedRequest, res) => {
    privateNoStore(res);
    try {
      const windows = Array.isArray(req.body)
        ? (req.body as Array<Record<string, unknown>>)
        : Array.isArray((req.body as { windows?: unknown })?.windows)
          ? (req.body as { windows: Array<Record<string, unknown>> }).windows
          : null;
      if (!windows) {
        sendError(
          res,
          400,
          'VALIDATION_ERROR',
          'Request body must be an array of hour windows',
          req.requestId ?? 'unknown',
        );
        return;
      }
      const data = await clinics.replaceHours(req.tenantContext!, windows);
      sendSuccess(res, data, req.requestId ?? 'unknown');
    } catch (err) {
      sendDomainError(res, err, req.requestId ?? 'unknown');
    }
  });

  app.get(
    `${ns}/clinics/current/memberships`,
    ...membershipRead,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const data = await memberships.listAuthorizedForActor(req.tenantContext!);
        sendSuccess(res, data, req.requestId ?? 'unknown');
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );

  /** Uploads remain absent/NOT_IMPLEMENTED in Phase 3D. */
  const uploadNotImplemented = (req: TenantAuthedRequest, res: Response) => {
    privateNoStore(res);
    sendError(
      res,
      501,
      'NOT_IMPLEMENTED',
      'Profile photo, logo, and signature uploads are not active in Phase 3D.',
      req.requestId ?? 'unknown',
    );
  };

  app.post(
    `${ns}/me/profile/photo`,
    requirePermission(Permission.DoctorProfileWrite),
    uploadNotImplemented,
  );
  app.post(
    `${ns}/me/signature`,
    requirePermission(Permission.DoctorProfileWrite),
    uploadNotImplemented,
  );
  app.post(
    `${ns}/clinics/current/logo`,
    requirePermission(Permission.ClinicProfileWrite),
    uploadNotImplemented,
  );
}
