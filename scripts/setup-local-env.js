'use strict';

/**
 * Ensure strict local dev env files exist and root .env has EH_LOCAL_DEV=1 + local API URLs.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const LOCAL_ENV_LINES = [
  '',
  '# ── Local Development Mode (auto-added by npm run setup:local) ──',
  'EH_LOCAL_DEV=1',
  'APP_ENV=local',
  'PORT=5000',
  'NEXT_PUBLIC_APP_ENV=local',
  'NEXT_PUBLIC_NODE_API_URL=http://127.0.0.1:5000',
  'NEXT_PUBLIC_PYTHON_API_URL=http://127.0.0.1:8005',
  'EH_PYTHON_API_URL=http://127.0.0.1:8005',
  'EH_API_URL=http://127.0.0.1:8005',
  'EH_EXPERT_ENGINE_URL=http://127.0.0.1:8005',
  'EH_ALLOW_TEMPLATE_FALLBACK=0',
  'EH_EXPERT_FALLBACK_NODE=0',
  'EH_NODE_SINGLE_ENGINE=0',
  'EH_SUMMARY_MODE=eh-api',
  'CORS_ORIGIN=http://localhost:3001,http://127.0.0.1:3001,http://localhost:5000,http://127.0.0.1:5000',
];

const LOCAL_KEYS = [
  'EH_LOCAL_DEV',
  'APP_ENV',
  'NEXT_PUBLIC_APP_ENV',
  'EH_PYTHON_API_URL',
  'EH_API_URL',
  'EH_EXPERT_ENGINE_URL',
];

function copyIfMissing(src, dest, label) {
  if (fs.existsSync(dest)) {
    console.log(`[setup:local] ${label} already exists — skipped`);
    return false;
  }
  if (!fs.existsSync(src)) {
    console.warn(`[setup:local] ${label} template missing: ${src}`);
    return false;
  }
  fs.copyFileSync(src, dest);
  console.log(`[setup:local] Created ${label} from template`);
  return true;
}

function ensureRootEnvLocal() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(path.join(root, '.env.local.example'), envPath);
    console.log('[setup:local] Created repo .env from .env.local.example');
    return;
  }

  const raw = fs.readFileSync(envPath, 'utf8');
  const missing = LOCAL_KEYS.filter((key) => !new RegExp(`^${key}=`, 'm').test(raw));
  if (missing.length === 0) {
    console.log('[setup:local] repo .env already has local dev keys');
    return;
  }

  fs.appendFileSync(envPath, LOCAL_ENV_LINES.join('\n') + '\n');
  console.log(`[setup:local] Appended local dev keys to .env: ${missing.join(', ')}`);
}

copyIfMissing(path.join(root, '.env.local.example'), path.join(root, '.env'), 'repo .env');
ensureRootEnvLocal();
copyIfMissing(
  path.join(root, 'frontend/.env.local.example'),
  path.join(root, 'frontend/.env.local'),
  'frontend/.env.local'
);
copyIfMissing(
  path.join(root, 'next-app/.env.local.example'),
  path.join(root, 'next-app/.env.local'),
  'next-app/.env.local'
);

console.log('\n[setup:local] Local Development Mode ready.');
console.log('  npm run dev:next    — pristine boot: Next :3001 + Node :5000 + Python :8005');
console.log('  npm run dev:restart — wipe cache + kill ports + dev:next');
