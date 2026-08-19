import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/.next-phase5a/**',
      '**/.next-phase5b/**',
      '**/.next-phase5c/**',
      '**/.next-phase5c-g/**',
      '**/.next-phase5c-g-br/**',
      '**/.next-phase5c-g-br2/**',
      '**/clinical-artifacts/**',
      '**/.venv/**',
      '**/node_modules/**',
      '**/_scaffold_phase1a.py',
      '**/next-env.d.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/EH_Arogya_Sutra_App/**', '**/eh-api/**'],
              message: 'EHAS2 must not import the old project at runtime.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'apps/api/**/*.js',
      'apps/api/**/*.cjs',
      'apps/api/**/*.mjs',
      'apps/api/**/*.ts',
      'apps/worker/**/*.js',
      'apps/worker/**/*.cjs',
      'apps/worker/**/*.mjs',
      'apps/worker/**/*.ts',
      'apps/web/**/*.js',
      'apps/web/**/*.cjs',
      'apps/web/**/*.mjs',
      'apps/web/**/*.ts',
      'apps/web/**/*.tsx',
      'packages/database/**/*.js',
      'packages/database/**/*.cjs',
      'packages/database/**/*.mjs',
      'packages/database/**/*.ts',
      'packages/evidence-extract-adapters/**/*.js',
      'packages/evidence-extract-adapters/**/*.cjs',
      'packages/evidence-extract-adapters/**/*.mjs',
      'packages/evidence-extract-adapters/**/*.ts',
    ],
    ignores: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx', '**/*.spec.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@ehas2/evidence-extract',
              importNames: ['parseOwnerFrozenCues'],
              message:
                'H2: runtime trees must not import parseOwnerFrozenCues; readiness flags only.',
            },
          ],
          patterns: [
            {
              group: ['**/EH_Arogya_Sutra_App/**', '**/eh-api/**'],
              message: 'EHAS2 must not import the old project at runtime.',
            },
            {
              group: [
                '**/terminology/parser/**',
                '**/src/terminology/parser/**',
                '**/dist/terminology/parser/**',
                '@ehas2/evidence-extract/src/**',
                '@ehas2/evidence-extract/dist/**',
                '@ehas2/evidence-extract/*',
              ],
              message:
                'H2: runtime trees may import @ehas2/evidence-extract root only; parser internals are forbidden.',
            },
          ],
        },
      ],
    },
  },
);
