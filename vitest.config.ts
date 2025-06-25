import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    includeSource: ['src/**/*.{js,ts}'],
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
})