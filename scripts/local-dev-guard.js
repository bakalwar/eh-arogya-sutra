'use strict';

/**
 * Blocks cloud deploy scripts when EH_LOCAL_DEV=1 or APP_ENV=local.
 * Usage: node scripts/local-dev-guard.js deploy:vercel
 */
const fs = require('fs');
const path = require('path');

function loadRootEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
  try {
    require('dotenv').config({ path: envPath });
  } catch {
    /* dotenv optional */
  }
}

loadRootEnv();

function readLocalDevConfig() {
  try {
    const p = path.join(__dirname, '../config/local-dev.json');
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return { blockCloudDeploy: true };
  }
}

function isLocalDevMode() {
  return (
    process.env.EH_LOCAL_DEV === '1' ||
    String(process.env.APP_ENV || '').toLowerCase() === 'local'
  );
}

function assertNotLocalDev(actionLabel = 'Cloud deploy') {
  if (!isLocalDevMode()) return;
  console.error(
    `\n[local-dev] ${actionLabel} blocked — workspace is in Local Development Mode.\n` +
      '  Set EH_LOCAL_DEV=0 and APP_ENV=staging|production to deploy.\n' +
      '  Primary UI: http://127.0.0.1:3001/reports (Next.js)\n' +
      '  API chain: Node http://127.0.0.1:5000 → Python EH API http://127.0.0.1:8005\n'
  );
  process.exit(1);
}

module.exports = { isLocalDevMode, assertNotLocalDev, readLocalDevConfig };

if (require.main === module) {
  assertNotLocalDev(process.argv[2] || 'Cloud deploy');
}
