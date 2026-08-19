import { randomUUID } from 'node:crypto';
import express, { type NextFunction, type Response } from 'express';
import { EHAS2_API_NAMESPACE } from '@ehas2/shared';
import {
  AUTHENTICATION_STATUS,
  AUTHORIZATION_POLICY_STATUS,
  OTP_PROVIDER_STATUS,
  Permission,
  SECURITY_HEADERS,
  SESSION_COOKIE_NAME,
  parseCookies,
  type IdentityPrincipal,
} from '@ehas2/security';
import { authService, databaseReadinessCode, type TenantContext } from '@ehas2/database';
import {
  EVIDENCE_CLINICAL_ENGINE_CONNECTED,
  EVIDENCE_DISTRIBUTED_RATE_LIMITER,
  EVIDENCE_INGEST_FOUNDATION,
  EVIDENCE_MALWARE_SCANNER_CONNECTED,
  EVIDENCE_OCR_CONNECTED,
  EVIDENCE_PRODUCTION_OBJECT_STORE,
  EVIDENCE_PRODUCTION_WORKER,
  F2A_INFRASTRUCTURE_FOUNDATION,
} from '@ehas2/evidence-ingest';
import {
  EVIDENCE_EXTRACT_PRODUCTION,
  EVIDENCE_OCR_ADAPTER_CONNECTED,
  F3A_EXTRACTION_CANDIDATE_FOUNDATION,
  F3B_OPEN_SOURCE_OCR_ADAPTER_FOUNDATION,
  F3C_CANDIDATE_REVIEW_FOUNDATION,
  F3D_FACT_CANDIDATE_FOUNDATION,
  F3D2_TERMINOLOGY_PACK_FOUNDATION,
  NORMALIZATION_PARSER_AVAILABLE,
  CUE_PARSER_FOUNDATION,
  CUE_PARSER_CONNECTED,
  CUE_PARSER_PRODUCTION_ENABLED,
  getTerminologyReadinessPosture,
} from '@ehas2/evidence-extract';
import { logInfo } from '@ehas2/observability';
import { requirePermission, type AuthedRequest } from './middleware/authorization.js';
import { sendError } from './http/errors.js';
import { registerProfileRoutes, type ProfileRouteDeps } from './routes/profiles.js';
import { registerAuthRoutes, type AuthRouteDeps } from './routes/auth.js';
import { registerPatientRoutes, type PatientRouteDeps } from './routes/patients.js';
import { registerConsultationRoutes, type ConsultationRouteDeps } from './routes/consultations.js';
import { registerEvidenceRoutes, type EvidenceRouteDeps } from './routes/evidence.js';
import {
  registerFactCandidateRoutes,
  type FactCandidateRouteDeps,
} from './routes/factCandidates.js';
import type { TenantContextResolver } from './middleware/tenantBridge.js';

export type CreateAppDeps = {
  /**
   * Optional principal override for automated tests.
   * Production uses opaque session cookie → AuthService.resolveSession.
   * Must never read identity from headers or query strings.
   */
  resolvePrincipal?: (req: AuthedRequest) => IdentityPrincipal | null;
  /**
   * Optional TenantContext bridge. Production derives from session membership when present.
   */
  resolveTenantContext?: TenantContextResolver;
  doctors?: ProfileRouteDeps['doctors'];
  clinics?: ProfileRouteDeps['clinics'];
  memberships?: ProfileRouteDeps['memberships'];
  patients?: PatientRouteDeps['patients'];
  consultations?: ConsultationRouteDeps['consultations'];
  intake?: ConsultationRouteDeps['intake'];
  evidence?: EvidenceRouteDeps['evidence'];
  factCandidates?: FactCandidateRouteDeps['factCandidates'];
  auth?: AuthRouteDeps['auth'];
  allowedOrigins?: string[];
};

type RequestWithId = AuthedRequest & {
  sessionTenant?: TenantContext | null;
};

