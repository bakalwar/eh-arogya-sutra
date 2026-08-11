import { spawnSync } from 'node:child_process';
import {
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as fsConstants from 'node:fs';
import {
  MARKER_EXACT_BYTES,
  MARKER_FILENAME,
  Rule5SyntheticInputError,
  __setAdapterTestSeam,
  readSyntheticInput,
} from '../../tools/provenance/readSyntheticInput.mjs';
import {
  HELP_TEXT,
  RULE5_CLI_UNSUPPORTED_PLATFORM,
  RULE5_CLI_USAGE_ERROR,
  TOOL_VERSION,
  VERSION_TEXT,
  __setCliTestSeam,
  runVerifySyntheticCli,
} from '../../tools/provenance/verifySyntheticCli.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CLI_PATH = path.join(REPO_ROOT, 'tools/provenance/verifySyntheticCli.mjs');
const ADAPTER_PATH = path.join(REPO_ROOT, 'tools/provenance/readSyntheticInput.mjs');

const FORBIDDEN_ADAPTER_IMPORTS = [
  /from\s+['"]\.\/verifyCore\.mjs['"]/,
  /from\s+['"]\.\/parseStructure\.mjs['"]/,
  /from\s+['"]\.\/verifyStructure\.mjs['"]/,
  /from\s+['"]node:crypto['"]/,
  /from\s+['"]node:child_process['"]/,
  /from\s+['"]node:http['"]/,
  /process\.env/,
];

const FORBIDDEN_CLI_IMPORTS = [
  /from\s+['"]node:fs['"]/,
  /from\s+['"]node:path['"]/,
  /from\s+['"]\.\/verifyStructure\.mjs['"]/,
  /from\s+['"]node:crypto['"]/,
  /from\s+['"]node:child_process['"]/,
  /process\.env/,
];

const LEAKAGE_PATTERNS = [
  /sha256:/i,
  /<user_query>/,
  /<\/user_query>/,
  /MED=/,
  /EHAS2_SYNTHETIC_ROOT/,
  /ENOENT/,
  /EACCES/,
  /at Object\./,
  /\\/,
  /\/tmp\//,
  /Desktop/,
  /dev":/,
  /ino":/,
];

/** @type {string[]} */
const createdTempRoots = [];

/**
 * @returns {string}
 */
function createTempRoot() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ehas2-p2b3-'));
  const resolved = path.resolve(dir);
  if (!resolved.startsWith(path.resolve(os.tmpdir()))) {
    throw new Error('Temp root outside os.tmpdir()');
  }
  createdTempRoots.push(resolved);
  return resolved;
}

/**
 * @param {string} root
 */
function writeMarker(root) {
  writeFileSync(path.join(root, MARKER_FILENAME), MARKER_EXACT_BYTES);
}

/**
 * @param {string} root
 * @param {string} relativePath
 * @param {string | Buffer} content
 */
function writeInput(root, relativePath, content) {
  const full = path.join(root, relativePath);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content);
}

/**
 * @param {string[]} args
 * @param {{ env?: NodeJS.ProcessEnv }} [options]
 */
function runCli(args, options = {}) {
  return spawnSync(process.execPath, [CLI_PATH, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
  });
}

/**
 * @param {import('node:child_process').SpawnSyncReturns<string>} result
 */
function expectEmptyStderr(result) {
  expect(result.stderr ?? '').toBe('');
}

/**
 * @param {string} stdout
 */
function parseStdoutJson(stdout) {
  expect(stdout.endsWith('\n')).toBe(true);
  const trimmed = stdout.slice(0, -1);
  expect(trimmed.includes('\n')).toBe(false);
  return JSON.parse(trimmed);
}

afterEach(() => {
  __setAdapterTestSeam(null);
  __setCliTestSeam(null);
  while (createdTempRoots.length > 0) {
    const target = createdTempRoots.pop();
    if (target && existsSync(target)) {
      rmSync(target, { recursive: true, force: true });
    }
  }
});

describe('provenance verifySyntheticCli (P2-B3 confined synthetic CLI)', () => {
  it('adapter import boundary allows only node:fs and node:path', () => {
    const source = readFileSync(ADAPTER_PATH, 'utf8');
    for (const pattern of FORBIDDEN_ADAPTER_IMPORTS) {
      expect(source).not.toMatch(pattern);
    }
    expect(source).toMatch(/from\s+['"]node:fs['"]/);
    expect(source).toMatch(/from\s+['"]node:path['"]/);
  });

  it('CLI import boundary forbids fs/path/comparator/crypto/env', () => {
    const source = readFileSync(CLI_PATH, 'utf8');
    for (const pattern of FORBIDDEN_CLI_IMPORTS) {
      expect(source).not.toMatch(pattern);
    }
  });

  it('emits fixed unsupported-platform JSON on non-linux', () => {
    const platformSpy = vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
    let stdout = '';
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      stdout += String(chunk);
      return true;
    });
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code) => {
      throw new Error(`exit:${code}`);
    }) as never);

    expect(() =>
      runVerifySyntheticCli(['--root', '/tmp/x', '--input', 'a.txt', '--length-unit', 'ABSENT']),
    ).toThrow('exit:1');
    expect(parseStdoutJson(stdout)).toEqual({
      toolVersion: TOOL_VERSION,
      outcome: 'ERROR',
      failureCode: RULE5_CLI_UNSUPPORTED_PLATFORM,
    });

    platformSpy.mockRestore();
    writeSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('returns static help and version without echoing argv values', () => {
    const help = runCli(['--help']);
    expect(help.status).toBe(0);
    expect(help.stdout).toBe(HELP_TEXT);
    expectEmptyStderr(help);

    const version = runCli(['--version']);
    expect(version.status).toBe(0);
    expect(version.stdout).toBe(VERSION_TEXT);
    expectEmptyStderr(version);
  });

  it('rejects duplicate, unknown, missing-value, positional, --, and @file flags', () => {
    const cases = [
      [['--help', '--help']],
      [['--root', '/tmp/a', '--root', '/tmp/b', '--input', 'x', '--length-unit', 'ABSENT']],
      [['--root', '/tmp/a', '--input', 'x', '--length-unit', 'ABSENT', '--unknown', 'x']],
      [['--root']],
      [['--root', '/tmp/a', '--input']],
      [['--root', '/tmp/a', '--input', 'x', '--length-unit']],
      [['--root', '/tmp/a', '--input', 'x', '--length-unit', 'ABSENT', 'extra']],
      [['--root', '/tmp/a', '--input', 'x', '--length-unit', 'ABSENT', '--']],
      [['--root', '/tmp/a', '--input', 'x', '--length-unit', 'ABSENT', '@response']],
    ];

    for (const args of cases) {
      const result = runCli(args);
      expect(result.status).toBe(1);
      expect(parseStdoutJson(result.stdout ?? '')).toEqual({
        toolVersion: TOOL_VERSION,
        outcome: 'ERROR',
        failureCode: RULE5_CLI_USAGE_ERROR,
      });
      expectEmptyStderr(result);
    }
  });

  it('rejects invalid relative input syntax before filesystem access', () => {
    const root = createTempRoot();
    writeMarker(root);
    writeInput(root, 'ok.txt', 'MED=A');

    const badInputs = [
      '.',
      '',
      '../secret',
      'a/../b',
      '/abs.txt',
      'C:\\temp\\x',
      'C:foo',
      '//unc/share',
      '\\\\?\\C:\\x',
      'seg:ads',
      'trail.',
      'trail. ',
      'bad\\slash',
    ];

    for (const input of badInputs) {
      const args = ['--root', root, '--input', input, '--length-unit', 'ABSENT'];
      const result = runCli(args);
      expect(result.status).toBe(1);
      expect(parseStdoutJson(result.stdout ?? '').failureCode).toBe(RULE5_CLI_USAGE_ERROR);
      expectEmptyStderr(result);
    }
  });

  it('ignores environment variables for paths and config', () => {
    if (process.platform !== 'linux') {
      return;
    }
    const root = createTempRoot();
    writeMarker(root);
    writeInput(root, 'data.txt', 'MED=TOK');

    const result = runCli(['--root', root, '--input', 'data.txt', '--length-unit', 'ABSENT'], {
      env: {
        ROOT: '/etc',
        INPUT: '/etc/passwd',
        SOURCE: '/etc/shadow',
        LENGTH_UNIT: 'BYTE',
      },
    });

    expect(result.status).toBe(0);
    const payload = parseStdoutJson(result.stdout ?? '');
    expect(payload.outcome).toBe('PARSED');
    expectEmptyStderr(result);
  });
});

describe.skipIf(process.platform !== 'linux')(
  'provenance verifySyntheticCli linux confinement',
  () => {
    it('accepts exact 24-byte marker and parses valid UTF-8 input', () => {
      const root = createTempRoot();
      writeMarker(root);
      writeInput(root, 'sample.txt', 'MED=ALPHA\n');

      const result = runCli(['--root', root, '--input', 'sample.txt', '--length-unit', 'ABSENT']);
      expect(result.status).toBe(0);
      const payload = parseStdoutJson(result.stdout ?? '');
      expect(payload).toEqual({
        toolVersion: TOOL_VERSION,
        outcome: 'PARSED',
        failureCode: null,
        interpretiveEncoding: 'PASS',
        byteLength: 10,
        logicalLineCount: 1,
        candidateHeaderCount: 1,
        lineAnchorState: 'SINGLE',
        wrapperState: 'ABSENT',
        lengthUnit: 'ABSENT',
      });
      expectEmptyStderr(result);
      for (const pattern of LEAKAGE_PATTERNS) {
        expect(result.stdout ?? '').not.toMatch(pattern);
      }
    });

    it('rejects CRLF, missing LF, BOM, suffix, and 65-byte markers', () => {
      const variants = [
        Buffer.from('EHAS2_SYNTHETIC_ROOT_V1\r\n', 'utf8'),
        Buffer.from('EHAS2_SYNTHETIC_ROOT_V1', 'utf8'),
        Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), MARKER_EXACT_BYTES]),
        Buffer.concat([MARKER_EXACT_BYTES, Buffer.from('X')]),
        Buffer.alloc(65, 0x41),
      ];

      for (const content of variants) {
        const root = createTempRoot();
        writeFileSync(path.join(root, MARKER_FILENAME), content);
        writeInput(root, 'x.txt', 'MED=A');
        const result = runCli(['--root', root, '--input', 'x.txt', '--length-unit', 'ABSENT']);
        expect(result.status).toBe(2);
        expect(parseStdoutJson(result.stdout ?? '').failureCode).toBe('RULE5_CLI_MARKER_INVALID');
        expectEmptyStderr(result);
      }
    });

    it('rejects marker symlink and hard link', () => {
      const root = createTempRoot();
      const markerReal = path.join(root, 'marker-real');
      writeFileSync(markerReal, MARKER_EXACT_BYTES);
      symlinkSync(markerReal, path.join(root, MARKER_FILENAME));
      writeInput(root, 'x.txt', 'MED=A');
      let result = runCli(['--root', root, '--input', 'x.txt', '--length-unit', 'ABSENT']);
      expect(result.status).toBe(2);
      expect(parseStdoutJson(result.stdout ?? '').failureCode).toBe('RULE5_CLI_MARKER_INVALID');

      const root2 = createTempRoot();
      writeFileSync(path.join(root2, MARKER_FILENAME), MARKER_EXACT_BYTES);
      linkSync(path.join(root2, MARKER_FILENAME), path.join(root2, 'marker-hardlink'));
      writeInput(root2, 'x.txt', 'MED=A');
      result = runCli(['--root', root2, '--input', 'x.txt', '--length-unit', 'ABSENT']);
      expect(result.status).toBe(2);
      expect(parseStdoutJson(result.stdout ?? '').failureCode).toBe('RULE5_CLI_MARKER_INVALID');
    });

    it('rejects marker lstat/fstat identity mismatch via adapter test seam', () => {
      const root = createTempRoot();
      writeMarker(root);
      writeInput(root, 'x.txt', 'MED=A');

      const originalFstat = fsConstants.fstatSync.bind(fsConstants);
      let fstatCalls = 0;
      __setAdapterTestSeam({
        fstat: (fd) => {
          fstatCalls += 1;
          const stats = originalFstat(fd);
          if (fstatCalls === 1) {
            return Object.create(stats, {
              ino: { value: Number(stats.ino) + 999999, enumerable: true },
            });
          }
          return stats;
        },
      });

      expect(() => readSyntheticInput(root, 'x.txt')).toThrow(Rule5SyntheticInputError);
      try {
        readSyntheticInput(root, 'x.txt');
      } catch (err) {
        expect(err).toBeInstanceOf(Rule5SyntheticInputError);
        expect(/** @type {Rule5SyntheticInputError} */ err.failureCode).toBe(
          'RULE5_CLI_PATH_CONFINEMENT_FAILED',
        );
      }
    });

    it('rejects root symlink component, input symlink, and directory input', () => {
      const outer = createTempRoot();
      const realRoot = path.join(outer, 'real');
      mkdirSync(realRoot);
      writeMarker(realRoot);
      writeInput(realRoot, 'x.txt', 'MED=A');
      symlinkSync(realRoot, path.join(outer, 'linked'));
      let result = runCli([
        '--root',
        path.join(outer, 'linked'),
        '--input',
        'x.txt',
        '--length-unit',
        'ABSENT',
      ]);
      expect(result.status).toBe(2);
      expect(parseStdoutJson(result.stdout ?? '').failureCode).toBe('RULE5_CLI_ROOT_INVALID');

      const root = createTempRoot();
      writeMarker(root);
      writeInput(root, 'real.txt', 'MED=A');
      symlinkSync(path.join(root, 'real.txt'), path.join(root, 'link.txt'));
      result = runCli(['--root', root, '--input', 'link.txt', '--length-unit', 'ABSENT']);
      expect(result.status).toBe(4);
      expect(parseStdoutJson(result.stdout ?? '').failureCode).toBe('RULE5_CLI_UNSAFE_FILE_TYPE');

      const root2 = createTempRoot();
      writeMarker(root2);
      mkdirSync(path.join(root2, 'dirinput'));
      result = runCli(['--root', root2, '--input', 'dirinput', '--length-unit', 'ABSENT']);
      expect(result.status).toBe(4);
      expect(parseStdoutJson(result.stdout ?? '').failureCode).toBe('RULE5_CLI_UNSAFE_FILE_TYPE');
    });

    it('rejects input hard link and input identity mismatch', () => {
      const root = createTempRoot();
      writeMarker(root);
      writeInput(root, 'primary.txt', 'MED=A');
      linkSync(path.join(root, 'primary.txt'), path.join(root, 'alias.txt'));
      const result = runCli(['--root', root, '--input', 'alias.txt', '--length-unit', 'ABSENT']);
      expect(result.status).toBe(4);
      expect(parseStdoutJson(result.stdout ?? '').failureCode).toBe('RULE5_CLI_HARDLINK_REJECTED');

      const root2 = createTempRoot();
      writeMarker(root2);
      writeInput(root2, 'probe.txt', 'MED=B');
      const originalFstat = fsConstants.fstatSync.bind(fsConstants);
      let fstatCalls = 0;
      __setAdapterTestSeam({
        fstat: (fd) => {
          fstatCalls += 1;
          const stats = originalFstat(fd);
          if (fstatCalls === 2) {
            return Object.create(stats, {
              ino: { value: Number(stats.ino) + 424242, enumerable: true },
            });
          }
          return stats;
        },
      });

      expect(() => readSyntheticInput(root2, 'probe.txt')).toThrow(Rule5SyntheticInputError);
      try {
        readSyntheticInput(root2, 'probe.txt');
      } catch (err) {
        expect(err).toBeInstanceOf(Rule5SyntheticInputError);
        expect(/** @type {Rule5SyntheticInputError} */ err.failureCode).toBe(
          'RULE5_CLI_PATH_CONFINEMENT_FAILED',
        );
      }
    });

    it('accepts exactly 262144 bytes and rejects 262145 bytes', () => {
      const okRoot = createTempRoot();
      writeMarker(okRoot);
      writeInput(okRoot, 'max.txt', Buffer.alloc(262144, 0x41));

      let result = runCli(['--root', okRoot, '--input', 'max.txt', '--length-unit', 'BYTE']);
      expect(result.status).toBe(0);
      expect(parseStdoutJson(result.stdout ?? '').byteLength).toBe(262144);

      const bigRoot = createTempRoot();
      writeMarker(bigRoot);
      writeInput(bigRoot, 'too-big.txt', Buffer.alloc(262145, 0x42));
      result = runCli(['--root', bigRoot, '--input', 'too-big.txt', '--length-unit', 'BYTE']);
      expect(result.status).toBe(5);
      expect(parseStdoutJson(result.stdout ?? '').failureCode).toBe('RULE5_CLI_INPUT_OVERSIZE');
    });

    it('rejects missing input', () => {
      const root = createTempRoot();
      writeMarker(root);
      const result = runCli(['--root', root, '--input', 'missing.txt', '--length-unit', 'ABSENT']);
      expect(result.status).toBe(3);
      expect(parseStdoutJson(result.stdout ?? '').failureCode).toBe('RULE5_CLI_INPUT_NOT_FOUND');
    });

    it('maps invalid UTF-8 to ENCODING_INVALID with exit 0', () => {
      const root = createTempRoot();
      writeMarker(root);
      writeInput(root, 'bad.txt', Buffer.from([0xff, 0xfe, 0xfd]));

      const result = runCli(['--root', root, '--input', 'bad.txt', '--length-unit', 'ABSENT']);
      expect(result.status).toBe(0);
      const payload = parseStdoutJson(result.stdout ?? '');
      expect(payload.outcome).toBe('ENCODING_INVALID');
      expect(payload.interpretiveEncoding).toBe('BV-ENC-INVALID');
      expect(payload.failureCode).toBeNull();
      expectEmptyStderr(result);
    });

    it('maps wrapper ambiguity to exit 7 without leaking tokens', () => {
      const root = createTempRoot();
      writeMarker(root);
      writeInput(
        root,
        'wrap.txt',
        '<user_query>\nMED=A\n</user_query>\n<user_query>\n</user_query>\n',
      );

      const result = runCli([
        '--root',
        root,
        '--input',
        'wrap.txt',
        '--length-unit',
        'ABSENT',
        '--wrapper-mode',
        'FIXED_USER_QUERY_V1',
      ]);
      expect(result.status).toBe(7);
      const payload = parseStdoutJson(result.stdout ?? '');
      expect(payload.failureCode).toBe('RULE5_WRAPPER_SOURCE_AMBIGUOUS');
      for (const pattern of LEAKAGE_PATTERNS) {
        expect(result.stdout ?? '').not.toMatch(pattern);
      }
      expectEmptyStderr(result);
    });

    it('emits stable JSON key order on success and error paths', () => {
      const root = createTempRoot();
      writeMarker(root);
      writeInput(root, 'stable.txt', 'MED=Z');

      const ok = runCli(['--root', root, '--input', 'stable.txt', '--length-unit', 'ABSENT']);
      expect((ok.stdout ?? '').trim()).toBe(
        '{"toolVersion":"P2-B3-1","outcome":"PARSED","failureCode":null,"interpretiveEncoding":"PASS","byteLength":5,"logicalLineCount":1,"candidateHeaderCount":1,"lineAnchorState":"SINGLE","wrapperState":"ABSENT","lengthUnit":"ABSENT"}',
      );

      const err = runCli(['--root', root, '--input', 'missing.txt', '--length-unit', 'ABSENT']);
      expect((err.stdout ?? '').trim()).toBe(
        '{"toolVersion":"P2-B3-1","outcome":"ERROR","failureCode":"RULE5_CLI_INPUT_NOT_FOUND"}',
      );
    });

    it('maps O_NOFOLLOW unavailable to unsupported platform without fallback', () => {
      __setCliTestSeam({ isConfinedOpenSupported: () => false });
      let stdout = '';
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
        stdout += String(chunk);
        return true;
      });
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code) => {
        throw new Error(`exit:${code}`);
      }) as never);

      expect(() =>
        runVerifySyntheticCli(['--root', '/tmp/x', '--input', 'a.txt', '--length-unit', 'ABSENT']),
      ).toThrow('exit:1');
      expect(parseStdoutJson(stdout)).toEqual({
        toolVersion: TOOL_VERSION,
        outcome: 'ERROR',
        failureCode: RULE5_CLI_UNSUPPORTED_PLATFORM,
      });

      writeSpy.mockRestore();
      exitSpy.mockRestore();
    });
  },
);

describe('provenance synthetic CLI regression guard', () => {
  it('keeps existing provenance unit tests discoverable', () => {
    const files = [
      'provenance-core.test.ts',
      'provenance-structure.test.ts',
      'provenance-parse-structure.test.ts',
    ];
    for (const file of files) {
      expect(existsSync(path.join(REPO_ROOT, 'tests/unit', file))).toBe(true);
    }
  });
});
