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
    sourceTag: string;
    versionOutputMustContain: string;
  };
  tessdataFast: {
    commit: string;
    license: string;
    languages: Record<string, { file: string; downloadUrl: string; sha256: string }>;
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
