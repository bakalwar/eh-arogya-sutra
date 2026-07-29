#!/usr/bin/env node
import { execSync } from 'node:child_process';

/**
 * Ordered typecheck. Internal packages emit declarations after check so
 * dependents resolve @ehas2/* types without a stale dist.
 */
const ORDER = [
  '@ehas2/shared',
  '@ehas2/ops-contracts',
  '@ehas2/security',
  '@ehas2/observability',
  '@ehas2/config',
  '@ehas2/design-system',
  '@ehas2/database',
  '@ehas2/clinical-contracts',
  '@ehas2/engine-adapter',
  'eh-arogya-sutra-2-worker',
  'eh-arogya-sutra-2-api',
  'eh-arogya-sutra-2-web',
];

for (const ws of ORDER) {
  execSync(`npm run typecheck -w ${ws}`, { stdio: 'inherit' });
  if (ws.startsWith('@ehas2/')) {
    execSync(`npm run build -w ${ws}`, { stdio: 'inherit' });
  }
}
