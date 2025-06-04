import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: [
            '__tests__/*.ts',
            '__tests__/**/*.ts',
            'src/**/*.test.ts',
            'packages/ts/**/*.test.ts'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: [
                '__tests__/*.ts',
                '__tests__/**/*.ts',
                'src/**/*.ts',
                'packages/ts/**/*.ts'
            ],
            exclude: [
                '__tests__/*.test.ts',
                '__tests__/*.d.ts',
                '__tests__/**/*.test.ts',
                '__tests__/**/*.d.ts',
                'src/**/*.test.ts',
                'src/**/*.d.ts',
                'packages/ts/**/*.test.ts',
                'packages/ts/**/*.d.ts'
            ]
        }
    }
}); 