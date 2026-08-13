#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Ordered typecheck. Internal packages emit declarations after check so
 * dependents resolve @ehas2/* types without a stale dist.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tsc = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

const ORDER = [
  '@ehas2/shared',
  '@ehas2/ops-contracts',
  '@ehas2/security',
  '@ehas2/management-contracts',
  '@ehas2/data-lifecycle-contracts',
  '@ehas2/observability',
  '@ehas2/config',
  '@ehas2/design-system',
  '@ehas2/database',
  '@ehas2/clinical-contracts',
  '@ehas2/rule6',
  '@ehas2/rule7',
  '@ehas2/rule8',
  '@ehas2/clinical-data-manifest',
  '@ehas2/medicine-registry',
  '@ehas2/engine-adapter',
  'eh-arogya-sutra-2-worker',
  'eh-arogya-sutra-2-api',
  'eh-arogya-sutra-2-web',
];

const workspaceDirs = {
  '@ehas2/shared': 'packages/shared',
  '@ehas2/ops-contracts': 'packages/ops-contracts',
  '@ehas2/security': 'packages/security',
  '@ehas2/management-contracts': 'packages/management-contracts',
  '@ehas2/data-lifecycle-contracts': 'packages/data-lifecycle-contracts',
  '@ehas2/observability': 'packages/observability',
  '@ehas2/config': 'packages/config',
  '@ehas2/design-system': 'packages/design-system',
  '@ehas2/database': 'packages/database',
  '@ehas2/clinical-contracts': 'packages/clinical-contracts',
  '@ehas2/rule6': 'packages/rule6',
  '@ehas2/rule7': 'packages/rule7',
  '@ehas2/rule8': 'packages/rule8',
  '@ehas2/clinical-data-manifest': 'packages/clinical-data-manifest',
  '@ehas2/medicine-registry': 'packages/medicine-registry',
  '@ehas2/engine-adapter': 'packages/engine-adapter',
  'eh-arogya-sutra-2-worker': 'apps/worker',
  'eh-arogya-sutra-2-api': 'apps/api',
  'eh-arogya-sutra-2-web': 'apps/web',
};

for (const ws of ORDER) {
  const dir = path.join(ROOT, workspaceDirs[ws]);
  console.log(`\n> ${ws} typecheck`);
  execFileSync(process.execPath, [tsc, '-p', 'tsconfig.json', '--noEmit'], {
    stdio: 'inherit',
    cwd: dir,
  });
  if (ws.startsWith('@ehas2/')) {
    console.log(`\n> ${ws} build`);
    execFileSync(process.execPath, [tsc, '-p', 'tsconfig.json'], { stdio: 'inherit', cwd: dir });
  }
}
