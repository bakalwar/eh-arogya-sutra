import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@ehas2/evidence-ingest': path.join(root, 'packages/evidence-ingest/src/index.ts'),
      '@ehas2/evidence-extract': path.join(root, 'packages/evidence-extract/src/index.ts'),
      '@ehas2/evidence-extract-adapters': path.join(
        root,
        'packages/evidence-extract-adapters/src/index.ts',
      ),
      '@ehas2/database': path.join(root, 'packages/database/src/index.ts'),
      '@ehas2/observability': path.join(root, 'packages/observability/src/index.ts'),
    },
  },
  test: {
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'packages/**/src/**/*.test.ts',
      'packages/rule1/tests/**/*.test.ts',
      'packages/rule2/tests/**/*.test.ts',
      'packages/rule3/tests/**/*.test.ts',
      'packages/rule6/tests/**/*.test.ts',
      'packages/rule7/tests/**/*.test.ts',
      'packages/rule8/tests/**/*.test.ts',
      'packages/rule9/tests/**/*.test.ts',
    ],
    environment: 'node',
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
