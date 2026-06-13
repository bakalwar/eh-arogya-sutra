const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
// Repo-root .env, then backend/.env (Gmail EMAIL_* overrides).
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });
const backendEnv = path.join(__dirname, '.env');
if (fs.existsSync(backendEnv)) {
  require('dotenv').config({ path: backendEnv, override: true });
}

// Optional: hide debug/info console output when EH_HIDE_DEBUG=1
if (process.env.EH_HIDE_DEBUG === '1') {
  const noop = () => {};
  console.log('EH_HIDE_DEBUG=1 — suppressing console.log / console.debug output');
  console.debug = noop;
  console.log = noop;
  console.info = noop;
}

// Import routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const medicineRoutes = require('./routes/medicines');
const reportRoutes = require('./routes/reports');
const prescriptionRoutes = require('./routes/prescriptions');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const smartSearchRoutes = require('./routes/searchEngine');
const auditRoutes = require('./routes/audit');
const symptomCheckerRoutes = require('./routes/symptomChecker');
const brandingRoutes = require('./routes/branding');
const profileRoutes = require('./routes/profile');
const superAdminRoutes = require('./routes/superAdmin');
const translationRoutes = require('./routes/translation');
const summaryGenerateRoutes = require('./routes/summaryGenerate');
const { EXPERT_BASE } = require('./services/ehExpertClient');
const ehExpertProxyRoutes = require('./routes/ehExpertProxy');
const ehV3ProxyRoutes = require('./routes/ehV3Proxy');
const subscriptionRoutes = require('./routes/subscription');
const referralRoutes = require('./routes/referral');

// Import middleware
const { asyncHandler } = require('./utils/asyncHandler');
const { requireAuth } = require('./middleware/requireAuth');
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');
const { auditMiddleware } = require('./middleware/auditLog');
const { connectRedis } = require('./services/redisService');
const { doctorRateLimiter } = require('./middleware/doctorRateLimit');
const ehHubApi = require('./routes/ehHubApi');
const healthRoutes = require('./routes/health');
const { startEhHubWatcher } = require('./services/ehHubLive');
const { connectPostgres, getPostgresHealth, pingPostgres, getPostgresModels } = require('./db/postgres.init');
const { sequelize } = require('./db/sequelize');

const app = express();
let server;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting — dev/local needs higher cap (health poll + Smart Search + summary)
const isProd = process.env.NODE_ENV === 'production';
const rateLimitWindow = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || (isProd ? 100 : 2000);

function rateLimitSkip(req) {
  const p = req.path || req.originalUrl || '';
  if (p.startsWith('/eh-arogya/api/stream')) return true;
  if (p === '/health') return true;
  if (p === '/api/summary/stack-status') return true;
  // Search engine — no rate-limit (clinical intake + fuzzy lookup)
  if (p.startsWith('/api/search')) return true;
  if (p.startsWith('/api/symptom-checker')) return true;
  return false;
}

