const { spawn } = require('child_process');
const path = require('path');
const { freePort } = require('./free-ports');

const vitePort = Number(process.env.VITE_PORT) || 5178;
const frontendDir = path.join(__dirname, '..', 'frontend');

console.log(`Starting Vite Frontend on 0.0.0.0:${vitePort}...`);
freePort(vitePort);
freePort(5179);

const viteBin = path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');
const vite = spawn(
  process.execPath,
  [viteBin, '--host', '0.0.0.0', '--port', String(vitePort), '--strictPort'],
  {
    cwd: frontendDir,
    stdio: 'inherit',
    env: { ...process.env, VITE_PORT: String(vitePort) },
  }
);

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
  process.exit(1);
});

vite.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Vite exited with code ${code}`);
    process.exit(code);
  }
});