export function createApp(deps: CreateAppDeps = {}) {
  const app = express();
  const auth = deps.auth ?? authService;

  app.use(express.json({ limit: '1mb' }));

  app.use((req: RequestWithId, res, next) => {
    const incoming = req.header('x-request-id');
    const requestId = incoming && incoming.trim() ? incoming.trim() : randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  });

  app.use((_req, res, next) => {
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
      res.setHeader(k, v as string);
    }
    next();
  });

  /**
   * Session cookie → principal (Phase 4A).
   * No header/query identity bypass. Tests may inject via resolvePrincipal.
   */
  app.use((req: RequestWithId, _res, next) => {
    void (async () => {
      try {
        if (deps.resolvePrincipal) {
          req.principal = deps.resolvePrincipal(req);
          req.sessionTenant = null;
          next();
          return;
        }
        const cookies = parseCookies(req.header('cookie') ?? undefined);
        const token = cookies[SESSION_COOKIE_NAME];
        if (!token) {
          req.principal = null;
          req.sessionTenant = null;
          next();
          return;
        }
        const resolved = await auth.resolveSession(token);
        req.principal = resolved.principal ?? null;
        if (
          resolved.session?.organizationId &&
          resolved.session.clinicId &&
          resolved.session.roleCode &&
          resolved.principal
        ) {
          req.sessionTenant = {
            organizationId: resolved.session.organizationId,
            clinicId: resolved.session.clinicId,
            actorId: resolved.principal.subjectId,
            actorRole: resolved.session.roleCode,
            membershipStatus: 'ACTIVE',
            allowPatientPhi:
              resolved.session.roleCode === 'Doctor' || resolved.session.roleCode === 'ClinicAdmin',
          };
        } else {
          req.sessionTenant = null;
        }
        next();
      } catch {
        req.principal = null;
        req.sessionTenant = null;
        next();
      }
    })();
  });

  app.get('/health', (req: RequestWithId, res) => {
    res.json({
      ok: true,
      service: 'eh-arogya-sutra-2-api',
      phase: '4a',
      requestId: req.requestId,
    });
  });

  app.get('/ready', (req: RequestWithId, res) => {
    const database = databaseReadinessCode();
    const terminology = getTerminologyReadinessPosture();
    const payload = {
      ready: false,
      clinicalEngine: false,
      dataPackages: false,
      authentication: false,
      authenticationStatus: AUTHENTICATION_STATUS,
      otpProviderStatus: OTP_PROVIDER_STATUS,
      authorizationPolicies: AUTHORIZATION_POLICY_STATUS,
      managementServices: false,
      patientDatabase: false,
      doctorClinicProfileApi: true,
      profileUploads: false,
      evidenceIngestFoundation: EVIDENCE_INGEST_FOUNDATION,
      f2aInfrastructureFoundation: F2A_INFRASTRUCTURE_FOUNDATION,
      f3aExtractionCandidateFoundation: F3A_EXTRACTION_CANDIDATE_FOUNDATION,
      f3bOpenSourceOcrAdapterFoundation: F3B_OPEN_SOURCE_OCR_ADAPTER_FOUNDATION,
      f3cCandidateReviewFoundation: F3C_CANDIDATE_REVIEW_FOUNDATION,
      f3dFactCandidateFoundation: F3D_FACT_CANDIDATE_FOUNDATION,
      f3d2TerminologyPackFoundation: F3D2_TERMINOLOGY_PACK_FOUNDATION,
      cueParserFoundation: CUE_PARSER_FOUNDATION,
      cueParserConnected: CUE_PARSER_CONNECTED,
      cueParserProductionEnabled: CUE_PARSER_PRODUCTION_ENABLED,
      terminologyProductionEntryCount: terminology.terminologyProductionEntryCount,
      ownerTerminologyFreezePending: terminology.ownerTerminologyFreezePending,
      terminologyPackFrozen: terminology.terminologyPackFrozen,
      terminologyPackValid: terminology.terminologyPackValid,
      normalizationParserAvailable: NORMALIZATION_PARSER_AVAILABLE,
      ocr: EVIDENCE_OCR_CONNECTED,
      ocrAdapter: EVIDENCE_OCR_ADAPTER_CONNECTED,
      extractProduction: EVIDENCE_EXTRACT_PRODUCTION,
      productionObjectStore: EVIDENCE_PRODUCTION_OBJECT_STORE,
      malwareScanner: EVIDENCE_MALWARE_SCANNER_CONNECTED,
      distributedRateLimiter: EVIDENCE_DISTRIBUTED_RATE_LIMITER,
      productionWorker: EVIDENCE_PRODUCTION_WORKER,
      passkeys: 'PASSKEY_NOT_CONNECTED',
      database,
      databaseCode: database === 'DATABASE_NOT_INSTALLED' ? 'DATABASE_NOT_INSTALLED' : database,
      payment: false,
      monitoring: false,
      superAdminControlPlane: false,
      requestId: req.requestId,
    };
    res.status(503).json(payload);
  });

  app.get(`${EHAS2_API_NAMESPACE}/system/data-version`, (req: RequestWithId, res) => {
    sendError(
      res,
      503,
      'DATA_PACKAGE_NOT_INSTALLED',
      'Data packages not installed (Phase 4–5)',
      req.requestId ?? 'unknown',
    );
  });

  app.get(`${EHAS2_API_NAMESPACE}/system/authz-status`, (req: RequestWithId, res) => {
    const terminology = getTerminologyReadinessPosture();
    res.json({
      success: true,
      data: {
        authenticationStatus: AUTHENTICATION_STATUS,
        authorizationPolicyStatus: AUTHORIZATION_POLICY_STATUS,
        otpProviderStatus: OTP_PROVIDER_STATUS,
        realOtp: false,
        authProvider: false,
        patientPersistence: false,
        profileApi: true,
        profileUploads: false,
        evidenceIngestFoundation: EVIDENCE_INGEST_FOUNDATION,
        f2aInfrastructureFoundation: F2A_INFRASTRUCTURE_FOUNDATION,
        f3aExtractionCandidateFoundation: F3A_EXTRACTION_CANDIDATE_FOUNDATION,
        f3bOpenSourceOcrAdapterFoundation: F3B_OPEN_SOURCE_OCR_ADAPTER_FOUNDATION,
        f3cCandidateReviewFoundation: F3C_CANDIDATE_REVIEW_FOUNDATION,
        f3dFactCandidateFoundation: F3D_FACT_CANDIDATE_FOUNDATION,
        f3d2TerminologyPackFoundation: F3D2_TERMINOLOGY_PACK_FOUNDATION,
        cueParserFoundation: CUE_PARSER_FOUNDATION,
        cueParserConnected: CUE_PARSER_CONNECTED,
        cueParserProductionEnabled: CUE_PARSER_PRODUCTION_ENABLED,
        terminologyProductionEntryCount: terminology.terminologyProductionEntryCount,
        ownerTerminologyFreezePending: terminology.ownerTerminologyFreezePending,
        terminologyPackFrozen: terminology.terminologyPackFrozen,
        terminologyPackValid: terminology.terminologyPackValid,
        normalizationParserAvailable: NORMALIZATION_PARSER_AVAILABLE,
        ocr: EVIDENCE_OCR_CONNECTED,
        ocrAdapter: EVIDENCE_OCR_ADAPTER_CONNECTED,
        extractProduction: EVIDENCE_EXTRACT_PRODUCTION,
        clinicalEngine: EVIDENCE_CLINICAL_ENGINE_CONNECTED,
        productionObjectStore: EVIDENCE_PRODUCTION_OBJECT_STORE,
        malwareScanner: EVIDENCE_MALWARE_SCANNER_CONNECTED,
        distributedRateLimiter: EVIDENCE_DISTRIBUTED_RATE_LIMITER,
        productionWorker: EVIDENCE_PRODUCTION_WORKER,
        passkeys: 'PASSKEY_NOT_CONNECTED',
      },
      requestId: req.requestId,
    });
  });

  registerAuthRoutes(app, {
    auth,
    allowedOrigins: deps.allowedOrigins,
  });

  registerProfileRoutes(app, {
    resolveTenantContext:
      deps.resolveTenantContext ?? ((req) => (req as RequestWithId).sessionTenant ?? null),
    doctors: deps.doctors,
    clinics: deps.clinics,
    memberships: deps.memberships,
  });

  const resolveTenant =
    deps.resolveTenantContext ?? ((req) => (req as RequestWithId).sessionTenant ?? null);

  registerPatientRoutes(app, {
    resolveTenantContext: resolveTenant,
    patients: deps.patients,
  });
  registerConsultationRoutes(app, {
    resolveTenantContext: resolveTenant,
    consultations: deps.consultations,
    intake: deps.intake,
  });
  registerEvidenceRoutes(app, {
    resolveTenantContext: resolveTenant,
    evidence: deps.evidence,
  });
  registerFactCandidateRoutes(app, {
    resolveTenantContext: resolveTenant,
    factCandidates: deps.factCandidates,
  });

  app.use(`${EHAS2_API_NAMESPACE}/analysis`, (req: RequestWithId, res) => {
    sendError(
      res,
      501,
      'NOT_IMPLEMENTED',
      'Clinical analysis is not implemented (Phase 6+)',
      req.requestId ?? 'unknown',
    );
  });

  app.use(
    `${EHAS2_API_NAMESPACE}/ops`,
    requirePermission(Permission.SuperAdminControlPlane),
    (req: RequestWithId, res) => {
      sendError(
        res,
        501,
        'NOT_IMPLEMENTED',
        'Super Admin Security and Operations Center is NOT_IMPLEMENTED (no live Super Admin login)',
        req.requestId ?? 'unknown',
      );
    },
  );

  app.get(
    `${EHAS2_API_NAMESPACE}/management`,
    requirePermission(Permission.ManagementShellAccess),
    (req: RequestWithId, res) => {
      sendError(
        res,
        503,
        'NOT_READY',
        'Management services are not connected.',
        req.requestId ?? 'unknown',
      );
    },
  );

  app.use(
    `${EHAS2_API_NAMESPACE}/management`,
    requirePermission(Permission.ManagementShellAccess),
    (req: RequestWithId, res) => {
      sendError(
        res,
        503,
        'NOT_READY',
        'Management services are not connected.',
        req.requestId ?? 'unknown',
      );
    },
  );

  app.post(
    `${EHAS2_API_NAMESPACE}/feedback`,
    requirePermission(Permission.FeedbackSubmit),
    (req: RequestWithId, res) => {
      sendError(
        res,
        503,
        'NOT_READY',
        'Feedback transmission is not connected.',
        req.requestId ?? 'unknown',
      );
    },
  );

  app.use((req: RequestWithId, res) => {
    sendError(
      res,
      404,
      'NOT_FOUND',
      `No route for ${req.method} ${req.path}`,
      req.requestId ?? 'unknown',
    );
  });

  app.use((err: unknown, req: RequestWithId, res: Response, _next: NextFunction) => {
    const requestId = req.requestId ?? 'unknown';
    const typed = err as { type?: string; status?: number };
    if (typed?.type === 'entity.too.large' || typed?.status === 413) {
      sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'Upload exceeds size limit', requestId);
      return;
    }
    logInfo('api_error', { requestId, message: 'internal_error' });
    sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error', requestId);
  });

  return app;
}
