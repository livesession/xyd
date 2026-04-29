import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        pool: 'forks',
        include: [
            '__tests__/**/*.test.ts',
            'src/**/*.test.ts',
            'packages/ts/**/*.test.ts'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: [
                'src/**/*.ts',
                'packages/ts/**/*.ts'
            ],
            exclude: [
                '**/*.test.ts',
                '**/*.d.ts',
            ]
        }
    }
});