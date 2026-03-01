import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/vitest/**/*.test.ts'],
    globals: true,
    environment: 'node',
    testTimeout: 15000,
  },
});
