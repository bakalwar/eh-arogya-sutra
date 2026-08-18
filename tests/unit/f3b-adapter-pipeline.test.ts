import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  TwoStageOpenSourceExtractor,
  extractPdfTextLayer,
  tesseractArgv,
  verifyPinnedTessdata,
  TesseractSidecar,
  createJobTempDir,
  PDFJS_VERSION,
  TESSERACT_VERSION,
  pinnedLangpackHashes,
  readExtractToolchainManifest,
} from '../../packages/evidence-extract-adapters/src/index.ts';
import {
  bornDigitalEnglishPdf,
  bornDigitalHindiPdf,
  bornDigitalMixedPdf,
  malformedPdf,
  mixedTextAndScannedPdf,
  multiPageProvenancePdf,
  passwordProtectedPdf,
} from '../../tools/extract-fixtures/synthetic/bornDigitalPdf.js';

function baseRequest(bytes: Uint8Array, extra: Record<string, unknown> = {}) {
  return {
    organizationId: '00000000-0000-4000-8000-000000000001',
    clinicId: '00000000-0000-4000-8000-000000000002',
    patientId: '00000000-0000-4000-8000-000000000003',
    consultationId: '00000000-0000-4000-8000-000000000004',
    evidenceItemId: '00000000-0000-4000-8000-0000000000aa',
    evidenceType: 'LAB_REPORT',
    declaredMime: 'application/pdf',
    detectedMime: 'application/pdf',
    byteSize: bytes.byteLength,
    contentSha256: 'abc',
    magicPrefix: bytes.subarray(0, 8),
    contentIntent: 'WRITTEN_REPORT_DOCUMENT',
    bytes,
    ...extra,
  };
}

describe('F3B actual PDF.js / sidecar adapter', () => {
  it('pins pdfjs-dist 4.10.38 Apache-2.0 and Tesseract 5.5.3 with exact langpack hashes', () => {
    const manifest = readExtractToolchainManifest();
    expect(manifest.pdfjs.version).toBe('4.10.38');
    expect(manifest.pdfjs.license).toBe('Apache-2.0');
    expect(manifest.tesseract.version).toBe('5.5.3');
    expect(manifest.tesseract.license).toBe('Apache-2.0');
    expect(PDFJS_VERSION).toBe('4.10.38');
    expect(TESSERACT_VERSION).toBe('5.5.3');
    const hashes = pinnedLangpackHashes();
    expect(hashes.eng).toBe('7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2');
    expect(hashes.hin).toBe('4c73ffc59d497c186b19d1e90f5d721d678ea6b2e277b719bee4e2af12271825');
    expect(hashes.eng).toHaveLength(64);
    expect(hashes.hin).toHaveLength(64);
    const pkg = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), 'packages/evidence-extract-adapters/package.json'),
        'utf8',
      ),
    );
    expect(pkg.dependencies['pdfjs-dist']).toBe('4.10.38');
    expect(pkg.optionalDependencies['@napi-rs/canvas']).toBe('0.1.80');
    const lock = fs.readFileSync(path.join(process.cwd(), 'package-lock.json'), 'utf8');
    expect(lock).toMatch(/"pdfjs-dist": "4\.10\.38"/);
    expect(lock).not.toMatch(/pdf-parse/);
    expect(lock).not.toMatch(/tesseract\.js/);
    expect(lock).not.toMatch(/pdftoppm|poppler/i);
    const distPkg = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'node_modules/pdfjs-dist/package.json'), 'utf8'),
    );
    expect(distPkg.version).toBe('4.10.38');
    expect(String(distPkg.license)).toMatch(/Apache-2\.0/i);
    expect(String(distPkg.engines?.node ?? '')).toMatch(/20/);
  });

  it('extracts born-digital English text layer without invoking Tesseract', async () => {
    const extractor = new TwoStageOpenSourceExtractor();
    const spy = vi.spyOn(TesseractSidecar.prototype, 'recognizePng');
    const result = await extractor.extract(baseRequest(bornDigitalEnglishPdf()));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.candidates.some((c) => c.rawText.includes('Hemoglobin'))).toBe(true);
    expect(result.candidates.some((c) => c.rawText.includes('g/dL'))).toBe(true);
    expect(result.candidates.every((c) => c.method === 'PDF_TEXT_LAYER')).toBe(true);
    expect(result.candidates.every((c) => c.sourceLocator.page === 1)).toBe(true);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('extracts born-digital Hindi ActualText and mixed Hindi/English', async () => {
    const extractor = new TwoStageOpenSourceExtractor();
    const hindi = await extractor.extract(baseRequest(bornDigitalHindiPdf()));
    expect(hindi.ok).toBe(true);
    if (hindi.ok) {
      const blob = hindi.candidates.map((c) => c.rawText).join(' ');
      expect(blob.includes('हीमोग्लोबिन') || blob.includes('g/dL')).toBe(true);
    }
    const mixed = await extractor.extract(baseRequest(bornDigitalMixedPdf()));
    expect(mixed.ok).toBe(true);
    if (mixed.ok) {
      const blob = mixed.candidates.map((c) => c.rawText).join(' ');
      expect(blob).toMatch(/Hemoglobin|हीमोग्लोबिन|g\/dL/);
    }
  });

  it('preserves multi-page provenance', async () => {
    const extractor = new TwoStageOpenSourceExtractor();
    const result = await extractor.extract(baseRequest(multiPageProvenancePdf()));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.candidates.some((c) => c.pageNumber === 1)).toBe(true);
    expect(result.candidates.some((c) => c.pageNumber === 2)).toBe(true);
    expect(
      result.candidates.every((c) => c.sourceLocator.page >= 1 && c.sourceLocator.page <= 2),
    ).toBe(true);
  });

  it('OCRs only insufficient pages of a mixed document', async () => {
    const extractor = new TwoStageOpenSourceExtractor();
    const spy = vi.spyOn(TesseractSidecar.prototype, 'recognizePng').mockResolvedValue({
      ok: true,
      words: [],
    });
    try {
      const result = await extractor.extract(baseRequest(mixedTextAndScannedPdf()));
      expect(spy).toHaveBeenCalledTimes(1);
      expect(result.ok || (!result.ok && result.code === 'PARTIAL_EXTRACTION')).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });

  it('refuses malformed and password PDFs fail-closed', async () => {
    const extractor = new TwoStageOpenSourceExtractor();
    const malformed = await extractor.extract(baseRequest(malformedPdf()));
    expect(malformed.ok).toBe(false);
    if (!malformed.ok) expect(malformed.code).toBe('MALFORMED_DOCUMENT');
    const locked = await extractPdfTextLayer(passwordProtectedPdf());
    expect(locked.ok).toBe(false);
    if (!locked.ok) expect(locked.code).toBe('MALFORMED_DOCUMENT');
  });

  it('refuses diagnostic image, patient photo, unclassified, and CT type alone', async () => {
    const extractor = new TwoStageOpenSourceExtractor();
    const bytes = bornDigitalEnglishPdf();
    const diagnostic = await extractor.extract(
      baseRequest(bytes, { contentIntent: 'DIAGNOSTIC_IMAGE', evidenceType: 'XRAY' }),
    );
    expect(diagnostic.ok).toBe(false);
    if (!diagnostic.ok) expect(diagnostic.code).toBe('IMAGE_INTERPRETATION_FORBIDDEN');
    const photo = await extractor.extract(baseRequest(bytes, { contentIntent: 'PATIENT_PHOTO' }));
    expect(photo.ok).toBe(false);
    if (!photo.ok) expect(photo.code).toBe('PHOTO_DIAGNOSIS_FORBIDDEN');
    const unclassified = await extractor.extract(
      baseRequest(bytes, { contentIntent: 'UNCLASSIFIED' }),
    );
    expect(unclassified.ok).toBe(false);
    if (!unclassified.ok) expect(unclassified.code).toBe('DOCUMENT_INTENT_REQUIRED');
  });
});

