import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['dist/', 'node_modules/', 'coverage/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
    },
  },
  // The engine boundary: game code (src/, tests/) talks to the engine only through engine/api.ts.
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['**/engine/**', '!**/engine/api.ts'], message: 'Game code imports only engine/api.ts. The rest of engine/ is owner-only.' }] },
      ],
    },
  },
  // Content runs on the server and, for path() and draw(), on every client: it must give the same
  // result everywhere. Randomness comes from ctx.rng (server) or a seed (launch.seed, e.seed, fx.seed).
  {
    files: ['src/content/**/*.ts'],
    rules: {
      'no-restricted-properties': ['error', { object: 'Math', property: 'random', message: 'Use ctx.rng on the server, or the seed you are given in path()/draw().' }],
      'no-restricted-globals': ['error', 'Date', 'performance', 'window', 'document', 'localStorage'],
    },
  },
);
