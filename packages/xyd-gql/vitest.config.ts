import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
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