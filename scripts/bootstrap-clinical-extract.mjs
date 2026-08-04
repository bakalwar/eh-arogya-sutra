#!/usr/bin/env node
/**
 * Lockfile-based install for offline clinical extract tools (better-sqlite3).
 * Run explicitly: npm run bootstrap:clinical-extract (not root postinstall).
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOOL_DIR = path.join(ROOT, 'tools', 'clinical-extract');
const LOCK = path.join(TOOL_DIR, 'package-lock.json');
const SUPPORTED_NODE_MAJOR = 20;

function fail(typedCode, message, exitCode = 1) {
  const code = Number.isFinite(exitCode) && exitCode !== 0 ? exitCode : 1;
  console.error(`EHAS2_CLINICAL_EXTRACT_BOOTSTRAP_${typedCode}: ${message}`);
  process.exit(code);
}

function parseNodeMajor(version) {
  const major = Number(String(version).split('.')[0]);
  return Number.isFinite(major) ? major : NaN;
}

const nodeMajor = parseNodeMajor(process.versions.node);
if (nodeMajor !== SUPPORTED_NODE_MAJOR) {
  fail(
    'UNSUPPORTED_NODE',
    `Node ${process.versions.node} is not supported for better-sqlite3 bootstrap. Use Node 20.x (project engines). Current major: ${nodeMajor}. Install Node 20.20.2 and re-run npm run bootstrap:clinical-extract`,
  );
}

if (!fs.existsSync(path.join(TOOL_DIR, 'package.json'))) {
  fail('MISSING_PACKAGE', 'tools/clinical-extract/package.json not found');
}
if (!fs.existsSync(LOCK)) {
  fail('MISSING_LOCK', 'Run npm install in tools/clinical-extract to generate package-lock.json');
}

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmArgs = ['ci'];

let exitCode = 0;
try {
  execFileSync(npmCmd, npmArgs, {
    cwd: TOOL_DIR,
    stdio: 'inherit',
    env: { ...process.env, npm_config_audit: 'false', npm_config_fund: 'false' },
  });
} catch (err) {
  const code = typeof err === 'object' && err && 'status' in err ? Number(err.status) : 1;
  exitCode = Number.isFinite(code) && code !== 0 ? code : 1;
  fail(
    'NATIVE_MODULE',
    'better-sqlite3 install failed. Use Node 20.x LTS, install Visual Studio Build Tools (Windows) or build-essential (Linux), then re-run npm run bootstrap:clinical-extract',
    exitCode,
  );
}

const nativeModule = path.join(TOOL_DIR, 'node_modules', 'better-sqlite3');
if (!fs.existsSync(nativeModule)) {
  fail('INCOMPLETE', 'better-sqlite3 missing after npm ci in tools/clinical-extract');
}

console.log('EHAS2 clinical-extract tools ready (better-sqlite3 installed).');
process.exit(exitCode);
