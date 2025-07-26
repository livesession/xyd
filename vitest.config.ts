import {defineConfig} from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: [
            'packages/**/*.test.ts',
            'packages/**/__tests__/**/*.test.ts',
            '__tests__/**/*.test.ts'
        ],
        exclude: [
            '__tests__/e2e/**',
            '__tests__/node-support/**',
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**'
        ]
    },
    plugins: [
        {
            name: 'graphql-raw',
            transform(code, id) {
                if (id.endsWith('.graphql')) {
                    return {
                        code: `export default ${JSON.stringify(code)};`,
                        map: null
                    }
                }
            }
        }
    ]
})