const limiter = rateLimit({
  windowMs: rateLimitWindow,
  max: rateLimitMax,
  message: {
    success: false,
    message:
      'Bahut zyada requests — 1-2 minute ruk kar dubara try karein. (HTTP 429)'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: rateLimitSkip
});

/** Summary routes: generous cap so clinical saar is not blocked after health/login traffic */
const summaryLimiter = rateLimit({
  windowMs: rateLimitWindow,
  max: Number(process.env.RATE_LIMIT_SUMMARY_MAX) || (isProd ? 30 : 120),
  message: {
    success: false,
    message: 'Summary limit — thodi der baad dubara try karein. (HTTP 429)'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Stricter limit on login only (mandated: max 5 / 15 min)
const authLoginLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_LOGIN_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.AUTH_LOGIN_MAX_ATTEMPTS) || 5,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/login', authLoginLimiter);

// CORS configuration
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
  'http://127.0.0.1:5177',
  'http://127.0.0.1:5178',
  'http://127.0.0.1:5179',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'https://eh-arogya-sutra.vercel.app',
  'https://staging.arogyasutra.com',
  'https://app.arogyasutra.com'
];
if (process.env.FRONTEND_URL) {
  defaultOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
}
const corsOptions = {
  origin(origin, callback) {
    const allowed = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
      : defaultOrigins;

    if (!origin) return callback(null, true);
    if (allowed.includes(origin)) return callback(null, true);

    // Vercel preview + production deployments (*.vercel.app)
    if (/^https:\/\/[a-z0-9-]+(?:-[a-z0-9-]+)*\.vercel\.app$/i.test(origin)) {
      return callback(null, true);
    }

    const isLocalDev =
      process.env.EH_LOCAL_DEV === '1' ||
      (process.env.NODE_ENV || 'development') !== 'production';
    if (
      isLocalDev &&
      /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/i.test(
        origin
      )
    ) {
      return callback(null, true);
    }

    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Body parsing middleware — large clinical PDFs / imaging (local + production)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression middleware
app.use(
  compression({
    filter: (req, res) => {
      if (req.path && req.path.startsWith('/eh-arogya/api/stream')) return false;
      return compression.filter(req, res);
    }
  })
);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check — PostgreSQL only
app.get('/health', async (req, res) => {
  let postgres = getPostgresHealth();
  if (req.query.deep === '1') {
    postgres = await pingPostgres();
  }
  const pgModels =
    postgres.enabled && postgres.connected ? Object.keys(getPostgresModels()) : undefined;
  res.status(200).json({
    status: 'OK',
    message: 'E.H. Arogya Sutra Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    appEnv: process.env.APP_ENV || process.env.NODE_ENV,
    deployEnv: process.env.EH_DEPLOY_ENV || null,
    deploy: {
      commit: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || null,
      branch: process.env.RAILWAY_GIT_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || null,
      summaryEhApiRoute: true,
      expertBase: EXPERT_BASE
    },
    summaryDenseMode: process.env.EH_SUMMARY_DENSE_MODE !== '0',
    database: {
      dialect: 'postgresql',
      name: sequelize?.getDatabaseName?.() || null,
      connected: postgres.connected,
      ...(sequelize?.config?.pool?.max != null ? { poolMax: sequelize.config.pool.max } : {}),
      ...(pgModels ? { models: pgModels } : {}),
      ...(postgres.lastError ? { lastError: postgres.lastError } : {})
    }
  });
});

// API routes — summary first (POST /api/summary/eh-api → Python EH API)
app.post(
  '/api/summary/eh-api',
  summaryLimiter,
  requireAuth,
  asyncHandler(summaryGenerateRoutes.runEhEngineSummary)
);
app.use('/api/summary', summaryLimiter, summaryGenerateRoutes);

app.use('/api/auth', auditMiddleware('auth.action'), authRoutes);
app.use('/api/patients', doctorRateLimiter, patientRoutes);
app.use('/api/medicines', doctorRateLimiter, medicineRoutes);
app.use('/api/reports', doctorRateLimiter, reportRoutes);
app.use('/api/prescriptions', doctorRateLimiter, prescriptionRoutes);
app.use('/api/admin', auditMiddleware('admin.action'), adminRoutes);
app.use('/api/payment', auditMiddleware('payment.action'), paymentRoutes);
app.use('/api/search', smartSearchRoutes);
app.use('/api/v3', ehV3ProxyRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/symptom-checker', symptomCheckerRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/translate', translationRoutes);
app.use('/api/eh-engine', healthRoutes);
app.use('/api/expert', ehExpertProxyRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/referral', referralRoutes);

// Uploaded reports (written by multer under backend/uploads)
// Serve files from backend/uploads to match where scripts write files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// E.H. Arogya — local live hub (work log + links)  →  http://localhost:PORT/eh-arogya/
const ehHubRoot = path.join(__dirname, '../local-site/eh-arogya');
if (fs.existsSync(path.join(ehHubRoot, 'index.html'))) {
  app.get('/eh-arogya', (_req, res) => res.redirect(301, '/eh-arogya/'));
  app.use('/eh-arogya', ehHubApi);
  app.use('/eh-arogya', express.static(ehHubRoot, { index: 'index.html', fallthrough: true }));
}
// Same server: docs HTML (project-dekho, etc.)  →  http://localhost:PORT/eh-arogya-docs/
const docsRoot = path.join(__dirname, '../docs');
if (fs.existsSync(docsRoot)) {
  app.use('/eh-arogya-docs', express.static(docsRoot, { fallthrough: true }));
}

// SPA: dev → live Vite (5173); production → frontend/dist build
const webDist = path.join(__dirname, '../frontend/dist');
const webDistIndex = path.join(webDist, 'index.html');
const isDev = (process.env.NODE_ENV || 'development') !== 'production';
const appDevUrl = (
  process.env.EH_NEXT_DEV_URL ||
  process.env.EH_VITE_DEV_URL ||
  'http://localhost:3001'
).replace(/\/$/, '');

// Purane static HTML — redirect to naya React Search (go-search clears PWA cache)
const legacyHtmlPaths = [
  '/doctor-analysis.html',
  '/demo-search.html',
  '/live-preview.html',
  '/autologin.html'
];
legacyHtmlPaths.forEach((legacyPath) => {
  app.get(legacyPath, (req, res) => {
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    if (isDev) {
      res.redirect(302, qs ? `${appDevUrl}${qs}` : appDevUrl);
      return;
    }
    res.redirect(302, qs ? `/${qs.replace(/^\?/, '')}` : '/');
  });
});

function isSpaBrowserRequest(req) {
  const p = req.path || '/';
  if (
    p.startsWith('/api') ||
    p.startsWith('/uploads') ||
    p.startsWith('/eh-arogya') ||
    p.startsWith('/eh-arogya-docs') ||
    p === '/health'
  ) {
    return false;
  }
  const accept = String(req.get('accept') || '');
  if (accept.includes('application/json') && !accept.includes('text/html')) return false;
  return req.method === 'GET' || req.method === 'HEAD';
}

const spaFallback = (indexFile) => (req, res, next) => {
  if (!isSpaBrowserRequest(req)) return next();
  res.sendFile(indexFile);
};

if (isDev) {
  // Port 5000 = API only in dev — stale frontend/dist was showing the OLD app
  app.get('*', (req, res, next) => {
    if (!isSpaBrowserRequest(req)) return next();
    return res.redirect(302, `${appDevUrl}${req.originalUrl}`);
  });
} else if (fs.existsSync(webDistIndex)) {
  app.use(express.static(webDist));
  app.get('*', spaFallback(webDistIndex));
} else {
  app.get('/', (req, res) => {
    res.status(503).type('html').send(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">
      <h1>EH CDSS</h1>
      <p>Web UI not built. Run one of:</p>
      <ul>
        <li><strong>Development:</strong> <code>npm run dev</code> then open <strong>http://localhost:3001/</strong></li>
        <li><strong>Production:</strong> <code>npm run build:web</code> then <code>npm start</code></li>
      </ul>
    </body></html>`);
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectPostgres();
    await connectRedis();

    server = app.listen(PORT, '0.0.0.0', () => {
      const httpTimeoutMs = Number(process.env.HTTP_SERVER_TIMEOUT_MS) || 720000;
      server.timeout = httpTimeoutMs;
      server.keepAliveTimeout = httpTimeoutMs + 30000;
      server.headersTimeout = httpTimeoutMs + 35000;
      startEhHubWatcher();
      const pg = getPostgresHealth();
      const pgLine =
        pg.enabled && pg.connected
          ? ' PostgreSQL: connected.'
          : pg.enabled
            ? ` PostgreSQL: NOT connected (${pg.lastError || 'unknown'}).`
            : '';
      const { networkInterfaces } = require('os');
      const nets = networkInterfaces();
      const networkLines = [];
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            networkLines.push(` Network: http://${net.address}:${PORT}`);
          }
        }
      }
      console.log(`
====================================================
 E.H. AROGYA SUTRA APP
 Server running on port: ${PORT}
 Local: http://localhost:${PORT}${networkLines.join('')}
 Environment: ${process.env.NODE_ENV || 'development'}
 App (dev):  ${appDevUrl}/  |  API: /api${pgLine}
 EH Python:  ${EXPERT_BASE}  |  summary: POST /api/summary/eh-api
 Local hub:  http://localhost:${PORT}/eh-arogya/
 SSE stream: http://localhost:${PORT}/eh-arogya/api/stream
 Docs HTML:  http://localhost:${PORT}/eh-arogya-docs/project-dekho.html
 Demo login: mobile ${process.env.DEMO_DOCTOR_MOBILE || '9876543210'} / password ${process.env.DEMO_DOCTOR_PASSWORD || 'demo123'}
 Admin login: mobile ${process.env.ADMIN_MOBILE || '9999999999'} / password ${process.env.ADMIN_PASSWORD || 'admin123'}
====================================================
      `);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`
[server] Port ${PORT} is already in use.
  → Close other terminals running "npm run dev", or run: npm run dev:fix
`);
        process.exit(1);
      }
      throw err;
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections — dev: log only (avoid 502 from Vite proxy kill)
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err?.stack || err?.message || err);
  if (process.env.NODE_ENV === 'production' || process.env.EH_STRICT_EXIT === '1') {
    if (server) {
      server.close(() => process.exit(1));
      return;
    }
    process.exit(1);
  }
});

// Handle uncaught exceptions (EADDRINUSE handled on server 'error' event)
process.on('uncaughtException', (err) => {
  if (err.code === 'EADDRINUSE') return;
  console.error('[uncaughtException]', err?.stack || err?.message || err);
  if (process.env.NODE_ENV === 'production' || process.env.EH_STRICT_EXIT === '1') {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('Process terminated');
    });
  }
});

startServer();

module.exports = app;