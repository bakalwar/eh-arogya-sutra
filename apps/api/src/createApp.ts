import { randomUUID } from 'node:crypto';
import express, { type NextFunction, type Response } from 'express';
import { EHAS2_API_NAMESPACE } from '@ehas2/shared';
import {
  AUTHENTICATION_STATUS,
  AUTHORIZATION_POLICY_STATUS,
  Permission,
  SECURITY_HEADERS,
  type IdentityPrincipal,
} from '@ehas2/security';
import { databaseReadinessCode } from '@ehas2/database';
import { logInfo } from '@ehas2/observability';
import { requirePermission, type AuthedRequest } from './middleware/authorization.js';
import { sendError } from './http/errors.js';
import { registerProfileRoutes, type ProfileRouteDeps } from './routes/profiles.js';
import type { TenantContextResolver } from './middleware/tenantBridge.js';

export type CreateAppDeps = {
  /**
   * Optional principal resolver for automated tests only.
   * Production omits this — principal remains null (AUTH_NOT_CONNECTED).
   * Must never read identity from headers or query strings.
   */
  resolvePrincipal?: (req: AuthedRequest) => IdentityPrincipal | null;
  /**
   * Optional TenantContext bridge for automated tests only.
   * Production has no session→tenant mapping until Phase 4 auth.
   */
  resolveTenantContext?: TenantContextResolver;
  doctors?: ProfileRouteDeps['doctors'];
  clinics?: ProfileRouteDeps['clinics'];
  memberships?: ProfileRouteDeps['memberships'];
};

type RequestWithId = AuthedRequest;

export function createApp(deps: CreateAppDeps = {}) {
  const app = express();

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
   * Real authentication is not connected.
   * Production always leaves principal null unless a future Phase 4 session adapter is wired.
   * Tests may inject via createApp({ resolvePrincipal }) — never via headers/query.
   */
  app.use((req: RequestWithId, _res, next) => {
    req.principal = deps.resolvePrincipal ? deps.resolvePrincipal(req) : null;
    next();
  });

  app.get('/health', (req: RequestWithId, res) => {
    res.json({
      ok: true,
      service: 'eh-arogya-sutra-2-api',
      phase: '3d',
      requestId: req.requestId,
    });
  });

  app.get('/ready', (req: RequestWithId, res) => {
    const database = databaseReadinessCode();
    const payload = {
      ready: false,
      clinicalEngine: false,
      dataPackages: false,
      authentication: false,
      authenticationStatus: AUTHENTICATION_STATUS,
      authorizationPolicies: AUTHORIZATION_POLICY_STATUS,
      managementServices: false,
      patientDatabase: false,
      doctorClinicProfileApi: true,
      profileUploads: false,
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
    res.json({
      success: true,
      data: {
        authenticationStatus: AUTHENTICATION_STATUS,
        authorizationPolicyStatus: AUTHORIZATION_POLICY_STATUS,
        realOtp: false,
        authProvider: false,
        patientPersistence: false,
        profileApi: true,
        profileUploads: false,
      },
      requestId: req.requestId,
    });
  });

  registerProfileRoutes(app, {
    resolveTenantContext: deps.resolveTenantContext ?? (() => null),
    doctors: deps.doctors,
    clinics: deps.clinics,
    memberships: deps.memberships,
  });

  app.get(
    `${EHAS2_API_NAMESPACE}/patients`,
    requirePermission(Permission.PatientRead),
    (req: RequestWithId, res) => {
      sendError(
        res,
        501,
        'NOT_IMPLEMENTED',
        'Patient HTTP persistence is not implemented (Phase 3D profiles only)',
        req.requestId ?? 'unknown',
      );
    },
  );

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

  const isProd = (process.env.EHAS2_NODE_ENV ?? process.env.NODE_ENV) === 'production';
  app.use((err: unknown, req: RequestWithId, res: Response, _next: NextFunction) => {
    const requestId = req.requestId ?? 'unknown';
    if (!isProd && err instanceof Error) {
      logInfo('api_error', { requestId, message: err.message });
    } else {
      logInfo('api_error', { requestId, message: 'internal_error' });
    }
    sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error', requestId);
  });

  return app;
}
