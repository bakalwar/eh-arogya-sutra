'use strict';

/**
 * Remove stale build caches so Next.js + EH API always boot from fresh artifacts.
 */
const fs = require('fs');
const path = require('path');

function rmDirSafe(dir) {
  if (!fs.existsSync(dir)) return 0;
  try {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`  ✓ removed ${path.relative(process.cwd(), dir)}`);
    return 1;
  } catch (e) {
    console.warn(`  ✗ failed ${dir}: ${e.message}`);
    return 0;
  }
}

function wipeDevCache(options = {}) {
  const root = path.join(__dirname, '..');
  const targets = [
    path.join(root, 'next-app', '.next'),
    path.join(root, 'next-app', '.turbo'),
    path.join(root, 'next-app', 'node_modules', '.cache'),
    path.join(root, 'frontend', 'dist'),
    path.join(root, 'frontend', '.vite'),
    path.join(root, 'frontend', 'node_modules', '.cache'),
    path.join(root, 'node_modules', '.cache'),
    path.join(root, '.turbo'),
  ];

  if (!options.silent) {
    console.log('Wiping legacy build caches…');
  }

  let removed = 0;
  for (const dir of targets) {
    removed += rmDirSafe(dir);
  }

  if (!options.silent) {
    console.log(removed ? `Cache wipe done (${removed} target(s)).` : 'No cache directories found — already clean.');
  }

  return removed;
}

module.exports = { wipeDevCache };

if (require.main === module) {
  wipeDevCache();
}
