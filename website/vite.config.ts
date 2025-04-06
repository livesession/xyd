import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Simple async plugin
const helloPlugin = {
  name: 'hello-plugin',
  async configureServer() {
    console.log('Hello World!')
  }
}

// Async plugin to modify variables
const variableModifierPlugin = {
  name: 'variable-modifier',
  async transform(code, id) {
    if (id.endsWith('test.ts')) {
      // Simulate some async operation
      await new Promise(resolve => setTimeout(resolve, 10 * 1000));
      console.log('Async transformation completed');
      
      return {
        code: code.replace('test: ""', 'test: "test"'),
        map: null
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), helloPlugin, variableModifierPlugin],
  css: {
    postcss: './postcss.config.js'
  }
})
