import {defineConfig} from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: [
            'src/**/*.test.ts',
            'packages/**/*.test.ts',
            '**/__tests__/**/*.test.ts'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
    },
}) 