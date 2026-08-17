import type { Express, Response } from 'express';
import { EHAS2_API_NAMESPACE } from '@ehas2/shared';
import { Permission } from '@ehas2/security';
import {
  ValidationError,
  consultationIntakeService,
  consultationService,
  type ConsultationIntakeService,
  type ConsultationService,
} from '@ehas2/database';
import { requirePermission } from '../middleware/authorization.js';
import { mutationRateLimit } from '../middleware/rateLimit.js';
import {
  requireTenantContext,
  type TenantAuthedRequest,
  type TenantContextResolver,
} from '../middleware/tenantBridge.js';
import { sendDomainError, sendSuccess } from '../http/errors.js';
import { assertExactJsonKeys, assertExactNestedKeys } from '../http/exactJsonBody.js';

export type ConsultationRouteDeps = {
  resolveTenantContext: TenantContextResolver;
  consultations?: ConsultationService;
  intake?: ConsultationIntakeService;
};

const VITALS_KEYS = [
  'bloodPressureSystolic',
  'bloodPressureDiastolic',
  'pulseBpm',
  'temperatureC',
  'spo2Percent',
  'weightKg',
  'heightCm',
  'notes',
] as const;

const SYMPTOM_KEYS = ['label', 'severity', 'duration', 'phase', 'notes'] as const;

const INTAKE_BODY_KEYS = [
  'patientId',
  'chiefComplaintText',
  'chiefComplaintOnset',
  'chiefComplaintDuration',
  'vitals',
  'symptoms',
  'historyNotes',
  'doctorObservations',
  'lifestyleEvidence',
] as const;

const PATCH_BODY_KEYS = [
  'chiefComplaintText',
  'chiefComplaintOnset',
  'chiefComplaintDuration',
  'vitals',
  'symptoms',
  'historyNotes',
  'doctorObservations',
  'lifestyleEvidence',
] as const;

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
        resourceKind: 'case' as const,
        resourceTenantId: req.principal.tenantId ?? '',
      }
    : null;
}

function assertSymptoms(value: unknown): void {
  if (value == null) return;
  if (!Array.isArray(value)) throw new ValidationError('Invalid symptoms');
  for (const row of value) {
    assertExactNestedKeys(row, SYMPTOM_KEYS, 'symptoms');
  }
}

export function registerConsultationRoutes(app: Express, deps: ConsultationRouteDeps): void {
  const consultations = deps.consultations ?? consultationService;
  const intake = deps.intake ?? consultationIntakeService;
  const ns = EHAS2_API_NAMESPACE;
  const tenant = requireTenantContext(deps.resolveTenantContext);
  const mutate = mutationRateLimit();
  const read = [requirePermission(Permission.ClinicalCaseRead, caseResource), tenant];
  const write = [requirePermission(Permission.ClinicalCaseWrite, caseResource), tenant, mutate];

  app.post(`${ns}/consultations`, ...write, async (req: TenantAuthedRequest, res) => {
    privateNoStore(res);
    try {
      const body = bodyObject(req);
      assertExactJsonKeys(body, INTAKE_BODY_KEYS);
      assertExactNestedKeys(body.vitals, VITALS_KEYS, 'vitals');
      assertSymptoms(body.symptoms);
      const created = await consultations.create(req.tenantContext!, {
        patientId: String(body.patientId ?? ''),
        chiefComplaintText: (body.chiefComplaintText as string | null | undefined) ?? null,
        idempotencyKey: idempotencyKey(req),
      });
      const hasIntake =
        body.chiefComplaintDuration != null ||
        body.chiefComplaintOnset != null ||
        body.vitals != null ||
        body.symptoms != null ||
        body.historyNotes != null ||
        body.doctorObservations != null ||
        body.lifestyleEvidence != null;
      const bundle = hasIntake
        ? await intake.patch(req.tenantContext!, created.id, {
            chiefComplaintOnset:
              (body.chiefComplaintOnset as string | null | undefined) ?? undefined,
            chiefComplaintDuration:
              (body.chiefComplaintDuration as string | null | undefined) ?? undefined,
            vitals: body.vitals as never,
            symptoms: body.symptoms as never,
            historyNotes: (body.historyNotes as string | null | undefined) ?? undefined,
            doctorObservations: (body.doctorObservations as string | null | undefined) ?? undefined,
            lifestyleEvidence: (body.lifestyleEvidence as string | null | undefined) ?? undefined,
          })
        : await intake.get(req.tenantContext!, created.id);
      sendSuccess(res, { consultation: created, intake: bundle }, req.requestId ?? 'unknown', 201);
    } catch (err) {
      sendDomainError(res, err, req.requestId ?? 'unknown');
    }
  });

  app.get(`${ns}/consultations/:consultationId`, ...read, async (req: TenantAuthedRequest, res) => {
    privateNoStore(res);
    try {
      const consultation = await consultations.getById(
        req.tenantContext!,
        String(req.params.consultationId),
      );
      const bundle = await intake.get(req.tenantContext!, consultation.id);
      sendSuccess(res, { consultation, intake: bundle }, req.requestId ?? 'unknown');
    } catch (err) {
      sendDomainError(res, err, req.requestId ?? 'unknown');
    }
  });

  app.patch(
    `${ns}/consultations/:consultationId`,
    ...write,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const body = bodyObject(req);
        assertExactJsonKeys(body, PATCH_BODY_KEYS);
        assertExactNestedKeys(body.vitals, VITALS_KEYS, 'vitals');
        assertSymptoms(body.symptoms);
        const bundle = await intake.patch(req.tenantContext!, String(req.params.consultationId), {
          chiefComplaintText: Object.prototype.hasOwnProperty.call(body, 'chiefComplaintText')
            ? (body.chiefComplaintText as string | null)
            : undefined,
          chiefComplaintOnset: Object.prototype.hasOwnProperty.call(body, 'chiefComplaintOnset')
            ? (body.chiefComplaintOnset as string | null)
            : undefined,
          chiefComplaintDuration: Object.prototype.hasOwnProperty.call(
            body,
            'chiefComplaintDuration',
          )
            ? (body.chiefComplaintDuration as string | null)
            : undefined,
          vitals: body.vitals as never,
          symptoms: body.symptoms as never,
          historyNotes: Object.prototype.hasOwnProperty.call(body, 'historyNotes')
            ? (body.historyNotes as string | null)
            : undefined,
          doctorObservations: Object.prototype.hasOwnProperty.call(body, 'doctorObservations')
            ? (body.doctorObservations as string | null)
            : undefined,
          lifestyleEvidence: Object.prototype.hasOwnProperty.call(body, 'lifestyleEvidence')
            ? (body.lifestyleEvidence as string | null)
            : undefined,
          idempotencyKey: idempotencyKey(req),
        });
        const consultation = await consultations.getById(
          req.tenantContext!,
          String(req.params.consultationId),
        );
        sendSuccess(res, { consultation, intake: bundle }, req.requestId ?? 'unknown');
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );
}
