import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXTRACT_JOB_TIMEOUT_MS,
  EXTRACT_PAGE_OCR_TIMEOUT_MS,
  MAX_STDIO_BYTES,
  TESSERACT_LANGUAGES,
  TESSERACT_VERSION,
} from '../constants.js';
import { pinnedLangpackHashes } from '../toolchainManifest.js';
import { isProductionRuntime } from '@ehas2/evidence-ingest';
import { writePrivateFile } from './jobTempDir.js';
import { parseTsv, type TsvWordBlock } from './tsvParser.js';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export type TesseractOcrResult =
  | { ok: true; words: TsvWordBlock[] }
  | { ok: false; code: 'TIMEOUT' | 'BINARY_UNAVAILABLE' | 'OCR_FAILED' | 'HASH_MISMATCH' };

export function resolveTesseractBinary(): string | null {
  const fromEnv = process.env.EHAS2_TESSERACT_BIN?.trim();
  if (fromEnv) return fromEnv;
  const ext = process.platform === 'win32' ? '.exe' : '';
  return path.join(PACKAGE_ROOT, '.extract-tools', 'tesseract', 'bin', `tesseract${ext}`);
}

export function resolveTessdataPrefix(): string | null {
  const fromEnv = process.env.TESSDATA_PREFIX?.trim();
  if (fromEnv) {
    if (fs.existsSync(path.join(fromEnv, 'eng.traineddata'))) return fromEnv;
    const nested = path.join(fromEnv, 'tessdata');
    if (fs.existsSync(path.join(nested, 'eng.traineddata'))) return nested;
  }
  return path.join(PACKAGE_ROOT, '.extract-tools', 'tessdata');
}

function sha256File(filePath: string): string {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

export function verifyPinnedTessdata(
  tessdataPrefix: string,
): { ok: true } | { ok: false; code: 'HASH_MISMATCH' } {
  const expected = pinnedLangpackHashes();
  for (const lang of ['eng', 'hin'] as const) {
    const filePath = path.join(tessdataPrefix, `${lang}.traineddata`);
    if (!fs.existsSync(filePath)) {
      return { ok: false, code: 'HASH_MISMATCH' };
    }
    if (sha256File(filePath) !== expected[lang]) {
      return { ok: false, code: 'HASH_MISMATCH' };
    }
  }
  return { ok: true };
}

export function assertPinnedTesseractVersion(
  binary: string,
): { ok: true; versionLine: string } | { ok: false; code: 'HASH_MISMATCH' } {
  const out = spawnSync(binary, ['--version'], {
    encoding: 'utf8',
    shell: false,
    timeout: 5_000,
  });
  const combined = `${out.stdout ?? ''}${out.stderr ?? ''}`;
  if (out.error || out.status !== 0 || !combined.includes(TESSERACT_VERSION)) {
    return { ok: false, code: 'HASH_MISMATCH' };
  }
  return { ok: true, versionLine: combined.trim().split('\n')[0] ?? '' };
}

export function tesseractArgv(
  inputPath: string,
  outputBase: string,
  tessdataDir: string,
): string[] {
  return [inputPath, outputBase, '--tessdata-dir', tessdataDir, '-l', TESSERACT_LANGUAGES, 'tsv'];
}

function killProcessGroup(child: ReturnType<typeof spawn>): void {
  const pid = child.pid;
  if (!pid) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(pid), '/t', '/f'], { shell: false, stdio: 'ignore' });
    return;
  }
  try {
    process.kill(-pid, 'SIGKILL');
  } catch {
    try {
      child.kill('SIGKILL');
    } catch {
      /* already exited */
    }
  }
}

export class TesseractSidecar {
  readonly version = TESSERACT_VERSION;

