'use strict';

/**
 * Next.js dev server — primary clinician UI on 0.0.0.0:3001 (LAN + mobile).
 * Override: NEXT_DEV_HOST=0.0.0.0  NEXT_DEV_PORT=3001
 */
const { spawn } = require('child_process');
const path = require('path');
const { freePort } = require('./free-ports');
const { getLanIPv4, buildMobileDevUrls, printMobileDevBanner } = require('./network-urls');

const port = Number(process.env.NEXT_DEV_PORT || process.env.PORT) || 3001;
const host = (process.env.NEXT_DEV_HOST || '0.0.0.0').trim() || '0.0.0.0';
const lanIp = getLanIPv4();
const mobile = buildMobileDevUrls({ next: port, api: 5000, python: 8005 });

freePort(port);

console.log('');
console.log('Starting Next.js clinician app (0.0.0.0 — LAN accessible)...');
printMobileDevBanner({ next: port, api: 5000, python: 8005 });
if (lanIp) {
  console.log(`  ✓ Phone reports:  http://${lanIp}:${port}/reports`);
}
console.log(`  ✓ Laptop reports: http://localhost:${port}/reports`);

const nextAppDir = path.join(__dirname, '..', 'next-app');
const nextBin = path.join(nextAppDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const fs = require('fs');
const nextArgs = ['dev', '-H', host, '-p', String(port)];
const useDirectBin = fs.existsSync(nextBin);

const child = useDirectBin
  ? spawn(process.execPath, [nextBin, ...nextArgs], {
      cwd: nextAppDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        EH_LOCAL_DEV: '1',
        NEXT_PUBLIC_APP_ENV: 'local',
        NEXT_DEV_HOST: host,
        NEXT_DEV_PORT: String(port),
        EH_LAN_IPV4: lanIp || '',
        NEXT_PUBLIC_MOBILE_DEV_URL: mobile.next || `http://localhost:${port}`,
      },
    })
  : spawn('npx', ['next', ...nextArgs], {
      cwd: nextAppDir,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        EH_LOCAL_DEV: '1',
        NEXT_PUBLIC_APP_ENV: 'local',
        NEXT_DEV_HOST: host,
        NEXT_DEV_PORT: String(port),
        EH_LAN_IPV4: lanIp || '',
        NEXT_PUBLIC_MOBILE_DEV_URL: mobile.next || `http://localhost:${port}`,
      },
    });

child.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0 && code !== null) process.exit(code);
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
