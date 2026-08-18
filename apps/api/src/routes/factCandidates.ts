import type { Express, Response } from 'express';
import { EHAS2_API_NAMESPACE } from '@ehas2/shared';
import { Permission } from '@ehas2/security';
import { ValidationError, factCandidateService, type FactCandidateService } from '@ehas2/database';
import { requirePermission } from '../middleware/authorization.js';
import { mutationRateLimit } from '../middleware/rateLimit.js';
import {
  requireTenantContext,
  type TenantAuthedRequest,
  type TenantContextResolver,
} from '../middleware/tenantBridge.js';
import { sendDomainError, sendSuccess } from '../http/errors.js';
import { assertExactJsonKeys } from '../http/exactJsonBody.js';

export type FactCandidateRouteDeps = {
  resolveTenantContext: TenantContextResolver;
  factCandidates?: FactCandidateService;
};

const MATERIALIZE_KEYS = [
  'sourceChannel',
  'sourceField',
  'category',
  'symptomId',
  'evidenceId',
  'candidateId',
  'supersedesFactId',
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

export function registerFactCandidateRoutes(app: Express, deps: FactCandidateRouteDeps): void {
  const facts = deps.factCandidates ?? factCandidateService;
  const ns = EHAS2_API_NAMESPACE;
  const tenant = requireTenantContext(deps.resolveTenantContext);
  const mutate = mutationRateLimit();
  const read = [requirePermission(Permission.ClinicalCaseRead, caseResource), tenant];
  const write = [requirePermission(Permission.ClinicalCaseWrite, caseResource), tenant, mutate];

  app.get(
    `${ns}/consultations/:consultationId/fact-candidates`,
    ...read,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const items = await facts.list(
          req.tenantContext!,
          String(req.params.consultationId),
          process.env,
        );
        sendSuccess(res, { items }, req.requestId ?? 'unknown');
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );

  app.post(
    `${ns}/consultations/:consultationId/fact-candidates/materialize`,
    ...write,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const body = bodyObject(req);
        assertExactJsonKeys(body, MATERIALIZE_KEYS);
        const key = idempotencyKey(req);
        if (!key) throw new ValidationError('IDEMPOTENCY_KEY_REQUIRED');
        const created = await facts.materialize(
          req.tenantContext!,
          String(req.params.consultationId),
          {
            sourceChannel: String(body.sourceChannel ?? ''),
            sourceField: String(body.sourceField ?? ''),
            category: (body.category as string | null | undefined) ?? null,
            symptomId: (body.symptomId as string | null | undefined) ?? null,
            evidenceId: (body.evidenceId as string | null | undefined) ?? null,
            candidateId: (body.candidateId as string | null | undefined) ?? null,
            supersedesFactId: (body.supersedesFactId as string | null | undefined) ?? null,
            idempotencyKey: key,
          },
          process.env,
        );
        sendSuccess(res, created, req.requestId ?? 'unknown', 201);
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );
}
