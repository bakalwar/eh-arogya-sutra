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
const FONT_DIR = path.join(TOOLS_ROOT, 'fonts');
const DEVANAGARI_FONT_PATH = path.join(FONT_DIR, 'NotoSansDevanagari-Regular.ttf');
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
  const sourceCommit = String(manifest.tesseract?.sourceCommit ?? '');
  if (!/^[0-9a-f]{40}$/.test(sourceCommit)) {
    fail(
      'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
      'Manifest tesseract.sourceCommit must be exact 40-char lowercase hex',
    );
  }
  for (const [lang, spec] of Object.entries(manifest.tessdataFast.languages)) {
    const sha = String(spec.sha256 ?? '');
    if (!sha || sha.length !== 64 || /placeholder|bootstrap/i.test(sha)) {
      fail(
        'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
        `Manifest tessdata ${lang} sha256 must be exact 64-char hex (no placeholder)`,
      );
    }
  }
  const fontCommit = String(manifest.devanagariFont?.commit ?? '');
  const fontSha = String(manifest.devanagariFont?.sha256 ?? '');
  if (!/^[0-9a-f]{40}$/.test(fontCommit)) {
    fail(
      'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
      'Manifest Devanagari font commit must be exact 40-char lowercase hex',
    );
  }
  if (!/^[0-9a-f]{64}$/.test(fontSha) || /placeholder|bootstrap/i.test(fontSha)) {
    fail(
      'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
      'Manifest Devanagari font sha256 must be exact 64-char lowercase hex',
    );
  }
}

function computeToolchainFingerprint({
  manifest,
  tessdataHashes,
  tesseractVersionLine,
  binarySha256,
  fontSha256,
}) {
  return sha256Text(
    JSON.stringify({
      schemaVersion: manifest.schemaVersion,
      pipelineConfigVersion: manifest.pipelineConfigVersion,
      pdfjsVersion: manifest.pdfjs.version,
      pdfjsLicense: manifest.pdfjs.license,
      tesseractVersion: manifest.tesseract.version,
      tesseractSourceTag: manifest.tesseract.sourceTag,
      tesseractSourceCommit: manifest.tesseract.sourceCommit,
      tesseractBuildConfigId: manifest.tesseract.buildConfigId,
      tessdataCommit: manifest.tessdataFast.commit,
      tessdataLicense: manifest.tessdataFast.license,
      tessdataHashes,
      tesseractVersionLine: tesseractVersionLine.trim(),
      binarySha256,
      devanagariFontCommit: manifest.devanagariFont.commit,
      devanagariFontSha256: fontSha256,
      devanagariFontFilePath: manifest.devanagariFont.filePath,
      devanagariFontLicense: manifest.devanagariFont.license,
    }),
  );
}

function validateVerifiedToolchainMarker(marker, manifest) {
  if (!/^[0-9a-f]{64}$/.test(String(marker?.toolchainFingerprint ?? ''))) {
    return { ok: false };
  }
  if (marker?.tesseract?.sourceCommit !== manifest.tesseract.sourceCommit) return { ok: false };
  if (marker?.tesseract?.sourceTag !== manifest.tesseract.sourceTag) return { ok: false };
  if (marker?.tesseract?.buildConfigId !== manifest.tesseract.buildConfigId) return { ok: false };
  if (marker?.tesseract?.version !== manifest.tesseract.version) return { ok: false };
  if (marker?.devanagariFont?.commit !== manifest.devanagariFont.commit) return { ok: false };
  if (marker?.devanagariFont?.sha256 !== manifest.devanagariFont.sha256) return { ok: false };
  if (marker?.tessdataFast?.commit !== manifest.tessdataFast.commit) return { ok: false };
  if (marker?.tessdataFast?.languages?.eng?.sha256 !== manifest.tessdataFast.languages.eng.sha256)
    return { ok: false };
  if (marker?.tessdataFast?.languages?.hin?.sha256 !== manifest.tessdataFast.languages.hin.sha256)
    return { ok: false };
  return { ok: true };
}

function tesseractBin() {
  const ext = process.platform === 'win32' ? '.exe' : '';
  return path.join(TESSERACT_PREFIX, 'bin', `tesseract${ext}`);
}

