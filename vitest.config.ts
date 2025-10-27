import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    include: ['tests/integration.test.ts'],
    exclude: [
      'server/tests/integration.test.js',
      'server/tests/e2e-smoke.test.js'
    ]
  }
})