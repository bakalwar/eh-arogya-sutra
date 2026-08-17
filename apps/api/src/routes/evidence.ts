import express, { type Express, type Response } from 'express';
import { EHAS2_API_NAMESPACE } from '@ehas2/shared';
import { Permission } from '@ehas2/security';
import { evidenceService, type EvidenceService } from '@ehas2/database';
import { MAX_EVIDENCE_BYTES } from '@ehas2/evidence-ingest';
import { requirePermission } from '../middleware/authorization.js';
import {
  requireTenantContext,
  type TenantAuthedRequest,
  type TenantContextResolver,
} from '../middleware/tenantBridge.js';
import { sendDomainError, sendError, sendSuccess } from '../http/errors.js';
import { ingestRateLimit } from '../middleware/uploadLimits.js';

export type EvidenceRouteDeps = {
  resolveTenantContext: TenantContextResolver;
  evidence?: EvidenceService;
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
        resourceKind: 'report' as const,
        resourceTenantId: req.principal.tenantId ?? '',
      }
    : null;
}

function metadataOnly<T extends { id: string }>(item: T): T {
  return item;
}

export function registerEvidenceRoutes(app: Express, deps: EvidenceRouteDeps): void {
  const evidence = deps.evidence ?? evidenceService;
  const ns = EHAS2_API_NAMESPACE;
  const tenant = requireTenantContext(deps.resolveTenantContext);
  const ingest = ingestRateLimit();
  const read = [
    requirePermission(Permission.ClinicalCaseRead, caseResource),
    requirePermission(Permission.EvidenceMetadataRead, caseResource),
    tenant,
  ];
  const write = [
    requirePermission(Permission.ClinicalCaseWrite, caseResource),
    requirePermission(Permission.EvidenceIngest, caseResource),
    tenant,
    ingest,
  ];

  app.post(
    `${ns}/consultations/:consultationId/evidence`,
    ...write,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const body = bodyObject(req);
        const data = await evidence.initiate(req.tenantContext!, {
          consultationId: String(req.params.consultationId),
          evidenceType: String(body.evidenceType ?? ''),
          sourceType: String(body.sourceType ?? 'DOCTOR_UPLOAD'),
          filename: String(body.filename ?? ''),
          declaredMime: String(body.declaredMime ?? ''),
          capturedOrIssuedOn: (body.capturedOrIssuedOn as string | null | undefined) ?? null,
          idempotencyKey: idempotencyKey(req),
        });
        sendSuccess(res, metadataOnly(data), req.requestId ?? 'unknown', 201);
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );

  app.put(
    `${ns}/consultations/:consultationId/evidence/:evidenceId/bytes`,
    ...write,
    express.raw({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'application/octet-stream'],
      limit: MAX_EVIDENCE_BYTES,
    }),
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const buf = Buffer.isBuffer(req.body)
          ? req.body
          : req.body instanceof Uint8Array
            ? Buffer.from(req.body)
            : null;
        if (!buf) {
          sendError(
            res,
            400,
            'VALIDATION_ERROR',
            'Raw evidence bytes required',
            req.requestId ?? 'unknown',
          );
          return;
        }
        const data = await evidence.receiveBytes(
          req.tenantContext!,
          String(req.params.evidenceId),
          buf,
        );
        sendSuccess(res, metadataOnly(data), req.requestId ?? 'unknown');
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );

  app.get(
    `${ns}/consultations/:consultationId/evidence`,
    ...read,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const data = await evidence.listByConsultation(
          req.tenantContext!,
          String(req.params.consultationId),
        );
        sendSuccess(res, data.map(metadataOnly), req.requestId ?? 'unknown');
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );

  app.get(
    `${ns}/consultations/:consultationId/evidence/:evidenceId`,
    ...read,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const data = await evidence.get(req.tenantContext!, String(req.params.evidenceId));
        if (data.consultationId !== String(req.params.consultationId)) {
          sendError(res, 404, 'NOT_FOUND', 'Resource not found', req.requestId ?? 'unknown');
          return;
        }
        sendSuccess(res, metadataOnly(data), req.requestId ?? 'unknown');
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );

  app.post(
    `${ns}/consultations/:consultationId/evidence/:evidenceId/abort`,
    ...write,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const data = await evidence.abort(req.tenantContext!, String(req.params.evidenceId));
        sendSuccess(res, metadataOnly(data), req.requestId ?? 'unknown');
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );
}
