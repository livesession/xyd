import { defineConfig } from "vite";
import xyd from "@xyd-js/vite-plugin";

export default defineConfig({
    plugins: [
        xyd({
            docsRoot: "./docs",
            base: "/docs",
            // The e2e harness injects the tier-resolved xyd CLI argv (monorepo CLI /
            // Verdaccio install / PATH). Real consumers omit `command` entirely.
            command: process.env.XYD_E2E_CLI_CMD ? JSON.parse(process.env.XYD_E2E_CLI_CMD) : undefined,
        }),
    ],
});
