'use strict';

/**
 * Railway release phase — Postgres schema + numerology DB seed (first deploy / missing DB).
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const numerologyDir = path.join(root, 'numerology-api');
const numerologyDb = path.join(numerologyDir, 'numerology.db');
const venvPython =
  process.platform === 'win32'
    ? path.join(root, 'eh-venv', 'Scripts', 'python.exe')
    : path.join(root, 'eh-venv', 'bin', 'python');
const pythonCmd = fs.existsSync(venvPython)
  ? venvPython
  : process.platform === 'win32'
    ? 'python'
    : 'python3';

const schemaResult = spawnSync('node', ['database/apply-schema.js'], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
  shell: false,
});

if (schemaResult.status !== 0) {
  console.warn(
    '[release] Schema apply failed (status',
    schemaResult.status,
    ') — deploy will continue. Fix DATABASE_URL / POSTGRES_* if needed.'
  );
}

if (!fs.existsSync(numerologyDb)) {
  console.log('[release] Seeding numerology.db (template mode, no Anthropic)...');
  const seedResult = spawnSync(pythonCmd, ['generate_numerology_db.py', '--templates'], {
    cwd: numerologyDir,
    env: process.env,
    stdio: 'inherit',
    shell: false,
  });
  if (seedResult.status !== 0) {
    console.warn('[release] Numerology seed failed — baseline API may return empty until fixed.');
  }
} else {
  console.log('[release] numerology.db present — skipping template seed.');
}

process.exit(0);
