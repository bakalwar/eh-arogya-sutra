#!/usr/bin/env node
/**
 * Deploy next-app to Vercel production (NOT the legacy Vite frontend).
 * Usage: npm run deploy:vercel:next
 */
const { execSync } = require('child_process');
const path = require('path');
const { assertNotLocalDev } = require('./local-dev-guard');

assertNotLocalDev('Vercel Next.js production deploy');

const nextApp = path.join(__dirname, '..', 'next-app');

console.log('[deploy:next] Building next-app...');
execSync('npm run build', { cwd: nextApp, stdio: 'inherit' });

console.log('[deploy:next] Uploading to Vercel production...');
execSync('npx vercel deploy --prod --yes --force', { cwd: nextApp, stdio: 'inherit' });

console.log('[deploy:next] Done — verify https://eh-arogya-sutra.vercel.app/case-summary');
