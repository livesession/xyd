import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts' ,'packages/ts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'packages/ts/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts', 'packages/ts/**/*.test.ts', 'packages/ts/**/*.d.ts']
    }
  }
}); 