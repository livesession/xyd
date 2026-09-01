import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import xyd from "@xyd-js/vite-plugin";

export default defineConfig({
    server: process.env.XYD_E2E_HOST_PORT
        ? { host: "127.0.0.1", port: Number(process.env.XYD_E2E_HOST_PORT), strictPort: true }
        : undefined,
    plugins: [
        sveltekit(),
        xyd({
            docsRoot: "./docs",
            base: "/docs",
            // adapter-static assembles the deployable dir AFTER the client build —
            // point the merge at it (the plugin's post-ordered closeBundle runs
            // after the adapter).
            outDir: "build",
            command: process.env.XYD_E2E_CLI_CMD ? JSON.parse(process.env.XYD_E2E_CLI_CMD) : undefined,
        }),
    ],
});
