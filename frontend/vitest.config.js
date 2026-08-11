import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx}'],
    globals: true,
    css: false,
    reporters: ['default', ['junit', { outputFile: 'reports/vitest-junit.xml' }]],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'reports/coverage',
      include: ['src/**/*.{js,jsx}'],
    },
  },
})
