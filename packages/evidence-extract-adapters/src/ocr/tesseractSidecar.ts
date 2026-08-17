import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXTRACT_JOB_TIMEOUT_MS,
  EXTRACT_PAGE_OCR_TIMEOUT_MS,
  MAX_STDIO_BYTES,
  TESSERACT_LANGUAGES,
  TESSERACT_VERSION,
} from '../constants.js';
import { writePrivateFile } from './jobTempDir.js';
import { parseTsv, type TsvWordBlock } from './tsvParser.js';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export type TesseractOcrResult =
  | { ok: true; words: TsvWordBlock[] }
  | { ok: false; code: 'TIMEOUT' | 'BINARY_UNAVAILABLE' | 'OCR_FAILED' };

export function resolveTesseractBinary(): string | null {
  const fromEnv = process.env.EHAS2_TESSERACT_BIN?.trim();
  if (fromEnv) return fromEnv;
  const ext = process.platform === 'win32' ? '.exe' : '';
  return path.join(PACKAGE_ROOT, '.extract-tools', 'tesseract', 'bin', `tesseract${ext}`);
}

export function resolveTessdataPrefix(): string | null {
  const fromEnv = process.env.TESSDATA_PREFIX?.trim();
  if (fromEnv) return fromEnv;
  return path.join(PACKAGE_ROOT, '.extract-tools', 'tessdata');
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
    const binary = resolveTesseractBinary();
    const tessdataPrefix = resolveTessdataPrefix();
    if (!binary || !tessdataPrefix) {
      return { ok: false, code: 'BINARY_UNAVAILABLE' };
    }
    const pageTimeoutMs = input.pageTimeoutMs ?? EXTRACT_PAGE_OCR_TIMEOUT_MS;
    const jobTimeoutMs = input.jobTimeoutMs ?? EXTRACT_JOB_TIMEOUT_MS;
    const inputPath = path.join(input.workDir, `page-${Date.now()}.png`);
    const outputBase = path.join(input.workDir, `ocr-${Date.now()}`);
    await writePrivateFile(inputPath, input.png);

    return new Promise<TesseractOcrResult>((resolve) => {
      let settled = false;
      let stdoutBytes = 0;
      let stderrBytes = 0;
      const child = spawn(
        binary,
        [inputPath, outputBase, '-l', TESSERACT_LANGUAGES, 'tsv'],
        {
          shell: false,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, TESSDATA_PREFIX: tessdataPrefix },
          detached: process.platform !== 'win32',
        },
      );

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
