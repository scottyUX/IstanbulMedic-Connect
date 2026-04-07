import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    environmentMatchGlobs: [
      ['app/api/**', 'node'],
      ['__tests__/agents/**', 'node'],
      ['__tests__/api/**', 'node'],
      ['tests/unit/**', 'node'],
    ],
    globals: true,
    setupFiles: ['./vitest.setup.ts', './tests/setup.tsx'],
    include: [
      '__tests__/**/*.test.{ts,tsx}',
      'tests/**/*.test.{ts,tsx}',
      'app/**/*.test.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**/*.ts', 'components/**/*.tsx'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
