import { defineConfig, defineWorkspace } from 'vitest/config'

export default defineWorkspace([
    {
        // extends: './vite.config.ts',
        test: {
            name: 'unit',
            include: ['**/unit/**/*.test.ts'],
            environment: 'node',
            globals: true,
        },
    },
    {
        // extends: './vite.config.ts',
        test: {
            name: 'integration',
            include: ['**/integration/**/*.test.ts'],
            environment: 'node',
            globals: true,
        },
    },
])