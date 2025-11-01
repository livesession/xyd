import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import PluginCritical from "rollup-plugin-critical";

export default defineConfig({
  plugins: [
    tailwindcss(), 
    reactRouter(), 
    tsconfigPaths(),
    // Inline critical CSS for faster initial render
    PluginCritical({
      criticalUrl: "http://localhost:3000/",
      criticalBase: "./build/client/",
      criticalPages: [
        { uri: "", template: "index" },
      ],
      criticalConfig: {
        inline: true,
        extract: false,
        width: 1920,
        height: 1080,
        penthouse: {
          blockJSRequests: false,
        },
      },
    }) as any,
  ],
  build: {
    // Optimize CSS and font loading
    cssCodeSplit: true,
    // Inline small assets as base64 (< 4KB)
    assetsInlineLimit: 4096,
    // Optimize chunks
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Better chunking for fonts and assets with cache-friendly names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".");
          const ext = info?.[info.length - 1];
          // Keep fonts separate for better caching
          if (/woff2?|ttf|otf|eot/.test(ext || "")) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          // Images in separate folder
          if (/png|jpe?g|svg|gif|webp|avif/.test(ext || "")) {
            return `assets/images/[name]-[hash][extname]`;
          }
          // Videos in separate folder
          if (/mp4|webm|ogg/.test(ext || "")) {
            return `assets/videos/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        // Split vendor chunks for better caching
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            // Split React and React Router into separate chunks
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }
            if (id.includes("react-router")) {
              return "vendor-router";
            }
            // Other node_modules go into vendor chunk
            return "vendor";
          }
        },
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "react-router"],
  },
});
