import {defineConfig} from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: [
            'packages/**/*.test.ts',
            'packages/**/__tests__/**/*.test.ts',
            '__tests__/**/*.test.ts',
            // The five converter shims live in the `apitoolchain` submodule now.
            // They are pnpm workspace members here, their dist/ is what ~16 xyd
            // packages import, and xyd is where the napi addon exists — so their
            // tests keep running in THIS suite, not only in apitoolchain's.
            'apitoolchain/packages/xyd-*/**/*.test.ts',
            'apitoolchain/packages/xyd-*/__tests__/**/*.test.ts'
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
            // The rest of the submodule: twelve standalone bun packages (bun:test
            // or a local vitest with its own node_modules) and five apps. They
            // were excluded here under their old packages/apitoolchain-* paths
            // for exactly the same reason; apitoolchain's own CI runs them.
            'apitoolchain/packages/api-*/**',
            'apitoolchain/packages/auth-design-system/**',
            'apitoolchain/packages/design-system/**',
            'apitoolchain/packages/dev/**',
            'apitoolchain/packages/filters/**',
            'apitoolchain/packages/gitprovider-node/**',
            'apitoolchain/packages/registry-api-node/**',
            'apitoolchain/packages/release-man/**',
            'apitoolchain/packages/schemas/**',
            'apitoolchain/packages/sdk-chain/**',
            'apitoolchain/packages/sdkjson-wizard/**',
            'apitoolchain/apps/**',
            'apitoolchain/opensdk/**',
            'apitoolchain/cli/**',
            // xyd-opensdk-uniform is NATIVE-ONLY: its src throws on XYD_NATIVE=0
            // because the JS emitters it used to fall back to were deleted with
            // the TypeScript cluster. `pnpm build` does NOT build the napi addon
            // (xyd-native deliberately names its script build:native), and
            // tests-unit.yml has no Rust toolchain or submodule checkout — so
            // collecting these here fails 24 tests on a clean runner. The ffi job
            // in tests-native.yml builds the .node and owns them.
            'packages/xyd-opensdk-uniform/**',
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