const { execSync } = require('child_process');

/** Dev stack ports — ghost processes killed on every boot */
const DEV_PORTS = [5178, 5179, 5000, 3001, 8005];

function freePort(port) {
  try {
    console.log(`Checking port ${port}…`);
    const stdout = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const pids = new Set();

    for (const line of stdout.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.includes('LISTENING')) continue;
      const parts = trimmed.split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && /^\d+$/.test(pid)) {
        pids.add(pid);
      }
    }

    for (const pid of pids) {
      console.log(`  taskkill /F /PID ${pid} (port ${port})`);
      try {
        execSync(`taskkill /F /PID ${pid}`);
      } catch (e) {
        console.error(`  Failed to kill PID ${pid}: ${e.message}`);
      }
    }
  } catch {
    /* port free */
  }
}

function freeDevPorts(ports = DEV_PORTS) {
  console.log(`Terminating ghost processes on ports: ${ports.join(', ')}`);
  for (const port of ports) {
    freePort(port);
  }
}

if (require.main === module) {
  freeDevPorts();
  freePort(5173);
  freePort(8000);
  freePort(8001);
}

module.exports = { freePort, freeDevPorts, DEV_PORTS };
