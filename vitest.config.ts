import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({

  plugins: [react()],
  css: { postcss: { plugins: [] } },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['components/**/*.{ts,tsx}'],
      exclude: ['**/*.test.*', '**/node_modules/**', '**/.DS_Store'],
      thresholds: {
        statements: 25,
        branches: 22,
        functions: 30,
        lines: 25,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