function gitOutput(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
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

function ensureDevanagariFont(manifest) {
  fs.mkdirSync(FONT_DIR, { recursive: true, mode: 0o700 });
  if (!fs.existsSync(DEVANAGARI_FONT_PATH)) {
    console.log('Downloading verified Devanagari font');
    execFileSync(
      'curl',
      ['-fsSL', manifest.devanagariFont.downloadUrl, '-o', DEVANAGARI_FONT_PATH],
      {
        stdio: 'inherit',
      },
    );
  }
  fs.chmodSync(DEVANAGARI_FONT_PATH, 0o600);
  const computed = sha256File(DEVANAGARI_FONT_PATH);
  if (computed !== manifest.devanagariFont.sha256) {
    fail(
      'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
      `Devanagari font sha256 mismatch: expected ${manifest.devanagariFont.sha256}, got ${computed}`,
    );
  }
  return computed;
}

function buildTesseractLinux(manifest) {
  const tag = manifest.tesseract.sourceTag;
  const expectedCommit = manifest.tesseract.sourceCommit;
  const bin = tesseractBin();

  fs.mkdirSync(BUILD_DIR, { recursive: true });
  const srcDir = path.join(BUILD_DIR, 'tesseract');
  if (!fs.existsSync(path.join(srcDir, '.git'))) {
    fs.rmSync(srcDir, { recursive: true, force: true });
    run('git', [
      'clone',
      '--depth',
      '1',
      '--branch',
      tag,
      manifest.tesseract.sourceRepositoryUrl,
      srcDir,
    ]);
  }
  const actualTagHead = gitOutput(['rev-parse', 'HEAD'], srcDir).toLowerCase();
  if (actualTagHead !== expectedCommit) {
    fail(
      'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
      `Tesseract tag ${tag} resolved to ${actualTagHead}, expected ${expectedCommit}`,
    );
  }
  run('git', ['checkout', '--detach', expectedCommit], { cwd: srcDir });
  const actualCommit = gitOutput(['rev-parse', 'HEAD'], srcDir).toLowerCase();
  if (actualCommit !== expectedCommit) {
    fail(
      'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
      `Detached tesseract source commit mismatch: expected ${expectedCommit}, got ${actualCommit}`,
    );
  }
  const dirty = gitOutput(['status', '--porcelain'], srcDir);
  if (dirty) {
    fail(
      'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
      'Tesseract source tree must be clean before build',
    );
  }

  const autogen = path.join(srcDir, 'autogen.sh');
  if (fs.existsSync(autogen)) {
    run('bash', [autogen], { cwd: srcDir });
  }

  run('./configure', [`--prefix=${TESSERACT_PREFIX}`], { cwd: srcDir });
  run('make', ['-j', String(Math.max(2, os.cpus().length))], { cwd: srcDir });
  run('make', ['install'], { cwd: srcDir });

  const out = spawnSync(bin, ['--version'], { encoding: 'utf8' });
  return {
    versionLine: `${out.stdout ?? ''}${out.stderr ?? ''}`.trim().split('\n')[0],
    sourceCommit: actualCommit,
  };
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
  const versionLine = combined.trim().split('\n')[0];
  console.log(`Verified tesseract: ${versionLine}`);
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
  return versionLine;
}

function writeVerifiedMarker(
  manifest,
  tessdataHashes,
  tesseractVersionLine,
  binarySha256,
  fontSha256,
) {
  const toolchainFingerprint = computeToolchainFingerprint({
    manifest,
    tessdataHashes,
    tesseractVersionLine,
    binarySha256,
    fontSha256,
  });
  let prior = null;
  if (fs.existsSync(VERIFIED_PATH)) {
    prior = JSON.parse(fs.readFileSync(VERIFIED_PATH, 'utf8'));
    const priorValidation = validateVerifiedToolchainMarker(prior, manifest);
    if (!priorValidation.ok || prior.toolchainFingerprint !== toolchainFingerprint) {
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
      sourceCommit: manifest.tesseract.sourceCommit,
      sourceUrl: manifest.tesseract.sourceUrl,
      license: manifest.tesseract.license,
      versionLine: tesseractVersionLine,
      binaryPath: tesseractBin(),
      binarySha256,
      buildConfigId: manifest.tesseract.buildConfigId,
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
    devanagariFont: {
      name: manifest.devanagariFont.name,
      commit: manifest.devanagariFont.commit,
      filePath: DEVANAGARI_FONT_PATH,
      sha256: fontSha256,
      license: manifest.devanagariFont.license,
      licenseUrl: manifest.devanagariFont.licenseUrl,
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
const fontSha256 = ensureDevanagariFont(manifest);
let tesseractVersionLine = '';
let sourceCommit = manifest.tesseract.sourceCommit;

if (process.platform === 'linux') {
  const build = buildTesseractLinux(manifest);
  tesseractVersionLine = build.versionLine;
  sourceCommit = build.sourceCommit;
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

const binarySha256 =
  process.platform === 'linux' ? sha256File(tesseractBin()) : sha256Text('non-linux-skip');
if (process.platform === 'linux' && sourceCommit !== manifest.tesseract.sourceCommit) {
  fail(
    'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED',
    `Actual built tesseract commit ${sourceCommit} did not match manifest ${manifest.tesseract.sourceCommit}`,
  );
}
const fingerprint = writeVerifiedMarker(
  manifest,
  tessdataHashes,
  tesseractVersionLine,
  binarySha256,
  fontSha256,
);
console.log(`Expected tesseract source commit: ${manifest.tesseract.sourceCommit}`);
console.log(`Actual verified tesseract source commit: ${sourceCommit}`);
console.log(`Tesseract binary sha256: ${binarySha256}`);
console.log(`eng.traineddata sha256: ${tessdataHashes.eng}`);
console.log(`hin.traineddata sha256: ${tessdataHashes.hin}`);
console.log(`Devanagari font sha256: ${fontSha256}`);
console.log(`Toolchain fingerprint: ${fingerprint}`);
console.log(`EHAS2 extract tools bootstrap complete (fingerprint ${fingerprint.slice(0, 16)}…).`);
