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
import fs from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MARKER_FILENAME,
  isConfinedOpenSupported,
  readSyntheticInput,
} from '../../tools/provenance/readSyntheticInput.mjs';
import * as adapterModule from '../../tools/provenance/readSyntheticInput.mjs';
import {
  HELP_TEXT,
  RULE5_CLI_UNSUPPORTED_PLATFORM,
  RULE5_CLI_USAGE_ERROR,
  TOOL_VERSION,
  VERSION_TEXT,
  runVerifySyntheticCli,
} from '../../tools/provenance/verifySyntheticCli.mjs';
import * as cliModule from '../../tools/provenance/verifySyntheticCli.mjs';

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

const FORBIDDEN_EXPORT_NAME = /TestSeam|setAdapter|setCli|override|mock/i;

/** Test-local exact marker bytes; not imported from production adapter. */
const TEST_MARKER_BYTES = Buffer.from('EHAS2_SYNTHETIC_ROOT_V1\n', 'utf8');

const ADAPTER_EXPORTS = Object.keys(adapterModule);
const CLI_EXPORTS = Object.keys(cliModule);

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
  writeFileSync(path.join(root, MARKER_FILENAME), TEST_MARKER_BYTES);
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

/**
 * Run a callback with an isolated node:fs mock; production modules stay unaware.
 *
 * @template T
 * @param {(actual: typeof import('node:fs')) => Partial<typeof import('node:fs').default>} configureMock
 * @param {(modules: {
 *   adapter: typeof import('../../tools/provenance/readSyntheticInput.mjs');
 *   cli?: typeof import('../../tools/provenance/verifySyntheticCli.mjs');
 * }) => T | Promise<T>} fn
 * @param {{ loadCli?: boolean }} [options]
 * @returns {Promise<T>}
 */
async function withIsolatedFsMock(configureMock, fn, options = {}) {
  vi.doMock('node:fs', async (importOriginal) => {
    const actual = await importOriginal();
    const overrides = configureMock(/** @type {typeof import('node:fs')} */ actual);
    const fsDefault = /** @type {typeof import('node:fs').default} */ actual.default;
    return {
      ...actual,
      default: {
        ...fsDefault,
        ...overrides,
      },
    };
  });

  vi.resetModules();

  try {
    const adapter = await import('../../tools/provenance/readSyntheticInput.mjs');
    /** @type {{ adapter: typeof adapter; cli?: typeof import('../../tools/provenance/verifySyntheticCli.mjs') }} */
    const modules = { adapter };
    if (options.loadCli) {
      modules.cli = await import('../../tools/provenance/verifySyntheticCli.mjs');
    }
    return await fn(modules);
  } finally {
    vi.doUnmock('node:fs');
    vi.resetModules();
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  while (createdTempRoots.length > 0) {
    const target = createdTempRoots.pop();
    if (target && existsSync(target)) {
      rmSync(target, { recursive: true, force: true });
    }
  }
});

