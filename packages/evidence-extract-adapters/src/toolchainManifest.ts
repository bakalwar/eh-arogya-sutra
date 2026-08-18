import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type ExtractToolchainManifest = {
  schemaVersion: string;
  pipelineConfigVersion: string;
  pdfjs: { name: string; version: string; license: string };
  tesseract: {
    version: string;
    license: string;
    sourceRepositoryUrl: string;
    sourceTag: string;
    sourceCommit: string;
    versionOutputMustContain: string;
    buildConfigId: string;
  };
  tessdataFast: {
    commit: string;
    license: string;
    languages: Record<string, { file: string; downloadUrl: string; sha256: string }>;
  };
  devanagariFont: {
    name: string;
    repository: string;
    commit: string;
    filePath: string;
    downloadUrl: string;
    sha256: string;
    license: string;
    licenseUrl: string;
  };
};

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export function manifestPath(): string {
  return path.join(REPO_ROOT, 'vendor', 'manifests', 'extract-toolchain.json');
}

export function readExtractToolchainManifest(): ExtractToolchainManifest {
  const raw = fs.readFileSync(manifestPath(), 'utf8');
  return JSON.parse(raw) as ExtractToolchainManifest;
}

function isLowerHex(value: string, length: number): boolean {
  return new RegExp(`^[0-9a-f]{${length}}$`).test(value);
}

export function assertExtractToolchainManifest(
  manifest: ExtractToolchainManifest = readExtractToolchainManifest(),
): ExtractToolchainManifest {
  const tesseractCommit = String(manifest.tesseract.sourceCommit ?? '');
  if (!isLowerHex(tesseractCommit, 40)) {
    throw new Error(
      'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED: manifest tesseract source commit must be exact 40-char lowercase hex',
    );
  }
  const fontCommit = String(manifest.devanagariFont?.commit ?? '');
  if (!isLowerHex(fontCommit, 40)) {
    throw new Error(
      'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED: manifest Devanagari font commit must be exact 40-char lowercase hex',
    );
  }
  const fontSha = String(manifest.devanagariFont?.sha256 ?? '');
  if (!isLowerHex(fontSha, 64) || /placeholder|bootstrap/i.test(fontSha)) {
    throw new Error(
      'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED: manifest Devanagari font sha256 must be exact 64-char lowercase hex',
    );
  }
  void pinnedLangpackHashes(manifest);
  return manifest;
}

export function pinnedLangpackHashes(
  manifest: ExtractToolchainManifest = readExtractToolchainManifest(),
): Readonly<Record<'eng' | 'hin', string>> {
  const eng = manifest.tessdataFast.languages.eng?.sha256;
  const hin = manifest.tessdataFast.languages.hin?.sha256;
  if (!eng || !hin || eng.length !== 64 || hin.length !== 64) {
    throw new Error('OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED: manifest langpack sha256 missing');
  }
  if (/placeholder|bootstrap/i.test(eng) || /placeholder|bootstrap/i.test(hin)) {
    throw new Error(
      'OCR_TOOLCHAIN_REPRODUCIBILITY_BLOCKED: manifest langpack sha256 is placeholder',
    );
  }
  return { eng, hin };
}
