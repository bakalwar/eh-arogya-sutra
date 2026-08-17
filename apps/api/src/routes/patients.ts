import type { Express, Response } from 'express';
import { EHAS2_API_NAMESPACE } from '@ehas2/shared';
import { Permission } from '@ehas2/security';
import { patientService, type PatientService } from '@ehas2/database';
import { requirePermission } from '../middleware/authorization.js';
import { mutationRateLimit } from '../middleware/rateLimit.js';
import {
  requireTenantContext,
  type TenantAuthedRequest,
  type TenantContextResolver,
} from '../middleware/tenantBridge.js';
import { sendDomainError, sendSuccess } from '../http/errors.js';

export type PatientRouteDeps = {
  resolveTenantContext: TenantContextResolver;
  patients?: PatientService;
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

function idempotencyKey(req: TenantAuthedRequest): string | undefined {
  const raw = req.header('idempotency-key');
  return raw && raw.trim() ? raw.trim().slice(0, 128) : undefined;
}

function caseResource(req: TenantAuthedRequest) {
  return req.principal
    ? {
        resourceKind: 'patient' as const,
        resourceTenantId: req.principal.tenantId ?? '',
      }
    : null;
}

export function registerPatientRoutes(app: Express, deps: PatientRouteDeps): void {
  const patients = deps.patients ?? patientService;
  const ns = EHAS2_API_NAMESPACE;
  const tenant = requireTenantContext(deps.resolveTenantContext);
  const mutate = mutationRateLimit();
  const read = [requirePermission(Permission.PatientRead, caseResource), tenant];
  const write = [requirePermission(Permission.PatientWrite, caseResource), tenant, mutate];

  app.post(`${ns}/patients`, ...write, async (req: TenantAuthedRequest, res) => {
    privateNoStore(res);
    try {
      const body = bodyObject(req);
      const data = await patients.create(
        req.tenantContext!,
        {
          displayName: String(body.displayName ?? ''),
          dateOfBirth: (body.dateOfBirth as string | null | undefined) ?? null,
          sexAtBirth: (body.sexAtBirth as string | null | undefined) ?? null,
          phoneMasked: (body.phoneMasked as string | null | undefined) ?? null,
          emailMasked: (body.emailMasked as string | null | undefined) ?? null,
        },
        { idempotencyKey: idempotencyKey(req) },
      );
      sendSuccess(res, data, req.requestId ?? 'unknown', 201);
    } catch (err) {
      sendDomainError(res, err, req.requestId ?? 'unknown');
    }
  });

  app.get(`${ns}/patients`, ...read, async (req: TenantAuthedRequest, res) => {
    privateNoStore(res);
    try {
      const data = await patients.list(req.tenantContext!, {
        cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      sendSuccess(res, data, req.requestId ?? 'unknown');
    } catch (err) {
      sendDomainError(res, err, req.requestId ?? 'unknown');
    }
  });

  app.get(`${ns}/patients/:patientId`, ...read, async (req: TenantAuthedRequest, res) => {
    privateNoStore(res);
    try {
      const data = await patients.getById(req.tenantContext!, String(req.params.patientId));
      sendSuccess(res, data, req.requestId ?? 'unknown');
    } catch (err) {
      sendDomainError(res, err, req.requestId ?? 'unknown');
    }
  });
}
