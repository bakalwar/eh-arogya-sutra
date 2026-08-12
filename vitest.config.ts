import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'packages/**/src/**/*.test.ts',
      'packages/rule6/tests/**/*.test.ts',
    ],
    environment: 'node',
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
