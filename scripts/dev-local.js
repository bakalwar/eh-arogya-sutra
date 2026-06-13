'use strict';

/**
 * Pristine local dev launcher — Next.js :3001 + Node :5000 + EH API :8005 + Baseline API :8001
 * On every boot: wipe stale caches → kill ghost ports → enforce EH API-only env.
 */
const { spawn } = require('child_process');
const path = require('path');
const { readLocalDevConfig } = require('./local-dev-guard');
const { buildMobileDevUrls, printMobileDevBanner, getLanIPv4 } = require('./network-urls');
const { wipeDevCache } = require('./wipe-dev-cache');

const cfg = readLocalDevConfig();
const NEXT_PORT = String(process.env.NEXT_DEV_PORT || '3001');
const API_PORT = String(process.env.PORT || '5000');
const PYTHON_PORT = '8005';
const NUMEROLOGY_PORT = '8001';
const PYTHON_URL = `http://127.0.0.1:${PYTHON_PORT}`;
const NUMEROLOGY_URL = `http://127.0.0.1:${NUMEROLOGY_PORT}`;

wipeDevCache();

const lan = getLanIPv4();
const mobile = buildMobileDevUrls({
  next: Number(NEXT_PORT),
  api: Number(API_PORT),
  python: Number(PYTHON_PORT),
});

const corsBase = (cfg.corsOrigins || []).filter(
  (o) => !/5178|5179/.test(String(o))
);
const corsExtra = lan
  ? [
      `http://${lan}:${NEXT_PORT}`,
      `http://${lan}:${API_PORT}`,
      `http://localhost:${NEXT_PORT}`,
      `http://127.0.0.1:${NEXT_PORT}`,
    ]
  : [
      `http://localhost:${NEXT_PORT}`,
      `http://127.0.0.1:${NEXT_PORT}`,
    ];
const corsAll = [...new Set([...corsBase, ...corsExtra])];

process.env.EH_LOCAL_DEV = '1';
process.env.APP_ENV = 'local';
process.env.NODE_ENV = 'development';
process.env.PORT = API_PORT;
process.env.HOST = '0.0.0.0';
process.env.NEXT_DEV_PORT = NEXT_PORT;
process.env.NEXT_DEV_HOST = '0.0.0.0';
process.env.EH_NEXT_DEV_URL = `http://localhost:${NEXT_PORT}`;
process.env.NEXT_PUBLIC_APP_ENV = 'local';
process.env.NEXT_PUBLIC_MOBILE_DEV_URL = mobile.next;
process.env.NEXT_PUBLIC_NODE_API_URL = `http://127.0.0.1:${API_PORT}`;
process.env.NEXT_PUBLIC_PYTHON_API_URL = PYTHON_URL;
process.env.NEXT_PUBLIC_NUMEROLOGY_API_URL = NUMEROLOGY_URL;
process.env.EH_NUMEROLOGY_API_URL = NUMEROLOGY_URL;
process.env.EH_LAN_IPV4 = lan || '';
process.env.EH_PYTHON_API_URL = PYTHON_URL;
process.env.EH_API_URL = PYTHON_URL;
process.env.EH_EXPERT_ENGINE_URL = PYTHON_URL;
process.env.CORS_ORIGIN = corsAll.join(',');

/** EH API only — no book / Node / Ollama fallbacks */
process.env.EH_ALLOW_TEMPLATE_FALLBACK = '0';
process.env.EH_EXPERT_FALLBACK_NODE = '0';
process.env.EH_NODE_SINGLE_ENGINE = '0';
process.env.EH_SUMMARY_MODE = 'eh-api';
process.env.EH_USE_SOURCE_OF_TRUTH = '0';

console.log('═══════════════════════════════════════════════════════');
console.log('  E.H. Arogya Sutra — PRISTINE LOCAL DEV');
console.log('  Pipeline: Next :3001 → Node :5000 → EH API :8005 + Baseline API :8001');
console.log('  EH API only (9 Rule Engines + 14k diseases + summary_engine)');
console.log(`  Primary UI:  http://0.0.0.0:${NEXT_PORT}/reports`);
console.log(`  Node API:    http://0.0.0.0:${API_PORT}`);
console.log(`  Python API:  ${PYTHON_URL}`);
console.log(`  Baseline API: ${NUMEROLOGY_URL}`);
printMobileDevBanner({ next: Number(NEXT_PORT), api: Number(API_PORT), python: Number(PYTHON_PORT) });

function start(name, command, args, options = {}) {
  console.log(`Starting ${name}…`);
  const proc = spawn(command, args, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...options.env },
    ...options,
  });
  proc.on('error', (err) => console.error(`Failed to start ${name}:`, err));
  return proc;
}

const root = path.join(__dirname, '..');
const api = start('Node API', 'npm', ['run', 'dev:api'], { cwd: root });
const web = start('Next.js App', 'node', ['scripts/start-next-dev.js'], { cwd: root });
const python = start('Python EH API', 'npm', ['run', 'expert-engine'], { cwd: root });
const numerology = start('Baseline API', 'npm', ['run', 'numerology-api'], { cwd: root });

function shutdown() {
  console.log('\nStopping local dev processes…');
  api.kill();
  web.kill();
  python.kill();
  numerology.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