  async recognizePng(input: {
    png: Uint8Array;
    pageWidth: number;
    pageHeight: number;
    workDir: string;
    pageTimeoutMs?: number;
    jobTimeoutMs?: number;
    abortSignal?: AbortSignal;
  }): Promise<TesseractOcrResult> {
    const testNodeScript =
      !isProductionRuntime() && process.env.EHAS2_TESSERACT_NODE_SCRIPT
        ? process.env.EHAS2_TESSERACT_NODE_SCRIPT.trim()
        : '';
    const binary = resolveTesseractBinary();
    const tessdataPrefix =
      resolveTessdataPrefix() ?? path.join(PACKAGE_ROOT, '.extract-tools', 'tessdata');
    if (!testNodeScript) {
      if (!binary || !fs.existsSync(binary)) {
        return { ok: false, code: 'BINARY_UNAVAILABLE' };
      }
      const hashGate = verifyPinnedTessdata(tessdataPrefix);
      if (!hashGate.ok) {
        return { ok: false, code: 'HASH_MISMATCH' };
      }
      const versionGate = assertPinnedTesseractVersion(binary);
      if (!versionGate.ok) {
        return { ok: false, code: 'HASH_MISMATCH' };
      }
    }
    const pageTimeoutMs = input.pageTimeoutMs ?? EXTRACT_PAGE_OCR_TIMEOUT_MS;
    const jobTimeoutMs = input.jobTimeoutMs ?? EXTRACT_JOB_TIMEOUT_MS;
    const inputPath = path.join(input.workDir, `page-${Date.now()}.png`);
    const outputBase = path.join(input.workDir, `ocr-${Date.now()}`);
    await writePrivateFile(inputPath, input.png);
    const argv = tesseractArgv(inputPath, outputBase, tessdataPrefix);
    const spawnBin = testNodeScript ? process.execPath : binary!;
    const spawnArgv = testNodeScript ? [testNodeScript, ...argv] : argv;
    const libDir = binary ? path.join(path.dirname(path.dirname(binary)), 'lib') : '';
    const ldPath = [libDir, process.env.LD_LIBRARY_PATH].filter(Boolean).join(path.delimiter);

    return new Promise<TesseractOcrResult>((resolve) => {
      let settled = false;
      let stdoutBytes = 0;
      let stderrBytes = 0;
      const child = spawn(spawnBin, spawnArgv, {
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          TESSDATA_PREFIX: path.dirname(tessdataPrefix),
          ...(ldPath ? { LD_LIBRARY_PATH: ldPath } : {}),
        },
        detached: process.platform !== 'win32',
      });

      const finish = (result: TesseractOcrResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(jobTimer);
        clearTimeout(pageTimer);
        input.abortSignal?.removeEventListener('abort', onAbort);
        resolve(result);
      };

      const onAbort = () => {
        killProcessGroup(child);
        finish({ ok: false, code: 'TIMEOUT' });
      };
      input.abortSignal?.addEventListener('abort', onAbort, { once: true });

      const jobTimer = setTimeout(() => {
        killProcessGroup(child);
        finish({ ok: false, code: 'TIMEOUT' });
      }, jobTimeoutMs);

      const pageTimer = setTimeout(() => {
        killProcessGroup(child);
        finish({ ok: false, code: 'TIMEOUT' });
      }, pageTimeoutMs);

      child.stdout?.on('data', (chunk: Buffer) => {
        stdoutBytes = Math.min(stdoutBytes + chunk.length, MAX_STDIO_BYTES);
      });
      child.stderr?.on('data', (chunk: Buffer) => {
        stderrBytes = Math.min(stderrBytes + chunk.length, MAX_STDIO_BYTES);
      });

      child.on('error', () => {
        finish({ ok: false, code: 'BINARY_UNAVAILABLE' });
      });

      child.on('close', async (code) => {
        if (settled) return;
        if (code !== 0) {
          void stdoutBytes;
          void stderrBytes;
          finish({ ok: false, code: 'OCR_FAILED' });
          return;
        }
        try {
          const { readFile } = await import('node:fs/promises');
          const tsvPath = `${outputBase}.tsv`;
          const tsv = await readFile(tsvPath, 'utf8');
          const words = parseTsv(tsv, input.pageWidth, input.pageHeight);
          finish({ ok: true, words });
        } catch {
          finish({ ok: false, code: 'OCR_FAILED' });
        }
      });
    });
  }
}
