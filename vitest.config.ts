import { defineConfig } from 'vitest/config';

export default defineConfig({
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
