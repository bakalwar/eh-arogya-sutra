#!/usr/bin/env node
/**
 * Cross-platform unittest runner for apps/clinical-engine (no auto venv install).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = path.join(ROOT, 'apps', 'clinical-engine');
const TESTS = path.join(ENGINE, 'tests');
const SRC = path.join(ENGINE, 'src');

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.X_OK);
    return true;
  } catch {
    return fs.existsSync(p);
  }
}

function venvPythonCandidates() {
  const win = process.platform === 'win32';
  const base = path.join(ENGINE, '.venv');
  if (win) {
    return [path.join(base, 'Scripts', 'python.exe'), path.join(base, 'Scripts', 'python3.exe')];
  }
  return [path.join(base, 'bin', 'python3'), path.join(base, 'bin', 'python')];
}

function resolvePython() {
  for (const p of venvPythonCandidates()) {
    if (exists(p)) return p;
  }
  const fromEnv = process.env.PYTHON?.trim();
  if (fromEnv && exists(fromEnv)) return fromEnv;

  if (process.platform === 'win32') {
    for (const cmd of ['py', 'python', 'python3']) {
      const r = spawnSync(cmd, ['-3', '-c', 'import sys; print(sys.executable)'], {
        encoding: 'utf8',
        shell: false,
      });
      if (r.status === 0 && r.stdout?.trim() && exists(r.stdout.trim())) {
        return r.stdout.trim();
      }
    }
  }

  for (const cmd of ['python3', 'python']) {
    const r = spawnSync(cmd, ['-c', 'import sys; print(sys.executable)'], {
      encoding: 'utf8',
      shell: false,
    });
    if (r.status === 0 && r.stdout?.trim() && exists(r.stdout.trim())) {
      return r.stdout.trim();
    }
  }

  console.error(
    'EHAS2_CLINICAL_ENGINE_TESTS: Python not found. Create apps/clinical-engine/.venv, run pip install -r requirements.txt, or set PYTHON to a 3.x interpreter.',
  );
  process.exit(127);
}

const python = resolvePython();
const env = {
  ...process.env,
  PYTHONPATH: [SRC, process.env.PYTHONPATH].filter(Boolean).join(path.delimiter),
};

const result = spawnSync(python, ['-m', 'unittest', 'discover', '-s', TESTS, '-p', 'test_*.py'], {
  cwd: ROOT,
  env,
  stdio: 'inherit',
});

if (result.error) {
  console.error(`EHAS2_CLINICAL_ENGINE_TESTS: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
