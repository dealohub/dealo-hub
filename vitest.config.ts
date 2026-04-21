import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest config — scoped to pure-function unit tests right now.
 *
 * We do NOT enable jsdom (no DOM needed for validators / helpers /
 * pure mappers). That keeps the test run fast — the whole suite
 * runs in well under a second on a cold cache.
 *
 * Tests land next to the code they cover (e.g. `validators.test.ts`
 * sits next to `validators.ts`) — no separate tests/ tree. This
 * keeps refactor-and-rename cheap.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'out', 'dist'],
    // Fail-fast on unhandled rejections — safer for pure fn tests.
    dangerouslyIgnoreUnhandledErrors: false,
  },
});
