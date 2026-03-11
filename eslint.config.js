import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    extends: [eslint.configs.recommended, tseslint.configs.recommended],
  },
]);