describe('provenance verifySyntheticCli (P2-B3 confined synthetic CLI)', () => {
  it('does not export marker byte authority or mutable test seam setters', () => {
    expect(ADAPTER_EXPORTS).not.toContain('MARKER_EXACT_BYTES');
    expect(ADAPTER_EXPORTS).not.toContain('__setAdapterTestSeam');
    expect(CLI_EXPORTS).not.toContain('__setCliTestSeam');
    for (const name of [...ADAPTER_EXPORTS, ...CLI_EXPORTS]) {
      expect(name).not.toMatch(FORBIDDEN_EXPORT_NAME);
    }
  });

  it('exports no Buffer, Uint8Array, or marker-control objects from adapter', () => {
    for (const name of ADAPTER_EXPORTS) {
      const value = adapterModule[name as keyof typeof adapterModule];
      expect(value).not.toBeInstanceOf(Buffer);
      expect(value).not.toBeInstanceOf(Uint8Array);
      expect(Array.isArray(value)).toBe(false);
      if (value !== null && typeof value === 'object' && !(value instanceof Function)) {
        expect(Object.isFrozen(value)).toBe(true);
      }
    }
  });

  it('adapter source keeps marker bytes internal and unexported', () => {
    const source = readFileSync(ADAPTER_PATH, 'utf8');
    expect(source).not.toMatch(/export const MARKER_EXACT_BYTES/);
    expect(source).toMatch(/MARKER_EXACT_TEXT/);
  });

  it('adapter source contains no mutable seam state', () => {
    const source = readFileSync(ADAPTER_PATH, 'utf8');
    expect(source).not.toMatch(/adapterTestSeam|cliTestSeam|__setAdapterTestSeam|__setCliTestSeam/);
    expect(source).not.toMatch(/TestSeam|setAdapter|setCli/);
  });

  it('reports programmatic export inventory for new modules', () => {
    expect(ADAPTER_EXPORTS.sort()).toEqual(
      [
        'INPUT_MAX_BYTES',
        'INPUT_MAX_READ',
        'MARKER_EXACT_BYTE_LENGTH',
        'MARKER_FILENAME',
        'MARKER_MAX_READ',
        'MARKER_MAX_SIZE',
        'RULE5_CLI_HARDLINK_REJECTED',
        'RULE5_CLI_INPUT_NOT_FOUND',
        'RULE5_CLI_INPUT_OVERSIZE',
        'RULE5_CLI_MARKER_INVALID',
        'RULE5_CLI_PATH_CONFINEMENT_FAILED',
        'RULE5_CLI_READ_FAILED',
        'RULE5_CLI_ROOT_INVALID',
        'RULE5_CLI_UNSAFE_FILE_TYPE',
        'RULE5_CLI_UNSUPPORTED_PLATFORM',
        'Rule5SyntheticInputError',
        'isConfinedOpenSupported',
        'readSyntheticInput',
      ].sort(),
    );
    expect(CLI_EXPORTS.sort()).toEqual(
      [
        'HELP_TEXT',
        'RULE5_CLI_INTERNAL_ERROR',
        'RULE5_CLI_UNSUPPORTED_PLATFORM',
        'RULE5_CLI_USAGE_ERROR',
        'TOOL_VERSION',
        'VERSION_TEXT',
        'runVerifySyntheticCli',
      ].sort(),
    );
  });

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
        Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), TEST_MARKER_BYTES]),
        Buffer.concat([TEST_MARKER_BYTES, Buffer.from('X')]),
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
      writeFileSync(markerReal, TEST_MARKER_BYTES);
      symlinkSync(markerReal, path.join(root, MARKER_FILENAME));
      writeInput(root, 'x.txt', 'MED=A');
      let result = runCli(['--root', root, '--input', 'x.txt', '--length-unit', 'ABSENT']);
      expect(result.status).toBe(2);
      expect(parseStdoutJson(result.stdout ?? '').failureCode).toBe('RULE5_CLI_MARKER_INVALID');

      const root2 = createTempRoot();
      writeFileSync(path.join(root2, MARKER_FILENAME), TEST_MARKER_BYTES);
      linkSync(path.join(root2, MARKER_FILENAME), path.join(root2, 'marker-hardlink'));
      writeInput(root2, 'x.txt', 'MED=A');
      result = runCli(['--root', root2, '--input', 'x.txt', '--length-unit', 'ABSENT']);
      expect(result.status).toBe(2);
      expect(parseStdoutJson(result.stdout ?? '').failureCode).toBe('RULE5_CLI_MARKER_INVALID');
    });

    it('rejects marker lstat/fstat identity mismatch via isolated fs mock', async () => {
      const root = createTempRoot();
      writeMarker(root);
      writeInput(root, 'x.txt', 'MED=A');

      await withIsolatedFsMock(
        (actual) => {
          let fstatCalls = 0;
          const originalFstat = actual.default.fstatSync.bind(actual.default);
          return {
            fstatSync: (fd) => {
              fstatCalls += 1;
              const stats = originalFstat(fd);
              if (fstatCalls === 1) {
                return Object.create(stats, {
                  ino: { value: Number(stats.ino) + 999999, enumerable: true },
                });
              }
              return stats;
            },
          };
        },
        async ({ adapter }) => {
          expect(() => adapter.readSyntheticInput(root, 'x.txt')).toThrow(
            adapter.Rule5SyntheticInputError,
          );
          try {
            adapter.readSyntheticInput(root, 'x.txt');
          } catch (err) {
            expect(err).toBeInstanceOf(adapter.Rule5SyntheticInputError);
            expect(/** @type {{ failureCode: string }} */ err.failureCode).toBe(
              'RULE5_CLI_MARKER_INVALID',
            );
          }
        },
      );
    });

    it('maps marker identity mismatch to MARKER_INVALID exit 2 via in-process CLI', async () => {
      const root = createTempRoot();
      writeMarker(root);
      writeInput(root, 'x.txt', 'MED=A');

      await withIsolatedFsMock(
        (actual) => {
          let fstatCalls = 0;
          const originalFstat = actual.default.fstatSync.bind(actual.default);
          return {
            fstatSync: (fd) => {
              fstatCalls += 1;
              const stats = originalFstat(fd);
              if (fstatCalls === 1) {
                return Object.create(stats, {
                  ino: { value: Number(stats.ino) + 888888, enumerable: true },
                });
              }
              return stats;
            },
          };
        },
        async ({ cli }) => {
          let stdout = '';
          const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
            stdout += String(chunk);
            return true;
          });
          const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code) => {
            throw new Error(`exit:${code}`);
          }) as never);

          try {
            expect(() =>
              cli!.runVerifySyntheticCli([
                '--root',
                root,
                '--input',
                'x.txt',
                '--length-unit',
                'ABSENT',
              ]),
            ).toThrow('exit:2');
            expect(parseStdoutJson(stdout)).toEqual({
              toolVersion: TOOL_VERSION,
              outcome: 'ERROR',
              failureCode: 'RULE5_CLI_MARKER_INVALID',
            });
            for (const pattern of LEAKAGE_PATTERNS) {
              expect(stdout).not.toMatch(pattern);
            }
          } finally {
            writeSpy.mockRestore();
            exitSpy.mockRestore();
          }
        },
        { loadCli: true },
      );
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

    it('rejects input hard link and input identity mismatch', async () => {
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

      await withIsolatedFsMock(
        (actual) => {
          let fstatCalls = 0;
          const originalFstat = actual.default.fstatSync.bind(actual.default);
          return {
            fstatSync: (fd) => {
              fstatCalls += 1;
              const stats = originalFstat(fd);
              if (fstatCalls === 2) {
                return Object.create(stats, {
                  ino: { value: Number(stats.ino) + 424242, enumerable: true },
                });
              }
              return stats;
            },
          };
        },
        async ({ adapter }) => {
          expect(() => adapter.readSyntheticInput(root2, 'probe.txt')).toThrow(
            adapter.Rule5SyntheticInputError,
          );
          try {
            adapter.readSyntheticInput(root2, 'probe.txt');
          } catch (err) {
            expect(err).toBeInstanceOf(adapter.Rule5SyntheticInputError);
            expect(/** @type {{ failureCode: string }} */ err.failureCode).toBe(
              'RULE5_CLI_PATH_CONFINEMENT_FAILED',
            );
          }
        },
      );
    });

    it('uses real fstat after isolated fs mocks complete', async () => {
      const root = createTempRoot();
      writeMarker(root);
      writeInput(root, 'real-stat.txt', 'MED=R');

      await withIsolatedFsMock(
        (actual) => {
          let fstatCalls = 0;
          const originalFstat = actual.default.fstatSync.bind(actual.default);
          return {
            fstatSync: (fd) => {
              fstatCalls += 1;
              const stats = originalFstat(fd);
              if (fstatCalls === 1) {
                return Object.create(stats, {
                  ino: { value: Number(stats.ino) + 111, enumerable: true },
                });
              }
              return stats;
            },
          };
        },
        async ({ adapter }) => {
          expect(() => adapter.readSyntheticInput(root, 'real-stat.txt')).toThrow(
            adapter.Rule5SyntheticInputError,
          );
        },
      );

      const bytes = readSyntheticInput(root, 'real-stat.txt');
      expect(bytes.length).toBeGreaterThan(0);
    });

    it('production adapter reads input using real fstat without mocks', () => {
      const root = createTempRoot();
      writeMarker(root);
      writeInput(root, 'unmocked.txt', 'MED=U');

      const bytes = readSyntheticInput(root, 'unmocked.txt');
      expect(Buffer.from(bytes).toString('utf8')).toBe('MED=U');
    });

    it('caller-owned marker buffer mutation cannot alter later validation', () => {
      const root = createTempRoot();
      const callerMarker = Buffer.from('EHAS2_SYNTHETIC_ROOT_V1\n', 'utf8');
      writeFileSync(path.join(root, MARKER_FILENAME), callerMarker);
      writeInput(root, 'first.txt', 'MED=A');
      readSyntheticInput(root, 'first.txt');

      callerMarker[0] = 0x58;

      writeInput(root, 'second.txt', 'MED=B');
      const bytes = readSyntheticInput(root, 'second.txt');
      expect(Buffer.from(bytes).toString('utf8')).toBe('MED=B');
    });

    it('asserts runtime O_NOFOLLOW availability via real constants', () => {
      expect(fs.constants.O_NOFOLLOW).toBeDefined();
      expect(isConfinedOpenSupported()).toBe(true);
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

    it('maps O_NOFOLLOW unavailable to unsupported platform without fallback', async () => {
      await withIsolatedFsMock(
        (actual) => ({
          constants: {
            ...actual.default.constants,
            O_NOFOLLOW: undefined,
          },
        }),
        async ({ cli }) => {
          let stdout = '';
          const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
            stdout += String(chunk);
            return true;
          });
          const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code) => {
            throw new Error(`exit:${code}`);
          }) as never);

          try {
            expect(() =>
              cli!.runVerifySyntheticCli([
                '--root',
                '/tmp/x',
                '--input',
                'a.txt',
                '--length-unit',
                'ABSENT',
              ]),
            ).toThrow('exit:1');
            expect(parseStdoutJson(stdout)).toEqual({
              toolVersion: TOOL_VERSION,
              outcome: 'ERROR',
              failureCode: RULE5_CLI_UNSUPPORTED_PLATFORM,
            });
          } finally {
            writeSpy.mockRestore();
            exitSpy.mockRestore();
          }
        },
        { loadCli: true },
      );
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
