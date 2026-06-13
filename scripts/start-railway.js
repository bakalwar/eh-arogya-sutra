'use strict';

/**
 * Railway production — Node API + EH Python (:8005) + Numerology API (:8001) in one container.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ehApiDir = path.join(root, 'eh-api');
const numerologyDir = path.join(root, 'numerology-api');
const venvPython =
  process.platform === 'win32'
    ? path.join(root, 'eh-venv', 'Scripts', 'python.exe')
    : path.join(root, 'eh-venv', 'bin', 'python');
const pythonCmd = fs.existsSync(venvPython)
  ? venvPython
  : process.platform === 'win32'
    ? 'python'
    : 'python3';

const EH_PORT = process.env.EH_API_PORT || '8005';
const EH_BASE = `http://127.0.0.1:${EH_PORT}`;
const NUM_PORT = process.env.NUMEROLOGY_API_PORT || '8001';
const NUM_BASE = `http://127.0.0.1:${NUM_PORT}`;

if (!process.env.EH_PYTHON_API_URL) process.env.EH_PYTHON_API_URL = EH_BASE;
if (!process.env.EH_API_URL) process.env.EH_API_URL = EH_BASE;
if (!process.env.EH_NUMEROLOGY_API_URL) process.env.EH_NUMEROLOGY_API_URL = NUM_BASE;
if (!process.env.EH_SUMMARY_MIN_WORDS) process.env.EH_SUMMARY_MIN_WORDS = '500';
if (!process.env.EH_SUMMARY_TARGET_WORDS) process.env.EH_SUMMARY_TARGET_WORDS = '550';

const childProcs = [];

function startNode() {
  console.log('[railway] Starting Node backend...');
  const nodeProc = spawn('node', ['backend/server.js'], {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: false,
  });
  nodeProc.on('exit', (code) => {
    console.error('[railway] Node exited', code);
    process.exit(code || 1);
  });
  childProcs.push(nodeProc);
  return nodeProc;
}

function startEhApi() {
  console.log(`[railway] Starting EH Python API on ${EH_BASE} ...`);
  const py = spawn(pythonCmd, ['eh_api.py'], {
    cwd: ehApiDir,
    env: { ...process.env, PORT: EH_PORT },
    stdio: 'inherit',
    shell: false,
  });
  py.on('error', (err) => {
    console.error('[railway] EH API failed to start:', err.message);
  });
  py.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error('[railway] EH API exited', code, '(Node API continues)');
    }
  });
  childProcs.push(py);
  return py;
}

function startNumerologyApi() {
  console.log(`[railway] Starting Numerology API on ${NUM_BASE} ...`);
  const py = spawn(pythonCmd, ['numerology_api.py'], {
    cwd: numerologyDir,
    env: {
      ...process.env,
      NUMEROLOGY_API_PORT: NUM_PORT,
      PORT: NUM_PORT,
    },
    stdio: 'inherit',
    shell: false,
  });
  py.on('error', (err) => {
    console.error('[railway] Numerology API failed to start:', err.message);
  });
  py.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error('[railway] Numerology API exited', code, '(Node API continues)');
    }
  });
  childProcs.push(py);
  return py;
}

startNumerologyApi();
startEhApi();
startNode();

function shutdown() {
  for (const proc of childProcs) {
    try {
      proc.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
