import { randomUUID } from 'node:crypto';
import express, { type NextFunction, type Response } from 'express';
import { EHAS2_API_NAMESPACE } from '@ehas2/shared';
import {
  AUTHENTICATION_STATUS,
  AUTHORIZATION_POLICY_STATUS,
  Permission,
  SECURITY_HEADERS,
} from '@ehas2/security';
import { logInfo } from '@ehas2/observability';
import { requirePermission, type AuthedRequest } from './middleware/authorization.js';

const app = express();
const port = Number(process.env.EHAS2_API_PORT ?? 4100);
const isProd = (process.env.EHAS2_NODE_ENV ?? process.env.NODE_ENV) === 'production';

type ApiErrorBody = {
  success: false;
  code:
    | 'NOT_IMPLEMENTED'
    | 'NOT_READY'
    | 'DATA_PACKAGE_NOT_INSTALLED'
    | 'NOT_FOUND'
    | 'INTERNAL_ERROR'
    | 'AUTH_NOT_CONNECTED'
    | 'PERMISSION_DENIED'
    | 'FORBIDDEN';
  message: string;
  requestId: string;
};

type RequestWithId = AuthedRequest;

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
 * Phase 2A: no authentication provider — principal remains null.
 * Authorization middleware still enforces deny-by-default on protected routes.
 */
app.use((req: RequestWithId, _res, next) => {
  req.principal = null;
  next();
});

function sendError(
  res: Response,
  status: number,
  code: ApiErrorBody['code'],
  message: string,
  requestId: string,
): void {
  const body: ApiErrorBody = { success: false, code, message, requestId };
  res.status(status).json(body);
}

app.get('/health', (req: RequestWithId, res) => {
  res.json({
    ok: true,
    service: 'eh-arogya-sutra-2-api',
    phase: '2a-m',
    requestId: req.requestId,
  });
});

app.get('/ready', (req: RequestWithId, res) => {
  const payload = {
    ready: false,
    clinicalEngine: false,
    dataPackages: false,
    authentication: false,
    authenticationStatus: AUTHENTICATION_STATUS,
    authorizationPolicies: AUTHORIZATION_POLICY_STATUS,
    managementServices: false,
    patientDatabase: false,
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
    },
    requestId: req.requestId,
  });
});

/**
 * Protected patient probe — demonstrates backend authz without patient persistence.
 * Without a live principal this returns AUTH_NOT_CONNECTED.
 */
app.get(
  `${EHAS2_API_NAMESPACE}/patients`,
  requirePermission(Permission.PatientRead),
  (req: RequestWithId, res) => {
    sendError(
      res,
      501,
      'NOT_IMPLEMENTED',
      'Patient persistence is not implemented (Phase 2A authz only)',
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

/**
 * Super Admin control-plane API — requires Super Admin permission; still NOT_IMPLEMENTED.
 * Doctor principals (when auth exists) cannot pass requirePermission for this plane.
 */
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

/**
 * Management Admin API shells — require ManagementShellAccess; still NOT_CONNECTED.
 * Doctor / Clinic Admin receive PERMISSION_DENIED when a principal is present without permission.
 * Without a live principal this returns AUTH_NOT_CONNECTED.
 */
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

/** Doctor feedback submit — requires FeedbackSubmit; transmission NOT_CONNECTED. */
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
  if (!isProd && err instanceof Error) {
    logInfo('api_error', { requestId, message: err.message });
  } else {
    logInfo('api_error', { requestId, message: 'internal_error' });
  }
  sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error', requestId);
});

if (process.env.EHAS2_API_LISTEN !== '0') {
  app.listen(port, () => {
    logInfo('EHAS2 API listening', { port, namespace: EHAS2_API_NAMESPACE });
  });
}

export { app };
