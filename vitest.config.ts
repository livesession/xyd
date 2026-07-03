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
            '**/__tests__/e2e/**',
            // Generated SDK goldens contain their own emitted *.test.ts (e.g. the
            // node emitter's output/tests/*.test.ts). They are ARTIFACTS, not repo
            // tests — never collect them (each emitter's own vitest config already
            // restricts include to __tests__/**; the root glob is broader).
            '**/__fixtures__/**',
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