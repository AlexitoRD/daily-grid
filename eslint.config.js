// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'dist/',
      '.astro/',
      'coverage/',
      'playwright-report/',
      'test-results/',
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.strict,
  astro.configs.recommended,
);
