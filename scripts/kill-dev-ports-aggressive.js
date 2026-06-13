'use strict';

/**
 * Aggressive dev-port purge — Windows netstat/taskkill + npx kill-port.
 * Priority: 5000 (Node API), 3001 (Next), 8005 (Python EH API).
 */
const { execSync } = require('child_process');
const net = require('net');

const PRIORITY_PORTS = [5000, 3001, 8001, 8005];
const EXTRA_PORTS = [5178, 5179, 5173, 8000];
const MAX_ROUNDS = 6;
const SETTLE_MS = 350;

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    /* spin until ports release */
  }
}

function isWin() {
  return process.platform === 'win32';
}

function getListeningPids(port) {
  const pids = new Set();
  if (!isWin()) return pids;
  try {
    const stdout = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    for (const line of stdout.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.includes('LISTENING')) continue;
      const parts = trimmed.split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && /^\d+$/.test(pid)) {
        pids.add(pid);
      }
    }
  } catch {
    /* port likely free */
  }
  return pids;
}

/** Windows FOR /F netstat → taskkill (user-requested native query). */
function killPortWinNative(port) {
  if (!isWin()) return;
  const batch = [
    `for /f "tokens=5" %%P in ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') do taskkill /F /T /PID %%P`,
  ].join(' & ');
  try {
    execSync(`cmd /c "${batch}"`, { stdio: 'pipe' });
  } catch {
    /* no matching PID */
  }
}

function killPidTree(pid, port) {
  if (!pid || pid === '0') return;
  try {
    if (isWin()) {
      execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'pipe' });
      console.log(`  taskkill /F /T /PID ${pid} (port ${port})`);
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'pipe' });
      console.log(`  kill -9 ${pid} (port ${port})`);
    }
  } catch (e) {
    console.warn(`  could not kill PID ${pid} on port ${port}: ${e.message}`);
  }
}

function killPortParsed(port) {
  const pids = getListeningPids(port);
  for (const pid of pids) {
    killPidTree(pid, port);
  }
}

function runNpxKillPort(ports) {
  const list = ports.join(' ');
  console.log(`[kill-ports] npx kill-port ${list}`);
  try {
    execSync(`npx --yes kill-port ${list}`, {
      stdio: 'inherit',
      timeout: 45000,
      env: { ...process.env, npm_config_yes: 'true' },
    });
  } catch {
    console.warn('[kill-ports] npx kill-port finished (some ports may already be free)');
  }
}

function isPortBusy(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(true));
    server.listen({ port, host: '127.0.0.1', exclusive: true }, () => {
      server.close(() => resolve(false));
    });
  });
}

async function waitPortFree(port, label) {
  for (let i = 0; i < 8; i++) {
    if (!(await isPortBusy(port))) {
      console.log(`[kill-ports] ✓ port ${port} free (${label})`);
      return true;
    }
    sleep(SETTLE_MS);
  }
  return false;
}

async function purgeDevPorts(options = {}) {
  const ports = options.ports || [...PRIORITY_PORTS, ...EXTRA_PORTS];
  const mustFree = options.mustFree || PRIORITY_PORTS;
  const npxTargets = options.npxPorts || mustFree;
  console.log('═══════════════════════════════════════════════════════');
  console.log('  AGGRESSIVE PORT PURGE — ghost processes terminated');
  console.log(`  Targets: ${ports.join(', ')}`);
  console.log('═══════════════════════════════════════════════════════');

  runNpxKillPort(npxTargets);

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    console.log(`[kill-ports] sweep round ${round}/${MAX_ROUNDS}`);
    for (const port of ports) {
      killPortWinNative(port);
      killPortParsed(port);
    }
    sleep(SETTLE_MS);
    const blocked = [];
    for (const port of mustFree) {
      if (await isPortBusy(port)) blocked.push(port);
    }
    if (!blocked.length) break;
    if (round === MAX_ROUNDS) {
      console.error(`[kill-ports] still blocked after ${MAX_ROUNDS} rounds: ${blocked.join(', ')}`);
    }
  }

  let ok = true;
  for (const port of mustFree) {
    const free = await waitPortFree(port, mustFree[0] === port ? 'Node/Next/Python' : '');
    if (!free) ok = false;
  }

  if (!ok) {
    console.error(
      '[kill-ports] FATAL: port 5000 (or other dev port) still occupied — close other npm run dev terminals manually.'
    );
    process.exit(1);
  }

  console.log('[kill-ports] all priority dev ports purged — safe to start stack.');
  return true;
}

function parseCliOptions() {
  const args = process.argv.slice(2);
  const onlyIdx = args.indexOf('--only');
  if (onlyIdx >= 0) {
    const nums = args
      .slice(onlyIdx + 1)
      .map((a) => parseInt(a, 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (nums.length) {
      return { ports: nums, mustFree: nums, npxPorts: nums };
    }
  }
  return {};
}

if (require.main === module) {
  purgeDevPorts(parseCliOptions()).catch((err) => {
    console.error('[kill-ports]', err);
    process.exit(1);
  });
}

module.exports = { purgeDevPorts, PRIORITY_PORTS, killPortParsed, getListeningPids };
