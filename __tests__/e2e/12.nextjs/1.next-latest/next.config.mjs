import { withXyd } from "@xyd-js/next-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withXyd({
    docsRoot: "./docs",
    base: "/docs",
    // The e2e harness injects the tier-resolved xyd CLI argv. Real consumers
    // omit `command` entirely.
    command: process.env.XYD_E2E_CLI_CMD ? JSON.parse(process.env.XYD_E2E_CLI_CMD) : undefined,
})(nextConfig);
