import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import xyd from "@xyd-js/vite-plugin";

export default defineConfig({
    // Harness-controlled dev port (engine-agnostic — works for `vite` and
    // `react-router dev` alike).
    server: process.env.XYD_E2E_HOST_PORT
        ? { host: "127.0.0.1", port: Number(process.env.XYD_E2E_HOST_PORT), strictPort: true }
        : undefined,
    plugins: [
        reactRouter(),
        xyd({
            docsRoot: "./docs",
            base: "/docs",
            // The e2e harness injects the tier-resolved xyd CLI argv (monorepo CLI /
            // Verdaccio install / PATH). Real consumers omit `command` entirely.
            command: process.env.XYD_E2E_CLI_CMD ? JSON.parse(process.env.XYD_E2E_CLI_CMD) : undefined,
        }),
    ],
});
