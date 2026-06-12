#!/usr/bin/env node
/**
 * Production deploy — always build fresh frontend/dist, never stale .vercel/output from git.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

console.log('[deploy] Building frontend...');
execSync('npm run build:web', { cwd: root, stdio: 'inherit' });

const dist = path.join(root, 'frontend', 'dist');
const outStatic = path.join(root, '.vercel', 'output', 'static');
const configPath = path.join(root, '.vercel', 'output', 'config.json');

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('[deploy] frontend/dist/index.html missing — build failed.');
  process.exit(1);
}

const indexHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const jsMatch = indexHtml.match(/index-([A-Za-z0-9_-]+)\.js/);
console.log('[deploy] Built bundle:', jsMatch ? `index-${jsMatch[1]}.js` : '(unknown)');

fs.mkdirSync(outStatic, { recursive: true });
for (const name of fs.readdirSync(outStatic)) {
  fs.rmSync(path.join(outStatic, name), { recursive: true, force: true });
}
for (const name of fs.readdirSync(dist)) {
  const src = path.join(dist, name);
  const dest = path.join(outStatic, name);
  fs.cpSync(src, dest, { recursive: true });
}

const railwayApi =
  JSON.parse(
    fs.readFileSync(path.join(root, 'config', 'railway-production.json'), 'utf8')
  ).apiUrl.replace(/\/$/, '');

const config = {
  version: 3,
  routes: [
    { src: '/health', dest: `${railwayApi}/health` },
    { src: '/api/(.*)', dest: `${railwayApi}/api/$1` },
    { src: '/uploads/(.*)', dest: `${railwayApi}/uploads/$1` },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index.html' }
  ],
  overrides: {
    'index.html': {
      headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }]
    }
  }
};
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log('[deploy] Uploading to Vercel production...');
execSync('npx vercel deploy --prebuilt --prod --yes --force', { cwd: root, stdio: 'inherit' });

console.log('[deploy] Done — verify https://eh-arogya-sutra.vercel.app/login');
