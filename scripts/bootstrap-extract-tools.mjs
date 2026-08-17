#!/usr/bin/env node
/**
 * Bootstrap pinned open-source extract toolchain (Tesseract 5.5.3 + tessdata).
 * Run explicitly: npm run bootstrap:extract-tools (CI + Linux dev).
 * Extraction jobs must not download at runtime — only this bootstrap path.
 */
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ADAPTERS_PKG = path.join(ROOT, 'packages', 'evidence-extract-adapters');
const TOOLS_ROOT = path.join(ADAPTERS_PKG, '.extract-tools');
const TESSERACT_PREFIX = path.join(TOOLS_ROOT, 'tesseract');
const TESSDATA_DIR = path.join(TOOLS_ROOT, 'tessdata');
const MANIFEST_PATH = path.join(ROOT, 'vendor', 'manifests', 'extract-toolchain.json');
const VERIFIED_PATH = path.join(TOOLS_ROOT, 'tessdata.verified.json');
const BUILD_DIR = path.join(TOOLS_ROOT, 'build', 'tesseract-src');

function fail(code, message, exitCode = 1) {
  console.error(`${code}: ${message}`);
  process.exit(exitCode);
}

function sha256File(filePath) {
  const body = fs.readFileSync(filePath);
  return createHash('sha256').update(body).digest('hex');
}

function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    fail('OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED', `Missing manifest: ${MANIFEST_PATH}`);
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function tesseractBin() {
  const ext = process.platform === 'win32' ? '.exe' : '';
  return path.join(TESSERACT_PREFIX, 'bin', `tesseract${ext}`);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false, ...opts });
  if (r.status !== 0) {
    fail(
      'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
      `${cmd} ${args.join(' ')} failed (exit ${r.status})`,
    );
  }
}

function ensureTessdata(manifest) {
  fs.mkdirSync(TESSDATA_DIR, { recursive: true });
  const langs = manifest.tessdataFast.languages;
  const verified = fs.existsSync(VERIFIED_PATH)
    ? JSON.parse(fs.readFileSync(VERIFIED_PATH, 'utf8'))
    : {};
  let verifiedChanged = false;

  for (const [lang, spec] of Object.entries(langs)) {
    const dest = path.join(TESSDATA_DIR, spec.file);
    if (!fs.existsSync(dest)) {
      console.log(`Downloading tessdata ${lang} → ${dest}`);
      execFileSync('curl', ['-fsSL', spec.downloadUrl, '-o', dest], { stdio: 'inherit' });
    }
    const computed = sha256File(dest);
    const expected =
      spec.sha256 === 'PLACEHOLDER_VERIFIED_BY_BOOTSTRAP' ? verified[lang]?.sha256 : spec.sha256;
    if (!expected) {
      verified[lang] = { file: spec.file, sha256: computed };
      verifiedChanged = true;
      console.log(`Recorded tessdata sha256 for ${lang}: ${computed}`);
      continue;
    }
    if (computed !== expected) {
      fail(
        'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
        `tessdata ${lang} sha256 mismatch: expected ${expected}, got ${computed}`,
      );
    }
  }

  if (verifiedChanged) {
    fs.mkdirSync(TOOLS_ROOT, { recursive: true });
    fs.writeFileSync(VERIFIED_PATH, `${JSON.stringify(verified, null, 2)}\n`);
  }
}

function buildTesseractLinux(manifest) {
  const tag = manifest.tesseract.sourceTag;
  const bin = tesseractBin();
  if (fs.existsSync(bin)) {
    const versionOut = spawnSync(bin, ['--version'], { encoding: 'utf8' });
    if (
      versionOut.status === 0 &&
      versionOut.stdout.includes(manifest.tesseract.versionOutputMustContain)
    ) {
      console.log(`Tesseract ${tag} already installed at ${bin}`);
      return;
    }
  }

  fs.mkdirSync(BUILD_DIR, { recursive: true });
  const srcDir = path.join(BUILD_DIR, 'tesseract');
  if (!fs.existsSync(path.join(srcDir, '.git'))) {
    run('git', [
      'clone',
      '--depth',
      '1',
      '--branch',
      tag,
      'https://github.com/tesseract-ocr/tesseract.git',
      srcDir,
    ]);
  }

  const autogen = path.join(srcDir, 'autogen.sh');
  if (fs.existsSync(autogen)) {
    run('bash', [autogen], { cwd: srcDir });
  }

  run('./configure', [`--prefix=${TESSERACT_PREFIX}`], { cwd: srcDir });
  run('make', ['-j', String(Math.max(2, os.cpus().length))], { cwd: srcDir });
  run('make', ['install'], { cwd: srcDir });
}

function verifyTesseractVersion(manifest) {
  const bin = tesseractBin();
  if (!fs.existsSync(bin)) {
    if (process.platform !== 'linux') {
      console.log(`Skipping tesseract binary verify on ${process.platform} (no local build)`);
      return;
    }
    fail('OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED', `Tesseract binary missing: ${bin}`);
  }
  const out = spawnSync(bin, ['--version'], { encoding: 'utf8' });
  const combined = `${out.stdout ?? ''}${out.stderr ?? ''}`;
  if (!combined.includes(manifest.tesseract.versionOutputMustContain)) {
    fail(
      'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
      `tesseract --version must contain ${manifest.tesseract.versionOutputMustContain}; got: ${combined.trim()}`,
    );
  }
  console.log(`Verified tesseract: ${combined.trim().split('\n')[0]}`);
}

const manifest = readManifest();
fs.mkdirSync(TOOLS_ROOT, { recursive: true });

if (process.platform === 'linux') {
  ensureTessdata(manifest);
  buildTesseractLinux(manifest);
  verifyTesseractVersion(manifest);
} else {
  console.log(`bootstrap:extract-tools — tessdata verify only on ${process.platform}`);
  if (fs.existsSync(TESSDATA_DIR) || process.env.CI) {
    ensureTessdata(manifest);
  }
  verifyTesseractVersion(manifest);
}

console.log('EHAS2 extract tools bootstrap complete.');
