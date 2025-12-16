import path from 'node:path'

import { defineConfig } from 'vite'
import { reactRouter } from "@react-router/dev/vite";

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './app'),
    },
  },
  ssr: {
    // te pakiety muszą przejść przez transformację Vite (nie externalizuj)
    noExternal: ['@primer/react', '@primer/primitives'],
  },
  optimizeDeps: {
    // opcjonalne, pomaga w dev/prebundle po stronie klienta
    include: ['@primer/react'],
  },
})
