import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// VSCode CSS imports need to be loaded as strings to prevent style conflicts
function loadVscodeCssAsString(): Plugin {
  return {
    name: 'load-vscode-css-as-string',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (
        source.endsWith('.css') &&
        importer != null &&
        (/(monaco-editor|@codingame\/monaco-vscode)/.exec(importer) != null)
      ) {
        const resolved = await this.resolve(source, importer, {
          ...options,
          skipSelf: true,
        })
        if (resolved != null) {
          return {
            ...resolved,
            id: `${resolved.id}?inline`,
          }
        }
      }
      return undefined
    },
  }
}

// Enable SharedArrayBuffer support (needed for some language features)
function configureResponseHeaders(): Plugin {
  return {
    name: 'configure-response-headers',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless')
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), loadVscodeCssAsString(), configureResponseHeaders()],
  build: {
    target: 'esnext',
  },
  worker: {
    format: 'es',
  },
  server: {
    port: 5180,
    host: '0.0.0.0',
    fs: {
      allow: ['../..'],
    },
  },
  optimizeDeps: {
    include: [
      'monaco-editor',
      '@codingame/monaco-vscode-api',
    ],
  },
  resolve: {
    dedupe: ['monaco-editor', 'vscode'],
  },
})
