#!/usr/bin/env node
/**
 * Deploy next-app to Vercel production (NOT the legacy Vite frontend).
 * Usage: npm run deploy:vercel:next
 */
process.env.EH_LOCAL_DEV = '0';
process.env.APP_ENV = 'production';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { assertNotLocalDev } = require('./local-dev-guard');

assertNotLocalDev('Vercel Next.js production deploy');

const root = path.join(__dirname, '..');
const nextApp = path.join(root, 'next-app');

function loadRailwayApi() {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(root, 'config', 'railway-production.json'), 'utf8')
    ).apiUrl.replace(/\/$/, '');
  } catch {
    return 'https://eh-arogya-api-production.up.railway.app';
  }
}

/** Production build must not inherit NODE_ENV=local from shell/.env (breaks /login prerender). */
function productionDeployEnv() {
  const railway = loadRailwayApi();
  return {
    ...process.env,
    NODE_ENV: 'production',
    APP_ENV: 'production',
    EH_LOCAL_DEV: '0',
    NEXT_PUBLIC_APP_ENV: 'production',
    NEXT_PUBLIC_NODE_API_URL:
      process.env.NEXT_PUBLIC_NODE_API_URL ||
      process.env.RAILWAY_API_URL ||
      railway,
  };
}

const deployEnv = productionDeployEnv();

console.log('[deploy:next] Building next-app (NODE_ENV=production)...');
execSync('npm run build', { cwd: nextApp, stdio: 'inherit', env: deployEnv });

console.log('[deploy:next] Uploading to Vercel production...');
execSync('npx vercel deploy --prod --yes --force', {
  cwd: nextApp,
  stdio: 'inherit',
  env: deployEnv,
});

console.log('[deploy:next] Done — verify https://eh-arogya-sutra.vercel.app/login');
