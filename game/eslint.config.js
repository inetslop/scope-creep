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
  // Architecture guardrail: core/ and content/ are pure TypeScript so they can be
  // unit-tested in Node and reasoned about without the engine.
  {
    files: ['src/core/**/*.ts', 'src/content/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'phaser', message: 'src/core and src/content must not import Phaser. Put engine code in entities/, systems/ or scenes/.' }],
          patterns: [{ group: ['**/scenes/*', '**/entities/*', '**/systems/*', '**/input/*', '**/art/*'], message: 'core/content must not depend on engine-side folders.' }],
        },
      ],
      'no-restricted-globals': ['error', 'window', 'document'],
    },
  },
);
