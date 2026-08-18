import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type ExtractToolchainManifest, pinnedLangpackHashes } from './toolchainManifest.js';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export type VerifiedToolchainMarker = {
  schemaVersion: string;
  toolchainFingerprint: string;
  verifiedAt: string;
  tesseract: {
    version: string;
    sourceTag: string;
    sourceCommit: string;
    sourceUrl: string;
    license: string;
    versionLine: string;
    binaryPath: string;
    binarySha256: string;
    buildConfigId: string;
  };
  tessdataFast: {
    commit: string;
    license: string;
    languages: Record<string, { file: string; sha256: string; downloadUrl: string }>;
  };
  devanagariFont: {
    name: string;
    commit: string;
    filePath: string;
    sha256: string;
    license: string;
    licenseUrl: string;
  };
  pdfjs: {
    version: string;
    license: string;
  };
  pipelineConfigVersion: string;
};

export function toolchainToolsRoot(): string {
  return path.join(PACKAGE_ROOT, '.extract-tools');
}

export function verifiedToolchainMarkerPath(): string {
  return path.join(toolchainToolsRoot(), 'toolchain.verified.json');
}

export function sha256File(filePath: string): string {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

export function sha256Text(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function isLowerHex(value: string, length: number): boolean {
  return new RegExp(`^[0-9a-f]{${length}}$`).test(value);
}

export function computeToolchainFingerprint(input: {
  manifest: ExtractToolchainManifest;
  tessdataHashes: Readonly<Record<'eng' | 'hin', string>>;
  tesseractVersionLine: string;
  binarySha256: string;
  fontSha256: string;
}): string {
  const { manifest, tessdataHashes, tesseractVersionLine, binarySha256, fontSha256 } = input;
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

export function readVerifiedToolchainMarker(): VerifiedToolchainMarker {
  const raw = fs.readFileSync(verifiedToolchainMarkerPath(), 'utf8');
  return JSON.parse(raw) as VerifiedToolchainMarker;
}

export function validateVerifiedToolchainMarker(
  marker: VerifiedToolchainMarker,
  manifest: ExtractToolchainManifest,
): { ok: true } | { ok: false; reason: string } {
  if (!isLowerHex(marker.toolchainFingerprint ?? '', 64)) {
    return { ok: false, reason: 'marker fingerprint missing' };
  }
  if (!isLowerHex(marker.tesseract?.sourceCommit ?? '', 40)) {
    return { ok: false, reason: 'marker tesseract source commit missing' };
  }
  if (!isLowerHex(marker.tesseract?.binarySha256 ?? '', 64)) {
    return { ok: false, reason: 'marker binary sha missing' };
  }
  if (!isLowerHex(marker.devanagariFont?.sha256 ?? '', 64)) {
    return { ok: false, reason: 'marker font sha missing' };
  }
  if (marker.tesseract.sourceCommit !== manifest.tesseract.sourceCommit) {
    return { ok: false, reason: 'marker tesseract commit mismatch' };
  }
  if (marker.tesseract.sourceTag !== manifest.tesseract.sourceTag) {
    return { ok: false, reason: 'marker tesseract tag mismatch' };
  }
  if (marker.tesseract.buildConfigId !== manifest.tesseract.buildConfigId) {
    return { ok: false, reason: 'marker build config mismatch' };
  }
  if (marker.tesseract.version !== manifest.tesseract.version) {
    return { ok: false, reason: 'marker tesseract version mismatch' };
  }
  if (marker.devanagariFont.commit !== manifest.devanagariFont.commit) {
    return { ok: false, reason: 'marker font commit mismatch' };
  }
  if (marker.devanagariFont.sha256 !== manifest.devanagariFont.sha256) {
    return { ok: false, reason: 'marker font sha mismatch' };
  }
  if (marker.tessdataFast.commit !== manifest.tessdataFast.commit) {
    return { ok: false, reason: 'marker tessdata commit mismatch' };
  }
  const expectedHashes = pinnedLangpackHashes(manifest);
  if (marker.tessdataFast.languages.eng?.sha256 !== expectedHashes.eng) {
    return { ok: false, reason: 'marker eng sha mismatch' };
  }
  if (marker.tessdataFast.languages.hin?.sha256 !== expectedHashes.hin) {
    return { ok: false, reason: 'marker hin sha mismatch' };
  }
  const fingerprint = computeToolchainFingerprint({
    manifest,
    tessdataHashes: expectedHashes,
    tesseractVersionLine: marker.tesseract.versionLine,
    binarySha256: marker.tesseract.binarySha256,
    fontSha256: marker.devanagariFont.sha256,
  });
  if (fingerprint !== marker.toolchainFingerprint) {
    return { ok: false, reason: 'marker fingerprint mismatch' };
  }
  return { ok: true };
}
