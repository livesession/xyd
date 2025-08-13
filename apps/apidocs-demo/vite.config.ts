import path from "node:path";

import { reactRouter } from "@react-router/dev/vite";
import { defineConfig,  PluginOption as VitePluginOption } from "vite";
// import { createServer,, Plugin as VitePlugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import netlifyPlugin from '@netlify/vite-plugin-react-router' 

export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    virtualComponentsPlugin(),
    netlifyPlugin()
  ],
  ssr: {
    external: ["@xyd-js/framework/hydration", "fs"]
  },
  define: {
    'import.meta.env.APP_URL': JSON.stringify(process.env.APP_URL || 'https://apidocs-demo.xyd.dev')
  }
});


export function virtualComponentsPlugin(): VitePluginOption {
  return {
    name: 'xyd-plugin-virtual-components',
    enforce: 'pre',
    config: () => {
      const componentsDist = path.resolve(".", "./node_modules/@xyd-js/components/dist")

      return {
        resolve: {
          alias: {
            // TODO: type-safe virtual-components
            'virtual-component:Search': path.resolve(componentsDist, "system.js")
          }
        }
      }
    },
  }
}