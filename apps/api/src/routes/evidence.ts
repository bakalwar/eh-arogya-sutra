import { type Express, type Response } from 'express';
import { EHAS2_API_NAMESPACE } from '@ehas2/shared';
import { Permission } from '@ehas2/security';
import { evidenceService, type EvidenceService, ValidationError } from '@ehas2/database';
import { requestBodyChunks, parseContentLengthHeader } from '../http/streamBody.js';
import { requirePermission } from '../middleware/authorization.js';
import {
  requireTenantContext,
  type TenantAuthedRequest,
  type TenantContextResolver,
} from '../middleware/tenantBridge.js';
import { sendDomainError, sendSuccess } from '../http/errors.js';
import { assertExactJsonKeys } from '../http/exactJsonBody.js';
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
        assertExactJsonKeys(body, [
          'evidenceType',
          'sourceType',
          'filename',
          'declaredMime',
          'capturedOrIssuedOn',
        ]);
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
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      const ac = new AbortController();
      const onAbort = (): void => ac.abort();
      req.on('aborted', onAbort);
      try {
        const data = await evidence.receiveBytes(
          req.tenantContext!,
          String(req.params.consultationId),
          String(req.params.evidenceId),
          requestBodyChunks(req),
          process.env,
          {
            declaredLength: parseContentLengthHeader(req.header('content-length')),
            signal: ac.signal,
          },
        );
        sendSuccess(res, metadataOnly(data), req.requestId ?? 'unknown');
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      } finally {
        req.off('aborted', onAbort);
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
        const data = await evidence.get(
          req.tenantContext!,
          String(req.params.consultationId),
          String(req.params.evidenceId),
        );
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
        const data = await evidence.abort(
          req.tenantContext!,
          String(req.params.consultationId),
          String(req.params.evidenceId),
        );
        sendSuccess(res, metadataOnly(data), req.requestId ?? 'unknown');
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );

  const reviewRead = [...read];
  const reviewWrite = [
    requirePermission(Permission.ClinicalCaseWrite, caseResource),
    requirePermission(Permission.EvidenceIngest, caseResource),
    tenant,
  ];

  app.get(
    `${ns}/consultations/:consultationId/evidence/:evidenceId/candidates`,
    ...reviewRead,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const data = await evidence.listSourceLinkedCandidates(
          req.tenantContext!,
          String(req.params.consultationId),
          String(req.params.evidenceId),
        );
        sendSuccess(res, data, req.requestId ?? 'unknown');
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );

  app.get(
    `${ns}/consultations/:consultationId/evidence/:evidenceId/candidates/:candidateId`,
    ...reviewRead,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const data = await evidence.getSourceLinkedCandidate(
          req.tenantContext!,
          String(req.params.consultationId),
          String(req.params.evidenceId),
          String(req.params.candidateId),
        );
        sendSuccess(res, data, req.requestId ?? 'unknown');
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );

  app.get(
    `${ns}/consultations/:consultationId/evidence/:evidenceId/candidates/:candidateId/reviews`,
    ...reviewRead,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const data = await evidence.listCandidateReviews(
          req.tenantContext!,
          String(req.params.consultationId),
          String(req.params.evidenceId),
          String(req.params.candidateId),
        );
        sendSuccess(res, data, req.requestId ?? 'unknown');
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );

  app.post(
    `${ns}/consultations/:consultationId/evidence/:evidenceId/candidates/:candidateId/reviews`,
    ...reviewWrite,
    async (req: TenantAuthedRequest, res) => {
      privateNoStore(res);
      try {
        const body = bodyObject(req);
        assertExactJsonKeys(body, [
          'action',
          'reasonCode',
          'correctedRawText',
          'supersedesReviewId',
        ]);
        const key = idempotencyKey(req);
        if (!key) {
          throw new ValidationError('IDEMPOTENCY_KEY_REQUIRED');
        }
        const data = await evidence.submitCandidateReview(
          req.tenantContext!,
          String(req.params.consultationId),
          String(req.params.evidenceId),
          String(req.params.candidateId),
          {
            action: String(body.action ?? ''),
            reasonCode: String(body.reasonCode ?? ''),
            correctedRawText:
              body.correctedRawText === undefined || body.correctedRawText === null
                ? null
                : String(body.correctedRawText),
            supersedesReviewId:
              body.supersedesReviewId === undefined || body.supersedesReviewId === null
                ? null
                : String(body.supersedesReviewId),
            idempotencyKey: key,
          },
        );
        sendSuccess(res, data, req.requestId ?? 'unknown', 201);
      } catch (err) {
        sendDomainError(res, err, req.requestId ?? 'unknown');
      }
    },
  );
}
