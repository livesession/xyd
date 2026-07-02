import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        // Only our unit tests — never the generated `tests/*.test.ts` under __fixtures__,
        // which are Node SDK test files (node:test), not vitest suites.
        include: ['__tests__/**/*.test.ts'],
    },
})