describe('F3B sidecar security', () => {
  afterEach(() => {
    delete process.env.EHAS2_TESSERACT_NODE_SCRIPT;
  });

  it('never puts user filenames in argv and never uses a shell', () => {
    const argv = tesseractArgv('/tmp/ehas2-generated.png', '/tmp/ehas2-generated-out');
    expect(argv).toEqual([
      '/tmp/ehas2-generated.png',
      '/tmp/ehas2-generated-out',
      '-l',
      'eng+hin',
      'tsv',
    ]);
    expect(argv.join(' ')).not.toMatch(/;|&&|\||\$\(/);
    const src = fs.readFileSync(
      path.join(process.cwd(), 'packages/evidence-extract-adapters/src/ocr/tesseractSidecar.ts'),
      'utf8',
    );
    expect(src).toMatch(/shell:\s*false/);
    expect(src).not.toMatch(/shell:\s*true/);
  });

  it('fails closed on tessdata hash mismatch', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ehas2-tess-'));
    fs.writeFileSync(path.join(dir, 'eng.traineddata'), 'not-the-model');
    fs.writeFileSync(path.join(dir, 'hin.traineddata'), 'not-the-model');
    expect(verifyPinnedTessdata(dir).ok).toBe(false);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('times out and kills the process group', async () => {
    process.env.EHAS2_TESSERACT_NODE_SCRIPT = path.join(
      process.cwd(),
      'tools/extract-fixtures/synthetic/sleep-forever.mjs',
    );
    const sidecar = new TesseractSidecar();
    const dir = await createJobTempDir();
    const started = Date.now();
    const result = await sidecar.recognizePng({
      png: new Uint8Array([1, 2, 3, 4]),
      pageWidth: 8,
      pageHeight: 8,
      workDir: dir.path,
      pageTimeoutMs: 400,
      jobTimeoutMs: 400,
    });
    await dir.cleanup();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('TIMEOUT');
    expect(Date.now() - started).toBeLessThan(8_000);
  }, 15_000);
});
