import { randomUUID } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import { EHAS2_API_NAMESPACE } from '@ehas2/shared';
import { SECURITY_HEADERS } from '@ehas2/security';
import { logInfo } from '@ehas2/observability';

const app = express();
const port = Number(process.env.EHAS2_API_PORT ?? 4100);
const isProd = (process.env.EHAS2_NODE_ENV ?? process.env.NODE_ENV) === 'production';

type ApiErrorBody = {
  success: false;
  code:
    'NOT_IMPLEMENTED' | 'NOT_READY' | 'DATA_PACKAGE_NOT_INSTALLED' | 'NOT_FOUND' | 'INTERNAL_ERROR';
  message: string;
  requestId: string;
};

type RequestWithId = Request & { requestId?: string };

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
  // No production CORS wildcard. CORS not enabled in Phase 1A.
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

/** Process liveness only — does not imply clinical readiness. */
app.get('/health', (req: RequestWithId, res) => {
  res.json({
    ok: true,
    service: 'eh-arogya-sutra-2-api',
    phase: '1a',
    requestId: req.requestId,
  });
});

/**
 * Readiness — false/503 while required services and data packages are absent.
 * Clinical engine, DB, and data packages are not installed in Phase 1A.
 */
app.get('/ready', (req: RequestWithId, res) => {
  const ready = false;
  const payload = {
    ready,
    clinicalEngine: false,
    dataPackages: false,
    authentication: false,
    patientDatabase: false,
    payment: false,
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

/** Analysis is not implemented — no synthetic medicine or clinical success. */
app.use(`${EHAS2_API_NAMESPACE}/analysis`, (req: RequestWithId, res) => {
  sendError(
    res,
    501,
    'NOT_IMPLEMENTED',
    'Clinical analysis is not implemented (Phase 6+)',
    req.requestId ?? 'unknown',
  );
});

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
  // Never leak stack traces in production responses.
  sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error', requestId);
});

if (process.env.EHAS2_API_LISTEN !== '0') {
  app.listen(port, () => {
    logInfo('EHAS2 API listening', { port, namespace: EHAS2_API_NAMESPACE });
  });
}

export { app };
