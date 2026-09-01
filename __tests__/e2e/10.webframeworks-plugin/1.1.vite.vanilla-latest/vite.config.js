import { defineConfig } from "vite";
import xyd from "@xyd-js/vite-plugin";

export default defineConfig({
    server: process.env.XYD_E2E_HOST_PORT
        ? { host: "127.0.0.1", port: Number(process.env.XYD_E2E_HOST_PORT), strictPort: true }
        : undefined,
    plugins: [
        xyd({
            docsRoot: "./docs",
            base: "/docs",
            command: process.env.XYD_E2E_CLI_CMD ? JSON.parse(process.env.XYD_E2E_CLI_CMD) : undefined,
        }),
    ],
});
