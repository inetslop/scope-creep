import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __BUILD_SHA__: JSON.stringify('test'),
    __BUILD_TIME__: JSON.stringify('test'),
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
