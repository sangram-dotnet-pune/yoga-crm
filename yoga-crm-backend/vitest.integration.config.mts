import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['tests/integration/setup.ts'],
    globals: false,
    fileParallelism: false,
    testTimeout: 90_000,
    hookTimeout: 90_000,
  },
});
