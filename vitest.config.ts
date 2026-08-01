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
            // The @apitoolchain/* packages are standalone bun packages (excluded
            // from the pnpm workspace) with their own test runners: apitoolchain-
            // filters runs its own `vitest run` against its own node_modules (for
            // kysely etc.), and apitoolchain-release-man uses `bun test`
            // (`bun:test`). The root pnpm Vitest can't resolve their bun deps, so
            // never collect them here.
            'packages/apitoolchain-*/**',
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