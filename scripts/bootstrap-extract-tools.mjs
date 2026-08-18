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
const VERIFIED_PATH = path.join(TOOLS_ROOT, 'toolchain.verified.json');
const BUILD_DIR = path.join(TOOLS_ROOT, 'build', 'tesseract-src');

function fail(code, message, exitCode = 1) {
  console.error(`${code}: ${message}`);
  process.exit(exitCode);
}

function sha256File(filePath) {
  const body = fs.readFileSync(filePath);
  return createHash('sha256').update(body).digest('hex');
}

function sha256Text(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    fail('OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED', `Missing manifest: ${MANIFEST_PATH}`);
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function assertManifestHashes(manifest) {
  for (const [lang, spec] of Object.entries(manifest.tessdataFast.languages)) {
    const sha = String(spec.sha256 ?? '');
    if (!sha || sha.length !== 64 || /placeholder|bootstrap/i.test(sha)) {
      fail(
        'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
        `Manifest tessdata ${lang} sha256 must be exact 64-char hex (no placeholder)`,
      );
    }
  }
}

function computeToolchainFingerprint(manifest, tessdataHashes, tesseractVersionLine) {
  const payload = JSON.stringify({
    schemaVersion: manifest.schemaVersion,
    pipelineConfigVersion: manifest.pipelineConfigVersion,
    pdfjsVersion: manifest.pdfjs.version,
    pdfjsLicense: manifest.pdfjs.license,
    tesseractVersion: manifest.tesseract.version,
    tesseractSourceTag: manifest.tesseract.sourceTag,
    tessdataCommit: manifest.tessdataFast.commit,
    tessdataLicense: manifest.tessdataFast.license,
    tessdataHashes,
    tesseractVersionLine: tesseractVersionLine.trim(),
  });
  return sha256Text(payload);
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
  fs.mkdirSync(TESSDATA_DIR, { recursive: true, mode: 0o700 });
  const langs = manifest.tessdataFast.languages;
  const verifiedHashes = {};

  for (const [lang, spec] of Object.entries(langs)) {
    const dest = path.join(TESSDATA_DIR, spec.file);
    if (!fs.existsSync(dest)) {
      console.log(`Downloading tessdata ${lang}`);
      execFileSync('curl', ['-fsSL', spec.downloadUrl, '-o', dest], { stdio: 'inherit' });
    }
    fs.chmodSync(dest, 0o600);
    const computed = sha256File(dest);
    if (computed !== spec.sha256) {
      fail(
        'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
        `tessdata ${lang} sha256 mismatch: expected ${spec.sha256}, got ${computed}`,
      );
    }
    verifiedHashes[lang] = computed;
  }
  return verifiedHashes;
}

function buildTesseractLinux(manifest) {
  const tag = manifest.tesseract.sourceTag;
  const bin = tesseractBin();
  if (fs.existsSync(bin)) {
    const versionOut = spawnSync(bin, ['--version'], { encoding: 'utf8' });
    const combined = `${versionOut.stdout ?? ''}${versionOut.stderr ?? ''}`;
    if (versionOut.status === 0 && combined.includes(manifest.tesseract.versionOutputMustContain)) {
      console.log(`Tesseract ${tag} already installed`);
      return combined.trim().split('\n')[0];
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

  const out = spawnSync(bin, ['--version'], { encoding: 'utf8' });
  return `${out.stdout ?? ''}${out.stderr ?? ''}`.trim().split('\n')[0];
}

function verifyTesseractVersion(manifest) {
  const bin = tesseractBin();
  if (!fs.existsSync(bin)) {
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
  const langs = spawnSync(bin, ['--list-langs', '--tessdata-dir', TESSDATA_DIR], {
    encoding: 'utf8',
    env: { ...process.env, TESSDATA_PREFIX: path.dirname(TESSDATA_DIR) },
  });
  const langOut = `${langs.stdout ?? ''}${langs.stderr ?? ''}`;
  if (!/\beng\b/.test(langOut) || !/\bhin\b/.test(langOut)) {
    fail(
      'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
      `tesseract --list-langs must include eng and hin; got: ${langOut.trim()}`,
    );
  }
  const smokePath = path.join(TOOLS_ROOT, 'smoke.pnm');
  const smokeOut = path.join(TOOLS_ROOT, 'smoke-ocr');
  const smoke = Buffer.concat([Buffer.from('P6\n8 8\n255\n'), Buffer.alloc(8 * 8 * 3, 255)]);
  fs.writeFileSync(smokePath, smoke, { mode: 0o600 });
  const smokeEnv = { ...process.env };
  delete smokeEnv.TESSDATA_PREFIX;
  const smokeOcr = spawnSync(
    bin,
    [
      smokePath,
      smokeOut,
      '--tessdata-dir',
      TESSDATA_DIR,
      '-l',
      'eng+hin',
      '--psm',
      '6',
      '-c',
      'tessedit_create_tsv=1',
    ],
    { encoding: 'utf8', env: smokeEnv },
  );
  if (smokeOcr.status !== 0 || !fs.existsSync(`${smokeOut}.tsv`)) {
    fail(
      'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
      `tesseract smoke PNM TSV OCR failed: ${(smokeOcr.stderr ?? smokeOcr.stdout ?? '').trim()}`,
    );
  }
  return combined.trim().split('\n')[0];
}

function writeVerifiedMarker(manifest, tessdataHashes, tesseractVersionLine) {
  const toolchainFingerprint = computeToolchainFingerprint(
    manifest,
    tessdataHashes,
    tesseractVersionLine,
  );
  let prior = null;
  if (fs.existsSync(VERIFIED_PATH)) {
    prior = JSON.parse(fs.readFileSync(VERIFIED_PATH, 'utf8'));
    if (prior.toolchainFingerprint && prior.toolchainFingerprint !== toolchainFingerprint) {
      console.log('Stale toolchain marker detected — re-verifying pinned artifacts');
    }
  }
  const marker = {
    schemaVersion: manifest.schemaVersion,
    toolchainFingerprint,
    verifiedAt: new Date().toISOString(),
    tesseract: {
      version: manifest.tesseract.version,
      sourceTag: manifest.tesseract.sourceTag,
      sourceUrl: manifest.tesseract.sourceUrl,
      license: manifest.tesseract.license,
      versionLine: tesseractVersionLine,
    },
    tessdataFast: {
      commit: manifest.tessdataFast.commit,
      license: manifest.tessdataFast.license,
      languages: Object.fromEntries(
        Object.entries(manifest.tessdataFast.languages).map(([lang, spec]) => [
          lang,
          { file: spec.file, sha256: tessdataHashes[lang], downloadUrl: spec.downloadUrl },
        ]),
      ),
    },
    pdfjs: {
      version: manifest.pdfjs.version,
      license: manifest.pdfjs.license,
    },
    pipelineConfigVersion: manifest.pipelineConfigVersion,
  };
  fs.mkdirSync(TOOLS_ROOT, { recursive: true, mode: 0o700 });
  fs.writeFileSync(VERIFIED_PATH, `${JSON.stringify(marker, null, 2)}\n`, { mode: 0o600 });
  void prior;
  return toolchainFingerprint;
}

const manifest = readManifest();
assertManifestHashes(manifest);
fs.mkdirSync(TOOLS_ROOT, { recursive: true, mode: 0o700 });

const tessdataHashes = ensureTessdata(manifest);
let tesseractVersionLine = '';

if (process.platform === 'linux') {
  tesseractVersionLine = buildTesseractLinux(manifest);
  tesseractVersionLine = verifyTesseractVersion(manifest);
} else if (process.env.CI) {
  fail(
    'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
    'CI requires Linux to build and verify Tesseract 5.5.3',
  );
} else {
  console.log(
    `bootstrap:extract-tools — tessdata verified on ${process.platform}; tesseract build is Linux-only`,
  );
  tesseractVersionLine = `skipped-non-linux:${manifest.tesseract.version}`;
}

const fingerprint = writeVerifiedMarker(manifest, tessdataHashes, tesseractVersionLine);
console.log(`EHAS2 extract tools bootstrap complete (fingerprint ${fingerprint.slice(0, 16)}…).`);
